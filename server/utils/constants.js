/**
 * Constants for User Profile and Connections
 * These values are used across controllers, models, and tests
 * to ensure consistency and make changes easier to manage
 */

// User Profile Field Validation
const MIN_FULL_NAME_LENGTH = 2;
const MAX_FULL_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_SPECIALIZATION_LENGTH = 100;
const MAX_LOCATION_LENGTH = 100;

// Sensitive user fields that should never be exposed in public profiles
const SENSITIVE_USER_FIELDS = [
  'password',
  'resetPasswordToken',
  'resetPasswordExpires',
  'emailVerificationToken',
  'emailVerificationExpires',
  'emailVerificationRequired',
  'googleId',
  'isBlocked',
  'blockReason'
];

// Fields allowed in profile updates
const UPDATABLE_PROFILE_FIELDS = [
  'fullName',
  'username',
  'bio',
  'profilePicture',
  'coverImage',
  'specialization',
  'location'
];

// Pagination defaults
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Search Configuration
const MAX_SEARCH_RESULTS = 50;          // Maximum results per page for search
const DEFAULT_SEARCH_LIMIT = 20;        // Default number of results per page
const MIN_SEARCH_QUERY_LENGTH = 2;      // Minimum characters required for search

// Post Validation
const MAX_POST_CONTENT_LENGTH = 5000;
const MAX_POST_IMAGES = 10;
const MAX_POST_TAGS = 5;
const MAX_REPOST_COMMENT_LENGTH = 500;
const POST_RATE_LIMIT = 10; // posts per hour

// Comment Validation
const MIN_COMMENT_CONTENT_LENGTH = 1;
const MAX_COMMENT_CONTENT_LENGTH = 1000;

// Notification Types
const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  REPLY: 'reply',
  COMMENT_LIKE: 'comment_like',
  REPOST: 'repost',
  FOLLOW: 'follow',
  // Track enrollment request flow: managers are notified of new requests and
  // the requester is notified of the approve/reject decision (target = Track).
  ENROLLMENT_REQUEST: 'enrollment_request',
  ENROLLMENT_APPROVED: 'enrollment_approved',
  ENROLLMENT_REJECTED: 'enrollment_rejected',
  // Community-group join-request flow: group admins are notified of new
  // requests and the requester is notified of the decision (target = CommunityGroup).
  GROUP_JOIN_REQUEST: 'group_join_request',
  GROUP_JOIN_APPROVED: 'group_join_approved',
  GROUP_JOIN_REJECTED: 'group_join_rejected',
  // Legacy-community join-request flow (Round 3 work order §4): community
  // owners/moderators are notified of new requests and the requester is
  // notified of the decision (target = Community).
  COMMUNITY_JOIN_REQUEST: 'community_join_request',
  COMMUNITY_JOIN_APPROVED: 'community_join_approved',
  COMMUNITY_JOIN_REJECTED: 'community_join_rejected'
};

// Groupable notification types (for aggregation)
const GROUPABLE_NOTIFICATION_TYPES = [
  NOTIFICATION_TYPES.LIKE,
  NOTIFICATION_TYPES.COMMENT,
  NOTIFICATION_TYPES.REPLY,
  NOTIFICATION_TYPES.COMMENT_LIKE
];

// Non-groupable notification types (individual notifications)
const NON_GROUPABLE_NOTIFICATION_TYPES = [
  NOTIFICATION_TYPES.REPOST,
  NOTIFICATION_TYPES.FOLLOW,
  NOTIFICATION_TYPES.ENROLLMENT_REQUEST,
  NOTIFICATION_TYPES.ENROLLMENT_APPROVED,
  NOTIFICATION_TYPES.ENROLLMENT_REJECTED,
  NOTIFICATION_TYPES.GROUP_JOIN_REQUEST,
  NOTIFICATION_TYPES.GROUP_JOIN_APPROVED,
  NOTIFICATION_TYPES.GROUP_JOIN_REJECTED
];

// Messaging Validation
const MAX_MESSAGE_CONTENT_LENGTH = 2000;
const MIN_GROUP_NAME_LENGTH = 2;
const MAX_GROUP_NAME_LENGTH = 100;
const MIN_GROUP_PARTICIPANTS = 3;
const MAX_GROUP_PARTICIPANTS = 100;
const MIN_CONVERSATION_PARTICIPANTS = 2;

