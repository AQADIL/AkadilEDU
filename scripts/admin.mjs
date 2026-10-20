import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { courseSummary } = require('../functions/catalog.js');

const [operation, uid] = process.argv.slice(2).filter((value) => value !== '--apply');
const apply = process.argv.includes('--apply');
if (
  !['grant-admin', 'sync-catalog', 'migrate-profiles', 'audit-password-fields'].includes(operation)
) {
  throw new Error('Choose grant-admin, sync-catalog, migrate-profiles or audit-password-fields');
}
if (!process.env.FIREBASE_DATABASE_URL) throw new Error('FIREBASE_DATABASE_URL is required');
const app = initializeApp({
  credential: applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const database = getDatabase(app);
let affected = 0;
try {
  if (operation === 'grant-admin') {
    if (!uid) throw new Error('A user UID is required');
    const user = await getAuth(app).getUser(uid);
    if (user.disabled || !user.emailVerified)
      throw new Error('An active verified account is required');
    affected = 1;
    if (apply) {
      await getAuth(app).setCustomUserClaims(uid, { ...user.customClaims, admin: true });
      await database.ref(`users/${uid}/role`).set('admin');
    }
  } else if (operation === 'sync-catalog') {
    const courses = (await database.ref('courses').get()).val() || {};
    const catalog = Object.fromEntries(
      Object.entries(courses)
        .map(([key, course]) => [key, courseSummary(course)])
        .filter(([, course]) => course),
    );
    affected = Object.keys(catalog).length;
    if (apply) await database.ref('courseCatalog').set(catalog);
  } else if (operation === 'audit-password-fields') {
    const users = (await database.ref('users').get()).val() || {};
    affected = Object.values(users).filter(
      (user) => Object.hasOwn(user, 'password') || Object.hasOwn(user, 'newPassword'),
    ).length;
    if (apply)
      throw new Error('This operation is read-only. Plan credential remediation separately.');
  } else {
    let pageToken;
    do {
      const page = await getAuth(app).listUsers(1000, pageToken);
      for (const user of page.users) {
        const profile = database.ref(`users/${user.uid}`);
        if ((await profile.get()).exists()) continue;
        affected++;
        if (apply)
          await profile.transaction(
            (current) =>
              current || {
                uid: user.uid,
                email: user.email || '',
                name: user.displayName || '',
                role: user.customClaims?.admin === true ? 'admin' : 'student',
                status: user.disabled ? 'suspended' : 'active',
                isDeleted: false,
                registeredAt: user.metadata.creationTime,
              },
          );
      }
      pageToken = page.pageToken;
    } while (pageToken);
  }
  process.stdout.write(
    `${JSON.stringify({ operation, mode: apply ? 'applied' : 'dry-run', affected })}\n`,
  );
} finally {
  await deleteApp(app);
}
