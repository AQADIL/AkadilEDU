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
    console.warn('FCM not available');
    return null;
  }

  try {
    // Check if already granted
    if (Notification.permission === 'granted') {
      console.log('📱 Notification permission already granted');
      return await getFCMToken(userId);
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return await getFCMToken(userId);
    } else {
      console.log('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Get FCM token and save to database
 */
async function getFCMToken(userId) {
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });
    
    if (token) {
      console.log('📱 FCM Token:', token);
      
      // Save token to database
      if (database && userId) {
        const tokenRef = ref(database, `users/${userId}/fcmToken`);
        await set(tokenRef, token);
        console.log('✅ FCM token saved to database');
      }
      
      return token;
    } else {
      console.warn('⚠️ No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
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
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
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
