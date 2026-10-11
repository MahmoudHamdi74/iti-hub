const { deletePostData } = require('../../utils/postLifecycle');
/**
 * Admin Post Management Controller
 * Provides post listing and deletion for content moderation
 */
const Post = require('../../models/Post');
const User = require('../../models/User');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * GET /admin/posts
 * List all posts with search, filtering, and pagination
 */
const listPosts = async (req, res, next) => {
  try {
    const {
      search,
      author,
      community,
      tags,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};
    
    // Search in content
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }
    
    // Filter by author (username or userId)
    if (author) {
      const userDoc = await User.findOne({
        $or: [
          { username: { $regex: `^${author}$`, $options: 'i' } },
          { _id: author.match(/^[0-9a-fA-F]{24}$/) ? author : null }
        ]
      });
      if (userDoc) {
        query.author = userDoc._id;
      } else {
        // Return empty result if author not found
        return sendSuccess(res, {
          posts: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      }
    }
    
    if (community) query.community = community;
    
    // Filter by tags (comma-separated)
    if (tags) {
      query.tags = { $in: tags.split(',').map(t => t.trim()) };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);

    // Execute query
    const [posts, totalItems] = await Promise.all([
      Post.find(query)
        .populate('author', 'username fullName profilePicture')
        .populate('community', 'name profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(maxLimit),
      Post.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / maxLimit);

    return sendSuccess(res, {
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: maxLimit,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/posts/:postId
 * Delete a post and all associated comments
 */
const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found'
        }
      });
    }

    const deleted = await deletePostData(post);

    return sendSuccess(res, {
      deletedPost: postId,
      deletedComments: deleted.deletedComments
    }, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPosts,
  deletePost
};
