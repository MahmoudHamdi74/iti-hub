const User = require('../../models/User');
const { validateProfileUpdate, sanitizeUserProfile } = require('../../utils/userHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Update User Profile
 * PUT /users/profile
 * 
 * Allows authenticated users to update their profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Validate update data
  const validation = validateProfileUpdate(req.body);
  
  if (!validation.isValid) {
    throw new ValidationError('Validation failed', validation.errors);
  }
  
  // Check if there's anything to update
  if (Object.keys(validation.validatedData).length === 0) {
    throw new ValidationError('No valid fields provided for update');
  }
  
  // Enforce username uniqueness (the model lowercases, so exact match suffices)
  if (validation.validatedData.username !== undefined) {
    const existingUsername = await User.findOne({
      username: validation.validatedData.username,
      _id: { $ne: userId },
    });
    if (existingUsername) {
      throw new ConflictError('Username is already taken', 'USERNAME_EXISTS');
    }
  }
  
  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: validation.validatedData },
    { new: true, runValidators: true }
  );
  
  if (!updatedUser) {
    throw new NotFoundError('User not found');
  }

  // Remove sensitive fields from response
  const userResponse = updatedUser.toObject();
  const sanitizedProfile = sanitizeUserProfile(userResponse, { includeEmail: true });
  
  sendSuccess(res, sanitizedProfile, 'Profile updated successfully');
});

module.exports = updateProfile;