// Message Status
const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  SEEN: 'seen'
};

// Conversation Types
const CONVERSATION_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group'
};

// Community Validation
const COMMUNITY_TAGS = [
  'Technology',
  'Education',
  'Science',
  'Arts',
  'Sports',
  'Gaming',
  'Music',
  'Movies',
  'Books',
  'Food',
  'Travel',
  'Health',
  'Fitness',
  'Business',
  'Career',
  'Fashion',
  'Photography',
  'Nature',
  'Politics',
  'Hobbies'
];
const MIN_COMMUNITY_TAGS = 1;
const MAX_COMMUNITY_TAGS = 3;

// Community Image Size Configuration
const COMMUNITY_PROFILE_PICTURE_SIZE = {
  width: 500,
  height: 500,
  max_size_mb: 5,
  quality: 85
};
const COMMUNITY_COVER_IMAGE_SIZE = {
  width: 1500,
  height: 500,
  max_size_mb: 10,
  quality: 85,
  fit: 'cover'
};

// Feed Algorithm Configuration
const TRENDING_FEED_DAYS = 2; // Time window for trending posts (in days)
const HOME_FEED_DAYS = 7; // Time window for home feed posts (in days)
const FOLLOWING_FEED_DAYS = 30; // Time window for following feed posts (in days)

// Featured tags for unauthenticated home feed
const FEATURED_TAGS = ['technology', 'programming', 'design', 'business', 'education'];

// Feed algorithm weights
const FEED_WEIGHTS = {
  HOME: {
    engagement: 0.5,
    recency: 0.3,
    source: 0.2
  },
  TRENDING: {
    engagement: 0.6,
    recency: 0.4
  }
};

// Feed cache TTL (in seconds)
const FEED_CACHE_TTL = {
  HOME: 300,        // 5 minutes
  FOLLOWING: 60,    // 1 minute
  TRENDING: 300,    // 5 minutes
  COMMUNITY: 300    // 5 minutes
};

// Image Upload Validation
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_CONFIGS = {
  POST: {
    width: 2000,
    max_size_mb: 5,
    quality: 85
  },
  PROFILE: { 
    width: 500,
    height: 500,
    max_size_mb: 5,
    quality: 85
  },
  COVER: { 
    width: 1500,
    height: 500,
    max_size_mb: 5,
    quality: 85,
    fit: 'cover'
  },
  MESSAGE: { 
    width: 1000,
    max_size_mb: 5,
    quality: 85
  }
};

// Image Processing Fit Strategies
const IMAGE_FIT_COVER = 'cover'; // Crop to fill dimensions
const IMAGE_FIT_INSIDE = 'inside'; // Resize to fit within dimensions, no enlargement

// Cloudinary Folders
const CLOUDINARY_FOLDER_PROFILE = 'profile-pictures';
const CLOUDINARY_FOLDER_COVER = 'cover-images';
const CLOUDINARY_FOLDER_POST = 'post-images';
const CLOUDINARY_FOLDER_MESSAGE = 'message-images';
const CLOUDINARY_FOLDER_COMMUNITY_PROFILE = 'community-profile-pictures';
const CLOUDINARY_FOLDER_COMMUNITY_COVER = 'community-cover-images';
const CLOUDINARY_FOLDER_BRANCH_IMAGES = 'branch-images';

// ========================================
// SEED DATA CONSTANTS
// ========================================

// Profile Pictures for seeding (from profilePictures.txt)
const SEED_PROFILE_PICTURES = [
  'https://i.pinimg.com/736x/ea/4d/0a/ea4d0a85e1260860d349a494e4bbdf86.jpg',
  'https://i.pinimg.com/736x/76/62/0f/76620f79257022ecceb12da9818e93c7.jpg',
  'https://i.pinimg.com/736x/a6/34/6d/a6346d0bfd5c9665b69d4a17c437b02d.jpg',
  'https://i.pinimg.com/736x/3e/1f/fd/3e1ffd99b51bd00543bb50f193fa4f7e.jpg',
  'https://i.pinimg.com/736x/c2/65/91/c265912343e2bebfb729fb5a7c65e06f.jpg',
  'https://i.pinimg.com/736x/05/db/04/05db04fbb164e3c03dd01dbba7dd0128.jpg',
];

