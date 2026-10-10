const Comment = require('../../models/Comment');
const Post = require('../../models/Post');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { validateCommentContent, buildCommentResponse, canHaveReplies } = require('../../utils/commentHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');
const {invalidateUserFeeds} = require("../../utils/feedCache")

/**
 * Create a new comment or reply
 * @route POST /posts/:postId/comments
 * @access Private
 */
const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentCommentId } = req.body;
  const userId = req.user._id;

  // Validate content
  const validation = validateCommentContent(content);
  if (!validation.isValid) {
    throw new ValidationError(validation.error);
  }

  // Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError('Post');
  }

  let parentComment = null;

  // If this is a reply, validate parent comment
  if (parentCommentId) {
    parentComment = await Comment.findById(parentCommentId);
    
    if (!parentComment) {
      throw new NotFoundError('Parent comment');
    }

    // Check if parent comment belongs to the same post
    if (parentComment.post.toString() !== postId) {
      throw new ValidationError('Parent comment does not belong to this post');
    }

    // Check if parent comment can have replies (no nested replies)
    if (!canHaveReplies(parentComment)) {
      throw new ValidationError('Cannot reply to a reply. You can only reply to top-level comments.');
    }

    // Increment replies count on parent comment
    parentComment.repliesCount += 1;
    await parentComment.save();
  }

  // Create comment
  const comment = await Comment.create({
    author: userId,
    post: postId,
    content,
    parentComment: parentCommentId || null
  });

  // Increment comments count on post
  post.commentsCount += 1;
  await post.save();

  // Create notifications (don't block on failure)
  try {
    if (parentCommentId && parentComment) {
      // This is a reply - notify the parent comment author
      // target = reply (for navigation), groupingKey = postId (for grouping)
      //another future enchasment is to notify all the user who replied to the same comment
      await Notification.createOrUpdateNotification(
        parentComment.author._id,
        userId,
        NOTIFICATION_TYPES.REPLY,
        comment._id, // target: the reply that caused the notification
        postId             // groupingKey: group by post
      );
    } else {
      // This is a top-level comment - notify the post author
      // target = comment (for navigation), groupingKey = postId (for grouping)
      await Notification.createOrUpdateNotification(
        post.author._id,
        userId,
        NOTIFICATION_TYPES.COMMENT,
        comment._id, // target: navigate to comment
        postId       // groupingKey: group by post
      );
    }
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Continue anyway - notification failure shouldn't block the comment
  }

  // Populate author details
  await comment.populate('author', 'username fullName profilePicture');
  // Invalidate user feeds cache
  await invalidateUserFeeds(req.user._id);

  return sendCreated(
    res,
    { comment: buildCommentResponse(comment, req.user) },
    'Comment created successfully'
  );
});

module.exports = createComment;
