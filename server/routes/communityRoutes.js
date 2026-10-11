const express = require('express');
const { checkAuth, optionalAuth } = require('../middlewares/checkAuth');
const { checkModeratorAccess, checkOwnerAccess } = require('../middlewares/checkCommunityAccess');
const { communityCreate, profile, cover } = require('../middlewares/upload');

// Community controllers
const getCommunityFeed = require('../controllers/community/getCommunityFeedController');
const createCommunity = require('../controllers/community/createCommunityController');
const getCommunity = require('../controllers/community/getCommunityController');
const getCommunityMembers = require('../controllers/community/getCommunityMembersController');
const updateCommunityDetails = require('../controllers/community/updateCommunityDetailsController');
const updateCommunityProfilePicture = require('../controllers/community/updateCommunityProfilePictureController');
const updateCommunityCoverImage = require('../controllers/community/updateCommunityCoverImageController');
const joinCommunity = require('../controllers/community/joinCommunityController');
const leaveCommunity = require('../controllers/community/leaveCommunityController');
const addModerator = require('../controllers/community/addModeratorController');
const removeModerator = require('../controllers/community/removeModeratorController');
const kickMember = require('../controllers/community/kickMemberController');
const listCommunities = require('../controllers/community/listCommunitiesController');
const {
  decideCommunityJoinRequest,
  cancelCommunityJoinRequest,
  listCommunityJoinRequests,
  getMyCommunityJoinRequests,
} = require('../controllers/community/communityJoinRequestController');

const communityRoutes = express.Router();

/**
 * @route   GET /api/communities
 * @desc    List all communities with pagination, search, and filtering
 * @access  Public (optional auth for isJoined status)
 */
communityRoutes.get('/', optionalAuth, listCommunities);

/**
 * @route   POST /api/communities
 * @desc    Create a new community
 * @access  Private
 */
communityRoutes.post('/', checkAuth, communityCreate, createCommunity);

/**
 * @route   GET /api/communities/:id
 * @desc    Get community details
 * @access  Public (optional auth for membership status)
 */
communityRoutes.get('/:id', optionalAuth, getCommunity);

/**
 * @route   GET /api/communities/:id/members
 * @desc    Get community members with pagination
 * @access  Public (optional auth)
 */
communityRoutes.get('/:id/members', optionalAuth, getCommunityMembers);

/**
 * @route   PATCH /api/communities/:id
 * @desc    Update community details (description)
 * @access  Private (Owner only)
 */
communityRoutes.patch('/:id', checkAuth, updateCommunityDetails);

/**
 * @route   POST /api/communities/:id/profile-picture
 * @desc    Update community profile picture
 * @access  Private (Owner only)
 */
communityRoutes.post('/:id/profile-picture', checkAuth, profile, updateCommunityProfilePicture);

/**
 * @route   POST /api/communities/:id/cover-image
 * @desc    Update community cover image
 * @access  Private (Owner only)
 */
communityRoutes.post('/:id/cover-image', checkAuth, cover, updateCommunityCoverImage);

/**
 * @route   POST /api/communities/:id/join
 * @desc    Request to join a community (pending review by a moderator)
 * @access  Private
 */
communityRoutes.post('/:id/join', checkAuth, joinCommunity);

/**
 * @route   POST /api/communities/:id/leave
 * @desc    Leave a community
 * @access  Private
 */
communityRoutes.post('/:id/leave', checkAuth, leaveCommunity);

// ---- Join-request moderation (request → moderator decision) ----
// NOTE: static-ish segment paths are registered before dynamic ':id'
// sub-paths so Express doesn't capture "join-requests" as an :id.
communityRoutes.get('/join-requests/my', checkAuth, getMyCommunityJoinRequests);
communityRoutes.patch('/join-requests/:id/decision', checkAuth, decideCommunityJoinRequest);
communityRoutes.delete('/join-requests/:id', checkAuth, cancelCommunityJoinRequest);
communityRoutes.get('/:id/join-requests', checkAuth, listCommunityJoinRequests);

/**
 * @route   POST /api/communities/:id/moderators
 * @desc    Add a moderator to the community
 * @access  Private (Owner/Moderator only)
 */
communityRoutes.post('/:id/moderators', checkAuth, checkModeratorAccess, addModerator);

/**
 * @route   DELETE /api/communities/:id/moderators/:userId
 * @desc    Remove a moderator from the community
 * @access  Private (Owner only)
 */
communityRoutes.delete('/:id/moderators/:userId', checkAuth, checkOwnerAccess, removeModerator);

/**
 * @route   DELETE /api/communities/:id/members/:userId
 * @desc    Kick/Remove a member from the community
 * @access  Private (Moderator/Owner only)
 */
communityRoutes.delete('/:id/members/:userId', checkAuth, checkModeratorAccess, kickMember);

/**
 * @route   GET /api/communities/:communityId/feed
 * @desc    Get community feed (chronological posts from a specific community)
 * @access  Public (optional auth)
 */
communityRoutes.get('/:communityId/feed', optionalAuth, getCommunityFeed);

communityRoutes.delete('/:id', checkAuth, require('../controllers/community/deleteCommunityController'));

module.exports = communityRoutes;
