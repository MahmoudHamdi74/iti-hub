const authRoute = require("express").Router();
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const {sendSuccess} = require("../utils/responseHelpers")
const {checkAuth} = require("../middlewares/checkAuth");
const {resendVerificationEmail} = require("../controllers/auth/emailVerificationController");

// Import controllers from auth directory
const {register, login, requestPasswordReset, confirmPasswordReset , verifyEmail, verifyOtp, resendOtp, googleAuth} = require("../controllers/auth");

// Disable rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test';

// Rate limiters - disabled in test environment
const registerLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many registration attempts. Please try again later.",
    },
  },
});

const loginLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many login attempts. Please try again later.",
    },
  },
});

const passwordResetLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many password reset attempts. Please try again later.",
    },
  },
});

const otpLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 verification attempts per 15 minutes
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many verification attempts. Please try again later.",
    },
  },
});

// Authentication routes
// registerLimiter is applied like the other auth limiters (pass-through in test env)
authRoute.post("/register", registerLimiter, register);
authRoute.post("/login", loginLimiter, login);
authRoute.post("/google", loginLimiter, googleAuth);
authRoute.post("/password-reset/request", passwordResetLimiter, requestPasswordReset);
authRoute.post("/password-reset/confirm", passwordResetLimiter, confirmPasswordReset);
authRoute.get("/verify-email", verifyEmail);
authRoute.get("/resend-verification", checkAuth, resendVerificationEmail);
// Email OTP verification (new registrations)
authRoute.post("/verify-otp", otpLimiter, verifyOtp);
authRoute.post("/resend-otp", otpLimiter, resendOtp);
authRoute.post("/check-username", async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    sendSuccess(res, { available: false });
  } else {
    sendSuccess(res, { available: true });
  }
});
authRoute.post("/check-email", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    sendSuccess(res, { available: false });
  } else {
    sendSuccess(res, { available: true });
  }
});

module.exports = authRoute;
