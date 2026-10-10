const Connection = require('../models/Connection');
const {
  SENSITIVE_USER_FIELDS,
  UPDATABLE_PROFILE_FIELDS,
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_SPECIALIZATION_LENGTH,
  MAX_LOCATION_LENGTH
} = require('./constants');

/**
 * Sanitize user profile by removing sensitive fields
 * @param {Object} user - User object (can be lean or Mongoose document)
 * @param {Object} options - Options for sanitization
 * @param {boolean} options.includeEmail - Whether to include email (default: false)
 * @returns {Object} Sanitized user object
 */
function sanitizeUserProfile(user, options = {}) {
  const { includeEmail = false } = options;
  
  // Convert to plain object if it's a Mongoose document
  const userObj = user.toObject ? user.toObject() : { ...user };
  
  // Remove sensitive fields
  SENSITIVE_USER_FIELDS.forEach(field => {
    delete userObj[field];
  });
  
  // Remove email unless explicitly requested
  if (!includeEmail) {
    delete userObj.email;
  }
  
  // Remove internal Mongoose fields
  delete userObj.__v;
  
  return userObj;
}

/**
 * Check if a user is blocked or if there's a mutual block
 * @param {ObjectId} requesterId - ID of the user making the request
 * @param {ObjectId} targetId - ID of the target user
 * @returns {Promise<Object>} Object with isBlocked and blockedBy properties
 */
async function checkUserBlocked(requesterId, targetId) {
  if (!requesterId || !targetId) {
    return { isBlocked: false, blockedBy: null };
  }
  
  // Check if requester blocked target
  const requesterBlocksTarget = await Connection.isBlocking(requesterId, targetId);
  
  // Check if target blocked requester
  const targetBlocksRequester = await Connection.isBlocking(targetId, requesterId);
  
  if (requesterBlocksTarget) {
    return { isBlocked: true, blockedBy: 'requester' };
  }
  
  if (targetBlocksRequester) {
    return { isBlocked: true, blockedBy: 'target' };
  }
  
  return { isBlocked: false, blockedBy: null };
}

/**
 * Validate profile update data
 * @param {Object} updateData - Data to update
 * @returns {Object} Object with isValid, errors, and validatedData properties
 */
function validateProfileUpdate(updateData) {
  const errors = [];
  const validatedData = {};
  
  // Only allow whitelisted fields
  Object.keys(updateData).forEach(key => {
    if (UPDATABLE_PROFILE_FIELDS.includes(key)) {
      validatedData[key] = updateData[key];
    }
  });
  
  // Validate fullName if provided
  if (validatedData.fullName !== undefined) {
    if (typeof validatedData.fullName !== 'string') {
      errors.push('Full name must be a string');
    } else {
      const trimmed = validatedData.fullName.trim();
      if (trimmed.length < MIN_FULL_NAME_LENGTH) {
        errors.push(`Full name must be at least ${MIN_FULL_NAME_LENGTH} characters`);
      } else if (trimmed.length > MAX_FULL_NAME_LENGTH) {
        errors.push(`Full name must not exceed ${MAX_FULL_NAME_LENGTH} characters`);
      } else {
        validatedData.fullName = trimmed;
      }
    }
  }
  
  // Validate username if provided (same rules as registration)
  if (validatedData.username !== undefined) {
    if (typeof validatedData.username !== 'string') {
      errors.push('Username must be a string');
    } else {
      const trimmed = validatedData.username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) {
        errors.push('Username must be 3-30 characters and contain only letters, numbers, and underscores');
      } else {
        validatedData.username = trimmed;
      }
    }
  }
  
  // Validate bio if provided
  if (validatedData.bio !== undefined) {
    if (typeof validatedData.bio !== 'string') {
      errors.push('Bio must be a string');
    } else if (validatedData.bio.length > MAX_BIO_LENGTH) {
      errors.push(`Bio must not exceed ${MAX_BIO_LENGTH} characters`);
    }
  }
  
  // Validate specialization if provided
  if (validatedData.specialization !== undefined) {
    if (validatedData.specialization !== null && typeof validatedData.specialization !== 'string') {
      errors.push('Specialization must be a string');
    } else if (validatedData.specialization && validatedData.specialization.length > MAX_SPECIALIZATION_LENGTH) {
      errors.push(`Specialization must not exceed ${MAX_SPECIALIZATION_LENGTH} characters`);
    }
  }
  
  // Validate location if provided
  if (validatedData.location !== undefined) {
    if (validatedData.location !== null && typeof validatedData.location !== 'string') {
      errors.push('Location must be a string');
    } else if (validatedData.location && validatedData.location.length > MAX_LOCATION_LENGTH) {
      errors.push(`Location must not exceed ${MAX_LOCATION_LENGTH} characters`);
    }
  }
  
  // Validate URLs if provided (basic validation)
  const urlFields = ['profilePicture', 'coverImage'];
  urlFields.forEach(field => {
    if (validatedData[field] !== undefined) {
      if (validatedData[field] !== null && typeof validatedData[field] !== 'string') {
        errors.push(`${field} must be a string or null`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    validatedData
  };
}

/**
 * Build profile response with additional metadata for authenticated users
 * @param {Object} user - User object
 * @param {ObjectId} requesterId - ID of the user making the request (optional)
 * @returns {Promise<Object>} Enhanced user profile object
 */
async function buildProfileResponse(user, requesterId = null) {
  const profile = sanitizeUserProfile(user);
  // Existing accounts may have a stale/negative stored counter. Count actual posts.
  profile.postsCount = await require('../models/Post').countDocuments({ author: user._id });
  
  // If requester is viewing their own profile, include email
  if (requesterId && user._id.toString() === requesterId.toString()) {
    profile.email = user.email;
    profile.isOwnProfile = true;
  }
  
  // If there's a requester and it's not their own profile
  if (requesterId && user._id.toString() !== requesterId.toString()) {
    // Check if requester follows this user
    profile.isFollowing = await Connection.isFollowing(requesterId, user._id);
    
    // Check if this user follows requester back
    profile.followsYou = await Connection.isFollowing(user._id, requesterId);
    
    // Check for blocks
    const blockStatus = await checkUserBlocked(requesterId, user._id);
    profile.isBlocked = blockStatus.isBlocked;
    
    profile.isOwnProfile = false;
  }
  
  return profile;
}

module.exports = {
  sanitizeUserProfile,
  checkUserBlocked,
  validateProfileUpdate,
  buildProfileResponse
};
