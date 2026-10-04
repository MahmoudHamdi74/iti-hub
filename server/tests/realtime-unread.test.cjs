const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { io: connect } = require('socket.io-client');

function event(socket, name) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.off(name, done); reject(new Error(`Missing ${name}`)); }, 5000);
    const done = data => { clearTimeout(timeout); resolve(data); };
    socket.once(name, done);
  });
}

test('messages and notifications reach both devices; unread totals and seen events stay synchronized', async t => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'isolated-realtime-test';
  const db = await MongoMemoryServer.create();
  await mongoose.connect(db.getUri());
  const app = express();
  app.use(express.json());
  app.use('/conversations', require('../routes/conversationRoutes'));
  app.use('/notifications', require('../routes/notificationRoutes'));
  app.use(require('../middlewares/errorHandler').errorHandler);
  const server = http.createServer(app);
  const socketServer = require('../utils/socketServer').initializeSocketServer(server);
  const clients = [];
  t.after(async () => {
    clients.forEach(socket => socket.disconnect());
    await new Promise(resolve => socketServer.close(resolve));
    await mongoose.disconnect();
    await db.stop();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const User = require('../models/User');
  const Notification = require('../models/Notification');
  const users = await User.create(['sender', 'receiver'].map(name => ({ username: name, fullName: name, email: `${name}@example.test`, password: 'TestPassword123!', role: 'student' })));
  const [sender, receiver] = users;
  const senderAuth = `Bearer ${sender.generateAuthToken()}`;
  const receiverAuth = `Bearer ${receiver.generateAuthToken()}`;
  for (const transports of [['polling'], ['websocket']]) {
    const socket = connect(`http://127.0.0.1:${server.address().port}`, { auth: { token: receiver.generateAuthToken() }, transports, autoConnect: false });
    clients.push(socket);
    const connected = event(socket, 'connect');
    socket.connect();
    await connected;
  }
  const created = await request(app).post('/conversations').set('Authorization', senderAuth).send({ participantId: receiver.id }).expect(201);
  const conversationId = created.body.data.conversation._id;
  const existing = await request(app).post('/conversations').set('Authorization', senderAuth).send({ participantId: receiver.id }).expect(200);
  assert.equal(existing.body.data.conversation._id, conversationId);

  const receivedIds = [];
  for (let n = 0; n < 2; n++) {
    const delivered = clients.map(socket => event(socket, 'message:new'));
    await request(app).post(`/conversations/${conversationId}/messages`).set('Authorization', senderAuth).send({ content: 'Same text twice' }).expect(201);
    const arrivals = await Promise.all(delivered);
    assert.equal(arrivals[0].messageId, arrivals[1].messageId);
    receivedIds.push(arrivals[0].messageId);
  }
  assert.notEqual(receivedIds[0], receivedIds[1]);
  const unread = await request(app).get('/conversations/unread/count').set('Authorization', receiverAuth).expect(200);
  assert.equal(unread.body.data.unreadCount, 2);
  const senderUnread = await request(app).get('/conversations/unread/count').set('Authorization', senderAuth).expect(200);
  assert.equal(senderUnread.body.data.unreadCount, 0);
  const seenEvents = clients.map(socket => event(socket, 'message:seen'));
  await request(app).put(`/conversations/${conversationId}/seen`).set('Authorization', receiverAuth).expect(200);
  for (const seen of await Promise.all(seenEvents)) assert.equal(seen.userId, receiver.id);
  assert.equal((await request(app).get('/conversations/unread/count').set('Authorization', receiverAuth)).body.data.unreadCount, 0);

  const notifications = clients.map(socket => event(socket, 'notification:new'));
  const counts = clients.map(socket => event(socket, 'notification:count'));
  const notification = await Notification.createOrUpdateNotification(receiver._id, sender._id, 'follow');
  for (const arrival of await Promise.all(notifications)) assert.equal(arrival.notification._id, notification.id);
  for (const count of await Promise.all(counts)) assert.equal(count.unreadCount, 1);
  const cleared = clients.map(socket => event(socket, 'notification:count'));
  await request(app).put(`/notifications/${notification.id}/read`).set('Authorization', receiverAuth).expect(200);
  for (const count of await Promise.all(cleared)) assert.equal(count.unreadCount, 0);
});
