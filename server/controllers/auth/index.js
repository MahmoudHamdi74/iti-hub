/**
 * Auth Controllers Index
 * Central export point for all authentication controllers
 * 
 * Usage:
 *   const authControllers = require('./controllers/auth');
 *   router.post('/register', authControllers.register);
 * 
 * Or individual imports:
 *   const { register } = require('./controllers/auth/registerController');
 */

const { register } = require('./registerController');
const { login } = require('./loginController');
const { requestPasswordReset, confirmPasswordReset } = require('./passwordResetController');
const { verifyEmail, verifyOtp, resendOtp } = require('./emailVerificationController');
const { googleAuth } = require('./googleAuthController');

module.exports = {
  // Registration
  register,
  
  // Login
  login,

  // Google Sign-In
  googleAuth,
  
  // Password Reset
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,

  // Email OTP verification
  verifyOtp,
  resendOtp
};
