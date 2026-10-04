const Notification = require('../../models/Notification');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
const { emitNotificationCount } = require('../../utils/socketEvents');

/**
 * Mark Notification as Read
 * PUT /notifications/:id/read
 * 
 * Marks a specific notification as read for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notificationId = req.params.id;
  
  // Validate notification ID format
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ValidationError('Invalid notification ID');
  }
  
  // Mark notification as read
  const notification = await Notification.markAsRead(notificationId, userId);
  
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }
  
  // Populate actor and target for response
  await notification.populate('actor', 'username fullName profilePicture bio');
  await notification.populate('target');
  emitNotificationCount(userId.toString(), await Notification.getUnreadCount(userId));
  
  sendSuccess(res, {
    message: 'Notification marked as read',
    notification
  });
});

module.exports = { markAsRead };
