const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const requireServer = createRequire(require.resolve('../functions/package.json'));

process.env.GCLOUD_PROJECT = 'demo-akadiledu-audit';
process.env.DATABASE_REGION = 'europe-west1';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: process.env.GCLOUD_PROJECT,
  databaseURL: 'https://demo-akadiledu-audit-default-rtdb.europe-west1.firebasedatabase.app',
  storageBucket: 'demo-akadiledu-audit.firebasestorage.app',
});

const functions = require('../functions');
const { getApp, deleteApp } = requireServer('firebase-admin/app');
const { getAuth } = requireServer('firebase-admin/auth');
const { getDatabase } = requireServer('firebase-admin/database');
const { getMessaging } = requireServer('firebase-admin/messaging');
const { getStorage } = requireServer('firebase-admin/storage');

after(() => deleteApp(getApp()));

test('installed Admin SDK exposes the services used by deployed functions', () => {
  assert.equal(typeof getAuth().getUser, 'function');
  assert.equal(typeof getMessaging().sendEachForMulticast, 'function');
  assert.equal(typeof getStorage().bucket().deleteFiles, 'function');
  assert.equal(
    getDatabase().ref('courses').toString(),
    `${JSON.parse(process.env.FIREBASE_CONFIG).databaseURL}/courses`,
  );
  assert.deepEqual(functions.syncCourseCatalog.__endpoint.region, [process.env.DATABASE_REGION]);
});

test('deployed callable handlers reject unauthenticated requests', async () => {
  for (const name of [
    'deleteUser',
    'setUserRole',
    'sendPushToUser',
    'sendPushToAll',
    'assignCourseServer',
    'bulkAssignCourse',
    'processLearningAI',
  ]) {
    await assert.rejects(functions[name].run({}, {}), { code: 'unauthenticated' }, name);
  }
});
