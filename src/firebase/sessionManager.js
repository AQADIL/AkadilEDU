/**
 * Session Management
 * Управление сессиями пользователей - revoke, limit, track
 */

import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './realtimeDb';

/**
 * Установить текущую активную сессию
 * SINGLE ACTIVE SESSION - только одна сессия может быть активна
 */
export async function setCurrentSession(uid, sessionId) {
  if (!database) {
    console.error('❌ Database not initialized');
    return { success: false, error: 'Database not initialized' };
  }

  try {
    // Устанавливаем currentSession в корне пользователя
    await update(ref(database, `users/${uid}`), {
      currentSession: sessionId,
      lastLogin: new Date().toISOString()
    });

    console.log(`✅ Current session set: ${sessionId}`);
    return { success: true, sessionId };

  } catch (error) {
    console.error('❌ Error setting current session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Получить текущую активную сессию из DB
 */
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
    console.error('❌ Error getting current session:', error);
    return null;
  }
}

/**
 * Revoke (выкинуть) все другие активные сессии пользователя
 * Оставляет только текущую сессию активной
 */
export async function revokeOtherSessions(uid, currentSessionId) {
  if (!database) {
    console.error('❌ Database not initialized');
    return { revoked: 0, error: 'Database not initialized' };
  }

  try {
    const sessionsRef = ref(database, `users/${uid}/sessions`);
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) {
      return { revoked: 0, message: 'No sessions found' };
    }

    const sessions = snapshot.val();
    const updates = {};
    let revokedCount = 0;

    // Revoke все сессии кроме текущей
    Object.keys(sessions).forEach(sessionId => {
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
      console.log(`✅ Revoked ${revokedCount} sessions for user ${uid}`);
    }

    // Установить currentSession
    await setCurrentSession(uid, currentSessionId);

    return {
      revoked: revokedCount,
      message: `${revokedCount} sessions revoked`
    };

  } catch (error) {
    console.error('❌ Error revoking sessions:', error);
    return { revoked: 0, error: error.message };
  }
}

/**
 * Проверить был ли пользователь выкинут (revoked)
 * Возвращает true если текущая сессия была revoked
 */
export async function checkSessionRevoked(uid, sessionId) {
  if (!database) return false;

  try {
    const sessionRef = ref(database, `users/${uid}/sessions/${sessionId}`);
    const snapshot = await get(sessionRef);

    if (!snapshot.exists()) return false;

    const session = snapshot.val();
    return session.revoked === true || session.active === false;

  } catch (error) {
    console.error('❌ Error checking session:', error);
    return false;
  }
}

/**
 * Получить количество активных сессий пользователя
 */
export async function getActiveSessionsCount(uid) {
  if (!database) return 0;

  try {
    const sessionsRef = ref(database, `users/${uid}/sessions`);
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) return 0;

    const sessions = snapshot.val();
    const activeSessions = Object.values(sessions).filter(s => s.active && !s.revoked);

    return activeSessions.length;

  } catch (error) {
    console.error('❌ Error counting sessions:', error);
    return 0;
  }
}

/**
 * Revoke конкретную сессию
 */
export async function revokeSession(uid, sessionId, reason = 'manual') {
  if (!database) return false;

  try {
    const updates = {};
    updates[`users/${uid}/sessions/${sessionId}/active`] = false;
    updates[`users/${uid}/sessions/${sessionId}/revoked`] = true;
    updates[`users/${uid}/sessions/${sessionId}/revokedAt`] = new Date().toISOString();
    updates[`users/${uid}/sessions/${sessionId}/revokedReason`] = reason;

    await update(ref(database), updates);
    console.log(`✅ Session ${sessionId} revoked`);
    return true;

  } catch (error) {
    console.error('❌ Error revoking session:', error);
    return false;
  }
}

/**
 * Revoke все сессии пользователя (logout everywhere)
 */
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

    Object.keys(sessions).forEach(sessionId => {
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
    console.error('❌ Error revoking all sessions:', error);
    return { revoked: 0, error: error.message };
  }
}
