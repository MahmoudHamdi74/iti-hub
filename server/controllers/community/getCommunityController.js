const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const CommunityJoinRequest = require('../../models/CommunityJoinRequest');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get community details by ID
 * GET /communities/:id
 * @route GET /communities/:id
 * @access Public (optional auth)
 */
const getCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  // Find community
  const community = await Community.findById(id)
    .populate('owners', 'username fullName profilePicture')
    .populate('moderators', 'username fullName profilePicture');
  
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Get community members
  const members = await CommunityMember.find({ community: id })
    .populate('user', 'username fullName profilePicture email')
    .sort({ createdAt: -1 })
    .limit(50); // Limit to 50 members for performance

  // Build response object
  const communityData = {
    _id: community._id,
    name: community.name,
    description: community.description,
    profilePicture: community.profilePicture,
    coverImage: community.coverImage,
    tags: community.tags,
    memberCount: community.memberCount,
    postCount: community.postCount,
    owners: community.owners,
    moderators: community.moderators,
    members: members.filter(m => m.user).map(m => ({
      _id: m.user._id,
      username: m.user.username,
      fullName: m.user.fullName,
      profilePicture: m.user.profilePicture,
      email: m.user.email,
      role: m.role,
      joinedAt: m.createdAt
    })),
    createdAt: community.createdAt,
    updatedAt: community.updatedAt,
    isJoined: false, // Default to false
    isPending: false, // True when the user has a pending join request
    role: null
  };

  // If user is authenticated, check membership
  if (userId) {
    const isJoined = await CommunityMember.isEnrolled(userId, id);
    const role = await CommunityMember.getRole(userId, id);

    communityData.isJoined = isJoined;
    communityData.role = role;

    // Pending join-request flag (Round 3 work order §4)
    if (!isJoined) {
      const pendingRequest = await CommunityJoinRequest.findOne({
        user: userId,
        community: id,
        status: 'pending',
      })
        .select('_id')
        .lean();
      communityData.isPending = !!pendingRequest;
    }
  }

  sendSuccess(res, { community: communityData });
});

module.exports = getCommunity;
