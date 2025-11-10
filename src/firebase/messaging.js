/**
 * Firebase Cloud Messaging Module
 * Handles push notifications
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './config';
import { ref, set } from 'firebase/database';
import { database } from './realtimeDb';

let messaging = null;

// Initialize FCM only in supported browsers
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
    console.log('✅ FCM initialized');
  } catch (error) {
    console.warn('⚠️ FCM not supported:', error);
  }
}

// VAPID key from Firebase Console
const VAPID_KEY = 'BINQDapHvjWQVn2MWslpDd1-_zpINrD29EtIM0XzoHHJ8N4U1ybgGuKdS3g11d3diJXblGSrvrK-bAB9NzBo2zA';

/**
 * Request notification permission and get FCM token
 * @param {string} userId - Current user ID
 * @returns {Promise<string|null>} FCM token or null
 */
export async function requestNotificationPermission(userId) {
  if (!messaging) {
    console.warn('⚠️ FCM not available - Service Worker may not be registered');
    return null;
  }

  try {
    console.log('📱 Current permission status:', Notification.permission);
    
    // Check if already granted
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return await getFCMToken(userId);
    }

    // Check if denied
    if (Notification.permission === 'denied') {
      console.warn('❌ Notifications were denied by user. Cannot request again.');
      alert('Push уведомления заблокированы. Разрешите в настройках браузера:\nChrome: Настройки → Конфиденциальность → Уведомления → localhost');
      return null;
    }

    // Request permission
    console.log('🔔 Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted!');
      return await getFCMToken(userId);
    } else {
      console.log('❌ Notification permission denied by user');
      return null;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Get FCM token and save to database
 */
async function getFCMToken(userId) {
  try {
    console.log('🔄 Getting FCM token...');
    console.log('VAPID Key:', VAPID_KEY.substring(0, 20) + '...');
    
    // Wait for service worker
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready:', registration);
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      console.log('📱 FCM Token received:', token.substring(0, 50) + '...');
      
      // Save token to database
      if (database && userId) {
        const tokenRef = ref(database, `users/${userId}/fcmToken`);
        await set(tokenRef, token);
        console.log('✅ FCM token saved to database at users/' + userId + '/fcmToken');
      } else {
        console.warn('⚠️ Cannot save token: database or userId missing');
      }
      
      return token;
    } else {
      console.warn('⚠️ No FCM token received from Firebase');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    if (error.code === 'messaging/permission-blocked') {
      console.error('Permission blocked - user needs to enable in browser settings');
    }
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function setupForegroundMessageListener() {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('📱 Foreground message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'AkadilEDU';
    const notificationOptions = {
      body: payload.notification?.body || 'Новое уведомление',
      icon: payload.notification?.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      image: payload.notification?.image || payload.data?.image, // Большое фото
      tag: 'akadiledu-push', // Предотвращает дубликаты
      renotify: false
    };
    
    // Show notification even when app is open
    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }
  });
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current permission status
 */
export function getNotificationPermissionStatus() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export { messaging };
