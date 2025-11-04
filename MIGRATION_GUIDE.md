# 📦 МИГРАЦИЯ ПОЛЬЗОВАТЕЛЕЙ: Firebase Auth → Realtime Database

## 🎯 Цель

Перенести всех существующих пользователей из **Firebase Authentication** в **Realtime Database**, чтобы у каждого была полная запись с профилем.

---

## 📋 Что Делает Скрипт

1. ✅ Получает всех пользователей из Firebase Authentication
2. ✅ Для каждого создаёт профиль в Realtime Database
3. ✅ Сохраняет:
   - UID, email, имя
   - Роль (по умолчанию: `student`)
   - Дата регистрации
   - Последний вход
   - Статус (активен/неактивен)
4. ✅ Пропускает уже существующие профили
5. ✅ Логирует процесс миграции

---

## 🚀 ИНСТРУКЦИЯ ПО ЗАПУСКУ

### Шаг 1: Скачать Service Account Key

1. Открой: https://console.firebase.google.com/
2. Выбери проект: **akadiledu**
3. Иди в: **⚙️ Project Settings** → **Service Accounts**
4. Нажми: **Generate new private key**
5. Скачай JSON файл
6. Переименуй в: `serviceAccountKey.json`
7. Положи в папку: `scripts/serviceAccountKey.json`

**⚠️ ВАЖНО:** Этот файл содержит секретные ключи! НЕ коммить в Git!

---

### Шаг 2: Установить Firebase Admin SDK

```bash
npm install firebase-admin --save-dev
```

---

### Шаг 3: Запустить Миграцию

```bash
node scripts/migrateAuthUsers.js
```

---

## 📊 Пример Вывода

```
🚀 Starting migration...

✅ Firebase Admin initialized
📋 Found 15 users in Firebase Authentication

[1/15] Processing: user1@example.com
   ✅ Created profile: user1@example.com (abc123...)
[2/15] Processing: user2@example.com
   ⏭️  Profile already exists: user2@example.com
[3/15] Processing: user3@example.com
   ✅ Created profile: user3@example.com (def456...)

...

============================================================
🎉 MIGRATION COMPLETED!
============================================================
📊 Total users:     15
✅ Created:         12
⏭️  Skipped:         3
❌ Errors:          0
⏱️  Duration:        2341ms
============================================================
```

---

## 🔍 Что Создаётся в Realtime DB

Для каждого пользователя:

```json
{
  "users": {
    "USER_UID_HERE": {
      "uid": "USER_UID_HERE",
      "email": "user@example.com",
      "name": "User Name",
      "phone": "",
      "role": "student",
      "status": "active",
      "registeredAt": "2025-11-04T12:00:00.000Z",
      "lastLogin": "2025-11-04T15:30:00.000Z",
      "emailVerified": true,
      "ipHistory": {},
      "sessions": {},
      "purchasedCourses": {},
      "isDeleted": false
    }
  }
}
```

---

## 🛡️ Безопасность

### ✅ Service Account Key:

- **НИКОГДА** не коммитить в Git!
- Уже добавлен в `scripts/.gitignore`
- Хранить только локально

### ✅ Security Rules:

Убедись, что в Realtime Database настроены правила:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".write": "auth != null && (auth.uid === $uid || root.child('users/' + auth.uid + '/role').val() === 'admin')"
      }
    }
  }
}
```

---

## 🔄 Повторный Запуск

Скрипт **безопасен** для повторного запуска:
- Пропустит уже существующие профили
- Создаст только новые

---

## ⚠️ Если Ошибки

### Ошибка: `Cannot find module 'firebase-admin'`

```bash
npm install firebase-admin --save-dev
```

---

### Ошибка: `PERMISSION_DENIED`

**Решение:**
1. Проверь Security Rules в Firebase Console
2. Временно установи:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
3. После миграции верни нормальные правила!

---

### Ошибка: `serviceAccountKey.json not found`

**Решение:**
Скачай Service Account Key (см. Шаг 1)

---

## 📝 Логи Миграции

Все миграции сохраняются в Realtime DB:

```
/migrationLogs/
  - MIGRATION_ID_1/
      timestamp: "2025-11-04T16:00:00.000Z"
      type: "auth_to_rtdb_migration"
      stats: { total: 15, created: 12, skipped: 3 }
```

---

## 🎯 После Миграции

1. ✅ Проверь данные в Firebase Console → Realtime Database
2. ✅ Войди на сайт под любым аккаунтом
3. ✅ Проверь что профиль загружается
4. ✅ Удали `serviceAccountKey.json` или храни в надёжном месте

---

## 🚨 Важные Замечания

1. **Все пользователи** по умолчанию получают роль `student`
2. **Админ** нужно назначить вручную в БД:
   ```
   users/UID_ADMIN/role = "admin"
   ```
3. **Email verification** переносится из Auth
4. **Курсы** изначально пустые - назначить вручную

---

## 🆘 Поддержка

Если что-то пошло не так:
1. Проверь Console на ошибки
2. Проверь Firebase Rules
3. Проверь что Service Account Key правильный
4. Проверь что база данных доступна

---

**ГОТОВО!** 🎉

Теперь все пользователи из Auth автоматически будут в Realtime Database!
