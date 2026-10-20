import i18n from '../i18n';

export function getDeviceInfo() {
  const ua = navigator.userAgent;

  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('Opera/')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  let deviceType = 'Desktop';
  if (ua.includes('Mobile')) deviceType = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) deviceType = 'Tablet';

  const deviceId = getOrCreateDeviceId();
  const fingerprint = generateDeviceFingerprint();

  return {
    deviceId,
    browser,
    os,
    platform: navigator.platform,
    deviceType,
    fingerprint,
    userAgent: ua,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

function getOrCreateDeviceId() {
  const STORAGE_KEY = 'akadil_device_id';

  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}

function generateDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ];

  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function hashIP(ip) {
  if (!ip || typeof crypto === 'undefined' || !crypto.subtle) {
    return ip;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    return ip;
  }
}

export async function getUserIP() {
  const endpoint = import.meta.env.VITE_IP_LOOKUP_URL;
  if (!endpoint) return { ip: 'unknown', timestamp: new Date().toISOString() };
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(i18n.t('ui.ipLookupFailed'));
    const data = await response.json();
    return { ip: isValidIP(data.ip) ? data.ip : 'unknown', timestamp: new Date().toISOString() };
  } catch {
    return { ip: 'unknown', timestamp: new Date().toISOString() };
  }
}

function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes(':');
}

export async function getIPLocation(ip) {
  if (!ip || ip === 'unknown' || !import.meta.env.VITE_IP_LOCATION_URL) return null;

  try {
    const response = await fetch(
      import.meta.env.VITE_IP_LOCATION_URL.replace('{ip}', encodeURIComponent(ip)),
      { signal: AbortSignal.timeout(5000) },
    );
    const data = await response.json();

    return {
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      timezone: data.timezone,
      coordinates: {
        lat: data.latitude,
        lng: data.longitude,
      },
    };
  } catch (error) {
    return null;
  }
}

export async function createSessionProfile() {
  const device = getDeviceInfo();
  const ipData = await getUserIP();
  const ipHash = await hashIP(ipData.ip);

  return {
    sessionId: generateSessionId(),
    deviceId: device.deviceId,
    device,
    ip: ipData.ip,
    ipHash,
    timestamp: new Date().toISOString(),
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    active: true,
    revoked: false,
    limited: false,
    riskScore: 0,
  };
}

function generateSessionId() {
  return crypto.randomUUID();
}

export function detectSuspiciousActivity(userSessions, currentSession) {
  const flags = [];

  if (!userSessions || Object.keys(userSessions).length === 0) {
    return { suspicious: false, flags: [], riskLevel: 'low' };
  }

  const sessions = Object.values(userSessions);
  const recentSessions = sessions.filter((s) => {
    const sessionTime = new Date(s.timestamp);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return sessionTime > dayAgo;
  });

  const uniqueIPs = new Set(recentSessions.map((s) => s.ip).filter(Boolean));

  if (uniqueIPs.size > 2) {
    flags.push({
      type: 'multiple_ips',
      severity: 'high',
      message: i18n.t('security.ipCount', { v0: uniqueIPs.size }),
      ips: Array.from(uniqueIPs),
    });
  }

  const uniqueDevices = new Set(recentSessions.map((s) => s.device?.fingerprint).filter(Boolean));

  if (uniqueDevices.size > 3) {
    flags.push({
      type: 'multiple_devices',
      severity: 'high',
      message: i18n.t('security.deviceCount', { v0: uniqueDevices.size }),
      deviceCount: uniqueDevices.size,
    });
  }

  const sortedSessions = recentSessions.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
  const lastSession = sortedSessions[1];

  if (lastSession && currentSession && currentSession.ip !== lastSession.ip) {
    const timeDiff = Math.abs(new Date(currentSession.timestamp) - new Date(lastSession.timestamp));
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    if (timeDiff < twoHoursInMs && timeDiff > 0) {
      flags.push({
        type: 'rapid_ip_change',
        severity: 'medium',
        message: i18n.t('security.ipChange', { v0: Math.round(timeDiff / 60000) }),
        oldIP: lastSession.ip,
        newIP: currentSession.ip,
      });
    }
  }

  const now = Date.now();
  const activeSessions = recentSessions.filter((s) => {
    const sessionTime = new Date(s.timestamp).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    return now - sessionTime < fifteenMinutes;
  });

  const simultaneousIPs = new Set(activeSessions.map((s) => s.ip).filter(Boolean));
  if (simultaneousIPs.size > 1) {
    flags.push({
      type: 'simultaneous_sessions',
      severity: 'critical',
      message: i18n.t('security.activeIps', { v0: simultaneousIPs.size }),
      ips: Array.from(simultaneousIPs),
    });
  }

  const result = {
    suspicious: flags.length > 0,
    flags,
    riskLevel: calculateRiskLevel(flags),
  };

  return result;
}

function calculateRiskLevel(flags) {
  const severityScores = {
    low: 1,
    medium: 3,
    high: 5,
    critical: 10,
  };

  const totalScore = flags.reduce((sum, flag) => sum + (severityScores[flag.severity] || 0), 0);

  if (totalScore >= 10) return 'critical';
  if (totalScore >= 5) return 'high';
  if (totalScore >= 3) return 'medium';
  return 'low';
}
