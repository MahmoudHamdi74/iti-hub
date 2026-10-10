const { getPostVisibility } = require('../../utils/postVisibility');
const Branch = require('../../models/Branch');
const Track = require('../../models/Track');
const User = require('../../models/User');
const Community = require('../../models/Community');
const CommunityGroup = require('../../models/CommunityGroup');
const Job = require('../../models/Job');
const Post = require('../../models/Post');
const Connection = require('../../models/Connection');
const { validateSearchQuery } = require('../../utils/searchHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Site-wide grouped search (sidebar search — Round 3 work order §1)
 * GET /api/v1/search/all?q=...
 *
 * Top matches grouped by type: branches, tracks, users, communities (legacy
 * communities + specialization groups), jobs, posts — up to 5 per group plus
 * a hasMore flag per group for the "see all results" link.
 *
 * Visibility mirrors each collection's own list endpoint: branches, tracks,
 * users, communities and posts are public (optionalAuth); specialization
 * groups and jobs are auth-gated by their list endpoints, so they are only
 * queried for signed-in users.
 */
const GROUP_LIMIT = 5;

/** Escape user input before interpolating it into a $regex */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const userId = req.user?._id;

  let searchQuery;
  try {
    searchQuery = validateSearchQuery(q);
  } catch (error) {
    throw new ValidationError(error.message);
  }

  const regex = { $regex: escapeRegex(searchQuery), $options: 'i' };

  // Users (public — mirrors the /search/fast behaviour)
  const userFilter = {
    $or: [{ username: regex }, { fullName: regex }],
  };
  if (userId) {
    const blockConnections = await Connection.find({
      $or: [
        { follower: userId, type: 'block' },
        { following: userId, type: 'block' },
      ],
    }).select('follower following');
    const blockedUserIds = blockConnections.map((conn) =>
      conn.follower.toString() === userId.toString()
        ? conn.following
        : conn.follower
    );
    if (blockedUserIds.length > 0) {
      userFilter._id = { $nin: blockedUserIds };
    }
  }
  const usersPromise = User.find(userFilter)
    .select('_id username fullName profilePicture')
    .sort({ username: 1 })
    .limit(GROUP_LIMIT + 1)
    .lean();

  // Branches (public)
  const branchesPromise = Branch.find({
    $or: [{ name: regex }, { location: regex }],
  })
    .select('name location type')
    .sort({ name: 1 })
    .limit(GROUP_LIMIT + 1)
    .lean();

  // Tracks (public)
  const tracksPromise = Track.find({ name: regex })
    .select('name category')
    .sort({ name: 1 })
    .limit(GROUP_LIMIT + 1)
    .lean();

  // Communities (legacy Community — public)
  const communitiesPromise = Community.find({
    $or: [{ name: regex }, { description: regex }],
  })
    .select('_id name memberCount profilePicture coverImage')
    .sort({ memberCount: -1 })
    .limit(GROUP_LIMIT + 1)
    .lean();

  // Posts (public — mirrors /search/posts)
  const visibility = await getPostVisibility(userId);
  const postsPromise = Post.find({ $and: [{ content: regex }, visibility.filter] })
    .select('content createdAt')
    .sort({ createdAt: -1 })
    .limit(GROUP_LIMIT + 1)
    .lean();

  // Auth-scoped: specialization groups + jobs (auth-gated list endpoints)
  const groupsPromise = userId
    ? CommunityGroup.find({
        $or: [{ name: regex }, { specialization: regex }],
      })
        .select('name specialization coverImage memberIds')
        .sort({ name: 1 })
        .limit(GROUP_LIMIT + 1)
        .lean()
    : Promise.resolve([]);
  const jobsPromise = userId
    ? Job.find({
        $or: [{ title: regex }, { company: regex }],
      })
        .select('title company location')
        .sort({ createdAt: -1 })
        .limit(GROUP_LIMIT + 1)
        .lean()
    : Promise.resolve([]);

  const [users, branches, tracks, communities, posts, groups, jobs] =
    await Promise.all([
      usersPromise,
      branchesPromise,
      tracksPromise,
      communitiesPromise,
      postsPromise,
      groupsPromise,
      jobsPromise,
    ]);

  // Cap each group at GROUP_LIMIT and flag whether more matches exist
  const cap = (arr) => ({
    items: arr.slice(0, GROUP_LIMIT),
    hasMore: arr.length > GROUP_LIMIT,
  });

  const usersCapped = cap(users);
  const branchesCapped = cap(branches);
  const tracksCapped = cap(tracks);
  const communitiesCapped = cap(communities);
  const postsCapped = cap(posts);
  const groupsCapped = cap(groups);
  const jobsCapped = cap(jobs);

  return sendSuccess(res, {
    query: searchQuery,
    results: {
      branches: branchesCapped.items,
      tracks: tracksCapped.items,
      users: usersCapped.items,
      // One "Communities" group: legacy communities (detail page exists)
      // plus specialization groups (auth-only, browse-page target)
      communities: [
        ...communitiesCapped.items.map((c) => ({ ...c, kind: 'community' })),
        ...groupsCapped.items.map((g) => ({
          _id: g._id,
          name: g.name,
          memberCount: (g.memberIds || []).length,
          profilePicture: g.coverImage || null,
          kind: 'group',
        })),
      ],
      jobs: jobsCapped.items,
      posts: postsCapped.items,
    },
    hasMore: {
      branches: branchesCapped.hasMore,
      tracks: tracksCapped.hasMore,
      users: usersCapped.hasMore,
      communities: communitiesCapped.hasMore || groupsCapped.hasMore,
      jobs: jobsCapped.hasMore,
      posts: postsCapped.hasMore,
    },
  });
});

module.exports = { globalSearch };