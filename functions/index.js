

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();


async function verifyAdmin(uid) {
  const userSnapshot = await admin.database().ref(`/users/${uid}`).once('value');
  
  if (!userSnapshot.exists()) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  
  const userData = userSnapshot.val();
  if (userData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can perform this action');
  }
  
  return true;
}

/**
 * Delete User Permanently
 * 
 * Deletes user from Authentication, Realtime Database, and Storage
 * 
 * @param {string} uid - Target user ID to delete
 * @returns {object} Success message
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = context.auth.uid;
  const targetUid = data.uid;
  
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }
  
  // Verify requester is admin
  await verifyAdmin(requesterUid);
  
  try {
    await admin.auth().deleteUser(targetUid);
    console.log(`✅ Deleted user from Auth: ${targetUid}`);
    

    await admin.database().ref(`/users/${targetUid}`).remove();
    await admin.database().ref(`/auth_logs/${targetUid}`).remove();
    console.log(`✅ Deleted user data from Database: ${targetUid}`);
    
    try {
      const bucket = admin.storage().bucket();
      await bucket.deleteFiles({
        prefix: `user_uploads/${targetUid}/`
      });
      console.log(`✅ Deleted user files from Storage: ${targetUid}`);
    } catch (storageError) {
      console.warn('Storage deletion error (may not exist):', storageError.message);
    }
    
    // Log admin action
    await admin.database().ref('/adminLogs').push({
      adminUid: requesterUid,
      action: 'deleteUser',
      targetUid,
      ts: new Date().toISOString()
    });
    
    return {
      success: true,
      message: `User ${targetUid} deleted successfully`
    };
    
  } catch (error) {
    console.error('Delete user error:', error);
    throw new functions.https.HttpsError('internal', `Failed to delete user: ${error.message}`);
  }
});

/**
 * Assign Course to User
 * 
 * Assigns a course to a user with expiration date
 * Server-side function to ensure data integrity
 * 
 * @param {string} uid - User ID
 * @param {string} courseId - Course ID
 * @param {string} expiresAt - ISO date string for expiration
 * @returns {object} Success message
 */
exports.assignCourseServer = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = context.auth.uid;
  const {uid, courseId, expiresAt} = data;
  
  if (!uid || !courseId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID and Course ID are required');
  }
  
  // Verify requester is admin
  await verifyAdmin(requesterUid);
  
  try {
    // Verify course exists
    const courseSnapshot = await admin.database().ref(`/courses/${courseId}`).once('value');
    if (!courseSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Course not found');
    }
    
    // Verify target user exists
    const userSnapshot = await admin.database().ref(`/users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    // Assign course
    await admin.database().ref(`/users/${uid}/purchasedCourses/${courseId}`).set({
      expiresAt: expiresAt || null,
      progress: 0,
      assignedBy: requesterUid,
      assignedAt: new Date().toISOString()
    });
    
    // Log admin action
    await admin.database().ref('/adminLogs').push({
      adminUid: requesterUid,
      action: 'assignCourse',
      targetUid: uid,
      payload: {courseId, expiresAt},
      ts: new Date().toISOString()
    });
    
    return {
      success: true,
      message: `Course ${courseId} assigned to user ${uid}`
    };
    
  } catch (error) {
    console.error('Assign course error:', error);
    throw new functions.https.HttpsError('internal', `Failed to assign course: ${error.message}`);
  }
});

/**
 * Send Push Notification to User (Optional)
 * 
 * Sends FCM push notification to specific user
 * Requires FCM token stored in user profile
 * 
 * @param {string} uid - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {object} Success message
 */
exports.sendPushToUser = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = context.auth.uid;
  const {uid, title, body} = data;
  
  if (!uid || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID, title, and body are required');
  }
  
  // Verify requester is admin
  await verifyAdmin(requesterUid);
  
  try {
    // Get user's FCM token
    const userSnapshot = await admin.database().ref(`/users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userSnapshot.val();
    const fcmToken = userData.fcmToken;
    
    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', 'User does not have FCM token');
    }
    
    // Send notification
    const message = {
      notification: {
        title,
        body
      },
      token: fcmToken
    };
    
    await admin.messaging().send(message);
    
    // Log admin action
    await admin.database().ref('/adminLogs').push({
      adminUid: requesterUid,
      action: 'sendPush',
      targetUid: uid,
      payload: {title, body},
      ts: new Date().toISOString()
    });
    
    return {
      success: true,
      message: `Push notification sent to user ${uid}`
    };
    
  } catch (error) {
    console.error('Send push error:', error);
    throw new functions.https.HttpsError('internal', `Failed to send push: ${error.message}`);
  }
});

/**
 * Bulk Assign Course to Multiple Users
 * 
 * @param {array} uids - Array of user IDs
 * @param {string} courseId - Course ID
 * @param {string} expiresAt - ISO date string
 * @returns {object} Results
 */
exports.bulkAssignCourse = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = context.auth.uid;
  const {uids, courseId, expiresAt} = data;
  
  if (!uids || !Array.isArray(uids) || !courseId) {
    throw new functions.https.HttpsError('invalid-argument', 'UIDs array and Course ID are required');
  }
  
  await verifyAdmin(requesterUid);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const uid of uids) {
    try {
      await admin.database().ref(`/users/${uid}/purchasedCourses/${courseId}`).set({
        expiresAt: expiresAt || null,
        progress: 0,
        assignedBy: requesterUid,
        assignedAt: new Date().toISOString()
      });
      results.success.push(uid);
    } catch (error) {
      results.failed.push({uid, error: error.message});
    }
  }
  
  // Log admin action
  await admin.database().ref('/adminLogs').push({
    adminUid: requesterUid,
    action: 'bulkAssignCourse',
    payload: {courseId, count: results.success.length},
    ts: new Date().toISOString()
  });
  
  return results;
});

