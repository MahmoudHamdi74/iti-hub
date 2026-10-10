const { getPostVisibility } = require('../../utils/postVisibility');
const Post = require('../../models/Post');
const Connection = require('../../models/Connection');
const CommunityMember = require('../../models/CommunityMember');
const feedCache = require('../../utils/feedCache');
const { buildPostResponse } = require('../../utils/postHelpers');
const { 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  FEATURED_TAGS,
  HOME_FEED_DAYS,
  FEED_CACHE_TTL
} = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get home feed
 * @route GET /feed/home
 * @access Public (optional auth)
 * 
 * Authenticated: Algorithmic feed from connections and communities
 * Unauthenticated: Featured tags, chronological
 */
const getHomeFeed = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id;
  const isAuthenticated = !!currentUserId;

  // Pagination
  const page = parseInt(req.query.page) || DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const visibility = await getPostVisibility(currentUserId);

  // Generate cache key
  const userId = isAuthenticated ? currentUserId.toString() : 'public';
  const cacheKey = feedCache.generateCacheKey('home', userId, page) + `:limit:${limit}:visibility:${visibility.cacheScope}`;

  // Check cache
  try {
    const cached = await feedCache.get(cacheKey);
    if (cached) {
      return sendSuccess(res, {
        cached: true,
        feedType: 'home',
        ...cached
      });
    }
  } catch (cacheError) {
    console.error('Cache read error:', cacheError);
    // Continue without cache
  }

  let posts;
  let total;

  if (isAuthenticated) {
    // Authenticated: Get posts NOT from followed users or joined communities
    const [connections, communityMembers] = await Promise.all([
      Connection.find({ follower: currentUserId, type: 'follow' }),
      CommunityMember.find({ user: currentUserId })
    ]);

    const followedUserIds = connections.map(c => c.following);
    const communityIds = communityMembers.map(cm => cm.community);

    // Build query for posts NOT from followed users or joined communities
    const query = {};
    if (followedUserIds.length > 0 || communityIds.length > 0) {
      query.$and = [];
      if (followedUserIds.length > 0) {
        query.$and.push({ author: { $nin: followedUserIds } });
      }
      if (communityIds.length > 0) {
        query.$and.push({ $or: [ { community: { $exists: false } }, { community: { $nin: communityIds } } ] });
      }
    }

    // Add time filter for home feed
    const timeThreshold = new Date();
    timeThreshold.setDate(timeThreshold.getDate() - HOME_FEED_DAYS);
    query.createdAt = { $gte: timeThreshold };

    // Pagination and fetch
    posts = await Post.find({ $and: [query, visibility.filter] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate('originalPost')
      .populate('community', 'name');

    total = await Post.countDocuments({ $and: [query, visibility.filter] });

  } else {
    // Unauthenticated: Show recent posts (no featured tags filter until Tag system is implemented)
    const query = {};

    posts = await Post.find({ $and: [query, visibility.filter] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate('originalPost')
      .populate('community', 'name');

    total = await Post.countDocuments({ $and: [query, visibility.filter] });
  }

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
    await feedCache.set(cacheKey, responseData, FEED_CACHE_TTL.HOME);
  } catch (cacheError) {
    console.error('Cache write error:', cacheError);
    // Continue without caching
  }

  sendSuccess(res, {
    cached: false,
    feedType: 'home',
    ...responseData
  });
});

module.exports = getHomeFeed;
