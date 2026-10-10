const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

test('SMTP failures cannot be reported as sent, and OTP accounts remain recoverable', async t => {
  process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'isolated-mail-failure'; process.env.FRONTEND_BASE_URL = 'https://www.itihub.tech';
  const emailPath = require.resolve('../utils/sendEmail');
  let failing = true; const emails = [];
  require.cache[emailPath] = { id: emailPath, filename: emailPath, loaded: true, exports: async mail => { if (failing) throw Object.assign(new Error('SMTP unavailable'), { code: 'EAUTH' }); emails.push(mail); } };
  const db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri());
  t.after(async () => { await mongoose.disconnect(); await db.stop(); });
  const app = express(); app.use(express.json()); app.use('/auth', require('../routes/authRoutes')); app.use(require('../middlewares/errorHandler').errorHandler);
  const account = { email: 'mail@example.test', username: 'mail_test', fullName: 'Mail Test', password: 'TestPassword123!' };
  const registered = await request(app).post('/auth/register').send(account).expect(201);
  assert.equal(registered.body.data.emailDelivery, 'failed'); assert.equal(registered.body.data.token, undefined);
  await request(app).post('/auth/resend-otp').send({ email: account.email }).expect(503);
  await request(app).post('/auth/password-reset/request').send({ email: account.email }).expect(503);
  failing = false;
  await request(app).post('/auth/resend-otp').send({ email: account.email }).expect(200);
  const otp = emails.at(-1).html.match(/\b\d{6}\b/)[0];
  await request(app).post('/auth/verify-otp').send({ email: account.email, otp }).expect(200);
  await request(app).post('/auth/password-reset/request').send({ email: account.email }).expect(200);
  assert.ok(emails.at(-1).html.includes('https://www.itihub.tech/password-reset/confirm?token='));
});
