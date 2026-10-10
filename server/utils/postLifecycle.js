const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const Notification = require('../models/Notification');
const { clearAll } = require('./feedCache');
const idOf = value => value?._id || value;

async function syncPostCounts(posts) {
  const authors = [...new Set(posts.map(p => String(idOf(p.author))))];
  const communities = [...new Set(posts.filter(p => p.community).map(p => String(idOf(p.community))))];
  for (const author of authors) {
    await User.updateOne({ _id: author }, { $set: { postsCount: await Post.countDocuments({ author }) } });
  }
  for (const community of communities) {
    await Community.updateOne({ _id: community }, { $set: { postCount: await Post.countDocuments({ community }) } });
  }
}

async function notifyRecipients(recipients) {
  const { emitNotificationRemoval, emitNotificationCount } = require('./socketEvents');
  for (const recipient of recipients) {
    emitNotificationRemoval(recipient);
    emitNotificationCount(recipient, await Notification.getUnreadCount(recipient));
  }
}

async function removeNotifications(filter, recipients) {
  const rows = await Notification.find(filter).select('recipient').lean();
  rows.forEach(row => recipients.add(String(row.recipient)));
  await Notification.deleteMany(filter);
}

// Preserve surviving interactions in grouped notifications, including legacy replies
// whose target was the parent comment instead of the reply that caused the alert.
async function reconcileGroups(postId, types, recipients) {
  const groups = await Notification.find({ groupingKey: postId, type: { $in: types } });
  const comments = types.includes('reply') ? await Comment.find({ post: postId }).sort({ createdAt: 1, _id: 1 }).lean() : [];
  const parents = new Map(comments.map(c => [String(c._id), c]));
  for (const group of groups) {
    recipients.add(String(group.recipient));
    let remaining;
    if (group.type === 'repost') {
      // Raw documents avoid Post's auto-population when comparing author IDs.
      remaining = await Post.collection.find({ originalPost: postId }).sort({ createdAt: 1, _id: 1 }).toArray();
    } else {
      remaining = comments.filter(c => group.type === 'comment' ? !c.parentComment :
        c.parentComment && String(parents.get(String(c.parentComment))?.author) === String(group.recipient));
    }
    remaining = remaining.filter(item => String(item.author) !== String(group.recipient));
    if (!remaining.length) {
      await Notification.deleteOne({ _id: group._id });
    } else {
      const latest = remaining.at(-1);
      await Notification.updateOne({ _id: group._id }, { $set: {
        target: latest._id, actor: latest.author,
        actorCount: new Set(remaining.map(item => String(item.author))).size,
      } }, { timestamps: false });
    }
  }
}

async function deleteCommentData(comment) {
  const postId = idOf(comment.post);
  const ids = [comment._id, ...(await Comment.find({ parentComment: comment._id }).distinct('_id'))];
  const recipients = new Set();
  const result = await Comment.deleteMany({ _id: { $in: ids } });
  await CommentLike.deleteMany({ comment: { $in: ids } });
  await reconcileGroups(postId, ['comment', 'reply'], recipients);
  await removeNotifications({ $or: [{ targetModel: 'Comment', target: { $in: ids } }, { groupingKey: { $in: ids } }] }, recipients);
  await Post.updateOne({ _id: postId }, { $set: { commentsCount: await Comment.countDocuments({ post: postId }) } });
  if (comment.parentComment) {
    await Comment.updateOne({ _id: comment.parentComment }, { $set: { repliesCount: await Comment.countDocuments({ parentComment: comment.parentComment }) } });
  }
  clearAll();
  await notifyRecipients(recipients);
  return result.deletedCount;
}

async function deletePostData(post) {
  // Remove dependent reposts too: none should keep pointing at a deleted original.
  const posts = [post];
  let frontier = [post._id];
  while (frontier.length) {
    const dependents = await Post.collection.find({ originalPost: { $in: frontier } }).toArray();
    const known = new Set(posts.map(p => String(p._id)));
    const unseen = dependents.filter(p => !known.has(String(p._id)));
    posts.push(...unseen); frontier = unseen.map(p => p._id);
  }
  const ids = posts.map(p => p._id);
  const commentIds = await Comment.find({ post: { $in: ids } }).distinct('_id');
  const recipients = new Set();
  await Post.deleteMany({ _id: { $in: ids } });
  await Comment.deleteMany({ _id: { $in: commentIds } });
  await CommentLike.deleteMany({ comment: { $in: commentIds } });
  await require('../models/PostLike').deleteMany({ post: { $in: ids } });
  await require('../models/PostSave').deleteMany({ post: { $in: ids } });
  const originalId = idOf(post.originalPost);
  if (originalId) {
    await Post.updateOne({ _id: originalId }, { $set: { repostsCount: await Post.countDocuments({ originalPost: originalId }) } });
    await reconcileGroups(originalId, ['repost'], recipients);
  }
  await removeNotifications({ $or: [
    { targetModel: 'Post', target: { $in: ids } },
    { targetModel: 'Comment', target: { $in: commentIds } },
    { groupingKey: { $in: [...ids, ...commentIds] } },
  ] }, recipients);
  await syncPostCounts(posts);
  clearAll();
  await notifyRecipients(recipients);
  return { deletedComments: commentIds.length };
}

module.exports = { syncPostCounts, deletePostData, deleteCommentData };
