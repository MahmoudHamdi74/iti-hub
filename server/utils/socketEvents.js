const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const { getUserSocketId, emitToUser } = require('./socketServer');

// Throttle map for typing events: { userId-conversationId: timestamp }
const typingThrottleMap = new Map();
const TYPING_THROTTLE_INTERVAL = 1000; // 1 second

/**
 * Setup Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
const setupSocketEvents = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    /**
     * message:send - Real-time message delivery
     * Emits to all conversation participants except sender
     */
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, senderId, senderName, image, messageId } = data;

        if (!conversationId || !senderId) {
          return;
        }

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants except sender
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== senderId) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('message:new', {
                conversationId,
                content,
                senderId,
                senderName,
                image,
                messageId,
                timestamp: new Date()
              });
            });
          }
        });
      } catch (error) {
        console.error('Error in message:send event:', error);
      }
    });

    /**
     * message:seen - Seen status updates
     * Emits to all conversation participants
     */
    socket.on('message:seen', async (data) => {
      try {
        const { conversationId, userId: seenByUserId } = data;

        if (!conversationId || !seenByUserId) {
          return;
        }

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          const socketIds = getUserSocketId(participantId);
          socketIds.forEach(socketId => {
            io.to(socketId).emit('message:seen', {
              conversationId,
              userId: seenByUserId,
              timestamp: new Date()
            });
          });
        });
      } catch (error) {
        console.error('Error in message:seen event:', error);
      }
    });

    /**
     * typing:start - User starts typing
     * Emits to conversation participants except sender
     */
    socket.on('typing:start', async (data) => {
      try {
        const { conversationId, userId: typingUserId } = data;

        if (!conversationId || !typingUserId) {
          return;
        }

        // Check throttle
        const throttleKey = `${typingUserId}-${conversationId}`;
        const lastEmit = typingThrottleMap.get(throttleKey);
        const now = Date.now();

        if (lastEmit && (now - lastEmit) < TYPING_THROTTLE_INTERVAL) {
          return; // Throttled
        }

        typingThrottleMap.set(throttleKey, now);

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants except sender
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== typingUserId) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('typing:start', {
                conversationId,
                userId: typingUserId
              });
            });
          }
        });

        // Auto-stop typing after 3 seconds
        setTimeout(() => {
          participants.forEach(participantId => {
            if (participantId !== typingUserId) {
              const socketIds = getUserSocketId(participantId);
              socketIds.forEach(socketId => {
                io.to(socketId).emit('typing:stop', {
                  conversationId,
                  userId: typingUserId
                });
              });
            }
          });
        }, 3000);
      } catch (error) {
        console.error('Error in typing:start event:', error);
      }
    });

    /**
     * typing:stop - User stops typing
     * Emits to conversation participants except sender
     */
    socket.on('typing:stop', async (data) => {
      try {
        const { conversationId, userId: typingUserId } = data;

        if (!conversationId || !typingUserId) {
          return;
        }

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants except sender
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== typingUserId) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('typing:stop', {
                conversationId,
                userId: typingUserId
              });
            });
          }
        });
      } catch (error) {
        console.error('Error in typing:stop event:', error);
      }
    });

    /**
     * notification:markAsRead - Mark notification as read
     * Updates notification and emits count to user
     */
    socket.on('notification:markAsRead', async (data) => {
      try {
        const { notificationId } = data;

        if (!notificationId || !userId) {
          return;
        }

        // Mark notification as read
        const notification = await Notification.markAsRead(notificationId, userId);
        
        if (notification) {
          // Get updated unread count
          const unreadCount = await Notification.getUnreadCount(userId);
          
          // Emit updated notification to user
          const socketIds = getUserSocketId(userId);
          socketIds.forEach(socketId => {
            io.to(socketId).emit('notification:read', {
              notificationId,
              unreadCount,
              timestamp: new Date()
            });
          });
        }
      } catch (error) {
        console.error('Error in notification:markAsRead event:', error);
      }
    });

    /**
     * notification:markAllAsRead - Mark all notifications as read
     * Updates all notifications and emits count to user
     */
    socket.on('notification:markAllAsRead', async () => {
      try {
        if (!userId) {
          return;
        }

        // Mark all notifications as read
        await Notification.markAllAsRead(userId);
        
        // Emit updated count to user (should be 0)
        const socketIds = getUserSocketId(userId);
        socketIds.forEach(socketId => {
          io.to(socketId).emit('notification:count', {
            unreadCount: 0,
            timestamp: new Date()
          });
        });
      } catch (error) {
        console.error('Error in notification:markAllAsRead event:', error);
      }
    });
  });
};

/**
 * Clear typing throttle map (for testing)
 */
const clearTypingThrottle = () => {
  typingThrottleMap.clear();
};

/**
 * Emit new notification to user
 * @param {string} recipientId - User ID to send notification to
 * @param {Object} notification - Notification object (populated)
 */
const emitNotification = (recipientId, notification) => {
  try {
    const socketIds = getUserSocketId(recipientId);
    socketIds.forEach(socketId => {
      const io = require('./socketServer').getIO();
      if (io) {
        io.to(socketId).emit('notification:new', {
          notification,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error emitting notification:', error);
  }
};

/**
 * Emit notification update to user (for grouped notifications)
 * @param {string} recipientId - User ID to send update to
 * @param {Object} notification - Updated notification object (populated)
 */
const emitNotificationUpdate = (recipientId, notification) => {
  try {
    const socketIds = getUserSocketId(recipientId);
    socketIds.forEach(socketId => {
      const io = require('./socketServer').getIO();
      if (io) {
        io.to(socketId).emit('notification:update', {
          notification,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error emitting notification update:', error);
  }
};

/**
 * Emit unread count to user
 * @param {string} userId - User ID to send count to
 * @param {number} unreadCount - Current unread count
 */
const emitNotificationCount = (userId, unreadCount) => {
  try {
    const socketIds = getUserSocketId(userId);
    socketIds.forEach(socketId => {
      const io = require('./socketServer').getIO();
      if (io) {
        io.to(socketId).emit('notification:count', {
          unreadCount,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error emitting notification count:', error);
  }
};

const emitNotificationRemoval = (recipientId) => {
  const io = require('./socketServer').getIO();
  if (!io) return;
  for (const socketId of getUserSocketId(String(recipientId))) {
    io.to(socketId).emit('notification:removed', {});
  }
};

module.exports = {
  emitNotificationRemoval,
  setupSocketEvents,
  clearTypingThrottle,
  emitNotification,
  emitNotificationUpdate,
  emitNotificationCount
};
