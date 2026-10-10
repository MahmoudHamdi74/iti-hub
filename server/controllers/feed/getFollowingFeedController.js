const { getPostVisibility } = require('../../utils/postVisibility');
const Post = require('../../models/Post');
const Connection = require('../../models/Connection');
const Enrollment = require('../../models/Enrollment');
const feedCache = require('../../utils/feedCache');
const { buildPostResponse } = require('../../utils/postHelpers');
const { 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  FOLLOWING_FEED_DAYS,
  FEED_CACHE_TTL
} = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { AuthenticationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get following feed
 * @route GET /feed/following
 * @access Private (authentication required)
 * 
 * Chronological feed from followed users and enrolled communities
 */
const getFollowingFeed = asyncHandler(async (req, res) => {
  // Require authentication
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  const currentUserId = req.user._id;

  // Pagination
  const page = parseInt(req.query.page) || DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const visibility = await getPostVisibility(currentUserId);

  // Generate cache key
  const cacheKey = feedCache.generateCacheKey('following', currentUserId.toString(), page) + `:limit:${limit}:visibility:${visibility.cacheScope}`;

  // Check cache
  try {
    const cached = await feedCache.get(cacheKey);
    if (cached) {
      return sendSuccess(res, {
        cached: true,
        feedType: 'following',
        ...cached
      });
    }
  } catch (cacheError) {
    console.error('Cache read error:', cacheError);
    // Continue without cache
  }

  // Fetch user connections and enrollments
  const [connections, enrollments] = await Promise.all([
    Connection.find({ follower: currentUserId, type: 'follow' }),
    Enrollment.find({ user: currentUserId })
  ]);

  const followedUserIds = connections.map(c => c.following);
  const communityIds = enrollments.map(e => e.branch);

  // If user has no connections or communities, return empty feed
  if (followedUserIds.length === 0 && communityIds.length === 0) {
    return sendSuccess(res, {
      cached: false,
      feedType: 'following',
      posts: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
  }

  // Build query for posts from followed users and communities
  const query = {
    $or: []
  };
  
  if (followedUserIds.length > 0) {
    query.$or.push({ author: { $in: followedUserIds } });
  }
  
  if (communityIds.length > 0) {
    query.$or.push({ community: { $in: communityIds } });
  }

  // Add time filter for following feed
  const timeThreshold = new Date();
  timeThreshold.setDate(timeThreshold.getDate() - FOLLOWING_FEED_DAYS);
  query.createdAt = { $gte: timeThreshold };

  // Fetch posts chronologically (no algorithmic sorting)
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
    await feedCache.set(cacheKey, responseData, FEED_CACHE_TTL.FOLLOWING);
  } catch (cacheError) {
    console.error('Cache write error:', cacheError);
    // Continue without caching
  }

  sendSuccess(res, {
    cached: false,
    feedType: 'following',
    ...responseData
  });
});

module.exports = getFollowingFeed;
