const Post = require('../../models/Post');
const { validatePostUpdate, canModifyPost, buildPostResponse } = require('../../utils/postHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
const {invalidateUserFeeds} = require('../../utils/feedCache');

/**
 * Update post
 * @route PATCH /posts/:id
 * @access Private
 */
const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Find post
  const post = await Post.findById(id);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check permissions
  if (!(await canModifyPost(post, req.user))) {
    throw new ForbiddenError('You do not have permission to update this post');
  }

  // Validate updates
  const validation = validatePostUpdate(updates);
  if (!validation.isValid) {
    throw new ValidationError(validation.error);
  }

  // Apply updates
  if (updates.content !== undefined) {
    post.content = updates.content;
  }
  if (updates.tags !== undefined) {
    post.tags = updates.tags;
  }
  if (updates.repostComment !== undefined) {
    post.repostComment = updates.repostComment;
  }

  // Set editedAt timestamp
  post.editedAt = new Date();

  await post.save();

  // Populate author details
  await post.populate('author', 'username fullName profilePicture');

  // Invalidate user feed cache
  await invalidateUserFeeds(req.user._id);

  sendSuccess(res, { post: await buildPostResponse(post, req.user._id) }, 'Post updated successfully');
});

module.exports = updatePost;
