# 🚀 Deploy Cloud Functions

## Быстрый Deploy

### 1. Установить Firebase CLI (если еще не установлен):
```bash
npm install -g firebase-tools
```

### 2. Логин в Firebase:
```bash
firebase login
```

### 3. Deploy функций:
```bash
cd C:\Users\ACER\WebstormProjects\akadiledu-v2
firebase deploy --only functions
```

---

## Что будет задеплоено:

### ✅ **sendPushToAll** - Отправка push уведомлений
```javascript
Вызов: httpsCallable(functions, 'sendPushToAll')
Параметры: { title, message }
Возврат: { success, message, successCount, failureCount }
```

### ✅ **deleteUser** - Удаление пользователя
```javascript
Параметры: { uid }
```

### ✅ **assignCourseServer** - Назначение курса
```javascript
Параметры: { uid, courseId, expiresAt }
```

### ✅ **sendPushToUser** - Push конкретному юзеру
```javascript
Параметры: { uid, title, body }
```

### ✅ **bulkAssignCourse** - Массовое назначение
```javascript
Параметры: { uids[], courseId, expiresAt }
```

### ✅ **createUserProfileOnSignup** - Auto-create профиля
```javascript
Триггер: при регистрации нового юзера
```

---

## После Deploy:

### Проверить что работает:
```bash
# Список функций
firebase functions:list

# Логи
firebase functions:log
```

### Тестовый вызов:
```javascript
// В консоли браузера (админ панель)
const functions = getFunctions(app, 'us-central1');
const sendPush = httpsCallable(functions, 'sendPushToAll');
sendPush({ title: 'Test', message: 'Hello!' });
```

---

## Troubleshooting:

### "firebase: command not found"
```bash
npm install -g firebase-tools
```

### "Permission denied"
```bash
firebase login
```

### "CORS error"
```javascript
// Уже исправлено в коде:
exports.sendPushToAll = onCall({
  cors: true,
  region: 'us-central1'
}, async (request) => { ... });
```

### "Function not found"
```bash
# Re-deploy
firebase deploy --only functions --force
```

---

## 💰 Стоимость:

**Бесплатный план:**
- 2M вызовов/месяц
- 400,000 GB-секунд
- 200,000 CPU-секунд

**Достаточно для 1000+ юзеров!**

---

## 🎯 После Deploy - Готово!

1. ✅ Push уведомления работают
2. ✅ CORS настроен
3. ✅ Регион: us-central1
4. ✅ Логирование в adminLogs

**Deploy и наслаждайтесь!** 🚀
