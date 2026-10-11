const Community = require('../../models/Community');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { deleteCommunity } = require('../admin/communityManagementController');
module.exports = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ValidationError('Invalid community ID');
  const community = await Community.findById(req.params.id);
  if (!community) throw new NotFoundError('Community not found');
  if (!community.isOwner(req.user._id) && !['admin', 'super_admin'].includes(req.user.role)) throw new ForbiddenError('Only the owner or a site administrator can delete this community');
  req.params.communityId = req.params.id;
  return deleteCommunity(req, res, next);
});
