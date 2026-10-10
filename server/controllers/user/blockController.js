const { invalidateUserFeeds } = require('../../utils/feedCache');
const Connection = require('../../models/Connection');
const { validateConnectionAction } = require('../../utils/connectionHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Block User
 * POST /users/:userId/block
 * 
 * Allows authenticated users to block another user
 * Blocking automatically removes any follow relationships in both directions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const blockUser = asyncHandler(async (req, res) => {
  const requesterId = req.user._id;
  const targetId = req.params.userId;
  
  // Validate the block action
  const validation = await validateConnectionAction(requesterId, targetId, 'block');
  
  if (!validation.isValid) {
    throw new ValidationError(validation.error);
  }
  
  // Create block connection (this also removes follow relationships)
  const connection = await Connection.createBlock(requesterId, targetId);
  
  await Promise.all([invalidateUserFeeds(String(requesterId)), invalidateUserFeeds(String(targetId))]);

  return sendSuccess(
    res,
    {
      blockedUserId: targetId,
      blockedAt: connection.createdAt
    },
    'Successfully blocked user'
  );
});

/**
 * Unblock User
 * DELETE /users/:userId/block
 * 
 * Allows authenticated users to unblock another user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const unblockUser = asyncHandler(async (req, res) => {
  const requesterId = req.user._id;
  const targetId = req.params.userId;
  
  // Validate the unblock action
  const validation = await validateConnectionAction(requesterId, targetId, 'unblock');
  
  if (!validation.isValid) {
    throw new ValidationError(validation.error);
  }
  
  // Remove block connection
  const removed = await Connection.removeBlock(requesterId, targetId);
  
  if (!removed) {
    throw new NotFoundError('Block relationship');
  }
  await Promise.all([invalidateUserFeeds(String(requesterId)), invalidateUserFeeds(String(targetId))]);
  
  return sendSuccess(
    res,
    { unblockedUserId: targetId },
    'Successfully unblocked user'
  );
});

module.exports = {
  blockUser,
  unblockUser
};
