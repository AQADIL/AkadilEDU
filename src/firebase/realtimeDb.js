/**
 * Firebase Realtime Database Module
 * 
 * Handles all Realtime Database operations for the admin panel
 */

import { getDatabase, ref, get, set, update, remove, push, query, orderByChild, equalTo, limitToFirst, startAt } from 'firebase/database';
import { app, isFirebaseConfigured } from './config';

// Initialize Realtime Database
let database = null;

if (isFirebaseConfigured()) {
  try {
    database = getDatabase(app);
    console.log('✅ Realtime Database initialized');
  } catch (error) {
    console.error('❌ Realtime Database initialization error:', error);
  }
}

export { database };

/**
 * Log user session with IP and device info
 * ⚠️ ADMINS ARE NOT LOGGED - они боги системы
 */
export async function logUserSession(uid, sessionData) {
  if (!database) {
    console.error('❌ Database not initialized in logUserSession');
    return null;
  }
  
  // Проверяем роль пользователя - НЕ ЛОГИРУЕМ АДМИНОВ
  try {
    const userRef = ref(database, `users/${uid}`);
    const userSnap = await get(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.val();
      if (userData.role === 'admin') {
        console.log('👑 Admin detected - skipping session logging');
        return null;
      }
    }
  } catch (error) {
    console.error('Error checking user role:', error);
  }
  
  // Валидация данных
  if (!sessionData || !sessionData.ip || !sessionData.sessionId) {
    console.error('❌ Invalid session data:', sessionData);
    return null;
  }
  
  try {
    console.log('📝 Logging session for user:', uid, 'IP:', sessionData.ip);
    
    const sessionRef = ref(database, `users/${uid}/sessions/${sessionData.sessionId}`);
    await set(sessionRef, sessionData);
    
    // Update last login (без IP для чистоты)
    await update(ref(database, `users/${uid}`), {
      lastLogin: sessionData.timestamp
    });
    
    console.log('✅ Session logged for user:', uid);
    return sessionData.sessionId;
  } catch (error) {
    console.error('❌ Error logging session:', error);
    return null;
  }
}

/**
 * Get user sessions for security analysis
 */
export async function getUserSessions(uid) {
  if (!database) {
    console.error('❌ Database not initialized');
    return null;
  }
  
  try {
    const sessionsRef = ref(database, `users/${uid}/sessions`);
    const snapshot = await get(sessionsRef);
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error('❌ Error getting sessions:', error);
    return {};
  }
}

/**
 * Create security alert for suspicious activity
 * ⚠️ НЕ СОЗДАЕМ АЛЕРТЫ ДЛЯ АДМИНОВ
 */