/**
 * Send Push Notification to All Users
 * 
 * Ported from legacy Express backend/server.js to Cloud Function.
 * Sends FCM push notification to all users who have FCM tokens.
 * Uses sendEachForMulticast with deduplicated tokens for better performance.
 * 
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 * @param {string} [imageUrl] - Optional image URL for webpush notification
 * @returns {object} Results with success/failure counts
 */
exports.sendPushToAll = functions
  .runWith({ memory: '512MB' })
  .https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const requesterUid = context.auth.uid;
    const { title, message, imageUrl } = data || {};

    if (!title || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Title and message are required');
    }

    // Verify requester is admin
    await verifyAdmin(requesterUid);

    try {
      console.log(`📱 Sending push: "${title}"${imageUrl ? ' with image' : ''}`);

      // Get all users with FCM tokens
      const usersSnapshot = await admin.database().ref('/users').once('value');

      if (!usersSnapshot.exists()) {
        return {
          success: false,
          message: 'No users found',
          successCount: 0,
          failureCount: 0,
          totalUsers: 0
        };
      }

      const rawTokens = [];
      const userEmails = [];

      usersSnapshot.forEach((userSnap) => {
        const userData = userSnap.val();
        if (userData && userData.fcmToken) {
          rawTokens.push(userData.fcmToken);
          if (userData.email) {
            userEmails.push(userData.email);
          }
        }
      });

      if (rawTokens.length === 0) {
        return {
          success: false,
          message:
            'Нет пользователей с FCM токенами. Войдите в приложение и разрешите уведомления.',
          successCount: 0,
          failureCount: 0,
          totalUsers: 0
        };
      }

      // Remove duplicate tokens
      const tokens = Array.from(new Set(rawTokens));

      if (tokens.length !== rawTokens.length) {
        console.log(`♻️ Deduplicated tokens: ${rawTokens.length} -> ${tokens.length}`);
      }

      console.log(`📤 Sending to ${tokens.length} users:`, userEmails);

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
            body: message
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'high_importance_channel',
              defaultSound: true,
              defaultVibrateTimings: true,
              visibility: 'public'
            }
          },
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert'
            },
            payload: {
              aps: {
                alert: {
                  title: title,
                  body: message
                },
                sound: 'default',
                'mutable-content': 1,
                'content-available': 1
              }
            },
            ...(imageUrl
              ? {
                  fcmOptions: {
                    image: imageUrl
                  }
                }
              : {})
          },
          webpush: {
            headers: {
              Urgency: 'high'
            },
            fcmOptions: {
              link: '/'
            },
            notification: {
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag: 'akadiledu-push',
              renotify: false
            }
          }
        };

        if (imageUrl) {
          multicastMessage.webpush.notification.image = imageUrl;
        }

        try {
          const batchResponse = await admin.messaging().sendEachForMulticast(multicastMessage);

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

          console.log(
            `✅ Batch sent: ${batchResponse.successCount} success, ${batchResponse.failureCount} failed (tokens ${i + 1}-${
              i + batchTokens.length
            })`
          );
        } catch (batchError) {
          console.error('❌ FCM batch send error:', batchError);
          // Continue with next batch, but surface error at the end
          throw new functions.https.HttpsError(
            'internal',
            `FCM отправка не удалась: ${batchError.message}`
          );
        }
      }

      if (invalidTokens.length > 0) {
        console.log(`🗑️ Found ${invalidTokens.length} invalid tokens`);
      }

      console.log(`✅ Total Success: ${successCount}, Failed: ${failureCount}`);

      const totalUsers = tokens.length;

      // Log to database
      await admin.database().ref('/adminLogs').push({
        adminUid: requesterUid,
        action: 'sendPushToAll',
        payload: { title, message, recipientCount: totalUsers },
        results: {
          success: successCount,
          failure: failureCount
        },
        ts: new Date().toISOString()
      });

      return {
        success: true,
        message: `Отправлено ${successCount} из ${totalUsers} пользователей`,
        successCount,
        failureCount,
        totalUsers
      };
    } catch (error) {
      console.error('❌ Send push to all error:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', `Failed to send push: ${error.message}`);
    }
  });

/**
 * AUTO-CREATE USER PROFILE ON SIGNUP
 * 
 * Автоматически создаёт профиль в Realtime DB при регистрации
 * Триггер срабатывает когда пользователь регистрируется через Firebase Auth
 */
exports.createUserProfileOnSignup = functions.auth.user().onCreate(async (user) => {
  
  const db = admin.database();
  const userRef = db.ref(`users/${user.uid}`);
  
  try {
    // Проверяем, не существует ли уже профиль
    const snapshot = await userRef.once('value');
    if (snapshot.exists()) {
      console.log('⏭️  Profile already exists:', user.uid);
      return;
    }
    
    // Создаём новый профиль
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      phone: user.phoneNumber || '',
      role: 'student', // По умолчанию все студенты
      status: 'active',
      registeredAt: user.metadata.creationTime,
      lastLogin: user.metadata.lastSignInTime || user.metadata.creationTime,
      emailVerified: user.emailVerified || false,
      ipHistory: {},
      sessions: {},
      purchasedCourses: {},
      isDeleted: false
    };
    
    await userRef.set(userData);
    
    console.log('✅ Auto-created profile for new user:', user.email);
    
  } catch (error) {
    console.error('❌ Error auto-creating profile:', error);
    // Не бросаем ошибку, чтобы не блокировать регистрацию
  }
});
