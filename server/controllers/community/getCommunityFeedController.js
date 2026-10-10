const { getPostVisibility } = require('../../utils/postVisibility');
const Post = require('../../models/Post');
const feedCache = require('../../utils/feedCache');
const { buildPostResponse } = require('../../utils/postHelpers');
const { 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  FEED_CACHE_TTL
} = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get community feed
 * @route GET /communities/:communityId/feed
 * @access Public (optional auth)
 * 
 * Chronological feed of posts from a specific community
 */
const getCommunityFeed = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  
  // Validate communityId
  if (!communityId) {
    throw new ValidationError('Community ID is required');
  }

  const currentUserId = req.user?._id;
  const isAuthenticated = !!currentUserId;

  // Pagination
  const page = parseInt(req.query.page) || DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const visibility = await getPostVisibility(currentUserId);

  // Generate cache key
  const userId = isAuthenticated ? currentUserId.toString() : 'public';
  const cacheKey = feedCache.generateCacheKey('community', userId, page, communityId) + `:limit:${limit}:visibility:${visibility.cacheScope}`;

  // Check cache
  try {
    const cached = await feedCache.get(cacheKey);
    if (cached) {
      return sendSuccess(res, {
        cached: true,
        feedType: 'community',
        communityId,
        ...cached
      });
    }
  } catch (cacheError) {
    console.error('Cache read error:', cacheError);
    // Continue without cache
  }

  // Build query for community posts
  const query = {
    community: communityId
  };

  // Fetch posts chronologically (no algorithmic sorting for community feeds)
  const posts = await Post.find({ $and: [query, visibility.filter] })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username fullName profilePicture')
    .populate('originalPost')
    .populate('community', 'name');

  // Get total count
  const total = await Post.countDocuments({ $and: [query, visibility.filter] });

  // Build post responses with user-specific data
  const postsWithUserData = await Promise.all(
    posts.map(post => buildPostResponse(post, currentUserId))
  );

  const totalPages = Math.ceil(total / limit);

  // Prepare response
  const responseData = {
    posts: postsWithUserData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };

  // Cache the results
  try {
    await feedCache.set(cacheKey, responseData, FEED_CACHE_TTL.COMMUNITY);
  } catch (cacheError) {
    console.error('Cache write error:', cacheError);
    // Continue without caching
  }

  sendSuccess(res, {
    cached: false,
    feedType: 'community',
    communityId,
    ...responseData
  });
});

module.exports = getCommunityFeed;
