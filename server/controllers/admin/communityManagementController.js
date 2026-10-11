/**
 * Admin Community Management Controller
 * Provides community listing and deletion for content moderation
 */
const Community = require('../../models/Community');
const Post = require('../../models/Post');
const CommunityMember = require('../../models/CommunityMember');
const User = require('../../models/User');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * GET /admin/communities
 * List all communities with search, filtering, and pagination
 */
const listCommunities = async (req, res, next) => {
  try {
    const {
      search,
      owner,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Filter by owner (username or userId)
    if (owner) {
      const userDoc = await User.findOne({
        $or: [
          { username: { $regex: `^${owner}$`, $options: 'i' } },
          { _id: owner.match(/^[0-9a-fA-F]{24}$/) ? owner : null }
        ]
      });
      if (userDoc) {
        query.owners = userDoc._id;
      } else {
        // Return empty result if owner not found
        return sendSuccess(res, {
          communities: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      }
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);

    // Execute query
    const [communities, totalItems] = await Promise.all([
      Community.find(query)
        .populate('owners', 'username fullName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(maxLimit),
      Community.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / maxLimit);

    return sendSuccess(res, {
      communities,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: maxLimit,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/communities/:communityId
 * Delete a community and all associated content
 */
const deleteCommunity = async (req, res, next) => {
  try {
    const { communityId } = req.params;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMUNITY_NOT_FOUND',
          message: 'Community not found'
        }
      });
    }

    const { deletePostData, deleteCommunityAlerts } = require('../../utils/postLifecycle');
    const posts = await Post.find({ community: communityId });
    let deletedComments = 0;
    for (const post of posts) {
      if (await Post.exists({ _id: post._id })) deletedComments += (await deletePostData(post)).deletedComments;
    }
    await require('../../models/CommunityJoinRequest').deleteMany({ community: communityId });
    require('../../utils/feedCache').clearAll();

    // Delete all memberships
    const removedMembers = await CommunityMember.deleteMany({ community: communityId });

    await deleteCommunityAlerts(communityId);

    // Delete community
    await community.deleteOne();

    return sendSuccess(res, {
      deletedCommunity: communityId,
      deletedPosts: posts.length,
      deletedComments,
      removedMembers: removedMembers.deletedCount
    }, 'Community and all associated content deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCommunities,
  deleteCommunity
};
