/**
 * Device & IP Information Utilities
 * Для трекинга устройств и IP адресов пользователей
 */

/**
 * Получить информацию об устройстве пользователя
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  // Определение браузера
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('Opera/')) browser = 'Opera';
  
  // Определение ОС
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Определение типа устройства
  let deviceType = 'Desktop';
  if (ua.includes('Mobile')) deviceType = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) deviceType = 'Tablet';
  
  // Генерация уникального отпечатка устройства
  const fingerprint = generateDeviceFingerprint();
  
  return {
    browser,
    os,
    deviceType,
    fingerprint,
    userAgent: ua,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  };
}

/**
 * Генерация отпечатка устройства (device fingerprint)
 * Комбинация характеристик для уникальной идентификации
 */
function generateDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const components = [
    navigator.userAgent,
    navigator.language,
    window.screen.colorDepth,
    window.screen.width + 'x' + window.screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    canvasData.slice(0, 100) // Первые 100 символов canvas fingerprint
  ];
  
  // Простой хеш
  return simpleHash(components.join('|'));
}

/**
 * Простая хеш-функция
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Получить IP адрес пользователя
 * Использует бесплатный API для определения IP
 */
export async function getUserIP() {
  try {
    // Используем несколько API для надёжности
    const apis = [
      'https://api.ipify.org?format=json',
      'https://api.ip.sb/jsonip',
      'https://ipapi.co/json/'
    ];
    
    for (const api of apis) {
      try {
        const response = await fetch(api);
        const data = await response.json();
        
        // Разные API возвращают IP в разных полях
        const ip = data.ip || data.query || data.ip_address;
        
        if (ip && isValidIP(ip)) {
          return {
            ip,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn(`Failed to get IP from ${api}:`, err);
        continue;
      }
    }
    
    // Если все API не сработали, возвращаем fallback
    return {
      ip: 'unknown',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error getting user IP:', error);
    return {
      ip: 'unknown',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Проверка валидности IP адреса
 */
function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes(':');
}

/**
 * Получить геолокацию по IP
 */
export async function getIPLocation(ip) {
  if (!ip || ip === 'unknown') return null;
  
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      timezone: data.timezone,
      coordinates: {
        lat: data.latitude,
        lng: data.longitude
      }
    };
  } catch (error) {
    console.error('Error getting IP location:', error);
    return null;
  }
}

/**
 * Создать полный профиль сессии
 */
export async function createSessionProfile() {
  const deviceInfo = getDeviceInfo();
  const ipInfo = await getUserIP();
  
  return {
    device: deviceInfo,
    ip: ipInfo.ip,
    timestamp: ipInfo.timestamp,
    sessionId: generateSessionId()
  };
}

/**
 * Генерация уникального ID сессии
 */
function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Проверка подозрительной активности
 */
export function detectSuspiciousActivity(userSessions, currentSession) {
  const flags = [];
  
  if (!userSessions || Object.keys(userSessions).length === 0) {
    return { suspicious: false, flags: [] };
  }
  
  const sessions = Object.values(userSessions);
  const recentSessions = sessions.filter(s => {
    const sessionTime = new Date(s.timestamp);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return sessionTime > dayAgo;
  });
  
  // Флаг 1: Множественные IP адреса
  const uniqueIPs = new Set(recentSessions.map(s => s.ip));
  if (uniqueIPs.size > 3) {
    flags.push({
      type: 'multiple_ips',
      severity: 'high',
      message: `Обнаружено ${uniqueIPs.size} разных IP адресов за последние 24 часа`,
      ips: Array.from(uniqueIPs)
    });
  }
  
  // Флаг 2: Множественные устройства
  const uniqueDevices = new Set(recentSessions.map(s => s.device?.fingerprint).filter(Boolean));
  if (uniqueDevices.size > 5) {
    flags.push({
      type: 'multiple_devices',
      severity: 'high',
      message: `Обнаружено ${uniqueDevices.size} разных устройств за последние 24 часа`,
      deviceCount: uniqueDevices.size
    });
  }
  
  // Флаг 3: Быстрая смена IP (в течение часа)
  const lastSession = recentSessions[recentSessions.length - 2]; // Предыдущая сессия
  if (lastSession && currentSession.ip !== lastSession.ip) {
    const timeDiff = new Date(currentSession.timestamp) - new Date(lastSession.timestamp);
    const hourInMs = 60 * 60 * 1000;
    
    if (timeDiff < hourInMs) {
      flags.push({
        type: 'rapid_ip_change',
        severity: 'medium',
        message: `Смена IP адреса за ${Math.round(timeDiff / 60000)} минут`,
        oldIP: lastSession.ip,
        newIP: currentSession.ip
      });
    }
  }
  
  // Флаг 4: Одновременные сессии с разных IP
  const now = Date.now();
  const activeSessions = sessions.filter(s => {
    const sessionTime = new Date(s.timestamp).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - sessionTime) < fiveMinutes;
  });
  
  const simultaneousIPs = new Set(activeSessions.map(s => s.ip));
  if (simultaneousIPs.size > 1) {
    flags.push({
      type: 'simultaneous_sessions',
      severity: 'critical',
      message: `Одновременные активные сессии с ${simultaneousIPs.size} разных IP адресов`,
      ips: Array.from(simultaneousIPs)
    });
  }
  
  return {
    suspicious: flags.length > 0,
    flags,
    riskLevel: calculateRiskLevel(flags)
  };
}

/**
 * Расчёт уровня риска
 */
function calculateRiskLevel(flags) {
  const severityScores = {
    low: 1,
    medium: 3,
    high: 5,
    critical: 10
  };
  
  const totalScore = flags.reduce((sum, flag) => 
    sum + (severityScores[flag.severity] || 0), 0
  );
  
  if (totalScore >= 10) return 'critical';
  if (totalScore >= 5) return 'high';
  if (totalScore >= 3) return 'medium';
  return 'low';
}