export async function createSecurityAlert(uid, alertData) {
  if (!database) return null;
  
  // Проверяем роль - НЕ СОЗДАЕМ АЛЕРТЫ ДЛЯ АДМИНОВ
  try {
    const userRef = ref(database, `users/${uid}`);
    const userSnap = await get(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.val();
      if (userData.role === 'admin') {
        console.log('👑 Admin detected - skipping security alert');
        return null;
      }
    }
  } catch (error) {
    console.error('Error checking user role:', error);
  }
  
  try {
    // Create alert for user
    const userAlertRef = push(ref(database, `users/${uid}/securityAlerts`));
    await set(userAlertRef, {
      ...alertData,
      timestamp: new Date().toISOString(),
      read: false
    });
    
    // Create alert for admin
    const adminAlertRef = push(ref(database, 'adminSecurityAlerts'));
    await set(adminAlertRef, {
      uid,
      ...alertData,
      timestamp: new Date().toISOString(),
      resolved: false
    });
    
    // Update user security status
    await update(ref(database, `users/${uid}`), {
      securityStatus: alertData.riskLevel,
      lastSecurityAlert: new Date().toISOString()
    });
    
    console.log('🚨 Security alert created for user:', uid);
    return userAlertRef.key;
  } catch (error) {
    console.error('❌ Error creating security alert:', error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(uid) {
  if (!database) {
    console.error('❌ Database not initialized in isUserAdmin');
    return false;
  }
  
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('❌ Admin check failed:', error.message);
    return false;
  }
}

/**
 * Create or update user profile in Realtime DB
 */
export async function createUserProfile(uid, data) {
  if (!database) {
    console.error('❌ Database not initialized!');
    console.error('📌 Check:');
    console.error('   1. Realtime Database created in Firebase Console?');
    console.error('   2. databaseURL in firebase config?');
    console.error('   3. Security Rules allow write?');
    throw new Error('Database not initialized');
  }
  
  console.log('📝 Creating user profile in Realtime DB...');
  console.log('   UID:', uid);
  console.log('   Email:', data.email);
  console.log('   Role:', data.role);
  
  const userRef = ref(database, `users/${uid}`);
  const userData = {
    uid,
    email: data.email || '',
    name: data.name || data.displayName || '',
    phone: data.phone || '',
    role: data.role || 'student',
    status: data.status || 'active',
    registeredAt: data.registeredAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    ipHistory: {},
    sessions: {},
    purchasedCourses: {},
    isDeleted: false
  };
  
  try {
    await set(userRef, userData);
    console.log('✅ User profile created in Realtime DB:', uid);
    console.log('   Role:', userData.role);
    return userData;
  } catch (error) {
    console.error('❌ Failed to create profile:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.error('⚠️ PERMISSION DENIED!');
      console.error('   Solution: Set Security Rules to Test Mode:');
      console.error('   {');
      console.error('     "rules": {');
      console.error('       ".read": "auth != null",');
      console.error('       ".write": "auth != null"');
      console.error('     }');
      console.error('   }');
    }
    
    throw error;
  }
}

/**
 * Get user profile from Realtime DB
 */
export async function getUserProfile(uid) {
  if (!database) {
    console.error('❌ Database not initialized');
    return null;
  }
  
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('❌ Profile fetch failed:', error.message);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid, updates) {
  if (!database) throw new Error('Database not initialized');
  
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, updates);
  console.log('✅ User profile updated:', uid);
}

/**
 * Fetch all users (for admin)
 */
export async function fetchAllUsers() {
  if (!database) {
    console.error('❌ Database not initialized in fetchAllUsers');
    return [];
  }
  
  try {
    console.log('📋 Fetching all users from Realtime DB...');
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const usersArray = Object.keys(usersData).map(uid => ({
        uid,
        ...usersData[uid]
      }));
      console.log(`✅ Fetched ${usersArray.length} users from Realtime DB`);
      return usersArray;
    }
    console.log('⚠️ No users found in Realtime DB');
    return [];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
}

/**
 * Suspend user
 */
export async function suspendUser(uid, adminUid, reason) {
  if (!database) throw new Error('Database not initialized');
  
  await update(ref(database, `users/${uid}`), {
    status: 'suspended',
    suspendedAt: new Date().toISOString(),
    suspendedReason: reason || 'No reason provided'
  });
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'suspendUser',
    targetUid: uid,
    payload: { reason },
    ts: new Date().toISOString()
  });
  
  console.log('✅ User suspended:', uid);
}

/**
 * Unsuspend user
 */
export async function unsuspendUser(uid, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  await update(ref(database, `users/${uid}`), {
    status: 'active',
    suspendedAt: null,
    suspendedReason: null
  });
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'unsuspendUser',
    targetUid: uid,
    ts: new Date().toISOString()
  });
  
  console.log('✅ User unsuspended:', uid);
}

/**
 * Soft delete user (set isDeleted flag)
 */
export async function softDeleteUser(uid, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  await update(ref(database, `users/${uid}`), {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: adminUid
  });
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'softDeleteUser',
    targetUid: uid,
    ts: new Date().toISOString()
  });
  
  console.log('✅ User soft deleted:', uid);
}


/**
 * Fetch all courses
 */
