const { test } = require('node:test');
const { readFileSync } = require('node:fs');

test(
  'storage rules restrict avatar writes and reject executable uploads',
  {
    skip: !process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  },
  async () => {
    const { initializeTestEnvironment, assertSucceeds, assertFails } =
      await import('@firebase/rules-unit-testing');
    const { ref, uploadBytes, deleteObject } = await import('firebase/storage');
    const [host, port] = process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(':');
    const environment = await initializeTestEnvironment({
      projectId: process.env.GCLOUD_PROJECT,
      storage: { host, port: Number(port), rules: readFileSync('storage.rules', 'utf8') },
    });
    try {
      const owner = environment.authenticatedContext('student').storage();
      const stranger = environment.authenticatedContext('other').storage();
      const anonymous = environment.unauthenticatedContext().storage();
      const avatar = 'user_avatars/student/avatar.png';
      const bytes = new Uint8Array([137, 80, 78, 71]);
      await assertSucceeds(uploadBytes(ref(owner, avatar), bytes, { contentType: 'image/png' }));
      await assertFails(uploadBytes(ref(stranger, avatar), bytes, { contentType: 'image/png' }));
      await assertFails(uploadBytes(ref(anonymous, avatar), bytes, { contentType: 'image/png' }));
      await assertFails(uploadBytes(ref(owner, avatar), bytes, { contentType: 'image/svg+xml' }));
      await assertFails(
        uploadBytes(ref(owner, avatar), new Uint8Array(5 * 1024 * 1024 + 1), {
          contentType: 'image/png',
        }),
      );
      await assertFails(deleteObject(ref(stranger, avatar)));
      await assertSucceeds(deleteObject(ref(owner, avatar)));
    } finally {
      await environment.cleanup();
    }
  },
);
