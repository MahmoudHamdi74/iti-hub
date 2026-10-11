const Notification = require('../../models/Notification');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get Notifications
 * GET /notifications
 * 
 * Retrieves paginated notifications for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Parse pagination parameters
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 20;
  
  // Validate and cap pagination parameters
  page = page < 1 ? 1 : page;
  limit = limit < 1 ? 20 : limit;
  limit = limit > 50 ? 50 : limit; // Cap at 50
  
  const skip = (page - 1) * limit;
  
  await Notification.pruneMissingTargets(userId);

  // Get total count for pagination
  const total = await Notification.countDocuments({ recipient: userId });
  
  // Get notifications with population
  // Sort by updatedAt to show most recently updated notifications first
  // (important for grouped notifications where multiple users act on same post)
  const notifications = await Notification.find({ recipient: userId })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('actor', 'username fullName profilePicture bio')
    .populate('target');
  
  // Get unread count
  const unreadCount = await Notification.getUnreadCount(userId);
  
  const totalPages = Math.ceil(total / limit);

  sendSuccess(res, {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
  },
   'Notifications retrieved successfully',
);
});

module.exports = { getNotifications };
