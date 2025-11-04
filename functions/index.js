/**
 * Cloud Functions for AkadilEDU Admin Panel
 * 
 * IMPORTANT: These functions require admin privileges and should only be called
 * by authenticated admin users. All functions verify the caller's admin status.
 */

const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {onUserCreated} = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Helper: Verify if user is admin
 */
async function verifyAdmin(uid) {
  const userSnapshot = await admin.database().ref(`/users/${uid}`).once('value');
  
  if (!userSnapshot.exists()) {
    throw new HttpsError('not-found', 'User not found');
  }
  
  const userData = userSnapshot.val();
  if (userData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can perform this action');
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
exports.deleteUser = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = request.auth.uid;
  const targetUid = request.data.uid;
  
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'User ID is required');
  }
  
  // Verify requester is admin
  await verifyAdmin(requesterUid);
  
  try {
    // Delete from Firebase Authentication
    await admin.auth().deleteUser(targetUid);
    console.log(`✅ Deleted user from Auth: ${targetUid}`);
    
    // Delete from Realtime Database
    await admin.database().ref(`/users/${targetUid}`).remove();
    await admin.database().ref(`/auth_logs/${targetUid}`).remove();
    console.log(`✅ Deleted user data from Database: ${targetUid}`);
    
    // Delete from Storage (if any user uploads exist)
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
    throw new HttpsError('internal', `Failed to delete user: ${error.message}`);
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
exports.assignCourseServer = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = request.auth.uid;
  const {uid, courseId, expiresAt} = request.data;
  
  if (!uid || !courseId) {
    throw new HttpsError('invalid-argument', 'User ID and Course ID are required');
  }
  
  // Verify requester is admin
  await verifyAdmin(requesterUid);
  
  try {
    // Verify course exists
    const courseSnapshot = await admin.database().ref(`/courses/${courseId}`).once('value');
    if (!courseSnapshot.exists()) {
      throw new HttpsError('not-found', 'Course not found');
    }
    
    // Verify target user exists
    const userSnapshot = await admin.database().ref(`/users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      throw new HttpsError('not-found', 'User not found');
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
    throw new HttpsError('internal', `Failed to assign course: ${error.message}`);
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
exports.sendPushToUser = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = request.auth.uid;
  const {uid, title, body} = request.data;
  
  if (!uid || !title || !body) {
    throw new HttpsError('invalid-argument', 'User ID, title, and body are required');
  }
  
  // Verify requester is admin
  await verifyAdmin(requesterUid);
  
  try {
    // Get user's FCM token
    const userSnapshot = await admin.database().ref(`/users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const userData = userSnapshot.val();
    const fcmToken = userData.fcmToken;
    
    if (!fcmToken) {
      throw new HttpsError('failed-precondition', 'User does not have FCM token');
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
    throw new HttpsError('internal', `Failed to send push: ${error.message}`);
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
exports.bulkAssignCourse = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const requesterUid = request.auth.uid;
  const {uids, courseId, expiresAt} = request.data;
  
  if (!uids || !Array.isArray(uids) || !courseId) {
    throw new HttpsError('invalid-argument', 'UIDs array and Course ID are required');
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
 * AUTO-CREATE USER PROFILE ON SIGNUP
 * 
 * Автоматически создаёт профиль в Realtime DB при регистрации
 * Триггер срабатывает когда пользователь регистрируется через Firebase Auth
 */
exports.createUserProfileOnSignup = onUserCreated(async (event) => {
  const user = event.data;
  
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
