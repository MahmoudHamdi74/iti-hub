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
  const { email, password, username, fullName } = req.body;

  // Validation object to collect all errors
  const validationErrors = {};

  // Validate email
  if (!email) {
    validationErrors.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    validationErrors.email = "Email format is invalid";
  }

  // Validate password
  if (!password) {
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

  // Send the OTP email, but never fail registration because of it:
  // the user can request a new code from the verify page.
  try {
    await sendEmail({
      to: newUser.email,
      subject: 'Your itiHub Verification Code',
      html: getOtpEmailTemplate(otp, newUser.fullName)
    });
  } catch (emailError) {
    console.error('[register] OTP email send failed:', emailError.message);
  }

  // Return user without password — deliberately NO token yet.
  const userObject = newUser.toObject();
  delete userObject.password;

  return sendCreated(
    res,
    { user: userObject, email: newUser.email },
    "Account created. A verification code has been sent to your email."
  );
});
