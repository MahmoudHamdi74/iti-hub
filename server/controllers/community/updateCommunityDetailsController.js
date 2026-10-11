const Community = require('../../models/Community');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
const feedCache = require('../../utils/feedCache');

/**
 * Update community details (description)
 * PATCH /communities/:id
 * @route PATCH /communities/:id
 * @access Private (Owner only)
 */
const updateCommunityDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user._id;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  if (name === undefined && description === undefined) throw new ValidationError('Name or description is required');
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100)) throw new ValidationError('Name must contain 2 to 100 characters');
  if (description !== undefined && (typeof description !== 'string' || !description.trim() || description.length > 1000)) throw new ValidationError('Description must contain 1 to 1000 characters');

  // Find community
  const community = await Community.findById(id);
  
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Check if user is owner
  if (!community.isOwner(userId)) {
    throw new ForbiddenError('Only community owners can update community details');
  }

  // Update description
  if (name !== undefined) community.name = name.trim();
  if (description !== undefined) community.description = description.trim();
  await community.save();
  // Feed cards embed the community name, including outside its own feed.
  feedCache.clearAll();

  sendSuccess(res, {
    community: {
      _id: community._id.toString(),
      name: community.name,
      description: community.description,
      profilePicture: community.profilePicture,
      coverImage: community.coverImage,
      tags: community.tags,
      memberCount: community.memberCount,
      postCount: community.postCount,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt
    }
  }, 'Community details updated successfully');
});

module.exports = updateCommunityDetails;
