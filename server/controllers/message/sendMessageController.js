const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { isParticipant, canSendMessage, formatMessage } = require('../../utils/messageHelpers');
const { saveFile, absoluteUrl } = require('../../utils/fileStorage');
const { MAX_MESSAGE_CONTENT_LENGTH } = require('../../utils/constants');
const { getSocketServer, getUserSocketId } = require('../../utils/socketServer');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError, InternalError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');

/**
 * Send a message in a conversation
 * POST /conversations/:conversationId/messages
 * Supports text content and/or image upload via upload.message middleware
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { conversationId } = req.params;
  let { content, replyTo } = req.body;
  const imageFile = req.file;

  // Validate conversationId
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ValidationError('Invalid conversationId');
  }

  // Trim content if provided
  if (content) {
    content = content.trim();
  }

  // Validate at least one of content or image is provided
  if ((!content || content.length === 0) && !imageFile) {
    throw new ValidationError('Message must have content or image');
  }

  // Validate content length
  if (content && content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    throw new ValidationError(`Message content cannot exceed ${MAX_MESSAGE_CONTENT_LENGTH} characters`);
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

  // For individual conversations, check blocking
  if (conversation.type === 'individual') {
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== currentUserId.toString()
    );

    if (otherParticipant) {
      const messageCheck = await canSendMessage(currentUserId, otherParticipant);
      if (!messageCheck.canSend) {
        throw new ForbiddenError('Cannot send message - blocked');
      }
    }
  }
  // Note: Group conversations allow messaging even if participants have blocked each other

  if (replyTo) {
    if (!mongoose.Types.ObjectId.isValid(replyTo)) throw new ValidationError('Invalid reply message');
    if (!(await Message.exists({ _id: replyTo, conversation: conversationId }))) throw new NotFoundError('Reply message not found in this conversation');
  }

  // Upload image if provided
  let imageUrl = null;
  if (imageFile) {
    try {
      const result = await saveFile(imageFile.buffer, {
        folder: 'iti-hub/messages',
        originalName: imageFile.originalname,
        resourceType: 'image',
        useFilename: false,
      });
      imageUrl = absoluteUrl(req, result.url);
    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      throw new InternalError('Failed to upload image');
    }
  }

  // Create message
  const messageData = {
    conversation: conversationId,
    sender: currentUserId,
    status: 'sent',
    replyTo: replyTo || null
  };

  if (content && content.length > 0) {
    messageData.content = content;
  }

  if (imageUrl) {
    messageData.image = imageUrl;
  }

  const message = await Message.create(messageData);

  // Update conversation lastMessage
  conversation.lastMessage = {content: message.content, senderId: currentUserId};

  // Increment unreadCount for all participants except sender
  for (const participantId of conversation.participants) {
    const participantIdString = participantId.toString();
    if (participantIdString !== currentUserId.toString()) {
      const currentCount = conversation.unreadCount.get(participantIdString) || 0;
      conversation.unreadCount.set(participantIdString, currentCount + 1);
    }
  }

  await conversation.save();

  // Populate sender details for response
  await message.populate('sender', 'username fullName profilePicture isOnline lastSeen');

  await message.populate({ path: 'replyTo', select: 'content image sender', populate: { path: 'sender', select: 'username fullName' } });

  const formatted = formatMessage(message.toObject());

  // Emit real-time message to other participants
  try {
    const io = getSocketServer();
    if (io) {
      const participants = conversation.participants.map(p => p.toString());
      participants.forEach(participantId => {
        if (participantId !== currentUserId.toString()) {
          const socketIds = getUserSocketId(participantId);
          socketIds.forEach(socketId => {
            io.to(socketId).emit('message:new', {
              conversationId: conversationId,
              content: formatted.content,
              image: formatted.image,
              replyTo: formatted.replyTo,
              senderId: currentUserId.toString(),
               senderProfilePicture: req.user.profilePicture,
              senderName: req.user.fullName || req.user.username,
              messageId: message._id.toString(),
              timestamp: message.createdAt
            });
          });
        }
      });
    }
  } catch (socketError) {
    // Log but don't fail the request if socket emission fails
    console.error('Error emitting message event:', socketError);
  }

  sendCreated(res, {message: formatted} ,'Message sent successfully');
});
