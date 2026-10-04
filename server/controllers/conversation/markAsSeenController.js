const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { isParticipant } = require('../../utils/messageHelpers');
const { getSocketServer, getUserSocketId } = require('../../utils/socketServer');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Mark all messages in a conversation as seen by current user
 * PUT /conversations/:conversationId/seen
 */
exports.markConversationAsSeen = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { conversationId } = req.params;

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

  // Reset unreadCount for current user
  conversation.unreadCount.set(currentUserId.toString(), 0);
  await conversation.save();

  // Find all messages in conversation not sent by current user
  // and not already seen by current user
  const messagesToMark = await Message.find({
    conversation: conversationId,
    sender: { $ne: currentUserId },
    'seenBy.userId': { $ne: currentUserId }
  });

  // Mark messages as seen
  let markedCount = 0;
  if (messagesToMark.length > 0) {
    for (const message of messagesToMark) {
      message.seenBy.push({
        userId: currentUserId,
        seenAt: new Date()
      });
      message.status = 'seen';
      await message.save();
      markedCount++;
    }
  }

  // Include the reader so their other devices clear the unread badge too.
  try {
    const io = getSocketServer();
    if (io) {
      const participants = conversation.participants.map(p => p.toString());
      participants.forEach(participantId => {
        const socketIds = getUserSocketId(participantId);
        socketIds.forEach(socketId => {
          io.to(socketId).emit('message:seen', {
            conversationId,
            userId: currentUserId.toString(),
            timestamp: new Date()
          });
        });
      });
    }
  } catch (socketError) {
    // Log but don't fail the request if socket emission fails
    console.error('Error emitting seen event:', socketError);
  }

  sendSuccess(res, {
    message: 'Conversation marked as seen',
    unreadCount: 0,
    markedCount
  });
});
