const mongoose = require("mongoose");
const {
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_IMAGES,
  MAX_POST_TAGS,
  MAX_REPOST_COMMENT_LENGTH,
} = require("../utils/constants");

const PostSchema = new mongoose.Schema(
  {
    clientRequestId: { type: String },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      maxlength: [
        MAX_POST_CONTENT_LENGTH,
        `Content cannot exceed ${MAX_POST_CONTENT_LENGTH} characters`,
      ],
      default: "",
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= MAX_POST_IMAGES;
        },
        message: `Cannot upload more than ${MAX_POST_IMAGES} images`,
      },
    },
    tags: {
      type: [String],
      // type: [mongoose.Schema.Types.ObjectId],
      // ref: "Tag",
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= MAX_POST_TAGS;
        },
        message: `Cannot add more than ${MAX_POST_TAGS} tags`,
      },
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
    repostComment: {
      type: String,
      maxlength: [
        MAX_REPOST_COMMENT_LENGTH,
        `Repost comment cannot exceed ${MAX_REPOST_COMMENT_LENGTH} characters`,
      ],
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    repostsCount: {
      type: Number,
      default: 0,
    },
    savesCount: {
      type: Number,
      default: 0,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

function autoPopulateOriginalPost(next) {
  this.populate([
    { path: "author", select: "username profilePicture fullName" },
    { path: "community", select: "name profilePicture" },
    {
      path: "originalPost",
      populate: [
        { path: "author", select: "username profilePicture fullName" },
        { path: "community", select: "name profilePicture" },
      ],
    },
  ]);

  next();
}


PostSchema.pre(["findOne", "find"], autoPopulateOriginalPost);

// Custom validation: require content or images (unless it's a repost)
PostSchema.pre("validate", function (next) {
  // Allow empty content for reposts
  if (this.originalPost) {
    return next();
  }

  if (!this.content && (!this.images || this.images.length === 0)) {
    this.invalidate("content", "Content or images required");
  }
  next();
});

// Indexes for efficient querying
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ author: 1, clientRequestId: 1 }, { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string' } } });
PostSchema.index({ community: 1, createdAt: -1 });
PostSchema.index({ tags: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ originalPost: 1 });

// Text index for search functionality (Epic 9)
PostSchema.index(
  {
    content: "text",
  },
  {
    weights: {
      content: 1,
    },
    name: "post_search_index",
  }
);

module.exports = mongoose.model("Post", PostSchema);
