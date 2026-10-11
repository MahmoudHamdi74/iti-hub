const Comment = require('../../models/Comment');
const { deleteCommentData } = require('../../utils/postLifecycle');
const { canModifyComment } = require('../../utils/commentHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Delete a comment
 * @route DELETE /comments/:id
 * @access Private
 */
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  // Find comment
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new NotFoundError('Comment');
  }

  await comment.populate('post');

  // Check authorization
  if (!canModifyComment(comment, user)) {
    throw new ForbiddenError('Not authorized to delete this comment');
  }

  const deletedCount = await deleteCommentData(comment);

  return sendSuccess(
    res,
    {},
    `${deletedCount} Comment${deletedCount > 1 ? 's' : ''} deleted successfully`
  );
});

module.exports = deleteComment;
