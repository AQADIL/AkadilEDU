import i18n from '../i18n';

export const RISK_CONFIG = {
  scores: {
    newDevice: 2,
    newIP: 1,
    multipleDevices24h: 6,
    multipleIPs24h: 4,
    geoJump: 5,
    concurrentSessions: 8,
  },

  thresholds: {
    softResponse: 6,
    strongResponse: 12,
    maxConcurrentSessions: 3,
  },

  deviceLimits: {
    uniqueDevices24h: 5,
    uniqueIPs24h: 5,
    concurrentThreshold: 2,
  },
};

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
      action: 'allow',
    };
  }

  const sessions = Object.values(userSessions);
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const recentSessions = sessions.filter((s) => {
    const sessionTime = new Date(s.timestamp || s.lastSeen).getTime();
    return sessionTime > oneDayAgo;
  });

  const isTrustedDevice = trustedDevices.includes(currentSession.deviceId);
  if (isTrustedDevice) {
    score -= 3;
    flags.push({
      type: 'trusted_device',
      severity: 'info',
      message: i18n.t('ui.trustedDevice'),
    });
  }

  const knownDevices = new Set(sessions.map((s) => s.deviceId).filter(Boolean));
  const isNewDevice = !knownDevices.has(currentSession.deviceId);

  if (isNewDevice) {
    score += RISK_CONFIG.scores.newDevice;
    flags.push({
      type: 'new_device',
      severity: 'low',
      message: i18n.t('ui.newDevice'),
      deviceId: currentSession.deviceId,
    });
  }

  const knownIPs = new Set(sessions.map((s) => s.ip).filter(Boolean));
  const isNewIP = !knownIPs.has(currentSession.ip);

  if (isNewIP) {
    score += RISK_CONFIG.scores.newIP;
    flags.push({
      type: 'new_ip',
      severity: 'low',
      message: i18n.t('ui.signinFromANewIpAddress'),
      ip: currentSession.ip,
    });
  }

  const uniqueDevices24h = new Set(recentSessions.map((s) => s.deviceId).filter(Boolean));
  details.uniqueDevices24h = uniqueDevices24h.size;

  if (uniqueDevices24h.size > RISK_CONFIG.deviceLimits.uniqueDevices24h) {
    score += RISK_CONFIG.scores.multipleDevices24h;
    flags.push({
      type: 'multiple_devices',
      severity: 'high',
      message: i18n.t('security.deviceCount', { v0: uniqueDevices24h.size }),
      deviceCount: uniqueDevices24h.size,
    });
  }

  const uniqueIPs24h = new Set(recentSessions.map((s) => s.ip).filter(Boolean));
  details.uniqueIPs24h = uniqueIPs24h.size;

  if (uniqueIPs24h.size > RISK_CONFIG.deviceLimits.uniqueIPs24h) {
    score += RISK_CONFIG.scores.multipleIPs24h;
    flags.push({
      type: 'multiple_ips',
      severity: 'high',
      message: i18n.t('security.ipCount', { v0: uniqueIPs24h.size }),
      ipCount: uniqueIPs24h.size,
      ips: Array.from(uniqueIPs24h),
    });
  }

  const activeSessions = sessions.filter((s) => {
    if (!s.active || s.revoked) return false;
    const lastSeenTime = new Date(s.lastSeen || s.timestamp).getTime();
    return lastSeenTime > fiveMinutesAgo;
  });

  details.concurrentSessions = activeSessions.length;

  if (activeSessions.length > RISK_CONFIG.deviceLimits.concurrentThreshold) {
    score += RISK_CONFIG.scores.concurrentSessions;

    const concurrentIPs = new Set(activeSessions.map((s) => s.ip).filter(Boolean));
    flags.push({
      type: 'concurrent_sessions',
      severity: 'critical',
      message: i18n.t('security.concurrent', { v0: activeSessions.length, v1: concurrentIPs.size }),
      sessionCount: activeSessions.length,
      ips: Array.from(concurrentIPs),
    });
  }

  const recentSession = recentSessions
    .filter((s) => new Date(s.timestamp || s.lastSeen).getTime() > oneHourAgo)
    .sort((a, b) => new Date(b.timestamp || b.lastSeen) - new Date(a.timestamp || a.lastSeen))[0];

  if (recentSession && recentSession.ip !== currentSession.ip) {
    const timeDiff = now - new Date(recentSession.timestamp || recentSession.lastSeen).getTime();
    if (timeDiff < 60 * 60 * 1000) {
      score += RISK_CONFIG.scores.geoJump;
      flags.push({
        type: 'geo_jump',
        severity: 'medium',
        message: i18n.t('security.ipChange', { v0: Math.round(timeDiff / 60000) }),
        oldIP: recentSession.ip,
        newIP: currentSession.ip,
      });
    }
  }

  const level = getRiskLevel(score);
  const action = getRecommendedAction(score, activeSessions.length);

  return {
    score,
    level,
    flags,
    details,
    action,
    requiresReview: score >= RISK_CONFIG.thresholds.strongResponse,
  };
}

function getRiskLevel(score) {
  if (score < RISK_CONFIG.thresholds.softResponse) return 'low';
  if (score < RISK_CONFIG.thresholds.strongResponse) return 'medium';
  return 'high';
}

function getRecommendedAction(score, concurrentSessions) {
  if (concurrentSessions >= RISK_CONFIG.thresholds.maxConcurrentSessions) {
    return 'limit_sessions';
  }

  if (score < RISK_CONFIG.thresholds.softResponse) {
    return 'allow';
  }

  if (score < RISK_CONFIG.thresholds.strongResponse) {
    return 'soft_verify';
  }

  return 'strong_verify';
}

export function getActionMessage(action) {
  const messages = {
    allow: i18n.t('ui.accessAllowed'),
    soft_verify: i18n.t('ui.emailVerificationSuggested'),
    strong_verify: i18n.t('ui.additionalReviewSuggested'),
    limit_sessions: i18n.t('ui.concurrentSessionLimitReached'),
  };

  return messages[action] || i18n.t('ui.unknownAction');
}

export function getDeviceId() {
  return localStorage.getItem('akadil_device_id');
}

export function clearDeviceId() {
  localStorage.removeItem('akadil_device_id');
}
