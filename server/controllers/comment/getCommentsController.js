const Comment = require('../../models/Comment');
const CommentLike = require('../../models/CommentLike');
const Post = require('../../models/Post');
const { buildCommentResponse } = require('../../utils/commentHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get comments for a post (or replies for a comment)
 * @route GET /posts/:postId/comments
 * @access Public
 */
const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { parentCommentId } = req.query;
  const currentUserId = req.user?._id;

  // Pagination
  const page = parseInt(req.query.page) || DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  // Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError('Post');
  }

  let query = { post: postId };

  // If fetching replies for a specific comment
  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      throw new NotFoundError('Parent comment');
    }
    query.parentComment = parentCommentId;
  } else {
    // Fetch only top-level comments (no parent)
    query.parentComment = null;
  }

  // Get comments
  const comments = await Comment.find(query)
    .sort({ createdAt: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username fullName profilePicture');

  // Get total count
  const total = await Comment.countDocuments(query);

  // Check if current user has liked each comment
  const commentsWithUserData = await Promise.all(
    comments.map(async (comment) => {
      let isLiked = false;

      if (currentUserId) {
        const like = await CommentLike.findOne({ user: currentUserId, comment: comment._id });
        isLiked = !!like;
      }

      return buildCommentResponse(comment, req.user, { isLiked });
    })
  );

  const totalPages = Math.ceil(total / limit);

  sendSuccess(res, {
    comments: commentsWithUserData,
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

module.exports = getComments;
