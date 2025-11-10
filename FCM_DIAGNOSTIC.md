# 🔍 FCM Push Notifications - Диагностика проблемы 404

## ❌ Проблема
```
Error 404: Not Found from FCM
FCM отправка не удалась: An unknown server error was returned
```

## 🎯 Причины ошибки 404

### 1. ⚠️ Cloud Messaging API НЕ ВКЛЮЧЕН (главная причина!)

**Решение:**
1. Откройте: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=akadiledu
2. Нажмите кнопку **"ENABLE"** (Включить)
3. Подождите 1-2 минуты
4. Проверьте статус: https://console.cloud.google.com/apis/api/fcm.googleapis.com/metrics?project=akadiledu

### 2. 🔑 Нет FCM токенов в базе данных

**Проверка:**
1. Откройте Firebase Console:
   https://console.firebase.google.com/project/akadiledu/database/akadiledu-default-rtdb/data/~2Fusers
2. Проверьте что у пользователей есть поле `fcmToken`
3. Пример:
   ```
   users
     └─ [USER_ID]
         ├─ email: "user@example.com"
         ├─ fcmToken: "cGFYLhllE_O..." ← ДОЛЖНО БЫТЬ!
         └─ ...
   ```

**Если токенов нет:**
- Войдите в приложение
- Через 2 секунды должно всплыть окно "Allow notifications"
- Нажмите **"Allow"**
- Проверьте консоль браузера (F12):
  ```
  ✅ FCM token saved to database
  ```

### 3. 🔒 Неправильный Service Account Key

**Проверка:**
- Файл `backend/serviceAccountKey.json` должен существовать
- Должен быть скачан из Firebase Console
- Формат:
  ```json
  {
    "type": "service_account",
    "project_id": "akadiledu",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...",
    "client_email": "firebase-adminsdk-...@akadiledu.iam.gserviceaccount.com",
    ...
  }
  ```

**Скачать новый:**
1. https://console.firebase.google.com/project/akadiledu/settings/serviceaccounts/adminsdk
2. Нажмите "Generate new private key"
3. Сохраните как `backend/serviceAccountKey.json`

### 4. 🌐 Backend не запущен

**Проверка:**
```bash
curl http://localhost:3001/health
```

**Запуск:**
```bash
cd backend
npm start
```

## 📋 Пошаговая диагностика

### Шаг 1: Включите Cloud Messaging API
```
✅ Откройте: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=akadiledu
✅ Нажмите "ENABLE"
✅ Подождите 1-2 минуты
```

### Шаг 2: Проверьте backend
```bash
cd backend
npm start
```

Должно быть:
```
🚀 Backend server running on http://localhost:3001
📱 Push notification endpoint: http://localhost:3001/api/send-push-to-all
```

### Шаг 3: Получите FCM токен
1. Откройте: https://akadiledu.web.app
2. Войдите в аккаунт
3. Разрешите уведомления (всплывет окно)
4. В консоли (F12) должно быть:
   ```
   📱 Requesting push notification permission...
   🔄 Getting FCM token...
   ✅ Service Worker ready
   📱 FCM Token received: cGFYLhllE_O...
   ✅ FCM token saved to database at users/[UID]/fcmToken
   ✅ Push notifications enabled
   ```

### Шаг 4: Проверьте токены в Firebase
```
https://console.firebase.google.com/project/akadiledu/database/akadiledu-default-rtdb/data/~2Fusers
```

Должно быть минимум 1 пользователь с `fcmToken`.

### Шаг 5: Отправьте тестовое уведомление
1. Откройте админ панель: https://akadiledu.web.app/admin
2. Заполните форму:
   - **Заголовок:** Тест
   - **Сообщение:** Проверка push
3. Нажмите "Отправить всем пользователям"
4. Должно быть:
   ```
   ✅ Отправлено 1 из 1 пользователей
   ```

## 🔧 Быстрое решение

### Если ошибка 404 все еще есть:

1. **Убедитесь что API включен:**
   ```
   https://console.cloud.google.com/apis/api/fcm.googleapis.com/metrics?project=akadiledu
   ```
   Должно быть: "API enabled"

2. **Проверьте логи backend:**
   ```bash
   cd backend
   npm start
   ```
   При отправке должно быть:
   ```
   📱 Sending push: "..."
   📤 Sending to 1 users: ["user@example.com"]
   ✅ Success: 1, Failed: 0
   ```

3. **Если все равно 404 - подождите:**
   После включения API нужно подождать 2-5 минут пока изменения применятся.

4. **Перезапустите backend:**
   ```bash
   taskkill /IM node.exe /F
   cd backend
   npm start
   ```

## 🎯 Финальная проверка

После всех шагов выполните:

```bash
# 1. Backend запущен
cd backend
npm start

# 2. Откройте в браузере
# https://akadiledu.web.app

# 3. Войдите и разрешите уведомления

# 4. Откройте админку
# https://akadiledu.web.app/admin

# 5. Отправьте тестовое уведомление
```

## ❓ Частые вопросы

**Q: API включен, но все равно 404?**
A: Подождите 5 минут и перезапустите backend.

**Q: Токены есть в базе, но 404?**
A: Проверьте что `serviceAccountKey.json` правильный и API включен.

**Q: Окно разрешения не всплывает?**
A: Очистите localStorage и перезагрузите страницу:
```javascript
localStorage.clear();
location.reload();
```

**Q: Как проверить что токен валидный?**
A: Используйте тестовый скрипт:
```bash
cd backend
node test-single-token.js
```

## 📱 Важные ссылки

- Cloud Messaging API: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=akadiledu
- Firebase Console: https://console.firebase.google.com/project/akadiledu
- Realtime Database: https://console.firebase.google.com/project/akadiledu/database/akadiledu-default-rtdb/data/~2Fusers
- Service Accounts: https://console.firebase.google.com/project/akadiledu/settings/serviceaccounts/adminsdk

## ✅ Контрольный список

- [ ] Cloud Messaging API включен
- [ ] Backend запущен на порту 3001
- [ ] Service Worker зарегистрирован
- [ ] FCM токены сохранены в базе данных
- [ ] serviceAccountKey.json существует и валиден
- [ ] Уведомления разрешены в браузере
- [ ] Тестовое уведомление отправлено успешно
