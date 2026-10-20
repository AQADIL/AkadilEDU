const functions = require('firebase-functions/v1');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');
const { getStorage } = require('firebase-admin/storage');
const { validId, expiryTimestamp, validNotification } = require('./validation');

initializeApp();

async function verifyAdmin(uid) {
  const user = await getAuth().getUser(uid);
  if (user.disabled || user.customClaims?.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  const profile = (
    await getDatabase()
      .ref('users/' + uid)
      .get()
  ).val();
  if (profile?.status !== 'active' || profile?.isDeleted) {
    throw new functions.https.HttpsError('permission-denied', 'Account unavailable');
  }
  return true;
}

async function throttlePush(uid) {
  const now = Date.now();
  const result = await getDatabase()
    .ref('privateRateLimits/push/' + uid)
    .transaction((previous) => {
      if (typeof previous === 'number' && now - previous < 60000) return;
      return now;
    });
  if (!result.committed)
    throw new functions.https.HttpsError('resource-exhausted', 'Notification limit reached');
}

function parseExpiry(value) {
  try {
    return expiryTimestamp(value);
  } catch {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid expiry');
  }
}

exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const requesterUid = context.auth.uid;
  const targetUid = data?.uid;

  if (!validId(targetUid) || targetUid === requesterUid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  await verifyAdmin(requesterUid);

  try {
    await getAuth().deleteUser(targetUid);

    await getDatabase().ref(`/users/${targetUid}`).remove();
    await getDatabase().ref(`/auth_logs/${targetUid}`).remove();

    try {
      const bucket = getStorage().bucket();
      await Promise.all(
        ['user_uploads', 'user_avatars'].map((directory) =>
          bucket.deleteFiles({ prefix: `${directory}/${targetUid}/` }),
        ),
      );
    } catch (storageError) {}

    await getDatabase().ref('/adminLogs').push({
      adminUid: requesterUid,
      action: 'deleteUser',
      targetUid,
      ts: new Date().toISOString(),
    });

    return {
      success: true,
      message: `User ${targetUid} deleted successfully`,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'User deletion failed');
  }
});

exports.assignCourseServer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const requesterUid = context.auth.uid;
  const { uid, courseId, expiresAt } = data || {};

  if (!validId(uid) || !validId(courseId)) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID and Course ID are required');
  }

  await verifyAdmin(requesterUid);

  try {
    const courseSnapshot = await getDatabase().ref(`/courses/${courseId}`).once('value');
    if (!courseSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Course not found');
    }

    const userSnapshot = await getDatabase().ref(`/users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    await getDatabase()
      .ref(`/users/${uid}/courses/${courseId}`)
      .set({
        expiryDate: parseExpiry(expiresAt),
        progress: 0,
        assignedBy: requesterUid,
        assignedAt: new Date().toISOString(),
      });

    await getDatabase().ref('/adminLogs').push({
      adminUid: requesterUid,
      action: 'assignCourse',
      targetUid: uid,
      payload: { courseId, expiresAt },
      ts: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Course ${courseId} assigned to user ${uid}`,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Course assignment failed');
  }
});

exports.sendPushToUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const requesterUid = context.auth.uid;
  const { uid, title, body } = data || {};

  if (!validId(uid) || !validNotification(title, body)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID, title, and body are required',
    );
  }

  await verifyAdmin(requesterUid);

  try {
    const userSnapshot = await getDatabase().ref(`/users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnapshot.val();
    if (
      userData.status !== 'active' ||
      userData.isDeleted ||
      userData.pushNotificationsEnabled === false
    ) {
      throw new functions.https.HttpsError('failed-precondition', 'Recipient unavailable');
    }
    await throttlePush(requesterUid);
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', 'User does not have FCM token');
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: fcmToken,
    };

    await getMessaging().send(message);

    await getDatabase().ref('/adminLogs').push({
      adminUid: requesterUid,
      action: 'sendPush',
      targetUid: uid,
      payload: { title, body },
      ts: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Push notification sent to user ${uid}`,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Notification delivery failed');
  }
});

exports.bulkAssignCourse = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const requesterUid = context.auth.uid;
  const { uids, courseId, expiresAt } = data || {};

  if (
    !Array.isArray(uids) ||
    uids.length < 1 ||
    uids.length > 100 ||
    !uids.every(validId) ||
    !validId(courseId)
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'UIDs array and Course ID are required',
    );
  }

  await verifyAdmin(requesterUid);

  parseExpiry(expiresAt);
  if (
    !(
      await getDatabase()
        .ref('courses/' + courseId)
        .get()
    ).exists()
  ) {
    throw new functions.https.HttpsError('not-found', 'Course not found');
  }
  const results = {
    success: [],
    failed: [],
  };

  for (const uid of new Set(uids)) {
    try {
      if (
        !(
          await getDatabase()
            .ref('users/' + uid)
            .get()
        ).exists()
      )
        throw new Error('missing-user');
      await getDatabase()
        .ref(`/users/${uid}/courses/${courseId}`)
        .set({
          expiryDate: parseExpiry(expiresAt),
          progress: 0,
          assignedBy: requesterUid,
          assignedAt: new Date().toISOString(),
        });
      results.success.push(uid);
    } catch (error) {
      results.failed.push({ uid, error: 'assignment-failed' });
    }
  }

  await getDatabase()
    .ref('/adminLogs')
    .push({
      adminUid: requesterUid,
      action: 'bulkAssignCourse',
      payload: { courseId, count: results.success.length },
      ts: new Date().toISOString(),
    });

  return results;
});

