# ⚡ БЫСТРАЯ ИНСТРУКЦИЯ: Миграция Пользователей

## 🎯 Задача
Перенести всех пользователей из Firebase Authentication в Realtime Database

---

## 📝 ТРИ ПРОСТЫХ ШАГА:

### 1️⃣ Скачать Service Account Key

```
1. https://console.firebase.google.com/
2. Проект: akadiledu
3. ⚙️ Project Settings → Service Accounts
4. Generate new private key → Скачать JSON
5. Переименовать в: serviceAccountKey.json
6. Положить в: scripts/serviceAccountKey.json
```

⚠️ **НЕ КОММИТИТЬ ЭТОТ ФАЙЛ В GIT!**

---

### 2️⃣ Установить Firebase Admin

```bash
npm install firebase-admin --save-dev
```

---

### 3️⃣ Запустить Миграцию

```bash
node scripts/migrateAuthUsers.js
```

---

## ✅ Готово!

Все пользователи из Authentication теперь в Realtime Database!

**Подробная инструкция:** `MIGRATION_GUIDE.md`

---

## 🔍 Проверка

1. Firebase Console → Realtime Database
2. Открой: `users/`
3. Должны быть все пользователи из Auth

---

## 🛠️ Если Ошибки

### `Cannot find module 'firebase-admin'`
```bash
npm install firebase-admin --save-dev
```

### `serviceAccountKey.json not found`
Скачай Service Account Key (шаг 1)

### `PERMISSION_DENIED`
Проверь Security Rules в Firebase Console

---

**Полная документация:** `MIGRATION_GUIDE.md` 📖
