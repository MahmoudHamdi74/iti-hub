const Notification = require('../../models/Notification');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');
const { emitNotificationCount } = require('../../utils/socketEvents');

/**
 * Mark All Notifications as Read
 * PUT /notifications/read
 * 
 * Marks all notifications as read for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Mark all notifications as read
  const result = await Notification.markAllAsRead(userId);
  
  // Get updated unread count (should be 0)
  const unreadCount = await Notification.getUnreadCount(userId);
  emitNotificationCount(userId.toString(), unreadCount);
  
  sendSuccess(res, {
    message: 'All notifications marked as read',
    modifiedCount: result.modifiedCount,
    unreadCount
  });
});

module.exports = { markAllAsRead };
