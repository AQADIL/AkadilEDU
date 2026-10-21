import { getCourseContent } from '../api/courseContent';
import i18n from '../i18n';

import {
  getDatabase,
  runTransaction,
  ref,
  get,
  set,
  update,
  remove,
  push,
} from 'firebase/database';
import { app, auth, isFirebaseConfigured } from './config';

let database = null;

if (isFirebaseConfigured()) {
  try {
    database = getDatabase(app);
  } catch {}
}

export { database };

export async function getUserSessions(uid) {
  if (!database) {
    return null;
  }

  try {
    const sessionsRef = ref(database, `users/${uid}/sessions`);
    const snapshot = await get(sessionsRef);
    return snapshot.exists() ? snapshot.val() : {};
  } catch {
    return {};
  }
}

export async function isUserAdmin(uid) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid) return false;
  const token = await auth.currentUser.getIdTokenResult();
  return token.claims.admin === true;
}

export async function createUserProfile(uid, data) {
  if (!database) {
    throw new Error(i18n.t('ui.databaseIsUnavailable'));
  }

  const userRef = ref(database, `users/${uid}`);
  const userData = {
    uid,
    email: data.email || '',
    name: data.name || data.displayName || '',
    phone: data.phone || '',
    role: 'student',
    status: 'active',
    registeredAt: data.registeredAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    ipHistory: {},
    sessions: {},
    purchasedCourses: {},
    isDeleted: false,
  };

  const result = await runTransaction(userRef, (current) => (current ? undefined : userData));
  return result.snapshot.val();
}

export async function getUserProfile(uid) {
  if (!database) {
    return null;
  }

  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateUserProfile(uid, updates) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  const userRef = ref(database, `users/${uid}`);
  await update(userRef, updates);
}

export async function fetchAllUsers() {
  if (!database) {
    return [];
  }

  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (snapshot.exists()) {
    const usersData = snapshot.val();
    const usersArray = Object.keys(usersData).map((uid) => ({
      uid,
      ...usersData[uid],
    }));

    return usersArray;
  }

  return [];
}

export async function suspendUser(uid, adminUid, reason) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  await update(ref(database, `users/${uid}`), {
    status: 'suspended',
    suspendedAt: new Date().toISOString(),
    suspendedReason: reason || i18n.t('common.noReason'),
  });

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'suspendUser',
    targetUid: uid,
    payload: { reason },
    ts: new Date().toISOString(),
  });
}

export async function unsuspendUser(uid, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  await update(ref(database, `users/${uid}`), {
    status: 'active',
    suspendedAt: null,
    suspendedReason: null,
  });

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'unsuspendUser',
    targetUid: uid,
    ts: new Date().toISOString(),
  });
}

export async function softDeleteUser(uid, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  await update(ref(database, `users/${uid}`), {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: adminUid,
  });

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'softDeleteUser',
    targetUid: uid,
    ts: new Date().toISOString(),
  });
}

export async function fetchAllCourses() {
  if (!database) return [];

  const adminAccess = await isUserAdmin(auth.currentUser.uid);
  const coursesRef = ref(database, adminAccess ? 'courses' : 'courseCatalog');
  const snapshot = await get(coursesRef);

  if (snapshot.exists()) {
    const coursesData = snapshot.val();
    return Object.keys(coursesData).map((courseId) => ({
      id: courseId,
      ...coursesData[courseId],
    }));
  }
  return [];
}

export async function createCourse(courseData, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  const courseRef = push(ref(database, 'courses'));
  const course = {
    title: courseData.title,
    description: courseData.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: adminUid,
    modules: {},
  };

  await set(courseRef, course);

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'createCourse',
    payload: { courseId: courseRef.key, title: courseData.title },
    ts: new Date().toISOString(),
  });

  return { id: courseRef.key, ...course };
}

export async function updateCourse(courseId, updates, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  const courseRef = ref(database, `courses/${courseId}`);
  await update(courseRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'updateCourse',
    payload: { courseId, updates },
    ts: new Date().toISOString(),
  });
}

export async function deleteCourse(courseId, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  await remove(ref(database, `courses/${courseId}`));

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'deleteCourse',
    payload: { courseId },
    ts: new Date().toISOString(),
  });
}

export async function assignCourseToUser(userId, courseId, expiryDate, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  const userCourseRef = ref(database, `users/${userId}/courses/${courseId}`);
  await set(userCourseRef, {
    enrolledAt: Date.now(),
    expiryDate: expiryDate || null,
    progress: 0,
    completedLessons: {},
    assignedBy: adminUid,
  });

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'assignCourse',
    payload: { userId, courseId, expiryDate },
    ts: new Date().toISOString(),
  });
}

