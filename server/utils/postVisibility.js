const Connection = require('../models/Connection');
const Post = require('../models/Post');
const { createHash } = require('crypto');

// Apply before pagination/counting, including reposts of a blocked author's post.
async function getPostVisibility(userId) {
  if (!userId) return { filter: {}, cacheScope: 'public' };
  const blocks = await Connection.find({ type: 'block', $or: [{ follower: userId }, { following: userId }] })
    .select('follower following').lean();
  const blocked = [...new Set(blocks.map(row =>
    String(row.follower) === String(userId) ? String(row.following) : String(row.follower)
  ))].sort();
  if (!blocked.length) return { filter: {}, cacheScope: 'no-blocks' };
  const originals = await Post.find({ author: { $in: blocked } }).distinct('_id');
  return {
    filter: { author: { $nin: blocked }, originalPost: { $nin: originals } },
    // A block on another server instance must never reuse an older feed cache.
    cacheScope: createHash('sha256').update(blocked.join(',')).digest('hex').slice(0, 20),
  };
}

module.exports = { getPostVisibility };
