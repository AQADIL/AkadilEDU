# ⚠️ КРИТИЧНО! Realtime Database НЕ РАБОТАЕТ

## 🔍 Диагностика По Твоим Логам:

### ✅ Что Работает:
```
✅ Firebase initialized successfully
✅ Realtime Database initialized
✅ User logged in: youtub.maj@gmail.com
```

### ❌ Что НЕ Работает:

**НЕТ этих логов (которые я добавил):**
```
🔍 Checking Realtime DB profile for: youtub.maj@gmail.com  ← НЕТ!
📝 Creating new Realtime DB profile...                      ← НЕТ!
👤 Role will be: admin                                      ← НЕТ!
```

**Это означает:** Код создания профиля в RTDB НЕ ВЫПОЛНЯЕТСЯ!

---

## 🚨 Проблемы В Логах:

### 1. Google OAuth Error
```
auth/unauthorized-domain
Add your domain (26.14.34.29) to the OAuth redirect domains
```

**Решение:**
```
Firebase Console → Authentication → Settings → Authorized domains
→ Add: 26.14.34.29
```

Но это НЕ главная проблема!

---

### 2. Firestore 400 Errors

Много ошибок `400 Bad Request` от Firestore.

**НО!** Пользователь вошел: `✅ User logged in: youtub.maj@gmail.com`

Значит Authentication работает!

---

## 🎯 ГЛАВНАЯ ПРОБЛЕМА:

**Realtime Database НЕ СОЗДАНА в Firebase Console!**

### Проверь:

1. **Открой Firebase Console:**
   ```
   https://console.firebase.google.com
   ```

2. **Выбери проект: akadiledu**

3. **Левое меню → Build → Realtime Database**

4. **Что ты видишь?**

   **Если видишь "Create Database":**
   - База НЕ создана!
   - Нажми "Create Database"
   - Location: us-central1
   - Start in test mode
   - Enable

   **Если видишь базу данных:**
   - Хорошо! База есть
   - Но тогда есть другая проблема

---

## 🔧 ЧТО ДЕЛАТЬ СЕЙЧАС:

### Шаг 1: Создай Realtime Database

**ОБЯЗАТЕЛЬНО!** Без этого НИЧЕГО не будет работать!

```
1. Firebase Console → Build → Realtime Database
2. Create Database
3. Location: United States (us-central1)
4. Security rules: "Start in test mode"
5. Enable
```

После создания должен появиться URL:
```
https://akadiledu-default-rtdb.firebaseio.com/
```

---

### Шаг 2: Установи Test Mode Rules

В Realtime Database → **Rules** tab:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

**Publish!**

---

### Шаг 3: Убедись что databaseURL правильный

Открой файл `src/firebase/config.js`:

Должно быть:
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://akadiledu-default-rtdb.firebaseio.com",  // ← ЕСТЬ?
  projectId: "akadiledu",
  ...
};
```

**Если `databaseURL` ОТСУТСТВУЕТ - добавь его!**

---

### Шаг 4: Перезапусти Сервер

```bash
# Останови сервер (Ctrl+C)

# Запусти заново
npm run dev
```

---

### Шаг 5: Войди Заново

```
1. Открой: http://localhost:3006
2. Выйди из аккаунта (если вошел)
3. Войди с youtub.maj@gmail.com
4. СМОТРИ CONSOLE (F12)
```

**Должны появиться логи:**
```
✅ Realtime Database initialized
🔍 Checking Realtime DB profile for: youtub.maj@gmail.com
📝 Creating new Realtime DB profile...
👤 Role will be: admin
📝 Creating user profile in Realtime DB...
   UID: abc123...
   Email: youtub.maj@gmail.com
   Role: admin
✅ User profile created in Realtime DB: abc123...
```

---

## 📸 Что Проверить:

### A. Firebase Console → Realtime Database

Должна быть структура:
```
/
└── users/
    └── {твой_uid}/
        ├── email: "youtub.maj@gmail.com"
        ├── name: "..."
        ├── role: "admin"  ← ГЛАВНОЕ!
        └── status: "active"
```

### B. Sidebar на Сайте

После входа должны появиться:
```
--- (линия) ---
🛡️ Админ Панель
👥 Пользователи
📚 Курсы
```

---

## ⚠️ Если RTDB УЖЕ Создана

Но логов всё равно нет, значит проблема в коде.

**Сделай:**

1. Открой Console (F12)
2. Введи вручную:
   ```javascript
   console.log('Database:', database);
   ```
3. Если `undefined` - RTDB не инициализирована
4. Проверь `databaseURL` в config

---

## 🆘 Быстрая Проверка

### В Console (F12) выполни:

```javascript
// Проверь database
import { database } from './src/firebase/realtimeDb.js';
console.log('Database:', database);

// Если null - проблема в инициализации!
```

---

**ВАЖНО:** Пока ты не создашь Realtime Database в Firebase Console, НИЧЕГО не будет работать!

Создай базу, поставь Test Mode в Rules, перезапусти сервер.
