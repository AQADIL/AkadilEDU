import i18n from '../i18n';

import { getMessaging, getToken } from 'firebase/messaging';
import { app } from './config';
import { ref, set } from 'firebase/database';
import { database } from './realtimeDb';

let messaging = null;

if (app && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {}
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission(userId) {
  if (!messaging || !VAPID_KEY) {
    return null;
  }

  try {
    if (Notification.permission === 'granted') {
      return await getFCMToken(userId);
    }

    if (Notification.permission === 'denied') {
      alert(i18n.t('ui.notificationsAreBlockedAllowThemInYour'));
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      return await getFCMToken(userId);
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getFCMToken(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      if (database && userId) {
        const tokenRef = ref(database, `users/${userId}/fcmToken`);
        await set(tokenRef, token);
      }

      return token;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermissionStatus() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export { messaging };
