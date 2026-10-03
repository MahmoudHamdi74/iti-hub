const mongoose = require('mongoose');
const Branch = require('../../models/Branch');
const { addBranchCovers } = require('../../utils/branchCover');
const Round = require('../../models/Round');
const Track = require('../../models/Track');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get a single branch with its rounds (hierarchy entry point).
 * GET /courses/branches/:id
 * @access Public
 */
const getBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid branch ID');
  }

  const branch = await Branch.findById(id).lean();
  if (!branch) {
    throw new NotFoundError('Branch');
  }

  // Rounds for this branch, newest first; active round is flagged
  const rounds = await Round.find({ branchId: branch._id })
    .sort({ startDate: -1, createdAt: -1 })
    .lean();

  // Track counts per round
  const trackCounts = await Track.aggregate([
    { $match: { branchId: branch._id } },
    { $group: { _id: '$roundId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(trackCounts.map((t) => [String(t._id), t.count]));

  const roundsWithStats = rounds.map((round) => ({
    ...round,
    trackCount: countMap.get(String(round._id)) || 0,
  }));

  // Total students across all tracks of this branch
  const studentAgg = await Track.aggregate([
    { $match: { branchId: branch._id } },
    { $project: { studentIds: 1 } },
    { $unwind: '$studentIds' },
    { $group: { _id: '$studentIds' } },
    { $count: 'total' },
  ]);

  return sendSuccess(
    res,
    {
      branch: (await addBranchCovers([branch]))[0],
      rounds: roundsWithStats,
      totalStudents: studentAgg[0]?.total || 0,
    },
    null,
    200
  );
});

module.exports = getBranch;
