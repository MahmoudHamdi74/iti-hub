const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]{3,30}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    // Google Sign-In — Google account subject identifier ("sub" claim).
    // Set when a user signs in with Google; null for password-only accounts.
    googleId: {
      type: String,
      default: null,
      select: false,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    profilePicture: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    specialization: {
      type: String,
      maxlength: 100,
      default: null,
    },
    location: {
      type: String,
      maxlength: 100,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin", "branch_admin", "instructor", "student"],
      default: "user",
    },
    // Branch assignment (for branch_admin / instructor / student)
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    // Tracks the user belongs to (as instructor or student)
    trackIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
    }],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: {
      type: String,
      default: null,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Set ONLY for accounts created through the email + OTP registration
    // flow. Login is blocked until these verify their email. Legacy accounts
    // (field absent/false) keep logging in exactly as before.
    emailVerificationRequired: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
    },

    // Notification preferences for the Settings page
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      communityUpdates: { type: Boolean, default: true },
    },
  },
  { timestamps: true, versionKey: false }
);

// Text index for search functionality
UserSchema.index(
  {
    username: "text",
    fullName: "text",
    bio: "text",
  },
  {
    weights: {
      username: 10, // Highest priority
      fullName: 5, // Medium priority
      bio: 1, // Lowest priority
    },
    name: "user_search_index",
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT auth token with 7-day expiration
UserSchema.methods.generateAuthToken = function () {
  const payload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d", // 7 days as per spec
  });

  return token;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = async function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and save to database
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiration to 1 hour from now
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  // Save to database
  await this.save({ validateBeforeSave: false });

  // Return plain token (to be sent via email)
  return resetToken;
};

UserSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require("crypto");

  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 ساعة

  return verificationToken;
};

// Generate a 6-digit email OTP. Only its SHA-256 hash + a 10-minute expiry
// are stored; the plain code is returned so it can be emailed to the user.
UserSchema.methods.generateEmailOtp = function () {
  const otp = crypto.randomInt(100000, 1000000).toString(); // 6 digits

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق

  return otp;
};

module.exports = mongoose.model("User", UserSchema);
