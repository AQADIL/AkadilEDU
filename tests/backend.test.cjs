const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../backend/app');

test('push endpoint rejects missing, invalid and non-admin credentials', async () => {
  let databaseCalls = 0;
  const admin = {
    auth: () => ({
      async verifyIdToken(token, checkRevoked) {
        assert.equal(checkRevoked, true);
        if (token === 'invalid') throw new Error('invalid token');
        return { uid: 'student', admin: false };
      },
    }),
    database: () => {
      databaseCalls++;
      throw new Error('Database must not be reached');
    },
  };
  const server = createApp(admin, []).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/send-push-to-all`;
    for (const [token, status] of [
      [null, 401],
      ['invalid', 401],
      ['student', 403],
    ]) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: 'Test', message: 'Test', adminUid: 'spoofed' }),
      });
      assert.equal(response.status, status);
    }
    assert.equal(databaseCalls, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
