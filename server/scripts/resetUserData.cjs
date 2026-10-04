// Dry run by default. Uses DB_URL from the server environment; never prints it.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const mongoose = require('mongoose');
const { EJSON } = mongoose.mongo.BSON;

const ADMIN_ROLES = ['admin', 'super_admin', 'branch_admin'];
const PRESERVED = ['branches', 'rounds', 'tracks', 'roles'];
const DYNAMIC = [
  'comments', 'commentlikes', 'communities', 'communitymembers', 'communityjoinrequests',
  'communitygroups', 'groupcomments', 'groupposts', 'groupjoinrequests', 'connections',
  'conversations', 'messages', 'notifications', 'posts', 'postlikes', 'postsaves',
  'enrollments', 'enrollmentrequests', 'trackchatmessages', 'trackitemreviews',
  'coursefiles', 'coursevideos', 'trackfolders', 'trackrecords', 'jobs', 'events',
];

async function inventory(db) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const counts = {};
  for (const { name } of collections) {
    counts[name] = await db.collection(name).countDocuments();
    if (!['users', ...PRESERVED, ...DYNAMIC].includes(name) && counts[name]) {
      throw new Error(`Unclassified collection ${name}; review its retention before applying cleanup`);
    }
  }
  const admins = await db.collection('users').countDocuments({ role: { $in: ADMIN_ROLES } });
  return { database: db.databaseName, counts, preserved: PRESERVED, adminsKept: admins, usersToDelete: (counts.users || 0) - admins };
}

async function resetUserData(connection, backupDirectory) {
  const db = connection.db;
  const plan = await inventory(db);
  if (!plan.adminsKept) throw new Error('No admin accounts found; verify the target database before cleanup');
  fs.mkdirSync(backupDirectory, { recursive: true });
  const session = await connection.startSession();
  let backupPath;
  try {
    await session.withTransaction(async () => {
      const snapshot = {};
      for (const name of Object.keys(plan.counts)) {
        snapshot[name] = await db.collection(name).find({}, { session }).toArray();
      }
      backupPath = path.join(backupDirectory, `before-cleanup-${Date.now()}.ejson.gz`);
      const bytes = zlib.gzipSync(EJSON.stringify({ database: db.databaseName, collections: snapshot }));
      fs.writeFileSync(backupPath, bytes, { flag: 'wx', mode: 0o600 });
      // Read back the backup before any write to the database.
      EJSON.parse(zlib.gunzipSync(fs.readFileSync(backupPath)).toString());
      const adminIds = snapshot.users.filter(u => ADMIN_ROLES.includes(u.role)).map(u => u._id);
      const removedUsers = snapshot.users.filter(u => !ADMIN_ROLES.includes(u.role)).map(u => u._id);
      for (const name of DYNAMIC) {
        if (!snapshot[name]?.length) continue;
        await db.collection(name).deleteMany({ _id: { $in: snapshot[name].map(d => d._id) } }, { session });
      }
      await db.collection('users').deleteMany({ _id: { $in: removedUsers } }, { session });
      await db.collection('users').updateMany({ _id: { $in: adminIds } }, { $set: { postsCount: 0, followersCount: 0, followingCount: 0 } }, { session });
      // Preserve the catalog itself while removing deleted users' memberships.
      await db.collection('tracks').updateMany({}, { $pull: { instructorIds: { $in: removedUsers }, studentIds: { $in: removedUsers } } }, { session });
      await db.collection('tracks').updateMany({ adminId: { $in: removedUsers } }, { $set: { adminId: null } }, { session });
      for (const name of PRESERVED) {
        if (await db.collection(name).countDocuments({}, { session }) !== (plan.counts[name] || 0)) throw Error(`Preserved collection changed: ${name}`);
      }
    });
  } finally { await session.endSession(); }
  return { backupPath, before: plan, after: await inventory(db) };
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
  (async () => {
    if (!process.env.DB_URL) throw new Error('DB_URL is required');
    await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 15000 });
    const plan = await inventory(mongoose.connection.db);
    if (!process.argv.includes('--apply')) { console.log(JSON.stringify(plan, null, 2)); return; }
    const expectedDatabase = process.argv.find(a => a.startsWith('--database='))?.slice(11);
    if (expectedDatabase !== plan.database) throw new Error('Pass the exact --database name shown by the dry run');
    const result = await resetUserData(mongoose.connection, path.resolve(__dirname, '../../.private-backups'));
    console.log(JSON.stringify(result, null, 2));
  })().catch(e => {
    // Connection error messages may contain deployment identifiers; only print codes.
    console.error(e.name?.startsWith('Mongo') ? `${e.name}: ${e.codeName || e.code || 'connection failed'}` : e.message);
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}
module.exports = { inventory, resetUserData, ADMIN_ROLES, PRESERVED, DYNAMIC };
