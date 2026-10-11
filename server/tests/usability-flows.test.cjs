const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express'), request = require('supertest'), mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
test('paged conversations, replies, community settings and repeat-safe publishing', async t => {
  process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'isolated-usability-test';
  const db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri());
  t.after(async () => { require('../utils/feedCache').clearAll(); await mongoose.disconnect(); await db.stop(); });
  require('../utils/cloudinary').uploadToCloudinary = async () => ({ secure_url: 'https://example.test/photo.png' });
  const app = express(); app.use(express.json());
  for(const [url,route] of [['conversations','conversation'],['communities','community'],['posts','post'],['feed','feed']])app.use('/'+url,require('../routes/'+route+'Routes'));
  app.use(require('../middlewares/errorHandler').errorHandler);
  const User = require('../models/User'), Conversation = require('../models/Conversation'), Message = require('../models/Message'), Post = require('../models/Post'), Community = require('../models/Community');
  await Post.init();
  const [owner, member, outsider] = await User.create(['owner', 'member', 'outsider'].map(username => ({ username, fullName: username, email: username+'@example.test', password: 'TestPassword123!' })));
  const auth = user => 'Bearer '+user.generateAuthToken();
  const conversation = await Conversation.create({ participants: [owner._id, member._id], type: 'individual' });
  const other = await Conversation.create({ participants: [owner._id, outsider._id], type: 'individual' });
  const original = await Message.create({ conversation: other._id, sender: owner._id, content: 'Private other conversation' });
  const batch = await Message.insertMany(Array.from({ length: 55 }, (_, i) => ({ conversation: conversation._id, sender: owner._id, content: 'Message '+i, createdAt: new Date('2026-01-01') })));
  await t.test('20 messages per page with tied timestamps, no gaps or duplicates', async () => {
    let cursor, ids = [];
    for (const expected of [20, 20, 15]) {
      const res = await request(app).get('/conversations/'+conversation.id+'/messages').query({ cursor }).set('Authorization', auth(member)).expect(200);
      assert.equal(res.body.data.messages.length, expected); ids.push(...res.body.data.messages.map(m => m._id)); cursor = res.body.data.cursor;
    }
    assert.equal(new Set(ids).size,55); assert.equal(cursor,null);
  });
  await t.test('replies survive reload and cannot reference a different conversation', async () => {
    const res = await request(app).post('/conversations/'+conversation.id+'/messages').set('Authorization',auth(member)).send({ content:'Reply text', replyTo:batch[10].id }).expect(201);
    assert.equal(res.body.data.message.replyTo._id,batch[10].id);
    const read = await request(app).get('/conversations/'+conversation.id+'/messages').set('Authorization',auth(member)).expect(200);
    assert.equal(read.body.data.messages[0].replyTo.content,'Message 10');
    await request(app).post('/conversations/'+conversation.id+'/messages').set('Authorization',auth(member)).send({ content:'Bad reply', replyTo:original.id }).expect(404);
    await request(app).post('/conversations/'+conversation.id+'/messages').set('Authorization',auth(outsider)).send({content:'Unauthorized'}).expect(403);
  });
  await t.test('only owner can rename; deleted community returns 404',async()=>{
    const community=await Community.create({name:'Before',description:'Description',owners:[owner._id],tags:[require('../utils/constants').COMMUNITY_TAGS[0]]});
    const cache = require('../utils/feedCache');
    await cache.set('feed:rename-test', { name: 'Before' }, 60);
    await request(app).patch('/communities/'+community.id).set('Authorization',auth(owner)).send({name:'After',description:'Updated'}).expect(200);
    assert.equal(await cache.get('feed:rename-test'), null);
    assert.equal((await Community.findById(community._id)).name,'After');
    await request(app).patch('/communities/'+community.id).set('Authorization',auth(member)).send({name:'No'}).expect(403);
    await request(app).patch('/communities/'+community.id).set('Authorization',auth(owner)).send({name:'x'}).expect(400);
    await Community.deleteOne({_id:community._id});await request(app).get('/communities/'+community.id).expect(404);
  });
  await t.test('repeated image upload returns same saved post',async()=>{
    const photo=await require('sharp')({create:{width:10,height:10,channels:3,background:'#ff0000'}}).png().toBuffer();
    const send=()=>request(app).post('/posts').set('Authorization',auth(owner)).field('content','Image post').field('clientRequestId','test-repeat-request-123').attach('images',photo,'photo.png');
    const first=await send().expect(201), second=await send().expect(201);
    assert.equal(first.body.data.post._id,second.body.data.post._id);assert.equal(first.body.data.post.images.length,1);
    assert.equal(await Post.countDocuments({clientRequestId:'test-repeat-request-123'}),1);
    const lookup=await request(app).get('/posts/requests/test-repeat-request-123').set('Authorization',auth(owner)).expect(200);
    assert.equal(lookup.body.data.post._id,first.body.data.post._id);
    await request(app).get('/posts/requests/test-repeat-request-123').set('Authorization',auth(member)).expect(404);
  });
  await t.test('feed pages stay bounded and distinct',async()=>{
    await Post.insertMany(Array.from({length:45},(_,i)=>({author:owner._id,content:'Feed '+i})));
    const pages=await Promise.all([1,2].map(page=>request(app).get('/feed/home').query({page,limit:20}).expect(200)));
    assert.equal(pages[0].body.data.posts.length,20);assert.equal(pages[1].body.data.posts.length,20);
    assert.equal(new Set(pages.flatMap(p=>p.body.data.posts.map(post=>post._id))).size,40);
  });
});
