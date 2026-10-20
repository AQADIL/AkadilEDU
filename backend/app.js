const express = require('express');
const cors = require('cors');

function createApp(admin, allowedOrigins) {
  const app = express();
  const recentRequests = new Map();
  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, !origin || allowedOrigins.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', (request, response) => response.json({ status: 'ok' }));

  app.post('/api/send-push-to-all', async (request, response) => {
    const match = request.headers.authorization?.match(/^Bearer (.+)$/);
    if (!match) return response.status(401).json({ error: 'authentication-required' });
    let user;
    try {
      user = await admin.auth().verifyIdToken(match[1], true);
    } catch {
      return response.status(401).json({ error: 'invalid-session' });
    }
    if (user.admin !== true) return response.status(403).json({ error: 'admin-required' });
    const { title, message, imageUrl } = request.body || {};
    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.length > 120 ||
      typeof message !== 'string' ||
      !message.trim() ||
      message.length > 2000
    ) {
      return response.status(400).json({ error: 'invalid-notification' });
    }
    if (imageUrl) {
      try {
        if (new URL(imageUrl).protocol !== 'https:') throw new Error();
      } catch {
        return response.status(400).json({ error: 'invalid-image-url' });
      }
    }
    const now = Date.now();
    for (const [uid, timestamp] of recentRequests) {
      if (now - timestamp >= 60000) recentRequests.delete(uid);
    }
    if (recentRequests.has(user.uid)) return response.status(429).json({ error: 'rate-limited' });
    recentRequests.set(user.uid, now);
    try {
      const snapshot = await admin.database().ref('users').once('value');
      const tokens = [
        ...new Set(
          Object.values(snapshot.val() || {})
            .filter(
              (profile) =>
                profile.status === 'active' &&
                !profile.isDeleted &&
                profile.pushNotificationsEnabled !== false,
            )
            .map((profile) => profile.fcmToken)
            .filter((token) => typeof token === 'string' && token),
        ),
      ];
      let successCount = 0;
      let failureCount = 0;
      for (let offset = 0; offset < tokens.length; offset += 500) {
        const result = await admin.messaging().sendEachForMulticast({
          tokens: tokens.slice(offset, offset + 500),
          notification: { title: title.trim(), body: message.trim() },
          webpush: {
            notification: {
              icon: '/icons/icon-192.png',
              ...(imageUrl ? { image: imageUrl } : {}),
            },
          },
        });
        successCount += result.successCount;
        failureCount += result.failureCount;
      }
      await admin
        .database()
        .ref('adminLogs')
        .push({
          adminUid: user.uid,
          action: 'sendPushToAll',
          results: { success: successCount, failure: failureCount },
          ts: new Date().toISOString(),
        });
      return response.json({
        success: successCount > 0,
        successCount,
        failureCount,
        totalUsers: tokens.length,
      });
    } catch {
      return response.status(503).json({ error: 'notification-service-unavailable' });
    }
  });
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    const status =
      error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    return response.status(status).json({ error: 'invalid-request' });
  });
  return app;
}

module.exports = { createApp };
