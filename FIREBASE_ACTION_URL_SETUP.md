# 🔧 Firebase Action URL Setup Guide

## ⚠️ Проблема

Когда Firebase отправляет email (password reset, email verification), ссылка может прийти неправильно:

### ❌ Неправильно:
```
https://akadiledu-v2-3.vercel.app/?mode=resetPassword&oobCode=XXX
```
Открывается главная страница `/` вместо страницы сброса пароля.

### ✅ Правильно:
```
https://akadiledu-v2-3.vercel.app/__/auth/action?mode=resetPassword&oobCode=XXX
```
Автоматически редиректит на нужную страницу.

---

## 🛠️ Решение

Я добавил **два уровня защиты**:

### 1. Home.jsx проверяет query параметры
```javascript
// Если на главной странице есть mode и oobCode
// Автоматически редиректит на /__/auth/action
useEffect(() => {
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  if (mode && oobCode) {
    navigate(`/__/auth/action?${searchParams.toString()}`);
  }
}, [searchParams]);
```

### 2. Настроить Action URL в Firebase Console

---

## 📝 Настройка Firebase Console

### Шаг 1: Открой Firebase Console
```
https://console.firebase.google.com
```

### Шаг 2: Выбери проект
```
akadiledu
```

### Шаг 3: Authentication → Templates

Кликни на каждый тип email:
- ✉️ **Email address verification**
- 🔑 **Password reset**
- 📧 **Email address change** (optional)

### Шаг 4: Для каждого типа:

#### 1. Кликни "Edit template" (карандаш)

#### 2. Найди раздел "Customize action URL"

#### 3. Включи переключатель "Customize action URL"

#### 4. Введи URL:
```
https://akadiledu-v2-3.vercel.app/__/auth/action
```

**Важно:** 
- ✅ Используй `https://`
- ✅ Используй свой Vercel домен
- ✅ Обязательно добавь `/__/auth/action` в конец
- ❌ Не добавляй `/` в конец

#### 5. Нажми "Save"

---

## 🔍 Как Проверить

### Вариант 1: Через Firebase Console

1. **Authentication → Templates → Password reset**
2. **Нажми "Send test email"**
3. **Введи свой email**
4. **Проверь почту**
5. **Кликни на ссылку**
6. **Должно открыть:** `/__/auth/action?mode=resetPassword&...`

### Вариант 2: Через приложение

1. **Открой:** https://akadiledu-v2-3.vercel.app/forgot-password
2. **Введи email**
3. **Проверь почту**
4. **Кликни на ссылку**
5. **Должно работать!**

---

## 🎯 Что Происходит

### Сценарий 1: Правильный Action URL настроен
```
Email link:
https://your-domain.com/__/auth/action?mode=resetPassword&oobCode=XXX
    ↓
AuthAction.jsx распознает mode
    ↓
Редиректит на /reset-password
    ↓
Работает! ✅
```

### Сценарий 2: Action URL не настроен (fallback)
```
Email link:
https://your-domain.com/?mode=resetPassword&oobCode=XXX
    ↓
Открывается Home.jsx
    ↓
useEffect видит mode и oobCode
    ↓
Редиректит на /__/auth/action
    ↓
AuthAction.jsx обрабатывает
    ↓
Работает! ✅
```

---

## 📋 Checklist

- [ ] Открыл Firebase Console
- [ ] Authentication → Templates
- [ ] Email verification → Customize action URL
  - [ ] Enabled
  - [ ] URL: `https://akadiledu-v2-3.vercel.app/__/auth/action`
  - [ ] Saved
- [ ] Password reset → Customize action URL
  - [ ] Enabled
  - [ ] URL: `https://akadiledu-v2-3.vercel.app/__/auth/action`
  - [ ] Saved
- [ ] Email change → Customize action URL (optional)
  - [ ] Enabled
  - [ ] URL: `https://akadiledu-v2-3.vercel.app/__/auth/action`
  - [ ] Saved
- [ ] Отправил test email
- [ ] Проверил что ссылка работает

---

## 🚨 Troubleshooting

### Проблема: Ссылка всё равно идет на `/?mode=...`
**Решение:** 
1. Убедись что Action URL сохранен в Firebase Console
2. Очисти кэш браузера
3. Попробуй в incognito режиме
4. Даже если придет на `/`, Home.jsx автоматически редиректит! ✅

### Проблема: "Invalid action code"
**Решение:**
- Код может быть использован только 1 раз
- Запроси новое письмо

### Проблема: Ссылка открывает Firebase домен
**Решение:**
- Проверь что домен добавлен в Authorized domains
- Firebase Console → Authentication → Settings → Authorized domains

---

## 🎨 Supported URLs

Приложение теперь поддерживает **оба формата**:

### Формат 1: Firebase стандарт
```
https://your-domain.com/__/auth/action?mode=XXX&oobCode=XXX
```

### Формат 2: Root URL (fallback)
```
https://your-domain.com/?mode=XXX&oobCode=XXX
```

### Формат 3: Direct links (работали всегда)
```
https://your-domain.com/reset-password?oobCode=XXX
https://your-domain.com/verify-email?oobCode=XXX
```

**Все 3 формата работают!** 🎉

---

## 📚 Authorized Domains

Не забудь добавить все домены в Firebase:

```
Firebase Console → Authentication → Settings → Authorized domains
```

Добавь:
- ✅ `akadiledu-v2-3.vercel.app` (Vercel)
- ✅ `localhost` (для разработки)
- ✅ Твой custom domain (если есть)

---

## ✅ Итог

После настройки Action URL:
- ✅ Все email ссылки будут открывать правильные страницы
- ✅ Password reset работает
- ✅ Email verification работает
- ✅ Есть fallback на случай неправильной конфигурации
- ✅ Production ready!

**Проверь сейчас:**
1. Открой Firebase Console
2. Настрой Action URL
3. Отправь test email
4. Всё работает! 🚀
