const express = require("express");
const { checkAuth, optionalAuth } = require("../middlewares/checkAuth");
const {
  createPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  repost,
  getUserPosts,
  getSavedPosts
} = require("../controllers/post");
const createComment = require("../controllers/comment/createCommentController");
const getComments = require("../controllers/comment/getCommentsController");
const upload = require("../middlewares/upload");

const postRoutes = express.Router();

// Create post (with optional image uploads)
postRoutes.post("/", checkAuth, upload.post, createPost);

// Get saved posts (must be before /:id to avoid conflicts)
postRoutes.get("/saved", checkAuth, getSavedPosts);

// Resolve ambiguous network outcomes without creating another post.
postRoutes.get('/requests/:requestId', checkAuth, require('../controllers/post/getPostRequestController'));

// Get, update, delete post
postRoutes.get("/:id", optionalAuth, getPost);
postRoutes.patch("/:id", checkAuth, updatePost);
postRoutes.delete("/:id", checkAuth, deletePost);

// Like/unlike post
postRoutes.post("/:id/like", checkAuth, likePost);
postRoutes.delete("/:id/like", checkAuth, unlikePost);

// Save/unsave post
postRoutes.post("/:id/save", checkAuth, savePost);
postRoutes.delete("/:id/save", checkAuth, unsavePost);

// Repost
postRoutes.post("/:id/repost", checkAuth, repost);

// Comments on post
postRoutes.post("/:postId/comments", checkAuth, createComment);
postRoutes.get("/:postId/comments", optionalAuth, getComments);

module.exports = postRoutes;
