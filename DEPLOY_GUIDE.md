# 🚀 Руководство по Деплою на Vercel

## 📋 Подготовка Завершена ✅

Проект готов к деплою! Все файлы настроены:

- ✅ `vercel.json` - настройки Vercel
- ✅ `public/manifest.json` - PWA манифест
- ✅ `vite.config.js` - production оптимизации
- ✅ `.vercelignore` - игнорируемые файлы
- ✅ `package.json` - зависимости

---

## 🎯 Способы Деплоя

### Способ 1: Через Vercel Dashboard (Самый Простой) 🌟

1. **Перейди на** https://vercel.com
2. **Войди через GitHub**
3. **Нажми "Add New Project"**
4. **Выбери репозиторий** `AQADIL/akadiledu-v2-1`
5. **Configure Project:**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
6. **Environment Variables** (добавь Firebase конфиг):
   ```
   VITE_FIREBASE_API_KEY=ваш_ключ
   VITE_FIREBASE_AUTH_DOMAIN=ваш_домен
   VITE_FIREBASE_PROJECT_ID=ваш_id
   ...и т.д.
   ```
7. **Нажми "Deploy"** 🚀

**Готово!** Через 1-2 минуты сайт будет живой!

---

### Способ 2: Через Vercel CLI

#### Шаг 1: Установи Vercel CLI
```bash
npm install -g vercel
```

#### Шаг 2: Логин
```bash
vercel login
```

#### Шаг 3: Деплой
```bash
# Из папки проекта:
cd C:\Users\ACER\WebstormProjects\akadiledu-v2

# Первый деплой:
vercel

# Production деплой:
vercel --prod
```

---

## 🔑 Environment Variables (ВАЖНО!)

### Что Нужно Добавить в Vercel:

Перейди в Vercel Dashboard → Settings → Environment Variables

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=akadiledu.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=akadiledu
VITE_FIREBASE_STORAGE_BUCKET=akadiledu.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Где Взять?**
```
Firebase Console → Project Settings → General → Your apps
```

---

## ⚙️ Настройки Vercel (Автоматически)

### Build Settings:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist"
}
```

### Routing (уже в vercel.json):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Это для React Router - все роуты идут через index.html

---

## 🔥 Firebase Setup

### 1. Добавь Домен Vercel в Firebase

После первого деплоя ты получишь URL типа:
```
https://akadiledu-v2-1.vercel.app
```

**Добавь его в Firebase:**
```
Firebase Console → Authentication → Settings → Authorized domains
→ Add domain: akadiledu-v2-1.vercel.app
```

### 2. Google Sign-In Redirect URI
```
Firebase Console → Authentication → Google → 
Authorized redirect URIs:
https://akadiledu-v2-1.vercel.app/__/auth/handler
```

---

## 📱 После Деплоя

### Проверь:
1. ✅ Сайт открывается
2. ✅ Google Sign-In работает
3. ✅ Email Verification работает
4. ✅ Firestore читает/пишет данные
5. ✅ Роутинг работает (F5 на /profile не ломается)
6. ✅ PWA устанавливается (Chrome → Install App)

### Если Что-то Не Работает:

#### Google Sign-In Error:
```
Проблема: Redirect URI mismatch
Решение: Добавь домен в Firebase Authorized domains
```

#### 404 на Routes:
```
Проблема: /profile возвращает 404
Решение: vercel.json правильный (уже есть!)
```

#### Environment Variables:
```
Проблема: Firebase не работает
Решение: Проверь Environment Variables в Vercel
```

---

## 🎨 Custom Domain (Опционально)

### Если хочешь свой домен:

1. **Купи домен** (Namecheap, GoDaddy, etc.)
2. **Vercel Dashboard → Settings → Domains**
3. **Добавь домен:** `akadiledu.com`
4. **Настрой DNS** (Vercel покажет инструкции)
5. **Добавь в Firebase Authorized domains**

Vercel автоматически даст:
- ✅ HTTPS сертификат
- ✅ CDN
- ✅ www редирект

---

## 📊 Vercel Features

### Что Получишь Бесплатно:
- ✅ **Unlimited Deployments**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **Analytics**
- ✅ **Preview Deployments** (каждый PR = отдельный preview)
- ✅ **Automatic Git Integration**

### Лимиты Free Plan:
- ✅ 100 GB bandwidth/месяц
- ✅ Unlimited сайтов
- ✅ Commercial use разрешен

---

## 🔄 Continuous Deployment

После первого деплоя:

```bash
# 1. Делаешь изменения в коде
git add .
git commit -m "Update feature"
git push

# 2. Vercel автоматически:
# ✅ Видит push на GitHub
# ✅ Билдит проект
# ✅ Деплоит на production
# ✅ Уведомляет тебя
```

**Автоматический CI/CD!** 🎉

---

## 🐛 Troubleshooting

### Build Failed:
```bash
# Проверь локально:
npm run build

# Если работает, проверь:
# - Node version в Vercel (Settings → General)
# - Environment variables
```

### Долгий Build:
```bash
# Обычно 1-2 минуты
# Если дольше - проверь Vercel Dashboard → Deployments
```

### Redirect Loop:
```bash
# Убедись что в Firebase Auth:
# Authorized domains содержит домен Vercel
```

---

## ✅ Checklist Перед Деплоем

- [x] `npm run build` работает локально
- [x] `.env` файл НЕ закоммичен (в .gitignore)
- [x] Firebase config готов
- [x] `vercel.json` создан
- [x] `manifest.json` в /public
- [x] Icons есть в /public/icons
- [ ] GitHub репозиторий актуален
- [ ] Vercel аккаунт создан
- [ ] Environment variables готовы

---

## 🎯 Быстрый Старт (3 Минуты)

```bash
# 1. Push на GitHub (если еще не)
git add .
git commit -m "Ready for deploy"
git push

# 2. Перейди на Vercel
https://vercel.com/new

# 3. Import репозиторий
AQADIL/akadiledu-v2-1

# 4. Добавь Environment Variables
(Firebase config)

# 5. Deploy!
```

**Готово!** 🚀

---

## 📞 Поддержка

### Если Нужна Помощь:
- 📚 Vercel Docs: https://vercel.com/docs
- 💬 Vercel Discord: https://vercel.com/discord
- 🔥 Firebase Docs: https://firebase.google.com/docs

### Полезные Команды:
```bash
# Проверка билда
npm run build

# Локальный preview
npm run preview

# Vercel logs
vercel logs

# Vercel domains
vercel domains ls
```

---

## 🎉 После Успешного Деплоя

Твой сайт будет доступен по:
```
https://akadiledu-v2-1.vercel.app
```

С автоматическими:
- ✅ HTTPS
- ✅ Global CDN
- ✅ Auto-scaling
- ✅ DDoS protection
- ✅ Instant cache invalidation

**Наслаждайся!** 🚀