exports.sendPushToAll = functions
  .runWith({ memory: '512MB' })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const requesterUid = context.auth.uid;
    const { title, message, imageUrl } = data || {};

    if (!validNotification(title, message, imageUrl)) {
      throw new functions.https.HttpsError('invalid-argument', 'Title and message are required');
    }

    await verifyAdmin(requesterUid);
    await throttlePush(requesterUid);

    try {
      const usersSnapshot = await getDatabase().ref('/users').once('value');

      if (!usersSnapshot.exists()) {
        return {
          success: false,
          message: 'No users found',
          successCount: 0,
          failureCount: 0,
          totalUsers: 0,
        };
      }

      const rawTokens = [];

      usersSnapshot.forEach((userSnap) => {
        const userData = userSnap.val();
        if (
          userData &&
          userData.fcmToken &&
          userData.status === 'active' &&
          !userData.isDeleted &&
          userData.pushNotificationsEnabled !== false
        ) {
          rawTokens.push(userData.fcmToken);
        }
      });

      if (rawTokens.length === 0) {
        return {
          success: false,
          message:
            'Нет пользователей с FCM токенами. Войдите в приложение и разрешите уведомления.',
          successCount: 0,
          failureCount: 0,
          totalUsers: 0,
        };
      }

      const tokens = Array.from(new Set(rawTokens));

      let successCount = 0;
      let failureCount = 0;
      const invalidTokens = [];

      const BATCH_SIZE = 500;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + BATCH_SIZE);

        const multicastMessage = {
          tokens: batchTokens,
          notification: {
            title: title,
            body: message,
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'high_importance_channel',
              defaultSound: true,
              defaultVibrateTimings: true,
              visibility: 'public',
            },
          },
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            payload: {
              aps: {
                alert: {
                  title: title,
                  body: message,
                },
                sound: 'default',
                'mutable-content': 1,
                'content-available': 1,
              },
            },
            ...(imageUrl
              ? {
                  fcmOptions: {
                    image: imageUrl,
                  },
                }
              : {}),
          },
          webpush: {
            headers: {
              Urgency: 'high',
            },

            notification: {
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag: 'akadiledu-push',
              renotify: false,
            },
          },
        };

        if (imageUrl) {
          multicastMessage.webpush.notification.image = imageUrl;
        }

        try {
          const batchResponse = await getMessaging().sendEachForMulticast(multicastMessage);

          successCount += batchResponse.successCount || 0;
          failureCount += batchResponse.failureCount || 0;

          if (Array.isArray(batchResponse.responses)) {
            batchResponse.responses.forEach((resp, index) => {
              if (!resp.success && resp.error) {
                const code = resp.error.code;
                if (
                  code === 'messaging/invalid-registration-token' ||
                  code === 'messaging/registration-token-not-registered'
                ) {
                  invalidTokens.push(batchTokens[index]);
                }
              }
            });
          }
        } catch (batchError) {
          throw new functions.https.HttpsError(
            'internal',
            `FCM отправка не удалась: ${batchError.message}`,
          );
        }
      }

      const totalUsers = tokens.length;

      await getDatabase()
        .ref('/adminLogs')
        .push({
          adminUid: requesterUid,
          action: 'sendPushToAll',
          payload: { title, message, recipientCount: totalUsers },
          results: {
            success: successCount,
            failure: failureCount,
          },
          ts: new Date().toISOString(),
        });

      return {
        success: successCount > 0,
        successCount,
        failureCount,
        totalUsers,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Notification delivery failed');
    }
  });

exports.createUserProfileOnSignup = functions.auth.user().onCreate(async (user) => {
  const db = getDatabase();
  const userRef = db.ref(`users/${user.uid}`);

  try {
    const snapshot = await userRef.once('value');
    if (snapshot.exists()) {
      return;
    }

    const userData = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || '',
      phone: user.phoneNumber || '',
      role: 'student',
      status: 'active',
      registeredAt: user.metadata.creationTime,
      lastLogin: user.metadata.lastSignInTime || user.metadata.creationTime,
      emailVerified: user.emailVerified || false,
      ipHistory: {},
      sessions: {},
      purchasedCourses: {},
      isDeleted: false,
    };

    await userRef.transaction((current) => current || userData);
  } catch (error) {}
});

exports.processLearningAI = require('./learningAI').processLearningAI;
exports.syncCourseCatalog = functions
  .region(process.env.DATABASE_REGION)
  .database.ref('/courses/{courseId}')
  .onWrite(async (change, context) => {
    const { courseSummary } = require('./catalog');
    return getDatabase()
      .ref('courseCatalog/' + context.params.courseId)
      .set(courseSummary(change.after.val()));
  });
exports.setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth)
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  await verifyAdmin(context.auth.uid);
  if (!validId(data?.uid) || !['student', 'teacher', 'admin'].includes(data.role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }
  if (data.uid === context.auth.uid && data.role !== 'admin') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Use another administrator to change your role',
    );
  }
  const user = await getAuth().getUser(data.uid);
  await getAuth().setCustomUserClaims(data.uid, {
    ...user.customClaims,
    admin: data.role === 'admin',
  });
  await getDatabase()
    .ref('users/' + data.uid + '/role')
    .set(data.role);
  await getAuth().revokeRefreshTokens(data.uid);
  return { success: true };
});
