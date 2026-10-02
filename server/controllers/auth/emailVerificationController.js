const User = require("../../models/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../../middlewares/errorHandler");
const { ValidationError } = require("../../utils/errors");
const { sendSuccess } = require("../../utils/responseHelpers");
const sendEmail = require('../../utils/sendEmail');
const { getOtpEmailTemplate } = require('../../utils/emailTemplates');

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ValidationError("Verification token is required", "MISSING_TOKEN");
  }

  // Hash the token to match database (same pattern as password reset)
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token and non-expired expiration
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  }).select('+emailVerificationToken');

  if (!user) {
    // Check if there's a user with this token but expired
    const expiredUser = await User.findOne({ emailVerificationToken: hashedToken }).select('+emailVerificationToken');
    
    if (expiredUser) {
      throw new ValidationError("Email verification token has expired", "TOKEN_EXPIRED");
    }

    throw new ValidationError("Invalid or expired verification token", "INVALID_VERIFICATION_TOKEN");
  }

  // Check if email is already verified
  if (user.isEmailVerified) {
    throw new ValidationError("Email is already verified", "EMAIL_ALREADY_VERIFIED");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;

  await user.save();

  return sendSuccess(res, {}, "Email verified successfully 🎉");
});


exports.resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email });

  if (!user) {
    throw new ValidationError("User not found");
  }
  if (user.isEmailVerified) {
    throw new ValidationError("Email is already verified");
  } 
  
  // generateEmailVerificationToken returns the plain token, stores hashed version
  const verificationToken = user.generateEmailVerificationToken();
  await user.save(); 
  
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const verifyLink = `${frontendBaseUrl}/verify-email?token=${verificationToken}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - itiHub',
    html: getEmailVerificationTemplate(verifyLink, user.fullName)
  });

  // Here you would typically send the verification email again
  return sendSuccess(res, {}, "Verification email resent successfully");  
}); 

/**
 * POST /auth/verify-otp
 * Body: { email, otp }
 * Verifies the 6-digit code emailed at registration. On success the user's
 * email is marked verified and an app JWT is returned (auto-login).
 */
const normalizeOtp = (value) => String(value || "").replace(/\D/g, "");

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ValidationError("Email and verification code are required", {
      fields: {
        ...(!email && { email: "Email is required" }),
        ...(!otp && { otp: "Verification code is required" }),
      },
    });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    "+emailVerificationToken"
  );

  if (!user) {
    throw new ValidationError("Invalid or expired verification code", "INVALID_OTP");
  }

  // Already verified → do NOT issue a token here (this endpoint is public);
  // the user simply logs in normally.
  if (user.isEmailVerified) {
    throw new ValidationError("Email is already verified. Please log in.", "EMAIL_ALREADY_VERIFIED");
  }

  if (
    !user.emailVerificationToken ||
    !user.emailVerificationExpires ||
    user.emailVerificationExpires.getTime() < Date.now()
  ) {
    throw new ValidationError(
      "Verification code has expired. Please request a new one.",
      "OTP_EXPIRED"
    );
  }

  const hashedOtp = crypto
    .createHash("sha256")
    .update(normalizeOtp(otp))
    .digest("hex");

  const provided = Buffer.from(hashedOtp);
  const stored = Buffer.from(user.emailVerificationToken);
  if (provided.length !== stored.length || !crypto.timingSafeEqual(provided, stored)) {
    throw new ValidationError("Invalid verification code. Please try again.", "INVALID_OTP");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  const token = user.generateAuthToken();
  const userObject = user.toObject();
  delete userObject.password;

  return sendSuccess(res, { token, user: userObject }, "Email verified successfully 🎉");
});

/**
 * POST /auth/resend-otp
 * Body: { email }
 * Public resend for users stuck on the OTP screen (e.g. after a failed
 * delivery). Responds generically so it never reveals which emails exist.
 */
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError("Email is required", {
      fields: { email: "Email is required" },
    });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });

  if (user && !user.isEmailVerified && user.emailVerificationRequired) {
    const otp = user.generateEmailOtp();
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        to: user.email,
        subject: "Your itiHub Verification Code",
        html: getOtpEmailTemplate(otp, user.fullName),
      });
    } catch (emailError) {
      console.error("[resendOtp] OTP email send failed:", emailError.message);
    }
  }

  return sendSuccess(
    res,
    {},
    "If the account exists and needs verification, a new code has been sent."
  );
});