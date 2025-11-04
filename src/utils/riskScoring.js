/**
 * Risk Scoring System for Smart Security
 * 
 * Calculates risk score based on user sessions and behavior
 * Uses soft and strong response thresholds instead of automatic blocking
 */

// Risk scoring configuration
export const RISK_CONFIG = {
  // Score weights
  scores: {
    newDevice: 2,
    newIP: 1,
    multipleDevices24h: 6,      // >5 devices
    multipleIPs24h: 4,          // >5 IPs
    geoJump: 5,                 // country change < 1h
    concurrentSessions: 8       // >2 active sessions
  },
  
  // Thresholds
  thresholds: {
    softResponse: 6,            // 6-11: soft measures
    strongResponse: 12,         // 12+: strong measures
    maxConcurrentSessions: 3    // Max allowed simultaneous sessions
  },
  
  // Device limits
  deviceLimits: {
    uniqueDevices24h: 5,
    uniqueIPs24h: 5,
    concurrentThreshold: 2
  }
};

/**
 * Calculate risk score for a login attempt
 * @param {Object} userSessions - All user sessions
 * @param {Object} currentSession - Current login session
 * @param {Array} trustedDevices - List of trusted deviceIds
 * @returns {Object} Risk assessment with score and flags
 */
export function calculateRiskScore(userSessions, currentSession, trustedDevices = []) {
  let score = 0;
  const flags = [];
  const details = {};
  
  if (!userSessions || Object.keys(userSessions).length === 0) {
    return {
      score: 0,
      level: 'low',
      flags: [],
      details: {},
      action: 'allow'
    };
  }
  
  const sessions = Object.values(userSessions);
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const oneHourAgo = now - (60 * 60 * 1000);
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  // Get recent sessions (last 24 hours)
  const recentSessions = sessions.filter(s => {
    const sessionTime = new Date(s.timestamp || s.lastSeen).getTime();
    return sessionTime > oneDayAgo;
  });
  
  // Check if device is trusted
  const isTrustedDevice = trustedDevices.includes(currentSession.deviceId);
  if (isTrustedDevice) {
    score -= 3; // Reduce score for trusted devices
    flags.push({
      type: 'trusted_device',
      severity: 'info',
      message: 'Доверенное устройство'
    });
  }
  
  // 1. Check for new device
  const knownDevices = new Set(sessions.map(s => s.deviceId).filter(Boolean));
  const isNewDevice = !knownDevices.has(currentSession.deviceId);
  
  if (isNewDevice) {
    score += RISK_CONFIG.scores.newDevice;
    flags.push({
      type: 'new_device',
      severity: 'low',
      message: 'Вход с нового устройства',
      deviceId: currentSession.deviceId
    });
  }
  
  // 2. Check for new IP
  const knownIPs = new Set(sessions.map(s => s.ip).filter(Boolean));
  const isNewIP = !knownIPs.has(currentSession.ip);
  
  if (isNewIP) {
    score += RISK_CONFIG.scores.newIP;
    flags.push({
      type: 'new_ip',
      severity: 'low',
      message: 'Вход с нового IP адреса',
      ip: currentSession.ip
    });
  }
  
  // 3. Multiple unique devices in 24h
  const uniqueDevices24h = new Set(recentSessions.map(s => s.deviceId).filter(Boolean));
  details.uniqueDevices24h = uniqueDevices24h.size;
  
  if (uniqueDevices24h.size > RISK_CONFIG.deviceLimits.uniqueDevices24h) {
    score += RISK_CONFIG.scores.multipleDevices24h;
    flags.push({
      type: 'multiple_devices',
      severity: 'high',
      message: `Обнаружено ${uniqueDevices24h.size} устройств за 24 часа`,
      deviceCount: uniqueDevices24h.size
    });
  }
  
  // 4. Multiple unique IPs in 24h
  const uniqueIPs24h = new Set(recentSessions.map(s => s.ip).filter(Boolean));
  details.uniqueIPs24h = uniqueIPs24h.size;
  
  if (uniqueIPs24h.size > RISK_CONFIG.deviceLimits.uniqueIPs24h) {
    score += RISK_CONFIG.scores.multipleIPs24h;
    flags.push({
      type: 'multiple_ips',
      severity: 'high',
      message: `Обнаружено ${uniqueIPs24h.size} IP адресов за 24 часа`,
      ipCount: uniqueIPs24h.size,
      ips: Array.from(uniqueIPs24h)
    });
  }
  
  // 5. Concurrent active sessions
  const activeSessions = sessions.filter(s => {
    if (!s.active || s.revoked) return false;
    const lastSeenTime = new Date(s.lastSeen || s.timestamp).getTime();
    return lastSeenTime > fiveMinutesAgo;
  });
  
  details.concurrentSessions = activeSessions.length;
  
  if (activeSessions.length > RISK_CONFIG.deviceLimits.concurrentThreshold) {
    score += RISK_CONFIG.scores.concurrentSessions;
    
    const concurrentIPs = new Set(activeSessions.map(s => s.ip).filter(Boolean));
    flags.push({
      type: 'concurrent_sessions',
      severity: 'critical',
      message: `${activeSessions.length} одновременных сессий с ${concurrentIPs.size} IP`,
      sessionCount: activeSessions.length,
      ips: Array.from(concurrentIPs)
    });
  }
  
  // 6. Geo jump detection (basic - based on IP change within 1 hour)
  const recentSession = recentSessions
    .filter(s => new Date(s.timestamp || s.lastSeen).getTime() > oneHourAgo)
    .sort((a, b) => new Date(b.timestamp || b.lastSeen) - new Date(a.timestamp || a.lastSeen))[0];
  
  if (recentSession && recentSession.ip !== currentSession.ip) {
    const timeDiff = now - new Date(recentSession.timestamp || recentSession.lastSeen).getTime();
    if (timeDiff < 60 * 60 * 1000) { // < 1 hour
      score += RISK_CONFIG.scores.geoJump;
      flags.push({
        type: 'geo_jump',
        severity: 'medium',
        message: `Смена IP за ${Math.round(timeDiff / 60000)} минут`,
        oldIP: recentSession.ip,
        newIP: currentSession.ip
      });
    }
  }
  
  // Determine risk level and action
  const level = getRiskLevel(score);
  const action = getRecommendedAction(score, activeSessions.length);
  
  return {
    score,
    level,
    flags,
    details,
    action,
    requiresReview: score >= RISK_CONFIG.thresholds.strongResponse
  };
}

