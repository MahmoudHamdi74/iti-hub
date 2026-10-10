const User = require("../../models/User");
const validator = require("validator");
const crypto = require("crypto");
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, AuthenticationError, APIError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
const sendEmail = require('../../utils/sendEmail');
const { getPasswordResetTemplate } = require('../../utils/emailTemplates');
const frontendUrl = require('../../utils/frontendUrl');

/**
 * @route   POST /auth/password-reset/request
 * @desc    Request password reset - generates and sends reset token
 * @access  Public
 * @body    { email }
 * @returns { success, message } - Generic success for unknown accounts; 503 on email delivery failure
 */
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email format
  if (!email || !validator.isEmail(String(email))) {
    throw new ValidationError('Invalid email format', 'INVALID_EMAIL');
  }

  // Find user by email
  const user = await User.findOne({ email: String(email).trim().toLowerCase() });

  // For security: Always return success even if user not found
  if (!user) {
    return sendSuccess(
      res,
      {},
      'If email exists in our system, a password reset link has been sent'
    );
  }

  // Generate password reset token
  const plainToken = await user.generatePasswordResetToken();

  // Create reset link and send email
  const resetLink = frontendUrl('/password-reset/confirm', { token: plainToken });

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password - itiHub',
      html: getPasswordResetTemplate(resetLink, user.fullName)
    });
  } catch (err) {
    console.error('[password-reset] Email send failed:', { code: err.code, command: err.command, responseCode: err.responseCode });
    throw new APIError('Email delivery is temporarily unavailable. Please try again later.', 503, 'EMAIL_DELIVERY_FAILED');
  }

  return sendSuccess(
    res,
    {},
    'If email exists in our system, a password reset link has been sent'
  );
});

/**
 * @route   POST /auth/password-reset/confirm
 * @desc    Confirm password reset with token and new password
 * @access  Public
 * @body    { token, password | newPassword }
 * @returns { success, message } or error
 */
exports.confirmPasswordReset = asyncHandler(async (req, res) => {
  const { token } = req.body;
  // Accept both keys: the client sends `password`, the API docs/specs use `newPassword`
  const password = req.body.password || req.body.newPassword;

  // Validate token presence
  if (!token) {
    throw new ValidationError('Reset token is required', 'MISSING_TOKEN');
  }

  // Validate new password presence
  if (!password) {
    throw new ValidationError('New password is required', 'MISSING_PASSWORD');
  }

  // Validate password strength (min 8 characters)
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long', 'WEAK_PASSWORD');
  }

  // Hash the token to match database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token and non-expired expiration
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  // Check if token is invalid or expired
  if (!user) {
    // Check if there's a user with this token but expired
    const expiredUser = await User.findOne({ resetPasswordToken: hashedToken });

    if (expiredUser) {
      throw new AuthenticationError('Password reset token has expired', 'RESET_TOKEN_EXPIRED');
    }

    throw new AuthenticationError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
  }

  // Update password (will be hashed by pre-save hook)
  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return sendSuccess(
    res,
    {},
    'Password reset successful. You can now login with your new password.'
  );
});
