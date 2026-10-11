const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { isParticipant, formatMessage } = require('../../utils/messageHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get messages for a conversation with cursor-based pagination
 * GET /conversations/:conversationId/messages
 */
exports.getMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { conversationId } = req.params;
  const { cursor, limit = 20 } = req.query;

  // Validate conversationId
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ValidationError('Invalid conversationId');
  }

  // Check if conversation exists
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  // Check if user is a participant
  const userIsParticipant = await isParticipant(conversationId, currentUserId);
  if (!userIsParticipant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }

  // Parse and validate limit (default 50, max 100)
  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    parsedLimit = 20;
  }
  if (parsedLimit > 20) {
    parsedLimit = 20;
  }

  // Build query
  const query = { conversation: conversationId };

  // Handle cursor for pagination
  if (cursor) {
    // Validate cursor is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      throw new ValidationError('Invalid cursor format');
    }
    // Get messages older than cursor (for reverse chronological order)
    const anchor = await Message.findOne({ _id: cursor, conversation: conversationId }).select('createdAt');
    if (!anchor) throw new ValidationError('Invalid conversation cursor');
    query.$or = [{ createdAt: { $lt: anchor.createdAt } }, { createdAt: anchor.createdAt, _id: { $lt: anchor._id } }];
  }

  // Get total count
  const total = await Message.countDocuments({ conversation: conversationId });

  // Fetch messages
  const messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 }) // Most recent first
    .limit(parsedLimit + 1) // Fetch one extra to check if there are more
    .populate('sender', 'username fullName profilePicture isOnline lastSeen')
    .populate({ path: 'replyTo', select: 'content image sender', populate: { path: 'sender', select: 'username fullName' } })
    .lean();

  // Check if there are more messages
  const hasMore = messages.length > parsedLimit;
  if (hasMore) {
    messages.pop(); // Remove extra message
  }

  // Format messages
  const formattedMessages = messages.map(msg => formatMessage(msg));

  // Get cursor for next page (last message ID)
  const nextCursor = hasMore && messages.length > 0 
    ? messages[messages.length - 1]._id.toString() 
    : null;

  sendSuccess(res, {
    message: 'Messages retrieved successfully',
    messages: formattedMessages,
    total,
    hasMore,
    cursor: nextCursor
  });
});
