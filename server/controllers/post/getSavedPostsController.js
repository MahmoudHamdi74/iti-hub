const { getPostVisibility } = require('../../utils/postVisibility');
const Post = require('../../models/Post');
const PostSave = require('../../models/PostSave');
const PostLike = require('../../models/PostLike');
const { buildPostResponse } = require('../../utils/postHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get saved posts for current user
 * @route GET /posts/saved
 * @access Private
 */
const getSavedPosts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const visibility = await getPostVisibility(req.user?._id);

  // Pagination
  const page = parseInt(req.query.page) || DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  // Get saved post IDs
  const savedPosts = await PostSave.find({ user: userId })
    .sort({ createdAt: -1 })
    .select('post');

  const savedIds = savedPosts.map(save => save.post);
  const visibleIds = new Set((await Post.find({ $and: [{ _id: { $in: savedIds } }, visibility.filter] }).distinct('_id')).map(String));
  const orderedIds = savedIds.filter(id => visibleIds.has(String(id)));
  const postIds = orderedIds.slice(skip, skip + limit);

  // Get posts
  const posts = await Post.find({ $and: [{ _id: { $in: postIds } }, visibility.filter] })
    .populate('author', 'username fullName profilePicture')
    .populate('originalPost');

  // Get total count
  const total = orderedIds.length;
  posts.sort((a, b) => postIds.findIndex(id => String(id) === String(a._id)) - postIds.findIndex(id => String(id) === String(b._id)));

  // Check if user has liked each post
  const postsWithUserData = await Promise.all(
    posts.map(async (post) => {
      return buildPostResponse(post, userId)
    })
  );

  const totalPages = Math.ceil(total / limit);

  sendSuccess(res, {
    posts: postsWithUserData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

module.exports = getSavedPosts;