/**
 * Get risk level based on score
 */
function getRiskLevel(score) {
  if (score < RISK_CONFIG.thresholds.softResponse) return 'low';
  if (score < RISK_CONFIG.thresholds.strongResponse) return 'medium';
  return 'high';
}

/**
 * Get recommended action based on risk score
 */
function getRecommendedAction(score, concurrentSessions) {
  // Check session limit first
  if (concurrentSessions >= RISK_CONFIG.thresholds.maxConcurrentSessions) {
    return 'limit_sessions'; // Require logout of old session or deny
  }
  
  if (score < RISK_CONFIG.thresholds.softResponse) {
    return 'allow'; // Normal login
  }
  
  if (score < RISK_CONFIG.thresholds.strongResponse) {
    return 'soft_verify'; // Send email, limit content access
  }
  
  return 'strong_verify'; // Require 2FA/email verification, lock content
}

/**
 * Get user-friendly message for action
 */
export function getActionMessage(action) {
  const messages = {
    allow: 'Доступ разрешён',
    soft_verify: 'Требуется подтверждение через email',
    strong_verify: 'Требуется дополнительная верификация',
    limit_sessions: 'Достигнут лимит одновременных сессий'
  };
  
  return messages[action] || 'Неизвестное действие';
}

/**
 * Export device ID for device management
 */
export function getDeviceId() {
  return localStorage.getItem('akadil_device_id');
}

/**
 * Clear device ID (for logout/reset)
 */
export function clearDeviceId() {
  localStorage.removeItem('akadil_device_id');
}