export async function getUserCourses(userId) {
  if (!database) return [];

  const userCoursesRef = ref(database, `users/${userId}/courses`);
  const snapshot = await get(userCoursesRef);

  if (!snapshot.exists()) {
    return [];
  }

  const coursesData = snapshot.val();
  const courseIds = Object.keys(coursesData);

  const coursesPromises = courseIds.map(async (courseId) => {
    const enrollment = coursesData[courseId];
    const expired = enrollment.expiryDate && enrollment.expiryDate <= Date.now();
    const courseData = expired
      ? (await get(ref(database, 'courseCatalog/' + courseId))).val()
      : await getCourseContent(courseId);

    if (courseData) {
      return {
        id: courseId,
        ...courseData,
        enrollment: coursesData[courseId],
      };
    }
    return null;
  });

  const courses = await Promise.all(coursesPromises);
  return courses.filter((course) => course !== null);
}

export async function getUserCoursesProgress(uid) {
  if (!database) return {};

  try {
    const progressRef = ref(database, `users/${uid}/progress`);
    const snapshot = await get(progressRef);
    return snapshot.exists() ? snapshot.val() : {};
  } catch {
    return {};
  }
}

export async function updateLessonProgress(uid, courseId, lessonId, progress) {
  if (!database) return;
  if (!uid || !courseId || !lessonId) return;

  try {
    const { completed = false, timestamp = 0, percent = 0 } = progress || {};
    const safeTimestamp = Math.max(0, Math.floor(Number(timestamp) || 0));
    const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));

    if (!completed && safeTimestamp <= 0 && safePercent <= 0) {
      return;
    }

    const basePath = `users/${uid}/progress/${courseId}`;
    const updates = {};

    updates[`${basePath}/lastActiveLessonId`] = lessonId;
    updates[`${basePath}/lastActiveTimestamp`] = safeTimestamp;
    updates[`${basePath}/lessons/${lessonId}`] = {
      completed: !!completed,
      timestamp: safeTimestamp,
      percent: safePercent,
    };

    await update(ref(database), updates);
  } catch {}
}

export async function updateUserCoursesOrder(userId, orderedCourseIds) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  const updates = {};
  orderedCourseIds.forEach((courseId, index) => {
    updates[`users/${userId}/courses/${courseId}/order`] = index;
  });

  await update(ref(database), updates);
}

export async function toggleUserPushNotifications(uid, enabled, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  await update(ref(database, `users/${uid}`), {
    pushNotificationsEnabled: enabled,
    pushStatus: enabled ? 'enabled' : 'disabled',
    updatedAt: new Date().toISOString(),
  });

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: enabled ? 'enablePushNotifications' : 'disablePushNotifications',
    targetUid: uid,
    ts: new Date().toISOString(),
  });

  return true;
}

export async function getUserPushStatus(uid) {
  if (!database) return null;

  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();

      return {
        enabled: userData.pushNotificationsEnabled === true,
        status: userData.pushStatus || 'unknown',
        lastUpdated: userData.updatedAt,
      };
    }
    return { enabled: false, status: 'unknown', lastUpdated: null };
  } catch {
    return { enabled: false, status: 'error', lastUpdated: null };
  }
}

export async function updateUserCourse(uid, courseId, expiryTimestamp, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  const numericExpiryTimestamp = Number(expiryTimestamp);

  const enrollmentRef = ref(database, `users/${uid}/courses/${courseId}`);
  const snapshot = await get(enrollmentRef);

  if (!snapshot.exists()) {
    throw new Error(i18n.t('ui.courseNotFound'));
  }

  if (!Number.isFinite(numericExpiryTimestamp) || numericExpiryTimestamp <= Date.now()) {
    throw new Error(i18n.t('courses.invalidExpiry'));
  }
  await update(enrollmentRef, {
    expiryDate: numericExpiryTimestamp,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  });

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'updateCourseEnrollment',
    targetUid: uid,
    payload: { courseId, expiryDate: numericExpiryTimestamp },
    ts: new Date().toISOString(),
  });

  return true;
}

export async function removeUserCourse(uid, courseId, adminUid) {
  if (!database) throw new Error(i18n.t('ui.databaseIsUnavailable'));

  await remove(ref(database, `users/${uid}/courses/${courseId}`));

  await push(ref(database, 'adminLogs'), {
    adminUid,
    action: 'removeCourseEnrollment',
    targetUid: uid,
    payload: { courseId },
    ts: new Date().toISOString(),
  });

  return true;
}
