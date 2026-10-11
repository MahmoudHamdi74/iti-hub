const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express'),request=require('supertest'),mongoose=require('mongoose');
const {MongoMemoryServer}=require('mongodb-memory-server');
test('post counts, repost responses and deletion cleanup', async t=>{
 process.env.NODE_ENV='test';process.env.JWT_SECRET='isolated-post-lifecycle';
 const db=await MongoMemoryServer.create();await mongoose.connect(db.getUri());
 t.after(async()=>{require('../utils/feedCache').clearAll();await mongoose.disconnect();await db.stop();});
 const app=express();app.use(express.json());app.use('/posts',require('../routes/postRoutes'));app.use('/comments',require('../routes/commentRoutes'));app.use(require('../routes/userRoutes'));app.use('/admin',require('../routes/adminRoutes'));app.use(require('../middlewares/errorHandler').errorHandler);
 const User=require('../models/User'),Post=require('../models/Post'),Comment=require('../models/Comment'),Notification=require('../models/Notification');
 const [owner,actor]=await User.create(['owner','actor'].map(username=>({username,fullName:username,email:username+'@example.test',password:'TestPassword123!',postsCount:-1})));
 const auth=u=>'Bearer '+u.generateAuthToken();
 const original=await Post.create({author:owner._id,content:'Original'});await Post.create({author:owner._id,content:'Second'});
 await t.test('profile uses existing posts, not a stale negative counter',async()=>{const res=await request(app).get('/users/owner').set('Authorization',auth(owner)).expect(200);assert.equal(res.body.data.postsCount,2);});
 await t.test('repost returns a populated serializable post and supports reposting a repost',async()=>{const res=await request(app).post('/posts/'+original.id+'/repost').set('Authorization',auth(actor)).send({}).expect(201);assert.ok(res.body.data.post._id);assert.equal(res.body.data.post.originalPost._id,original.id);const second=await request(app).post('/posts/'+res.body.data.post._id+'/repost').set('Authorization',auth(owner)).send({comment:'Again'}).expect(201);assert.equal(second.body.data.post.originalPost._id,original.id);});
 await t.test('deleting a comment removes its reply likes and notifications',async()=>{const parent=await Comment.create({author:owner._id,post:original._id,content:'Parent'});const reply=await Comment.create({author:actor._id,post:original._id,parentComment:parent._id,content:'Reply'});await require('../models/CommentLike').create({user:owner._id,comment:reply._id});await Notification.create({recipient:owner._id,actor:actor._id,type:'reply',target:reply._id,groupingKey:original._id});await request(app).delete('/comments/'+parent.id).set('Authorization',auth(owner)).expect(200);assert.equal(await Notification.countDocuments({target:reply._id}),0);assert.equal(await require('../models/CommentLike').countDocuments({comment:reply._id}),0);});

 await t.test('deleting one grouped comment preserves the remaining comment alert', async()=>{
  const first=await request(app).post('/posts/'+original.id+'/comments').set('Authorization',auth(actor)).send({content:'First surviving comment'}).expect(201);
  const second=await request(app).post('/posts/'+original.id+'/comments').set('Authorization',auth(actor)).send({content:'Second removed comment'}).expect(201);
  await request(app).delete('/comments/'+second.body.data.comment._id).set('Authorization',auth(actor)).expect(200);
  const alert=await Notification.findOne({recipient:owner._id,type:'comment',groupingKey:original._id});
  assert.equal(String(alert.target),first.body.data.comment._id);assert.equal(alert.actorCount,1);
 });
 await t.test('deleting a reply updates its parent and removes legacy parent-targeted alerts',async()=>{
  const parent=await Comment.create({author:owner._id,post:original._id,content:'Legacy parent'});
  const reply=await Comment.create({author:actor._id,post:original._id,parentComment:parent._id,content:'Legacy reply'});
  await Notification.create({recipient:owner._id,actor:actor._id,type:'reply',target:parent._id,groupingKey:original._id});
  await request(app).delete('/comments/'+reply.id).set('Authorization',auth(actor)).expect(200);
  assert.equal(await Notification.countDocuments({recipient:owner._id,type:'reply',groupingKey:original._id}),0);
  assert.equal((await Comment.findById(parent._id)).repliesCount,0);
 });
 await t.test('new posts and edits return data and synchronize stored counters',async()=>{
  const created=await request(app).post('/posts').set('Authorization',auth(actor)).send({content:'New post'}).expect(201);
  assert.equal(created.body.data.post.author._id,actor.id);
  const edited=await request(app).patch('/posts/'+created.body.data.post._id).set('Authorization',auth(actor)).send({content:'Edited post'}).expect(200);
  assert.equal(edited.body.data.post.content,'Edited post');
  assert.equal((await User.findById(actor._id)).postsCount,await Post.countDocuments({author:actor._id}));
  await request(app).delete('/posts/'+created.body.data.post._id).set('Authorization',auth(owner)).expect(403);
 });
 await t.test('historical orphan alerts are removed from unread counts',async()=>{
  const missing=new mongoose.Types.ObjectId();
  await Notification.create({recipient:owner._id,actor:actor._id,type:'like',target:missing,groupingKey:missing});
  await Notification.getUnreadCount(owner._id);
  assert.equal(await Notification.countDocuments({target:missing}),0);
 });
 await t.test('post deletion removes related notifications and reposts but preserves unrelated ones',async()=>{await Notification.create({recipient:owner._id,actor:actor._id,type:'like',target:original._id,groupingKey:original._id});const follow=await Notification.create({recipient:owner._id,actor:actor._id,type:'follow'});await request(app).delete('/posts/'+original.id).set('Authorization',auth(owner)).expect(204);assert.equal(await Notification.countDocuments({groupingKey:original._id}),0);assert.equal(await Post.countDocuments({originalPost:original._id}),0);assert.ok(await Notification.findById(follow._id));});
 await t.test('admin deletions use the same cascade and repair counts',async()=>{
  const admin=await User.create({username:'lifecycle_admin',fullName:'Admin',email:'admin@example.test',password:'TestPassword123!',role:'admin'});
  const post=await Post.create({author:actor._id,content:'Admin moderated post'});
  const parent=await Comment.create({author:actor._id,post:post._id,content:'Admin moderated comment'});
  const reply=await Comment.create({author:owner._id,post:post._id,parentComment:parent._id,content:'Reply'});
  await Notification.create({recipient:actor._id,actor:owner._id,type:'reply',target:reply._id,groupingKey:post._id});
  await request(app).delete('/admin/comments/'+parent.id).set('Authorization',auth(admin)).expect(200);
  assert.equal(await Comment.countDocuments({post:post._id}),0);
  assert.equal(await Notification.countDocuments({groupingKey:post._id}),0);
  await request(app).delete('/admin/posts/'+post.id).set('Authorization',auth(admin)).expect(200);
  assert.equal((await User.findById(actor._id)).postsCount,await Post.countDocuments({author:actor._id}));
  await request(app).delete('/admin/posts/'+post.id).set('Authorization',auth(admin)).expect(404);
 });

 await t.test('removing a repost keeps the original and repairs its count and grouped alert',async()=>{
  const original=await Post.create({author:owner._id,content:'Repost deletion'});
  const a=await request(app).post('/posts/'+original.id+'/repost').set('Authorization',auth(actor)).send({}).expect(201);
  const b=await request(app).post('/posts/'+original.id+'/repost').set('Authorization',auth(actor)).send({comment:'Second share'}).expect(201);
  assert.equal((await User.findById(actor._id)).postsCount,await Post.countDocuments({author:actor._id}));
  assert.equal((await Post.findById(original._id)).repostsCount,2);
  await request(app).delete('/posts/'+b.body.data.post._id).set('Authorization',auth(actor)).expect(204);
  assert.equal((await Post.findById(original._id)).repostsCount,1);
  const alert=await Notification.findOne({type:'repost',groupingKey:original._id});
  assert.equal(String(alert.target),a.body.data.post._id);assert.equal(alert.actorCount,1);
 });

});
