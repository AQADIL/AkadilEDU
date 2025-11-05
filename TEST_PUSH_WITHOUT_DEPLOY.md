# 📱 Тестирование Push Уведомлений БЕЗ Deploy

## Если не хотите деплоить Cloud Function

Можно тестировать через Firebase Console напрямую!

---

## 🧪 Способ 1: Firebase Console (Самый Простой)

### 1. Получить FCM Token:

Откройте приложение, войдите, в консоли браузера выполните:
```javascript
// Очистить флаг чтобы снова запросить разрешение
localStorage.removeItem('fcm_permission_requested');
location.reload();

// Или напрямую запросить:
import { requestNotificationPermission } from './firebase/messaging';
const token = await requestNotificationPermission('YOUR_UID');
console.log('FCM Token:', token);
```

Скопируйте токен из консоли.

### 2. Отправить через Firebase Console:

```
1. https://console.firebase.google.com
2. Проект "akadiledu"
3. Build → Cloud Messaging
4. "Send test message"
5. Вставить FCM token
6. Title: "Тестовое уведомление"
7. Body: "Проверка push"
8. Send
```

**Уведомление должно прийти!** 📱

---

## 🧪 Способ 2: REST API (Postman/Curl)

### Получить Server Key:
```
Firebase Console → Project Settings
→ Cloud Messaging → Server key
```

### Отправить через curl:
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_HERE",
    "notification": {
      "title": "Новый курс!",
      "body": "Математика 102 доступна",
      "icon": "/icons/icon-192.png"
    }
  }'
```

---

## 🧪 Способ 3: Встроенная Тестовая Кнопка

Добавьте в AdminDashboard временную кнопку:

```javascript
// AdminDashboard.jsx
import { getMessaging, getToken } from 'firebase/messaging';
import { messaging } from '../../firebase/messaging';

const testPushDirect = async () => {
  try {
    // Получить свой токен
    const token = await getToken(messaging, {
      vapidKey: 'BINQDapHvjWQVn2MWslpDd1-_zp...'
    });
    
    console.log('Ваш токен:', token);
    
    // Отправить через Firebase Console вручную
    alert(`Ваш FCM токен:\n\n${token}\n\nСкопируйте и отправьте через Firebase Console`);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// В UI:
<button onClick={testPushDirect}>
  🧪 Получить мой FCM токен
</button>
```

---

## 📱 Проверка на Телефоне

### Android Chrome:
1. Откройте сайт на телефоне
2. Войдите в аккаунт
3. Должно всплыть "Allow notifications?"
4. Если не всплыло - очистите:
   ```javascript
   // В консоли DevTools (Chrome Remote Debugging)
   localStorage.clear();
   location.reload();
   ```

### iOS Safari:
⚠️ **PWA push notifications работают только на iOS 16.4+**

Для iOS:
1. Добавьте сайт на главный экран (Add to Home Screen)
2. Откройте из иконки на главном экране
3. Тогда разрешение должно запроситься

---

## 🔍 Debugging

### Проверить что Service Worker зарегистрирован:
```javascript
// В консоли
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### Проверить разрешение:
```javascript
console.log('Permission:', Notification.permission);
// "granted", "denied", или "default"
```

### Проверить FCM токен в базе:
```
Firebase Console → Realtime Database
→ users → YOUR_UID
→ должно быть поле "fcmToken"
```

### Если разрешение "denied":
```javascript
// Нельзя изменить программно!
// Нужно вручную:
// Chrome: Settings → Site Settings → localhost → Notifications → Allow
// Firefox: Address bar (i) → Permissions → Notifications → Allow
```

---

## ✅ После Тестирования

Когда убедитесь что push работают:
```bash
# Deploy Cloud Function
firebase deploy --only functions

# Или через npm script
npm run deploy:functions
```

---

## 💡 Полезные Ссылки:

- **Firebase Console:** https://console.firebase.google.com
- **FCM Documentation:** https://firebase.google.com/docs/cloud-messaging
- **Chrome Remote Debugging:** chrome://inspect

---

**Push уведомления готовы к тестированию!** 🚀
