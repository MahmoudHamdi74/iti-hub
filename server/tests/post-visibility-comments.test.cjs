const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

test('blocks hide posts and reposts across cached feeds, profiles, saved posts, search and direct links; comments are oldest first', async t => {
  process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'isolated-visibility-test';
  const db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri());
  t.after(async () => { require('../utils/feedCache').clearAll(); await mongoose.disconnect(); await db.stop(); });
  const app = express(); app.use(express.json());
  app.use('/feed', require('../routes/feedRoutes'));
  app.use('/posts', require('../routes/postRoutes'));
  app.use(require('../routes/userRoutes'));
  app.use(require('../routes/connectionRoutes'));
  app.use('/search', require('../routes/searchRoutes'));
  app.get('/community/:communityId/feed', require('../middlewares/checkAuth').optionalAuth, require('../controllers/community/getCommunityFeedController'));
  app.use(require('../middlewares/errorHandler').errorHandler);
  const User = require('../models/User'), Post = require('../models/Post'), PostSave = require('../models/PostSave');
  const [viewer, blocked, friend] = await User.create(['viewer', 'blocked', 'friend'].map(name => ({ username: name, fullName: name, email: `${name}@example.test`, password: 'TestPassword123!' })));
  const community = new mongoose.Types.ObjectId();
  const hidden = await Post.create({ author: blocked._id, content: 'needle blocked post', community });
  const repost = await Post.create({ author: friend._id, originalPost: hidden._id, content: 'needle repost', community });
  const visible = await Post.create({ author: friend._id, content: 'needle visible', community });
  await PostSave.create([{ user: viewer._id, post: hidden._id }, { user: viewer._id, post: visible._id }]);
  const auth = `Bearer ${viewer.generateAuthToken()}`;
  const get = url => request(app).get(url).set('Authorization', auth);
  const routes = ['/feed/home', '/feed/trending', `/community/${community}/feed`];
  for (const route of routes) assert.ok((await get(route)).body.data.posts.some(p => p._id === hidden.id), route);
  await request(app).post(`/users/${blocked.id}/block`).set('Authorization', auth).expect(200);
  for (const route of [...routes, '/feed/following', '/posts/saved', `/users/${blocked.id}/posts`, '/search/posts?q=needle']) {
    const res = await get(route); assert.equal(res.status, 200, route);
    const ids = res.body.data.posts.map(p => p._id);
    assert.ok(!ids.includes(hidden.id) && !ids.includes(repost.id), route);
  }
  assert.equal((await get('/posts/saved?limit=1')).body.data.pagination.total, 1);
  assert.equal((await get('/search/all?q=needle')).body.data.results.posts.some(p => p._id === hidden.id || p._id === repost.id), false);
  await get(`/posts/${hidden.id}`).expect(404);
  await get(`/posts/${repost.id}`).expect(404);
  // Blocking works both ways, not just for the initiating account.
  const own = await Post.create({ author: viewer._id, content: 'needle viewer' });
  await request(app).get(`/posts/${own.id}`).set('Authorization', `Bearer ${blocked.generateAuthToken()}`).expect(404);
  await request(app).delete(`/users/${blocked.id}/block`).set('Authorization', auth).expect(200);
  await get(`/posts/${hidden.id}`).expect(200);
  assert.ok((await get('/feed/home')).body.data.posts.some(p => p._id === hidden.id));

  const Comment = require('../models/Comment');
  const older = await Comment.create({ post: visible._id, author: viewer._id, content: 'older', createdAt: new Date('2025-01-01') });
  await Comment.create({ post: visible._id, author: friend._id, content: 'newer', createdAt: new Date('2025-01-02') });
  const first = await get(`/posts/${visible.id}/comments?limit=1&page=1`);
  const second = await get(`/posts/${visible.id}/comments?limit=1&page=2`);
  assert.equal(first.body.data.comments[0].content, 'older'); assert.equal(second.body.data.comments[0].content, 'newer');
  await request(app).post(`/posts/${visible.id}/comments`).set('Authorization', auth).send({ content: 'reply one', parentCommentId: older.id }).expect(201);
  await request(app).post(`/posts/${visible.id}/comments`).set('Authorization', auth).send({ content: 'reply two', parentCommentId: older.id }).expect(201);
  const replies = await get(`/posts/${visible.id}/comments?parentCommentId=${older.id}`);
  assert.deepEqual(replies.body.data.comments.map(c => c.content), ['reply one', 'reply two']);
});
