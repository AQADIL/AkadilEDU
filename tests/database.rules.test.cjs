const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

test(
  'database rules enforce ownership, admin claims and course access',
  {
    skip: !process.env.FIREBASE_DATABASE_EMULATOR_HOST,
  },
  async (t) => {
    const { initializeTestEnvironment, assertSucceeds, assertFails } =
      await import('@firebase/rules-unit-testing');
    const { ref, get, set, update } = await import('firebase/database');
    const [host, port] = process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
    const environment = await initializeTestEnvironment({
      projectId: process.env.GCLOUD_PROJECT,
      database: { host, port: Number(port), rules: readFileSync('database.rules.json', 'utf8') },
    });
    const profile = {
      uid: 'student',
      name: 'Student',
      role: 'student',
      status: 'active',
      isDeleted: false,
    };
    try {
      await environment.withSecurityRulesDisabled(async (context) => {
        await set(ref(context.database()), {
          users: {
            administrator: { ...profile, uid: 'administrator', role: 'admin' },
            blockedAdmin: { ...profile, uid: 'blockedAdmin', role: 'admin', status: 'suspended' },
            student: {
              ...profile,
              courses: {
                enrolled: { expiryDate: Date.now() + 3600000 },
                expired: { expiryDate: 1 },
              },
            },
            other: { ...profile, uid: 'other' },
            blocked: {
              ...profile,
              uid: 'blocked',
              status: 'suspended',
              courses: { enrolled: { expiryDate: Date.now() + 3600000 } },
            },
          },
          courses: {
            enrolled: { title: 'Enrolled' },
            expired: { title: 'Expired' },
            locked: { title: 'Locked' },
          },
          courseCatalog: { enrolled: { title: 'Enrolled' } },
          privateRateLimits: { private: true },
        });
      });
      const student = environment
        .authenticatedContext('student', { email_verified: true })
        .database();
      const administrator = environment
        .authenticatedContext('administrator', { admin: true, email_verified: true })
        .database();
      const anonymous = environment.unauthenticatedContext().database();
      await t.test('anonymous users cannot read private records', async () => {
        await assertFails(get(ref(anonymous, 'users/student')));
        await assertFails(get(ref(anonymous, 'courses')));
        const blockedAdmin = environment
          .authenticatedContext('blockedAdmin', { admin: true, email_verified: true })
          .database();
        await assertFails(get(ref(blockedAdmin, 'users')));
        await assertFails(set(ref(blockedAdmin, 'courses/locked/title'), 'Changed'));
      });
      await t.test('students can edit profile fields but cannot grant privileges', async () => {
        await assertSucceeds(update(ref(student, 'users/student'), { name: 'Updated' }));
        await assertFails(update(ref(student, 'users/student'), { role: 'admin' }));
        await assertFails(
          update(ref(student, 'users/student'), { status: 'active', isDeleted: false }),
        );
        await assertFails(
          set(ref(student, 'users/student/courses/locked'), { expiryDate: Date.now() + 3600000 }),
        );
        await assertFails(set(ref(student, 'users/student/password'), 'never-store-passwords'));
        await assertSucceeds(set(ref(student, 'users/student/courses/enrolled/order'), 1));
        await assertFails(set(ref(student, 'users/student/courses/locked/order'), 1));
        await assertFails(get(ref(student, 'courses/locked')));
        await assertFails(get(ref(student, 'users/other')));
        await assertFails(get(ref(student, 'users')));
      });
      await t.test('new accounts cannot inject enrolments or admin roles', async () => {
        const account = environment.authenticatedContext('new').database();
        await assertFails(
          set(ref(account, 'users/new'), { ...profile, uid: 'new', role: 'admin' }),
        );
        await assertFails(
          set(ref(account, 'users/new'), {
            ...profile,
            uid: 'new',
            courses: { locked: { expiryDate: Date.now() + 3600000 } },
          }),
        );
        await assertSucceeds(set(ref(account, 'users/new'), { ...profile, uid: 'new' }));
      });
      await t.test(
        'students use server endpoints instead of reading course video sources',
        async () => {
          await assertSucceeds(get(ref(student, 'courseCatalog')));
          await assertFails(get(ref(student, 'courses/enrolled')));
          await assertFails(
            get(ref(student, 'courses/enrolled/modules/one/lessons/first/videoUrl')),
          );
          await assertSucceeds(get(ref(administrator, 'courses/enrolled')));
          await assertFails(get(ref(student, 'courses/expired')));
          await assertFails(get(ref(student, 'courses/locked')));
          await assertFails(get(ref(student, 'courses')));
          const blocked = environment
            .authenticatedContext('blocked', { email_verified: true })
            .database();
          await assertFails(get(ref(blocked, 'courses/enrolled')));
          const unverified = environment
            .authenticatedContext('student', { email_verified: false })
            .database();
          await assertFails(get(ref(unverified, 'courses/enrolled')));
        },
      );
      await t.test(
        'admin authority comes from claims and private limits remain server-only',
        async () => {
          await assertSucceeds(get(ref(administrator, 'users')));
          await assertSucceeds(
            set(ref(administrator, 'users/student/courses/locked'), {
              expiryDate: Date.now() + 3600000,
            }),
          );
          await assertFails(get(ref(student, 'courses/locked')));
          await assertFails(get(ref(administrator, 'privateRateLimits')));
          const forgedRole = environment
            .authenticatedContext('student', { role: 'admin', email_verified: true })
            .database();
          await assertFails(get(ref(forgedRole, 'users')));
          assert.equal((await get(ref(student, 'users/student/name'))).val(), 'Updated');
        },
      );
    } finally {
      await environment.cleanup();
    }
  },
);
