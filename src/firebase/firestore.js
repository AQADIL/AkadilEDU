/**
 * Firebase Firestore Module
 * 
 * Handles database operations for users, courses, and admin data
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

/**
 * Create or update user profile in Firestore
 * @param {string} uid - User ID
 * @param {Object} profileData - Profile data to save
 * @returns {Promise<void>}
 */
export async function createOrUpdateUserProfile(uid, profileData) {
  if (!isFirebaseConfigured() || !db) {
    console.warn('⚠️ Firestore not available, skipping profile update');
    return;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Update existing profile
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ User profile updated');
    } else {
      // Create new profile
      await setDoc(userRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isSuspended: false
      });
      console.log('✅ User profile created');
    }
  } catch (error) {
    console.error('Create/Update profile error:', error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} - User profile or null
 */
export async function getUserProfile(uid) {
  if (!isFirebaseConfigured() || !db) {
    console.warn('⚠️ Firestore not available');
    return null;
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    // Handle offline errors gracefully
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.warn('⚠️ Firestore offline');
      return null;
    }
    console.error('❌ Get profile error:', error);
    return null;
  }
}

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} data - Profile data to update
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, data) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Profile updated successfully');
  } catch (error) {
    console.error('❌ Update profile error:', error);
    throw error;
  }
}

/**
 * Check if user is an admin
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function checkAdminStatus(uid) {
  if (!isFirebaseConfigured()) {
    return false;
  }

  if (!uid) {
    return false;
  }

  try {
    const adminRef = doc(db, 'admins', uid);
    const adminDoc = await getDoc(adminRef);

    if (adminDoc.exists()) {
      const data = adminDoc.data();
      return data.enabled === true;
    }
    return false;
  } catch (error) {
    console.error('Check admin status error:', error);
    return false;
  }
}

/**
 * Create admin user
 * @param {string} uid - User ID to make admin
 * @param {string} displayName - Admin display name
 * @param {string} createdByUid - UID of user creating this admin
 * @returns {Promise<void>}
 */
export async function createAdmin(uid, displayName, createdByUid) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const adminRef = doc(db, 'admins', uid);
    await setDoc(adminRef, {
      enabled: true,
      displayName: displayName || '',
      createdByUid: createdByUid || uid,
      createdAt: serverTimestamp()
    });
    console.log('✅ Admin created:', uid);
  } catch (error) {
    console.error('Create admin error:', error);
    throw error;
  }
}

/**
 * Remove admin privileges
 * @param {string} uid - User ID
 * @returns {Promise<void>}
 */
export async function removeAdmin(uid) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const adminRef = doc(db, 'admins', uid);
    await deleteDoc(adminRef);
    console.log('✅ Admin removed:', uid);
  } catch (error) {
    console.error('Remove admin error:', error);
    throw error;
  }
}

/**
 * List all courses
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} - Array of courses
 */
export async function listCourses(maxResults = 50) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('createdAt', 'desc'), limit(maxResults));
    const querySnapshot = await getDocs(q);

    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${courses.length} courses`);
    return courses;
  } catch (error) {
    console.error('List courses error:', error);
    throw error;
  }
}

/**
 * Get single course by ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object|null>} - Course data or null
 */
export async function getCourse(courseId) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);

    if (courseDoc.exists()) {
      return { id: courseDoc.id, ...courseDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Get course error:', error);
    throw error;
  }
}

/**
 * Create or update a course
 * @param {string} courseId - Course ID (or null for new course)
 * @param {Object} courseData - Course data
 * @returns {Promise<string>} - Course ID
 */
export async function saveCourse(courseId, courseData) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    if (courseId) {
      // Update existing course
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        ...courseData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Course updated:', courseId);
      return courseId;
    } else {
      // Create new course
      const coursesRef = collection(db, 'courses');
      const newCourseRef = doc(coursesRef);
      await setDoc(newCourseRef, {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        published: false
      });
      console.log('✅ Course created:', newCourseRef.id);
      return newCourseRef.id;
    }
  } catch (error) {
    console.error('Save course error:', error);
    throw error;
  }
}

/**
 * Delete a course
 * @param {string} courseId - Course ID
 * @returns {Promise<void>}
 */
export async function deleteCourse(courseId) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const courseRef = doc(db, 'courses', courseId);
    await deleteDoc(courseRef);
    console.log('✅ Course deleted:', courseId);
  } catch (error) {
    console.error('Delete course error:', error);
    throw error;
  }
}

/**
 * Log authentication event
 * @param {string} uid - User ID
 * @param {string} ip - IP address
 * @param {string} userAgent - User agent string
 * @returns {Promise<void>}
 */
export async function logAuthEvent(uid, ip = 'unknown', userAgent = '') {
  if (!isFirebaseConfigured() || !db) {
    console.warn('⚠️ Firestore not available, skipping auth log');
    return;
  }

  try {
    const logsRef = collection(db, 'auth_logs', uid, 'logs');
    const logRef = doc(logsRef);
    
    await setDoc(logRef, {
      ip,
      ua: userAgent || navigator.userAgent,
      timestamp: serverTimestamp()
    });
    
    console.log('✅ Auth event logged to Firestore');
  } catch (error) {
    console.warn('⚠️ Could not log auth event (Firestore offline?):', error.message);
    // Don't throw - logging should not break auth flow
  }
}

/**
 * Get user's login history
 * @param {string} uid - User ID
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} - Array of log entries
 */
export async function getUserLoginHistory(uid, maxResults = 50) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const logsRef = collection(db, 'auth_logs', uid, 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxResults));
    const querySnapshot = await getDocs(q);

    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    return logs;
  } catch (error) {
    console.error('Get login history error:', error);
    throw error;
  }
}

/**
 * Get all users (admin only)
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} - Array of users
 */
export async function getAllUsers(maxResults = 100) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(maxResults));
    const querySnapshot = await getDocs(q);

    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
}

/**
 * Update user suspension status
 * @param {string} uid - User ID
 * @param {boolean} suspended - Suspension status
 * @returns {Promise<void>}
 */
export async function updateUserSuspension(uid, suspended) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isSuspended: suspended,
      updatedAt: serverTimestamp()
    });
    console.log(`✅ User ${suspended ? 'suspended' : 'unsuspended'}:`, uid);
  } catch (error) {
    console.error('Update suspension error:', error);
    throw error;
  }
}

/**
 * Initialize first admin (run once)
 * @param {string} email - Admin email
 * @returns {Promise<void>}
 */
export async function initializeFirstAdmin(email) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`No user found with email: ${email}`);
    }

    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;

    // Create admin entry
    await createAdmin(uid, userDoc.data().firstName + ' ' + userDoc.data().lastName, uid);
    
    console.log('✅ First admin initialized:', email);
  } catch (error) {
    console.error('Initialize first admin error:', error);
    throw error;
  }
}
