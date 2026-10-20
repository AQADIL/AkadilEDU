import i18n from '../i18n';

function getDeviceInfo() {
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
  } catch {
    return ip;
  }
}

async function getUserIP() {
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
