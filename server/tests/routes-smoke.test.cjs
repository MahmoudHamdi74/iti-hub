const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

test('every mounted API route responds without server errors, guest writes remain guarded', async t => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'isolated-route-smoke-secret';
  const db = await MongoMemoryServer.create();
  await mongoose.connect(db.getUri());
  t.after(async () => { await mongoose.disconnect(); await db.stop(); });
  const app = require('../app');
  const User = require('../models/User');
  const admin = await User.create({ username: 'route_admin', fullName: 'Route Admin', email: 'route-admin@example.test', password: 'TestPassword123!', role: 'super_admin' });
  const member = await User.create({ username: 'route_member', fullName: 'Route Member', email: 'route-member@example.test', password: 'TestPassword123!', role: 'student' });
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const imports = new Map([...source.matchAll(/const (\w+) = require\("(\.\/routes\/[^"\n]+)"\)/g)].map(m => [m[1], m[2]]));
  const failures = []; let checked = 0;
  for (const mount of source.matchAll(/apiRouter\.use\((?:"([^"]+)", )?(\w+)\)/g)) {
    const [, prefix = '', variable] = mount;
    const router = require(path.join(__dirname, '..', imports.get(variable)));
    for (const layer of router.stack) {
      if (!layer.route) continue;
      for (const [method, active] of Object.entries(layer.route.methods)) {
        if (!active || method === 'head') continue;
        const route = '/api' + prefix + (layer.route.path === '/' ? '' : layer.route.path);
        const url = route.replace(/:username/g, member.username).replace(/:[A-Za-z0-9_]+/g, '507f1f77bcf86cd799439011');
        for (const actor of method === 'get' ? [null, member, admin] : [null]) {
          let req = request(app)[method](url).query({ q: 'route', limit: 3 });
          if (actor) req = req.set('Authorization', `Bearer ${actor.generateAuthToken()}`);
          if (method !== 'get') req = req.send({});
          const response = await req;
          checked++;
          if (response.status >= 500 || response.body.error?.code === 'ROUTE_NOT_FOUND') failures.push({ method, route, role: actor?.role || 'guest', status: response.status, code: response.body.error?.code });
          if (method !== 'get' && response.status < 400 && !['/api/auth/check-email', '/api/auth/check-username'].includes(route)) failures.push({ method, route, issue: 'Guest write unexpectedly accepted' });
        }
      }
    }
  }
  console.log(`Checked ${checked} route/role combinations`);
  assert.deepEqual(failures, []);
});
