const Conversation = require('../models/Conversation');
const Connection = require('../models/Connection');
const User = require('../models/User');

/**
 * Check if a user is a participant in a conversation
 * @param {ObjectId} conversationId - Conversation ID
 * @param {ObjectId} userId - User ID
 * @returns {Promise<boolean>} True if user is participant
 */
async function isParticipant(conversationId, userId) {
  try {
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return false;
    }

    return conversation.participants.some(
      participantId => participantId.toString() === userId.toString()
    );
  } catch (error) {
    return false;
  }
}

/**
 * Check if a sender can send message to a recipient
 * Checks for blocking in both directions
 * @param {ObjectId} senderId - Sender user ID
 * @param {ObjectId} recipientId - Recipient user ID
 * @returns {Promise<Object>} { canSend: boolean, reason: string | null }
 */
async function canSendMessage(senderId, recipientId) {
  try {
    // Check if sender blocked recipient
    const senderBlocksRecipient = await Connection.isBlocking(senderId, recipientId);
    if (senderBlocksRecipient) {
      return {
        canSend: false,
        reason: 'You have blocked this user'
      };
    }

    // Check if recipient blocked sender
    const recipientBlocksSender = await Connection.isBlocking(recipientId, senderId);
    if (recipientBlocksSender) {
      return {
        canSend: false,
        reason: 'User has blocked you'
      };
    }

    return {
      canSend: true,
      reason: null
    };
  } catch (error) {
    // If any error occurs, allow (fail open for non-critical check)
    return {
      canSend: true,
      reason: null
    };
  }
}

/**
 * Format conversation for API response
 * Includes unread count, participant details, and online status
 * @param {Conversation} conversation - Conversation document
 * @param {ObjectId} currentUserId - Current user ID (for unread count)
 * @returns {Promise<Object>} Formatted conversation object
 */
async function formatConversation(conversation, currentUserId) {
  // Populate participants if not already populated
  if (!conversation.populated('participants')) {
    await conversation.populate('participants', 'username fullName profilePicture lastSeen');
  }

  // Populate admin if group conversation and not already populated
  if (conversation.type === 'group' && conversation.admin && !conversation.populated('admin')) {
    await conversation.populate('admin', 'username fullName profilePicture');
  }

  // Get unread count for current user
  const userIdStr = currentUserId.toString();
  const unreadCount = conversation.unreadCount.get(userIdStr) || 0;

  // Format participants with online status
  const formattedParticipants = conversation.participants.map(participant => {
    const isOnline = participant.lastSeen && 
      (Date.now() - participant.lastSeen.getTime()) < 5 * 60 * 1000; // 5 minutes

    return {
      _id: participant._id,
      username: participant.username,
      fullName: participant.fullName,
      profilePicture: participant.profilePicture,
      lastSeen: participant.lastSeen,
      isOnline
    };
  });

  // Build formatted conversation
  const formatted = {
    _id: conversation._id,
    type: conversation.type,
    image: conversation.image,
    name: conversation.name,
    participants: formattedParticipants,
    unreadCount,
    isGroup: conversation.isGroup,
    lastMessage: conversation.lastMessage,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };

  // Add group-specific fields
  if (conversation.type === 'group') {
    formatted.name = conversation.name;
    formatted.image = conversation.image;
    formatted.admin = conversation.admin ? {
      _id: conversation.admin._id,
      username: conversation.admin.username,
      fullName: conversation.admin.fullName,
      profilePicture: conversation.admin.profilePicture
    } : null;
  }

  // Add last message if exists
  if (conversation.lastMessage) {
    formatted.lastMessage = conversation.lastMessage;
  }

  return formatted;
}

/**
 * Format message for API response
 * Handles both Mongoose documents and lean objects
 * @param {Message} message - Message document or plain object
 * @returns {Object} Formatted message object
 */
function formatMessage(message) {
  // Build formatted message
  const formatted = {
    _id: message._id,
    conversation: message.conversation,
    content: message.content,
    replyTo: message.replyTo || null,
    image: message.image,
    status: message.status,
    seenBy: message.seenBy || [],
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };

  // Include sender details if populated
  if (message.sender && typeof message.sender === 'object' && message.sender.username) {
    formatted.sender = {
      _id: message.sender._id,
      username: message.sender.username,
      fullName: message.sender.fullName,
      profilePicture: message.sender.profilePicture,
      isOnline: message.sender.isOnline,
      lastSeen: message.sender.lastSeen
    };
  } else if (message.sender) {
    // Sender not populated, just include ID
    formatted.sender = message.sender;
  }

  return formatted;
}

module.exports = {
  isParticipant,
  canSendMessage,
  formatConversation,
  formatMessage
};
