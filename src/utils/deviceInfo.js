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
    return { suspicious: false, flags: [], riskLevel: 'low' };
  }
  
  const sessions = Object.values(userSessions);
  const recentSessions = sessions.filter(s => {
    const sessionTime = new Date(s.timestamp);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return sessionTime > dayAgo;
  });
  
  console.log('🔍 Security Analysis:', {
    totalSessions: sessions.length,
    recentSessions: recentSessions.length,
    currentIP: currentSession?.ip
  });
  
  // Флаг 1: Множественные IP адреса (снижен порог с 3 до 2 для теста)
  const uniqueIPs = new Set(recentSessions.map(s => s.ip).filter(Boolean));
  console.log('📊 Unique IPs:', Array.from(uniqueIPs));
  
  if (uniqueIPs.size > 2) {
    flags.push({
      type: 'multiple_ips',
      severity: 'high',
      message: `Обнаружено ${uniqueIPs.size} разных IP адресов за последние 24 часа`,
      ips: Array.from(uniqueIPs)
    });
    console.log('🚨 ALERT: Multiple IPs detected!');
  }
  
  // Флаг 2: Множественные устройства (снижен порог с 5 до 3)
  const uniqueDevices = new Set(recentSessions.map(s => s.device?.fingerprint).filter(Boolean));
  console.log('📱 Unique Devices:', uniqueDevices.size);
  
  if (uniqueDevices.size > 3) {
    flags.push({
      type: 'multiple_devices',
      severity: 'high',
      message: `Обнаружено ${uniqueDevices.size} разных устройств за последние 24 часа`,
      deviceCount: uniqueDevices.size
    });
    console.log('🚨 ALERT: Multiple devices detected!');
  }
  
  // Флаг 3: Быстрая смена IP (в течение 2 часов, было 1 час)
  const sortedSessions = recentSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const lastSession = sortedSessions[1]; // Предыдущая сессия (после текущей)
  
  if (lastSession && currentSession && currentSession.ip !== lastSession.ip) {
    const timeDiff = Math.abs(new Date(currentSession.timestamp) - new Date(lastSession.timestamp));
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    
    console.log('⏱️ Time between sessions:', Math.round(timeDiff / 60000), 'minutes');
    
    if (timeDiff < twoHoursInMs && timeDiff > 0) {
      flags.push({
        type: 'rapid_ip_change',
        severity: 'medium',
        message: `Смена IP адреса за ${Math.round(timeDiff / 60000)} минут`,
        oldIP: lastSession.ip,
        newIP: currentSession.ip
      });
      console.log('🚨 ALERT: Rapid IP change!');
    }
  }
  
  // Флаг 4: Одновременные сессии с разных IP (расширен с 5 до 15 минут)
  const now = Date.now();
  const activeSessions = recentSessions.filter(s => {
    const sessionTime = new Date(s.timestamp).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    return (now - sessionTime) < fifteenMinutes;
  });
  
  console.log('🕐 Active sessions (last 15min):', activeSessions.length);
  
  const simultaneousIPs = new Set(activeSessions.map(s => s.ip).filter(Boolean));
  if (simultaneousIPs.size > 1) {
    flags.push({
      type: 'simultaneous_sessions',
      severity: 'critical',
      message: `Одновременные активные сессии с ${simultaneousIPs.size} разных IP адресов`,
      ips: Array.from(simultaneousIPs)
    });
    console.log('🚨 ALERT: Simultaneous sessions!');
  }
  
  const result = {
    suspicious: flags.length > 0,
    flags,
    riskLevel: calculateRiskLevel(flags)
  };
  
  console.log('🔒 Security Result:', result);
  
  return result;
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
