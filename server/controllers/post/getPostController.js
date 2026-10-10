const { getPostVisibility } = require('../../utils/postVisibility');
const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const { buildPostResponse } = require('../../utils/postHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get post by ID
 * @route GET /posts/:id
 * @access Public
 */
const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const visibility = await getPostVisibility(userId);

  // Find post
  const post = await Post.findOne({ $and: [{ _id: id }, visibility.filter] })
    .populate('author', 'username fullName profilePicture')
    .populate('community', 'name profilePicture')
    .populate('originalPost');

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if user has liked/saved the post
  let isLiked = false;
  let isSaved = false;

  if (userId) {
    const like = await PostLike.findOne({ user: userId, post: id });
    isLiked = !!like;

    const save = await PostSave.findOne({ user: userId, post: id });
    isSaved = !!save;
  }
  const postWithUserData = await buildPostResponse(post, userId);

  sendSuccess(res, { post: postWithUserData });
});

module.exports = getPost;
