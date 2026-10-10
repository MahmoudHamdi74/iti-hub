const { getPostVisibility } = require('../../utils/postVisibility');
/**
 * Search Posts Controller
 * Epic 9: Search - T105
 * Handles searching for posts with text search, filtering, and pagination
 */
const Post = require("../../models/Post");
const PostLike = require("../../models/PostLike");
const PostSave = require("../../models/PostSave");
const {
  validateSearchQuery,
  sanitizeSearchQuery,
  buildSearchFilter,
  parseSearchPagination,
} = require("../../utils/searchHelpers");
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Search posts by content, tags, type, or community
 * @route GET /api/v1/search/posts?q=<query>&type=<type>&communityId=<id>&page=<page>&limit=<limit>
 * @access Public (with optional authentication for hasLiked/hasSaved metadata)
 * @note Tags filter removed due to tags being ObjectIds (not searchable strings)
 */
const searchPosts = asyncHandler(async (req, res) => {
  const { q, type, communityId, page, limit } = req.query;

  // Validate search query
  const trimmedQuery = q?.trim();
  if (!trimmedQuery) {
    throw new ValidationError('Search query is required');
  }

  try {
    validateSearchQuery(trimmedQuery);
  } catch (error) {
    throw new ValidationError(error.message);
  }

  // Build search filter
  const searchQuery = sanitizeSearchQuery(trimmedQuery);
  const filter = buildSearchFilter(searchQuery, {
    deletedAt: null, // Exclude deleted posts
  });

  // Note: Tags filter removed because tags are ObjectIds (not searchable strings)

  // Add type filter if provided
  if (type) {
    if (type === "original") {
      filter.originalPost = null;
    } else if (type === "repost") {
      filter.originalPost = { $ne: null };
    }
  }

  // Add community filter if provided
  if (communityId) {
    filter.community = communityId;
  }

  // Parse pagination
  const { page: currentPage, limit: pageLimit } = parseSearchPagination(
    page,
    limit
  );
  const skip = (currentPage - 1) * pageLimit;

  const visibility = await getPostVisibility(req.user?._id);
  filter.$and = [...(filter.$and || []), visibility.filter];

  // Execute search with alphabetical sorting
  const posts = await Post.find(filter)
    .select("-__v")
    .populate("author", "username fullName avatar")
    .populate("community", "name avatar")
    .sort({ content: 1 }) // Alphabetical by content (case-insensitive)
    .collation({ locale: "en", strength: 2 }) // Case-insensitive collation
    .limit(pageLimit)
    .skip(skip);

  // Get total count for pagination
  const total = await Post.countDocuments(filter);
  const pages = Math.ceil(total / pageLimit);

  // Add hasLiked and hasSaved metadata for authenticated users
  let postsData = posts;
  if (req.user) {
    const postsWithMetadata = await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject();

        // Check if user has liked the post
        const hasLiked = await PostLike.findOne({
          post: post._id,
          user: req.user._id,
        });

        // Check if user has saved the post
        const hasSaved = await PostSave.findOne({
          post: post._id,
          user: req.user._id,
        });

        return {
          ...postObj,
          hasLiked: !!hasLiked,
          hasSaved: !!hasSaved,
        };
      })
    );
    postsData = postsWithMetadata;
  }

  sendSuccess(res, {
    posts: postsData,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      pages,
      hasNextPage: currentPage < pages,
      hasPrevPage: currentPage > 1
    }
  });
});

module.exports = searchPosts;
