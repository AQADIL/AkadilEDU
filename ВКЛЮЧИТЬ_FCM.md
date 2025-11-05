# 🔧 Включить Firebase Cloud Messaging

## Проблема:
```
Error 404 от Firebase при отправке push
"Not Found" - FCM API не включен
```

## Решение:

### Шаг 1: Включить Cloud Messaging API

1. Откройте: **https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=akadiledu**

2. Нажмите **"ENABLE"** (Включить API)

3. Подождите 1-2 минуты

### Шаг 2: Проверить Web Push Certificates

1. Откройте: **https://console.firebase.google.com/project/akadiledu/settings/cloudmessaging**

2. Вкладка **"Web configuration"**

3. Должен быть **Web Push certificates**

4. Если нет - нажмите **"Generate key pair"**

5. **Скопируйте новый VAPID key** и обновите в коде (если отличается):
   ```
   Ваш текущий: BINQDapHvjWQVn2MWslpDd1-_zp...
   ```

### Шаг 3: Перезапустить Backend

```bash
# Остановите backend (Ctrl+C)
# Запустите снова
cd C:\Users\ACER\WebstormProjects\akadiledu-v2\backend
npm start
```

### Шаг 4: Тест

1. Обновите страницу админ панели
2. Нажмите "🧪 Тест Push Уведомлений" снова
3. Попробуйте отправить push

---

## Если Все Еще Не Работает:

### Проверить что FCM токен валидный:

В консоли браузера (F12):
```javascript
// Проверить Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});

// Проверить permission
console.log('Notification permission:', Notification.permission);
```

### Проверить токен в базе:

Firebase Console → Realtime Database:
```
users → [ваш UID] → fcmToken: "cGFYLhllE_O..."
```

Должен быть длинный токен (152+ символа).

---

## Альтернатива: Legacy Server Key

Если VAPID ключ не работает, можно использовать Legacy Server Key:

1. **https://console.firebase.google.com/project/akadiledu/settings/cloudmessaging**

2. Вкладка **"Cloud Messaging API (Legacy)"**

3. Скопируйте **Server key**

4. Используйте вместо VAPID в backend

---

## После Включения API:

✅ Error 404 исчезнет
✅ Push уведомления заработают
✅ Можно отправлять всем пользователям

**Включите Cloud Messaging API и все заработает!** 🚀
