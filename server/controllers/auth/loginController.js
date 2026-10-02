const User = require("../../models/User");
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, AuthenticationError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * @route   POST /auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 * @body    { email, password }
 * @returns { success, message, data: { token, user } } or error
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ValidationError('Email and password are required', {
      fields: {
        ...(!email && { email: 'Email is required' }),
        ...(!password && { password: 'Password is required' })
      }
    });
  }

  // Find user by email (include password field for verification)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  // Verify credentials
  if (!user || !(await user.comparePassword(password))) {
    throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Check if account is blocked
  if (user.isBlocked) {
    throw new ForbiddenError('Your account has been blocked', 'ACCOUNT_BLOCKED');
  }

  // Accounts created through the email + OTP flow must verify their email
  // before logging in. Legacy accounts (flag absent/false) are unaffected.
  if (user.emailVerificationRequired && !user.isEmailVerified) {
    throw new ForbiddenError(
      'Please verify your email first. Check your inbox for the verification code.',
      'EMAIL_NOT_VERIFIED'
    );
  }

  // Update lastSeen timestamp
  user.lastSeen = new Date();
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Return user without password
  const userObject = user.toObject();
  delete userObject.password;

  return sendSuccess(
    res,
    { token, user: userObject },
    'Login successful'
  );
});
