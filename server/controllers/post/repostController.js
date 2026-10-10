const { syncPostCounts } = require('../../utils/postLifecycle');
const { canPostToCommunity } = require('../../utils/communityHelpers');
const { getPostVisibility } = require('../../utils/postVisibility');
const Post = require('../../models/Post');
const Community = require('../../models/Community');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { validateRepostComment, buildPostResponse } = require('../../utils/postHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');
const {clearAll} = require("../../utils/feedCache")

/**
 * Repost a post
 * @route POST /posts/:id/repost
 * @access Private
 */
const repost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment, communityId } = req.body || {};
  const userId = req.user._id;


  // Find original post
  const visibility = await getPostVisibility(userId);
  let originalPost = await Post.findOne({ $and: [{ _id: id }, visibility.filter] });
  if (!originalPost) {
    throw new NotFoundError('Original post not found');
  }

  // If the original post is itself a repost, get the root original post
  if (originalPost.originalPost) {
    originalPost = await Post.findById(originalPost.originalPost._id || originalPost.originalPost);
    if (!originalPost) {
      throw new NotFoundError('Original post not found');
    }
  }

  if (communityId) {
    const community = await Community.findById(communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }
  }

  if (communityId && !(await canPostToCommunity(userId, communityId))) throw new ForbiddenError('You must be a member of this community to post');

  // Validate repost comment
  if (comment) {
    const validation = validateRepostComment(comment);
    if (!validation.isValid) {
      throw new ValidationError(validation.error);
    }
  }

  // Create repost
  const repostDoc = await Post.create({
    author: userId,
    content: comment || '',
    originalPost: originalPost._id,
    repostComment: comment || null,
    community: communityId || null
  });

  // Increment repost count on original post
  await Post.updateOne({ _id: originalPost._id }, { $inc: { repostsCount: 1 } });
  await syncPostCounts([repostDoc]);

  // Create notification (don't block on failure)
  // Group reposts by the original post (not by individual repost)
  try {
    await Notification.createOrUpdateNotification(
      originalPost.author._id || originalPost.author,
      userId,
      NOTIFICATION_TYPES.REPOST,
      repostDoc._id,    // target: navigate to the repost with comment
      originalPost._id  // groupingKey: group by original post
    );
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Continue anyway - notification failure shouldn't block the repost
  }

  // Populate author details
  await repostDoc.populate('author', 'username fullName profilePicture');
  await repostDoc.populate({ path: 'originalPost', populate: [{ path: 'author', select: 'username fullName profilePicture' }, { path: 'community', select: 'name profilePicture' }] });
  clearAll();

  sendCreated(res, { post: await buildPostResponse(repostDoc, req.user._id) }, 'Post reposted successfully');
});

module.exports = repost;
