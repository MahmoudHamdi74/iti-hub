const { getPostVisibility } = require('../../utils/postVisibility');
const Post = require('../../models/Post');
const User = require('../../models/User');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const { buildPostResponse } = require('../../utils/postHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get posts by user
 * @route GET /users/:userId/posts
 * @access Public
 */
const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?._id;

  const visibility = await getPostVisibility(req.user?._id);

  // Pagination
  const page = parseInt(req.query.page) || DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Get posts
  const posts = await Post.find({ $and: [{ author: userId }, visibility.filter] })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username fullName profilePicture')
    .populate('originalPost');

  // Get total count
  const total = await Post.countDocuments({ $and: [{ author: userId }, visibility.filter] });

  // Check if current user has liked/saved each post
  const postsWithUserData = await Promise.all(
    posts.map(async (post) => {
        return buildPostResponse(post, currentUserId); 

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

module.exports = getUserPosts;
