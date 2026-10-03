const Branch = require('../../models/Branch');
const { addBranchCovers } = require('../../utils/branchCover');
const Track = require('../../models/Track');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * List all branches (training locations) with pagination & search.
 * Each branch includes activeTracks count and students count for card display.
 * GET /courses/branches
 * @access Public
 */
const listBranches = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const search = (req.query.search || '').trim();

  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [branches, total] = await Promise.all([
    Branch.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Branch.countDocuments(filter),
  ]);

  const branchIds = branches.map((b) => b._id);

  // Active tracks per branch (tracks whose round is active, fallback: all tracks)
  const activeTrackStats = await Track.aggregate([
    {
      $lookup: {
        from: 'rounds',
        localField: 'roundId',
        foreignField: '_id',
        as: 'round',
      },
    },
    { $unwind: { path: '$round', preserveNullAndEmptyArrays: true } },
    { $match: { branchId: { $in: branchIds }, $or: [{ 'round.isActive': true }, { round: null }] } },
    { $group: { _id: '$branchId', count: { $sum: 1 } } },
  ]);

  // Students per branch (unique students across the branch's tracks)
  const studentStats = await Track.aggregate([
    { $match: { branchId: { $in: branchIds } } },
    { $project: { branchId: 1, studentIds: 1 } },
    { $unwind: '$studentIds' },
    { $group: { _id: { branch: '$branchId', student: '$studentIds' } } },
    { $group: { _id: '$_id.branch', count: { $sum: 1 } } },
  ]);

  const trackMap = new Map(activeTrackStats.map((s) => [String(s._id), s.count]));
  const studentMap = new Map(studentStats.map((s) => [String(s._id), s.count]));

  const coveredBranches = await addBranchCovers(branches);
  const branchesWithStats = coveredBranches.map((branch) => ({
    ...branch,
    activeTracks: trackMap.get(String(branch._id)) || 0,
    students: studentMap.get(String(branch._id)) || 0,
  }));

  const hasNextPage = skip + branches.length < total;

  return sendSuccess(res, { branches: branchesWithStats }, null, 200, {
    pagination: { page, limit, total, hasNextPage },
  });
});

module.exports = listBranches;
