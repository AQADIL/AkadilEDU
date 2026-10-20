import i18n from '../i18n';

import { ref, get, update } from 'firebase/database';
import { database } from './realtimeDb';

export async function setCurrentSession(uid, sessionId) {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    await update(ref(database, `users/${uid}`), {
      currentSession: sessionId,
      lastLogin: new Date().toISOString(),
    });

    return { success: true, sessionId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentSession(uid) {
  if (!database) return null;

  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.currentSession || null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function revokeOtherSessions(uid, currentSessionId) {
  if (!database) {
    return { revoked: 0, error: 'Database not initialized' };
  }

  try {
    const userRef = ref(database, `users/${uid}`);
    const userSnap = await get(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.val();
      if (userData.role === 'admin') {
        return { revoked: 0, message: i18n.t('ui.administratorSessionPolicy') };
      }
    }

    const sessionsRef = ref(database, `users/${uid}/sessions`);
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) {
      return { revoked: 0, message: i18n.t('ui.noSessionsFound') };
    }

    const sessions = snapshot.val();
    const updates = {};
    let revokedCount = 0;

    Object.keys(sessions).forEach((sessionId) => {
      if (sessionId !== currentSessionId && sessions[sessionId].active) {
        updates[`users/${uid}/sessions/${sessionId}/active`] = false;
        updates[`users/${uid}/sessions/${sessionId}/revoked`] = true;
        updates[`users/${uid}/sessions/${sessionId}/revokedAt`] = new Date().toISOString();
        updates[`users/${uid}/sessions/${sessionId}/revokedReason`] = 'new_session_detected';
        revokedCount++;
      }
    });

    if (revokedCount > 0) {
      await update(ref(database), updates);
    }

    await setCurrentSession(uid, currentSessionId);

    return {
      revoked: revokedCount,
      message: `${revokedCount} sessions revoked`,
    };
  } catch (error) {
    return { revoked: 0, error: error.message };
  }
}

export async function checkSessionRevoked(uid, sessionId) {
  if (!database) return false;

  try {
    const sessionRef = ref(database, `users/${uid}/sessions/${sessionId}`);
    const snapshot = await get(sessionRef);

    if (!snapshot.exists()) return false;

    const session = snapshot.val();
    return session.revoked === true || session.active === false;
  } catch (error) {
    return false;
  }
}

export async function getActiveSessionsCount(uid) {
  if (!database) return 0;

  try {
    const sessionsRef = ref(database, `users/${uid}/sessions`);
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) return 0;

    const sessions = snapshot.val();
    const activeSessions = Object.values(sessions).filter((s) => s.active && !s.revoked);

    return activeSessions.length;
  } catch (error) {
    return 0;
  }
}

export async function revokeSession(uid, sessionId, reason = 'manual') {
  if (!database) return false;

  try {
    const updates = {};
    updates[`users/${uid}/sessions/${sessionId}/active`] = false;
    updates[`users/${uid}/sessions/${sessionId}/revoked`] = true;
    updates[`users/${uid}/sessions/${sessionId}/revokedAt`] = new Date().toISOString();
    updates[`users/${uid}/sessions/${sessionId}/revokedReason`] = reason;

    await update(ref(database), updates);

    return true;
  } catch (error) {
    return false;
  }
}

export async function revokeAllSessions(uid) {
  if (!database) return { revoked: 0 };

  try {
    const sessionsRef = ref(database, `users/${uid}/sessions`);
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) {
      return { revoked: 0 };
    }

    const sessions = snapshot.val();
    const updates = {};
    let revokedCount = 0;

    Object.keys(sessions).forEach((sessionId) => {
      if (sessions[sessionId].active) {
        updates[`users/${uid}/sessions/${sessionId}/active`] = false;
        updates[`users/${uid}/sessions/${sessionId}/revoked`] = true;
        updates[`users/${uid}/sessions/${sessionId}/revokedAt`] = new Date().toISOString();
        updates[`users/${uid}/sessions/${sessionId}/revokedReason`] = 'logout_all';
        revokedCount++;
      }
    });

    if (revokedCount > 0) {
      await update(ref(database), updates);
    }

    return { revoked: revokedCount };
  } catch (error) {
    return { revoked: 0, error: error.message };
  }
}
