const mongoose = require("mongoose");
const { NOTIFICATION_TYPES, GROUPABLE_NOTIFICATION_TYPES } = require('../utils/constants');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Recipient is required'],
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Actor is required'],
      index: true
    },
    actorCount: {
      type: Number,
      default: 1,
      min: 1
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Type is required'],
      index: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      required: function() {
        return this.type !== NOTIFICATION_TYPES.FOLLOW;
      }
    },
    targetModel: {
      type: String,
      enum: ['Post', 'Comment', 'Track', 'CommunityGroup', 'Community'],
      default: function() {
        if (this.type === NOTIFICATION_TYPES.REPLY || this.type === NOTIFICATION_TYPES.COMMENT || this.type === NOTIFICATION_TYPES.COMMENT_LIKE) {
          return 'Comment';
        }
        if (this.type === NOTIFICATION_TYPES.LIKE ||  this.type === NOTIFICATION_TYPES.REPOST) {
          return 'Post';
        }
        if (this.type === NOTIFICATION_TYPES.ENROLLMENT_REQUEST || this.type === NOTIFICATION_TYPES.ENROLLMENT_APPROVED || this.type === NOTIFICATION_TYPES.ENROLLMENT_REJECTED) {
          return 'Track';
        }
        if (this.type === NOTIFICATION_TYPES.GROUP_JOIN_REQUEST || this.type === NOTIFICATION_TYPES.GROUP_JOIN_APPROVED || this.type === NOTIFICATION_TYPES.GROUP_JOIN_REJECTED) {
          return 'CommunityGroup';
        }
        if (this.type === NOTIFICATION_TYPES.COMMUNITY_JOIN_REQUEST || this.type === NOTIFICATION_TYPES.COMMUNITY_JOIN_APPROVED || this.type === NOTIFICATION_TYPES.COMMUNITY_JOIN_REJECTED) {
          return 'Community';
        }
        return undefined;
      }
    },
    // NEW FIELD: The actual entity to group notifications by
    groupingKey: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: function() {
        return this.type !== NOTIFICATION_TYPES.FOLLOW;
      }
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
// Sort by updatedAt to show most recently updated notifications first
NotificationSchema.index({ recipient: 1, updatedAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, type: 1, groupingKey: 1 }); // CHANGED: Use groupingKey instead of target

NotificationSchema.statics.isGroupableType = function(type) {
  return GROUPABLE_NOTIFICATION_TYPES.includes(type);
};

/**
 * Create a new notification or update existing one (for groupable types)
 * @param {ObjectId} recipientId - User receiving the notification
 * @param {ObjectId} actorId - User performing the action
 * @param {string} type - Notification type
 * @param {ObjectId} targetId - Target comment/post for navigation
 * @param {ObjectId} postId - The post being interacted with (for grouping)
 * @returns {Promise<Notification|null>}
 */
NotificationSchema.statics.createOrUpdateNotification = async function(recipientId, actorId, type, targetId, postId = null) {
  // Don't notify user of their own actions
  if (recipientId.toString() === actorId.toString()) {
    return null;
  }

  const isGroupable = this.isGroupableType(type);

  // Determine grouping key:
  // - For COMMENT/REPLY: group by POST (not by individual comment)
  // - For LIKE/REPOST: group by POST
  // - For COMMENT_LIKE: group by COMMENT
  let groupingKey = targetId; // Default to targetId
  
  if (type === NOTIFICATION_TYPES.COMMENT || type === NOTIFICATION_TYPES.REPLY || type === NOTIFICATION_TYPES.REPOST) {
    // Group comments/replies by POST, not by individual comment
    groupingKey = postId || targetId; // Use postId if provided, fallback to targetId
  }

  if (isGroupable && groupingKey) {
    // FIXED: Query by groupingKey instead of target
    const existingNotification = await this.findOne({
      recipient: recipientId,
      type: type,
      groupingKey: groupingKey
    });

    if (existingNotification) {
      
      // Check if same actor is trying to re-trigger
      if (existingNotification.actor.toString() === actorId.toString()) {
        // Same user performing action again - just update timestamp, don't increase count
        existingNotification.isRead = false;
        existingNotification.updatedAt = new Date();
        // Note: Don't update createdAt - it should remain the original creation time
        // Update target to most recent comment/interaction
        existingNotification.target = targetId;
        
        await existingNotification.save();
        await existingNotification.populate("actor", "username fullName profilePicture bio");
        await existingNotification.populate("target");

        try {
          const { emitNotificationUpdate, emitNotificationCount } = require("../utils/socketEvents");
          const unreadCount = await this.getUnreadCount(recipientId);
          emitNotificationUpdate(recipientId.toString(), existingNotification);
          emitNotificationCount(recipientId.toString(), unreadCount);
        } catch (socketError) {
          console.error("Failed to emit notification update via socket:", socketError);
        }

        return existingNotification;
      }

      // Different user - increase actor count
      existingNotification.actor = actorId; // Most recent actor
      existingNotification.actorCount += 1;
      existingNotification.isRead = false;
      existingNotification.updatedAt = new Date();
      // Update target to most recent comment/interaction
      existingNotification.target = targetId;

      await existingNotification.save();
      await existingNotification.populate("actor", "username fullName profilePicture bio");
      await existingNotification.populate("target");

      try {
        const { emitNotificationUpdate, emitNotificationCount } = require("../utils/socketEvents");
        const unreadCount = await this.getUnreadCount(recipientId);
        emitNotificationUpdate(recipientId.toString(), existingNotification);
        emitNotificationCount(recipientId.toString(), unreadCount);
      } catch (socketError) {
        console.error("Failed to emit notification update via socket:", socketError);
      }

      return existingNotification;
    }
  }

  // Create new notification
  const notificationData = {
    recipient: recipientId,
    actor: actorId,
    type: type,
    actorCount: 1,
    groupingKey: groupingKey // Store grouping key
  };

  if (targetId) {
    notificationData.target = targetId;
  }

  const notification = await this.create(notificationData);
  
  await notification.populate('actor', 'username fullName profilePicture bio');
  await notification.populate('target');
  
  try {
    const { emitNotification, emitNotificationCount } = require('../utils/socketEvents');
    const unreadCount = await this.getUnreadCount(recipientId);
    emitNotification(recipientId.toString(), notification);
    emitNotificationCount(recipientId.toString(), unreadCount);
  } catch (socketError) {
    console.error('Failed to emit notification via socket:', socketError);
  }
  
  return notification;
};

// Clean up historical alerts whose posts/comments were deleted before cascade cleanup.
NotificationSchema.statics.pruneMissingTargets = async function(userId) {
  for (const modelName of ['Post', 'Comment']) {
    const rows = await this.find({ recipient: userId, targetModel: modelName }).select('_id target').lean();
    if (!rows.length) continue;
    const existing = new Set((await mongoose.model(modelName).distinct('_id', { _id: { $in: rows.map(row => row.target) } })).map(String));
    const missing = rows.filter(row => !existing.has(String(row.target))).map(row => row._id);
    if (missing.length) await this.deleteMany({ _id: { $in: missing }, recipient: userId });
  }
};

NotificationSchema.statics.getUnreadCount = async function(userId) {
  await this.pruneMissingTargets(userId);
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

NotificationSchema.statics.markAsRead = async function(notificationId, userId) {
  const notification = await this.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId
    },
    {
      isRead: true
    },
    {
      new: true
    }
  );

  return notification;
};

NotificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      isRead: true
    }
  );

  return result;
};

module.exports = mongoose.model("Notification", NotificationSchema);

