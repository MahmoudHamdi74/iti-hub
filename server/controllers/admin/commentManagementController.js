const { deleteCommentData } = require('../../utils/postLifecycle');
/**
 * Admin Comment Management Controller
 * Provides comment listing and deletion for content moderation
 */
const Comment = require('../../models/Comment');
const User = require('../../models/User');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * GET /admin/comments
 * List all comments with search, filtering, and pagination
 */
const listComments = async (req, res, next) => {
  try {
    const {
      search,
      author,
      post,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};
    
    // Search in content
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }
    
    // Filter by author (username or userId)
    if (author) {
      const userDoc = await User.findOne({
        $or: [
          { username: { $regex: `^${author}$`, $options: 'i' } },
          { _id: author.match(/^[0-9a-fA-F]{24}$/) ? author : null }
        ]
      });
      if (userDoc) {
        query.author = userDoc._id;
      } else {
        // Return empty result if author not found
        return sendSuccess(res, {
          comments: [],
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
    
    if (post) query.post = post;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);

    // Execute query
    const [comments, totalItems] = await Promise.all([
      Comment.find(query)
        .populate('author', 'username fullName profilePicture')
        .populate('post', 'content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(maxLimit),
      Comment.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / maxLimit);

    return sendSuccess(res, {
      comments,
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
 * DELETE /admin/comments/:commentId
 * Delete a comment
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found'
        }
      });
    }

    const deletedCount = await deleteCommentData(comment);

    return sendSuccess(res, {
      deletedComment: commentId,
      deletedReplies: Math.max(0, deletedCount - 1)
    }, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listComments,
  deleteComment
};
