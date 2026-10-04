const Conversation = require('../../models/Conversation');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get unread messages count for authenticated user
 * Returns the total number of unread messages across the user's conversations.
 * 
 * GET /conversations/unread/count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUnreadMessagesCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userIdStr = userId.toString();

  // Use aggregation for optimized query performance
  // Sum the current user's unread entry without including other participants.
  const result = await Conversation.aggregate([
    // Match conversations where user is a participant
    { $match: { participants: userId } },
    // Convert unreadCount Map to array for filtering
    { $addFields: { 
      unreadArray: { $objectToArray: '$unreadCount' }
    }},
    { $unwind: '$unreadArray' },
    { $match: { 'unreadArray.k': userIdStr, 'unreadArray.v': { $gt: 0 } } },
    { $group: { _id: null, unreadCount: { $sum: '$unreadArray.v' } } }
  ]);

  // Extract count from result (returns empty array if no matches)
  const unreadCount = result[0]?.unreadCount || 0;

  sendSuccess(res, { unreadCount });
});

module.exports = { getUnreadMessagesCount };
