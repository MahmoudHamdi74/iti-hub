const mongoose = require('mongoose');
const {
  MESSAGE_STATUS,
  MAX_MESSAGE_CONTENT_LENGTH
} = require('../utils/constants');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    content: {
      type: String,
      maxlength: MAX_MESSAGE_CONTENT_LENGTH,
      trim: true
    },
    image: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid image URL format'
      }
    },
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT
    },
    seenBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        seenAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ status: 1 });

// Validation: require either content or image
messageSchema.pre('validate', function(next) {
  if (!this.content && !this.image) {
    return next(new Error('Message must have content or image'));
  }
  next();
});

/**
 * Create a new message with validation
 * @param {ObjectId} conversationId - Conversation ID
 * @param {ObjectId} senderId - Sender user ID
 * @param {String|null} content - Message content
 * @param {String|null} image - Image URL
 * @returns {Promise<Message>}
 */
messageSchema.statics.createMessage = async function(conversationId, senderId, content, image) {
  // Validate content or image
  if (!content && !image) {
    throw new Error('Message must have content or image');
  }

  // Verify conversation exists
  const Conversation = mongoose.model('Conversation');
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Verify sender exists
  const User = mongoose.model('User');
  const user = await User.findById(senderId);
  if (!user) {
    throw new Error('User not found');
  }

  // Create message
  const messageData = {
    conversation: conversationId,
    sender: senderId,
    status: MESSAGE_STATUS.SENT
  };

  if (content) {
    messageData.content = content;
  }

  if (image) {
    messageData.image = image;
  }

  const message = await this.create(messageData);

  return message;
};

/**
 * Mark all unread messages in a conversation as seen by a user
 * @param {ObjectId} conversationId - Conversation ID
 * @param {ObjectId} userId - User ID who is marking messages as seen
 * @returns {Promise<void>}
 */
messageSchema.statics.markAsSeen = async function(conversationId, userId) {
  // Find all unseen messages in this conversation
  const messages = await this.find({
    conversation: conversationId,
    'seenBy.userId': { $ne: userId }
  });

  // Update each message
  for (const message of messages) {
    // Check if user already in seenBy array
    const alreadySeen = message.seenBy.some(
      seen => seen.userId.toString() === userId.toString()
    );

    if (!alreadySeen) {
      message.seenBy.push({
        userId,
        seenAt: new Date()
      });
      message.status = MESSAGE_STATUS.SEEN;
      await message.save();
    }
  }
};

/**
 * Get paginated messages for a conversation
 * @param {ObjectId} conversationId - Conversation ID
 * @param {Date|null} before - Cursor for pagination (get messages before this timestamp)
 * @param {Number} limit - Maximum number of messages to return (default: 20)
 * @returns {Promise<Array>} Array of messages
 */
messageSchema.statics.getConversationMessages = async function(conversationId, before = null, limit = 20) {
  const query = { conversation: conversationId };

  if (before) {
    query.createdAt = { $lt: before };
  }

  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'username fullName profilePicture');

  return messages;
};

module.exports = mongoose.model('Message', messageSchema);
