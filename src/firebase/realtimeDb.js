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
 * Check if user is admin
 */
export async function isUserAdmin(uid) {
  if (!database) {
    console.error('❌ Database not initialized in isUserAdmin');
    return false;
  }
  
  try {
    console.log('🔍 Checking admin status for UID:', uid);
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      console.log('📊 User data from DB:', userData);
      console.log('📊 Role:', userData.role);
      const isAdmin = userData.role === 'admin';
      console.log('✅ Is admin?', isAdmin);
      return isAdmin;
    }
    console.log('⚠️ User profile not found in database');
    return false;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
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
    console.error('❌ Database not initialized in getUserProfile');
    return null;
  }
  
  try {
    console.log('🔍 Getting user profile for UID:', uid);
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const profile = snapshot.val();
      console.log('✅ Profile found:', profile);
      return profile;
    }
    console.log('⚠️ Profile not found for UID:', uid);
    return null;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
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
  if (!database) return [];
  
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      return Object.keys(usersData).map(uid => ({
        uid,
        ...usersData[uid]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
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
 * Log user session with IP
 */
export async function logUserSession(uid, ip, userAgent) {
  if (!database) return;
  
  try {
    const timestamp = Date.now();
    
    // Update last login
    await update(ref(database, `users/${uid}`), {
      lastLogin: new Date(timestamp).toISOString()
    });
    
    // Add session
    await push(ref(database, `users/${uid}/sessions`), {
      ip,
      ua: userAgent,
      ts: new Date(timestamp).toISOString()
    });
    
    // Add to auth logs
    await push(ref(database, `auth_logs/${uid}`), {
      ip,
      ua: userAgent,
      ts: new Date(timestamp).toISOString()
    });
    
    // Update IP history
    await update(ref(database, `users/${uid}/ipHistory`), {
      [timestamp]: ip
    });
    
    console.log('✅ Session logged for user:', uid);
  } catch (error) {
    console.error('Error logging session:', error);
  }
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
