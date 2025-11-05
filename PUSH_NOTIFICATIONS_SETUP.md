# 📱 Push Notifications Setup Guide

## 🎯 Что Это Дает:

Отправлять push уведомления всем пользователям:
- 📢 "Новый курс доступен!"
- 🎓 "Ваш сертификат готов!"
- ⏰ "Курс истекает через 3 дня"
- 🔥 "Скидка 50% только сегодня!"

---

## 🔧 Шаг 1: Включить Cloud Messaging в Firebase

### 1.1 Откройте Firebase Console
```
https://console.firebase.google.com
→ Выберите проект "akadiledu"
→ Build → Cloud Messaging
```

### 1.2 Настройте Web Push сертификат
```
Cloud Messaging → Web configuration
→ Generate key pair
→ Скопируйте VAPID key (понадобится позже)
```

---

## 📦 Шаг 2: Установить Firebase Cloud Messaging SDK

### 2.1 В основном проекте (akadiledu-v2):
```bash
npm install firebase
```

Уже установлено! ✅

### 2.2 Создать firebase-messaging-sw.js

Создайте файл `public/firebase-messaging-sw.js`:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBqKkucrcXnCWsC07w3DwvPkBbhI9XJKIE",
  authDomain: "akadiledu.firebaseapp.com",
  projectId: "akadiledu",
  storageBucket: "akadiledu.firebasestorage.app",
  messagingSenderId: "78627994035",
  appId: "1:78627994035:web:eb93f14c26e6c9d96273c6"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

---

## 🔔 Шаг 3: Запросить Разрешение у Пользователя

### 3.1 Создать утилиту для FCM

Создайте `src/firebase/messaging.js`:

```javascript
// src/firebase/messaging.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './config';

let messaging = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('FCM not supported:', error);
}

// VAPID key из Firebase Console
const VAPID_KEY = 'ВАШ_VAPID_KEY_ЗДЕСЬ';

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission() {
  if (!messaging) {
    console.warn('FCM not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onMessageListener() {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Show notification
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: '/icons/icon-192.png'
    });
  });
}

export { messaging };
```

### 3.2 Запросить разрешение при логине

В `src/App.jsx` добавьте:

```javascript
import { requestNotificationPermission } from './firebase/messaging';

useEffect(() => {
  if (user) {
    // Request notification permission
    requestNotificationPermission().then(token => {
      if (token) {
        // Save token to database for this user
        console.log('FCM token:', token);
        // TODO: Save to Realtime DB at users/{uid}/fcmToken
      }
    });
  }
}, [user]);
```

---

## ☁️ Шаг 4: Cloud Function для Отправки

### 4.1 Установить Firebase Admin SDK в functions:

```bash
cd functions
npm install firebase-admin
```

### 4.2 Создать Cloud Function

В `functions/index.js` добавьте:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Send push notification to all users
 * Call from Admin Dashboard
 */
exports.sendPushToAll = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can send push notifications'
    );
  }

  const { title, message } = data;

  if (!title || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Title and message are required'
    );
  }

  try {
    // Get all FCM tokens from database
    const usersSnapshot = await admin.database()
      .ref('users')
      .once('value');
    
    const tokens = [];
    usersSnapshot.forEach(userSnap => {
      const userData = userSnap.val();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return { success: false, message: 'No users with FCM tokens found' };
    }

    // Send to all tokens
    const payload = {
      notification: {
        title: title,
        body: message,
        icon: '/icons/icon-192.png'
      }
    };

    const response = await admin.messaging().sendToDevice(tokens, payload);
    
    console.log(`Push sent to ${tokens.length} users`);
    console.log('Success:', response.successCount);
    console.log('Failure:', response.failureCount);

    return {
      success: true,
      message: `Отправлено ${response.successCount} из ${tokens.length} пользователей`,
      successCount: response.successCount,
      failureCount: response.failureCount
    };

  } catch (error) {
    console.error('Error sending push:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 4.3 Deploy Cloud Function:

```bash
cd functions
firebase deploy --only functions
```

---

## 🎨 Шаг 5: Интегрировать в Admin Dashboard

Уже сделано! ✅ 

В `AdminDashboard.jsx` есть форма отправки.

Нужно только обновить `handleSendPushNotification`:

```javascript
const handleSendPushNotification = async () => {
  if (!pushTitle || !pushMessage) return;
  
  setSending(true);
  setSendResult(null);
  
  try {
    // Call Cloud Function
    const sendPushToAll = httpsCallable(functions, 'sendPushToAll');
    const result = await sendPushToAll({
      title: pushTitle,
      message: pushMessage
    });

    setSendResult({
      success: true,
      message: result.data.message
    });

    // Clear form
    setPushTitle('');
    setPushMessage('');

  } catch (error) {
    console.error('Error sending push:', error);
    setSendResult({
      success: false,
      message: 'Ошибка: ' + error.message
    });
  } finally {
    setSending(false);
  }
};
```

---

## ✅ Проверка Работы:

### 1. Запросить разрешение:
```javascript
// В консоли браузера
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

### 2. Отправить тестовое уведомление:
```
Firebase Console → Cloud Messaging → Send test message
→ Вставьте FCM token
→ Send
```

### 3. Проверить что работает:
- ✅ Уведомление пришло когда вкладка открыта
- ✅ Уведомление пришло когда вкладка закрыта
- ✅ Уведомление кликабельно

---

## 🎯 Примеры Использования:

### Новый курс:
```
Title: "Новый курс доступен! 🎓"
Message: "Математика 102: Алгебра и геометрия теперь доступна"
```

### Сертификат готов:
```
Title: "Ваш сертификат готов! 🎉"
Message: "Скачайте сертификат за курс Математика 101"
```

### Скидка:
```
Title: "Скидка 50% только сегодня! 🔥"
Message: "Все курсы по программированию со скидкой до конца дня"
```

### Напоминание:
```
Title: "Ваш курс истекает скоро ⏰"
Message: "У вас осталось 3 дня доступа к курсу JavaScript"
```

---

## 📊 Статистика:

После отправки вы увидите:
```
✅ Отправлено 42 из 45 пользователей
- Success: 42
- Failure: 3 (истекшие токены)
```

---

## 🐛 Troubleshooting:

### Проблема: "Notification permission denied"
**Решение:** Пользователь отклонил разрешение. Попросите разрешить в настройках браузера.

### Проблема: "Service worker not found"
**Решение:** Убедитесь что `firebase-messaging-sw.js` в папке `public/`.

### Проблема: "FCM token not received"
**Решение:** Проверьте VAPID key в `messaging.js`.

### Проблема: "Sending failed"
**Решение:** Проверьте что Cloud Function задеплоена: `firebase deploy --only functions`.

---

## 💰 Стоимость:

**Firebase Cloud Messaging: БЕСПЛАТНО!** 🎉

Никаких лимитов на количество уведомлений.

---

## 🚀 Готово!

После настройки вы сможете:
1. Отправлять push всем пользователям
2. Видеть статистику доставки
3. Отправлять с Admin Dashboard

**Push уведомления готовы!** 📱
