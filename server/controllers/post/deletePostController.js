const Post = require('../../models/Post');
const { deletePostData } = require('../../utils/postLifecycle');
const { canModifyPost } = require('../../utils/postHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendNoContent } = require('../../utils/responseHelpers');

/**
 * Delete post
 * @route DELETE /posts/:id
 * @access Private
 */
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find post
  const post = await Post.findById(id);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check permissions
  if (!(await canModifyPost(post, req.user))) {
    throw new ForbiddenError('You do not have permission to delete this post');
  }

  await deletePostData(post);

  sendNoContent(res);
});

module.exports = deletePost;
