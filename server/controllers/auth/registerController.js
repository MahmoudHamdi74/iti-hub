const User = require("../../models/User");
const validator = require("validator");
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, ConflictError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');
const sendEmail = require('../../utils/sendEmail');
const {SEED_PROFILE_PICTURES} = require('../../utils/constants')
const { getOtpEmailTemplate } = require('../../utils/emailTemplates');

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, username, fullName }
 * @returns { success, message, data: { user, token } } or error
 */
exports.register = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';

  // Validation object to collect all errors
  const validationErrors = {};

  // Validate email
  if (!email) {
    validationErrors.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    validationErrors.email = "Email format is invalid";
  }

  // Validate password
  if (!password || typeof password !== 'string') {
    validationErrors.password = "Password is required";
  } else {
    if (password.length < 8) {
      validationErrors.password =
        "Password must be at least 8 characters long";
    } else if (!/[a-z]/.test(password)) {
      validationErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      validationErrors.password = "Password must contain at least one number";
    }
  }

  // Validate username
  if (!username) {
    validationErrors.username = "Username is required";
  } else if (username.length < 3 || username.length > 30) {
    validationErrors.username =
      "Username must be between 3 and 30 characters";
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    validationErrors.username =
      "Username can only contain alphanumeric characters and underscores";
  }

  // Validate fullName
  if (!fullName) {
    validationErrors.fullName = "Full name is required";
  } else if (fullName.length < 2) {
    validationErrors.fullName =
      "Full name must be at least 2 characters long";
  }

  // If there are validation errors, throw them
  if (Object.keys(validationErrors).length > 0) {
    console.log(validationErrors);
    throw new ValidationError("Validation failed", {
      fields: validationErrors,
    });
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    if (existingEmail.emailVerificationRequired && !existingEmail.isEmailVerified && !existingEmail.isBlocked) {
      throw new ConflictError('This account is awaiting email verification. Continue with your verification code or request a new one.', 'EMAIL_VERIFICATION_REQUIRED');
    }
    throw new ConflictError("Email is already registered", "EMAIL_EXISTS");
  }

  // Check if username already exists
  const existingUsername = await User.findOne({
    username: username.toLowerCase(),
  });
  if (existingUsername) {
    throw new ConflictError("Username is already taken", "USERNAME_EXISTS");
  }

  // Create new user — it starts UNVERIFIED: the client must complete the
  // email OTP step (POST /auth/verify-otp) before a JWT is ever issued.
  const newUser = new User({
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    fullName,
    isEmailVerified: false,
    emailVerificationRequired: true, // legacy accounts stay false → unaffected
    //random profile picture from seed profile pictures
    profilePicture: SEED_PROFILE_PICTURES[Math.floor(Math.random() * SEED_PROFILE_PICTURES.length)],
  });

  // 6-digit OTP — only its hash + expiry are stored, the plain code is emailed
  const otp = newUser.generateEmailOtp();

  await newUser.save();

  // Keep an unverified account recoverable without claiming a failed email was sent.
  let emailDelivery = 'sent';
  try {
    await sendEmail({
      to: newUser.email,
      subject: 'Your itiHub Verification Code',
      html: getOtpEmailTemplate(otp, newUser.fullName)
    });
  } catch (emailError) {
    emailDelivery = 'failed';
    console.error('[register] OTP email send failed:', { code: emailError.code, command: emailError.command, responseCode: emailError.responseCode });
  }

  // Return user without password — deliberately NO token yet.
  const userObject = newUser.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.emailVerificationAttempts;

  return sendCreated(
    res,
    { user: userObject, email: newUser.email, emailDelivery },
    emailDelivery === 'sent' ? "Account created. A verification code has been sent to your email." : "Account created, but the email could not be sent. Please request another code."
  );
});