// Cover Images for seeding
const SEED_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1500&h=500&fit=crop'
];

// Post Images for seeding
const SEED_POST_IMAGES = [
  'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'
];

// Community Images for seeding
const SEED_COMMUNITY_IMAGES = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=500&fit=crop'
];

// Public fields for posts
const PUBLIC_POST_FIELDS = [
  '_id',
  'author',
  'content',
  'images',
  'tags',
  'community',
  'repostComment',
  'originalPost',
  'likesCount',
  'commentsCount',
  'repostsCount',
  'savesCount',
  'createdAt',
  'updatedAt',
  'editedAt'
];

// Updatable fields for posts
const UPDATABLE_POST_FIELDS = ['content', 'tags', 'repostComment'];

// Public fields for comments
const PUBLIC_COMMENT_FIELDS = [
  '_id',
  'author',
  'post',
  'content',
  'parentComment',
  'likesCount',
  'repliesCount',
  'createdAt',
  'updatedAt',
  'editedAt'
];

// Updatable fields for comments
const UPDATABLE_COMMENT_FIELDS = ['content'];

module.exports = {
  // Validation lengths
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_SPECIALIZATION_LENGTH,
  MAX_LOCATION_LENGTH,
  
  // Field lists
  SENSITIVE_USER_FIELDS,
  UPDATABLE_PROFILE_FIELDS,
  
  // Pagination
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  
  // Search configuration
  MAX_SEARCH_RESULTS,
  DEFAULT_SEARCH_LIMIT,
  MIN_SEARCH_QUERY_LENGTH,
  
  // Post validation
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_IMAGES,
  MAX_POST_TAGS,
  MAX_REPOST_COMMENT_LENGTH,
  POST_RATE_LIMIT,
  
  // Comment validation
  MIN_COMMENT_CONTENT_LENGTH,
  MAX_COMMENT_CONTENT_LENGTH,
  
  // Notification types and grouping
  NOTIFICATION_TYPES,
  GROUPABLE_NOTIFICATION_TYPES,
  NON_GROUPABLE_NOTIFICATION_TYPES,
  
  // Messaging validation
  MAX_MESSAGE_CONTENT_LENGTH,
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MIN_GROUP_PARTICIPANTS,
  MAX_GROUP_PARTICIPANTS,
  MIN_CONVERSATION_PARTICIPANTS,
  MESSAGE_STATUS,
  CONVERSATION_TYPES,
  
  // Community validation
  COMMUNITY_TAGS,
  MIN_COMMUNITY_TAGS,
  MAX_COMMUNITY_TAGS,
  COMMUNITY_PROFILE_PICTURE_SIZE,
  COMMUNITY_COVER_IMAGE_SIZE,
  
  // Feed algorithm configuration
  TRENDING_FEED_DAYS,
  HOME_FEED_DAYS,
  FOLLOWING_FEED_DAYS,
  FEATURED_TAGS,
  FEED_WEIGHTS,
  FEED_CACHE_TTL,
  
  
  // Comment fields
  PUBLIC_COMMENT_FIELDS,
  UPDATABLE_COMMENT_FIELDS,

  // Image upload
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_CONFIGS,
  
  
  // Image processing fit strategies
  IMAGE_FIT_COVER,
  IMAGE_FIT_INSIDE,
  
  // Cloudinary folders
  CLOUDINARY_FOLDER_PROFILE,
  CLOUDINARY_FOLDER_COVER,
  CLOUDINARY_FOLDER_POST,
  CLOUDINARY_FOLDER_MESSAGE,
  CLOUDINARY_FOLDER_COMMUNITY_PROFILE,
  CLOUDINARY_FOLDER_COMMUNITY_COVER,
  CLOUDINARY_FOLDER_BRANCH_IMAGES,

  // Post fields
  PUBLIC_POST_FIELDS,
  UPDATABLE_POST_FIELDS,

  // Seed data constants
  SEED_PROFILE_PICTURES,
  SEED_COVER_IMAGES,
  SEED_POST_IMAGES,
  SEED_COMMUNITY_IMAGES,
};
