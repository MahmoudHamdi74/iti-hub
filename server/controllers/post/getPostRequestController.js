const Post = require('../../models/Post');
const { buildPostResponse } = require('../../utils/postHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
module.exports = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ author: req.user._id, clientRequestId: req.params.requestId });
  if (!post) throw new NotFoundError('Post has not been confirmed');
  sendSuccess(res, { post: await buildPostResponse(post, req.user._id) });
});
