# 🔒 НАСТРОЙКА SECURITY RULES

## ❌ ПРОБЛЕМА: Permission Denied

Если видишь ошибку:
```
❌ Error fetching users: Error: Permission denied
```

Это значит Security Rules блокируют доступ к данным!

---

## ✅ РЕШЕНИЕ: Настрой Rules в Firebase Console

### Шаг 1: Открой Firebase Console

```
https://console.firebase.google.com/
```

### Шаг 2: Выбери Проект

```
akadiledu
```

### Шаг 3: Realtime Database → Rules

```
Firebase Console
  → Realtime Database (слева в меню)
  → Rules (вкладка сверху)
```

### Шаг 4: Замени Rules

**Удали старые правила и вставь:**

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".write": "auth != null && (auth.uid === $uid || root.child('users/' + auth.uid + '/role').val() === 'admin')"
      }
    },
    "adminSecurityAlerts": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'",
      ".write": "auth != null"
    },
    "adminLogs": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'",
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
    },
    "courses": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
    },
    "auth_logs": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".write": "auth != null"
      }
    }
  }
}
```

### Шаг 5: Publish (Опубликовать)

**Нажми кнопку "Publish" вверху справа!**

---

## 📖 Что Делают Эти Rules:

### `/users/$uid`
- **Read:** Может читать:
  - Сам пользователь (свой профиль)
  - Админ (любой профиль)
- **Write:** То же самое

### `/adminSecurityAlerts`
- **Read:** Только админы
- **Write:** Любой авторизованный (для создания алертов)

### `/adminLogs`
- **Read:** Только админы
- **Write:** Только админы

### `/courses`
- **Read:** Все авторизованные
- **Write:** Только админы

### `/auth_logs/$uid`
- **Read:** Сам пользователь или админ
- **Write:** Любой авторизованный

---

## 🚨 ВРЕМЕННОЕ РЕШЕНИЕ (Для Тестирования)

**Если нужно быстро протестировать:**

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

⚠️ **НЕ ИСПОЛЬЗУЙ В PRODUCTION!** Это даёт полный доступ всем!

---

## ✅ После Настройки Rules:

1. Перезагрузи страницу: `Ctrl+R`
2. Открой: `http://localhost:3000/admin/users`
3. Пользователи должны появиться!

---

## 🔍 Проверка Rules:

В Firebase Console → Realtime Database → Rules должно быть примерно так:

```
✅ Published: 2025-11-04 16:50:00
✅ Rules active
```

---

## 📊 Как Проверить Что Работает:

### Console (F12):
```
✅ Fetched 5 users from Realtime DB
```

Вместо:
```
❌ Error fetching users: Error: Permission denied
```

---

**НАСТРОЙ RULES И ВСЁ ЗАРАБОТАЕТ!** 🚀
