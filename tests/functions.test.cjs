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
    'getCourseContent',
    'getLessonPlayback',
  ]) {
    await assert.rejects(functions[name].run({}, {}), { code: 'unauthenticated' }, name);
  }
});

test('course callables filter sources and enforce access and playback rate limits', async (t) => {
  let identity = { uid: 'student', emailVerified: true, disabled: false };
  let profile = { status: 'active', courses: { course: { expiryDate: Date.now() + 60000 } } };
  const counters = new Map();
  const course = {
    title: 'Course',
    modules: {
      one: {
        lessons: {
          first: { videoUrl: 'M7lc1UVf-VE', title: 'First' },
          second: { videoUrl: 'aqz-KE-bpKQ', title: 'Second' },
        },
      },
    },
  };
  t.mock.method(getAuth(), 'getUser', async () => identity);
  t.mock.method(getDatabase(), 'ref', (path) => ({
    get: async () => {
      if (path === 'users/student') return { val: () => profile };
      if (path === 'courses/course') return { val: () => course };
      throw new Error('Unexpected database read');
    },
    transaction: async (callback) => {
      const next = callback(counters.get(path));
      if (next === undefined) return { committed: false };
      counters.set(path, next);
      return { committed: true };
    },
  }));
  const context = { auth: { uid: 'student', token: {} } };
  const content = await functions.getCourseContent.run({ courseId: 'course' }, context);
  assert.equal(JSON.stringify(content).includes('videoUrl'), false);
  assert.equal(JSON.stringify(content).includes('M7lc1UVf-VE'), false);
  assert.equal(content.course.modules.one.lessons.first.hasVideo, true);
  assert.deepEqual(
    await functions.getLessonPlayback.run({ courseId: 'course', lessonId: 'first' }, context),
    { videoId: 'M7lc1UVf-VE' },
  );
  await assert.rejects(
    functions.getLessonPlayback.run({ courseId: 'course', lessonId: 'missing' }, context),
    { code: 'not-found' },
  );
  await assert.rejects(
    functions.getLessonPlayback.run({ courseId: '../course', lessonId: 'first' }, context),
    { code: 'invalid-argument' },
  );
  profile = { ...profile, courses: {} };
  await assert.rejects(
    functions.getLessonPlayback.run({ courseId: 'course', lessonId: 'first' }, context),
    { code: 'permission-denied' },
  );
  profile = { ...profile, courses: { course: { expiryDate: 1 } } };
  await assert.rejects(functions.getCourseContent.run({ courseId: 'course' }, context), {
    code: 'permission-denied',
  });
  profile = { ...profile, courses: { course: {} } };
  identity = { ...identity, disabled: true };
  await assert.rejects(
    functions.getLessonPlayback.run({ courseId: 'course', lessonId: 'first' }, context),
    { code: 'permission-denied' },
  );
  identity = { ...identity, disabled: false };
  counters.clear();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await functions.getLessonPlayback.run({ courseId: 'course', lessonId: 'first' }, context);
  }
  await assert.rejects(
    functions.getLessonPlayback.run({ courseId: 'course', lessonId: 'first' }, context),
    { code: 'resource-exhausted' },
  );
});
