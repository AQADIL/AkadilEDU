# 📱 Быстрый Тест Push БЕЗ Blaze Плана

## Шаг 1: Получить FCM Token

В консоли браузера (F12):

```javascript
// Очистить флаг
localStorage.removeItem('fcm_permission_requested');

// Перезагрузить
location.reload();
```

После перезагрузки и входа всплывет "Allow notifications?" → **Allow**

Скопируйте токен из консоли:
```
📱 FCM Token: eXjT9ZqP8n4:APA91bH...
```

## Шаг 2: Отправить через Firebase Console

```
1. https://console.firebase.google.com/project/akadiledu/messaging
2. "New notification"
3. Title: "Тестовое уведомление"
4. Body: "Проверка push"
5. Send test message
6. Вставить FCM token
7. Test
```

**Уведомление придет!** ✅

## Шаг 3: Отправить Всем (REST API)

Получите Server Key:
```
Firebase Console → Project Settings
→ Cloud Messaging → Server key (legacy)
```

Создайте файл `send-push.js`:
```javascript
const https = require('https');

const SERVER_KEY = 'ВАШ_SERVER_KEY';
const FCM_TOKENS = [
  'token1_from_database',
  'token2_from_database'
];

const payload = JSON.stringify({
  registration_ids: FCM_TOKENS,
  notification: {
    title: 'Новый курс!',
    body: 'Математика 102 доступна',
    icon: '/icons/icon-192.png'
  }
});

const options = {
  hostname: 'fcm.googleapis.com',
  path: '/fcm/send',
  method: 'POST',
  headers: {
    'Authorization': `key=${SERVER_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => {
    console.log('Response:', JSON.parse(d));
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(payload);
req.end();
```

Запустить:
```bash
node send-push.js
```

**Всем придет уведомление!** 🎉

---

## Вариант 3: Интеграция в Админ Панель (БЕЗ Cloud Functions)

Можно добавить endpoint на ваш бэкенд:

```javascript
// backend/send-push.js (Node.js)
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

async function sendPushToAll(title, message) {
  const usersRef = admin.database().ref('users');
  const snapshot = await usersRef.once('value');
  
  const tokens = [];
  snapshot.forEach(user => {
    if (user.val().fcmToken) {
      tokens.push(user.val().fcmToken);
    }
  });

  if (tokens.length === 0) {
    return { error: 'No FCM tokens' };
  }

  const payload = {
    notification: { title, body: message }
  };

  const response = await admin.messaging().sendToDevice(tokens, payload);
  return { success: response.successCount, failed: response.failureCount };
}

module.exports = { sendPushToAll };
```

---

## ✅ Что Работает Без Blaze:

- ✅ FCM разрешения запрашиваются
- ✅ Токены сохраняются в БД
- ✅ Можно отправлять через Console
- ✅ Можно отправлять через REST API
- ✅ Можно отправлять с backend сервера

## ❌ Что НЕ Работает:

- ❌ Cloud Functions (требуют Blaze)
- ❌ Отправка напрямую из админ панели

---

**Выберите вариант или upgrade на Blaze!** 🚀