export async function fetchAllCourses() {
  if (!database) return [];
  
  try {
    const coursesRef = ref(database, 'courses');
    const snapshot = await get(coursesRef);

    if (snapshot.exists()) {
      const coursesData = snapshot.val();
      return Object.keys(coursesData).map(courseId => ({
        id: courseId,
        ...coursesData[courseId]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

/**
 * Create course
 */
export async function createCourse(courseData, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  const courseRef = push(ref(database, 'courses'));
  const course = {
    title: courseData.title,
    description: courseData.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: adminUid,
    modules: {}
  };
  
  await set(courseRef, course);
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'createCourse',
    payload: { courseId: courseRef.key, title: courseData.title },
    ts: new Date().toISOString()
  });
  
  console.log('✅ Course created:', courseRef.key);
  return { id: courseRef.key, ...course };
}

/**
 * Update course
 */
export async function updateCourse(courseId, updates, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  const courseRef = ref(database, `courses/${courseId}`);
  await update(courseRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'updateCourse',
    payload: { courseId, updates },
    ts: new Date().toISOString()
  });
  
  console.log('✅ Course updated:', courseId);
}

/**
 * Delete course
 */
export async function deleteCourse(courseId, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  await remove(ref(database, `courses/${courseId}`));
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'deleteCourse',
    payload: { courseId },
    ts: new Date().toISOString()
  });
  
  console.log('✅ Course deleted:', courseId);
}

/**
 * Assign course to user with expiry date
 */
export async function assignCourseToUser(userId, courseId, expiryDate, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  const userCourseRef = ref(database, `users/${userId}/courses/${courseId}`);
  await set(userCourseRef, {
    enrolledAt: Date.now(),
    expiryDate: expiryDate || null, // null = permanent access
    progress: 0,
    completedLessons: {},
    assignedBy: adminUid
  });
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'assignCourse',
    payload: { userId, courseId, expiryDate },
    ts: new Date().toISOString()
  });
  
  console.log('✅ Course assigned to user:', { userId, courseId, expiryDate });
}

/**
 * Remove course from user
 */
export async function removeCourseFromUser(userId, courseId, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  await remove(ref(database, `users/${userId}/courses/${courseId}`));
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'removeCourse',
    payload: { userId, courseId },
    ts: new Date().toISOString()
  });
  
  console.log('✅ Course removed from user:', { userId, courseId });
}

/**
 * Get user's enrolled courses
 */
export async function getUserCourses(userId) {
  if (!database) return [];
  
  try {
    const userCoursesRef = ref(database, `users/${userId}/courses`);
    const snapshot = await get(userCoursesRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const coursesData = snapshot.val();
    const courseIds = Object.keys(coursesData);
    
    // Fetch full course details
    const coursesPromises = courseIds.map(async (courseId) => {
      const courseRef = ref(database, `courses/${courseId}`);
      const courseSnapshot = await get(courseRef);
      
      if (courseSnapshot.exists()) {
        return {
          id: courseId,
          ...courseSnapshot.val(),
          enrollment: coursesData[courseId]
        };
      }
      return null;
    });

    const courses = await Promise.all(coursesPromises);
    return courses.filter(course => course !== null);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return [];
  }
}

/**
 * Fetch admin logs
 */
export async function fetchAdminLogs(limit = 100) {
  if (!database) return [];
  
  try {
    const logsRef = ref(database, 'adminLogs');
    const logsQuery = query(logsRef, limitToFirst(limit));
    const snapshot = await get(logsQuery);
    
    if (snapshot.exists()) {
      const logsData = snapshot.val();
      return Object.keys(logsData).map(logId => ({
        id: logId,
        ...logsData[logId]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
}

/**
 * Get user's auth logs
 */
export async function getUserAuthLogs(uid) {
  if (!database) return [];
  
  try {
    const logsRef = ref(database, `auth_logs/${uid}`);
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const logsData = snapshot.val();
      return Object.keys(logsData).map(logId => ({
        id: logId,
        ...logsData[logId]
      })).sort((a, b) => new Date(b.ts) - new Date(a.ts));
    }
    return [];
  } catch (error) {
    console.error('Error fetching auth logs:', error);
    return [];
  }
}

/**
 * Toggle user's push notification settings
 */
export async function toggleUserPushNotifications(uid, enabled, adminUid) {
  if (!database) throw new Error('Database not initialized');
  
  // Update user's push notification settings
  await update(ref(database, `users/${uid}`), {
    pushNotificationsEnabled: enabled,
    updatedAt: new Date().toISOString()
  });
  
  // Log admin action
  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: enabled ? 'enablePushNotifications' : 'disablePushNotifications',
    targetUid: uid,
    ts: new Date().toISOString()
  });
  
  return true;
}

/**
 * Get user's push notification status
 */
export async function getUserPushStatus(uid) {
  if (!database) return null;
  
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.pushNotificationsEnabled === true;
    }
    return false;
  } catch (error) {
    console.error('Error fetching user push status:', error);
    return false;
  }
}
