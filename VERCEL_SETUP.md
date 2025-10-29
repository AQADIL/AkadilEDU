# 🚀 Инструкция по Деплою на Vercel

## 📋 Шаг 1: Build Settings

В Vercel Dashboard настрой следующее:

### Framework Preset:
```
Vite
```

### Build Command:
```bash
npm run build
```

### Output Directory:
```
dist
```

### Install Command:
```bash
npm install
```

### Node.js Version:
```
18.x (или 20.x)
```

---

## 🔑 Шаг 2: Environment Variables

**ОБЯЗАТЕЛЬНО!** Добавь эти переменные в Vercel:

### Способ 1: По одной (Add Variable)

```env
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyBqKkucrcXnCWsC07w3DwvPkBbhI9XJKIE

Name: VITE_FIREBASE_AUTH_DOMAIN
Value: akadiledu.firebaseapp.com

Name: VITE_FIREBASE_PROJECT_ID
Value: akadiledu

Name: VITE_FIREBASE_STORAGE_BUCKET
Value: akadiledu.firebasestorage.app

Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 78627994035

Name: VITE_FIREBASE_APP_ID
Value: 1:78627994035:web:eb93f14c26e6c9d96273c6

Name: VITE_FIREBASE_MEASUREMENT_ID
Value: G-8HFHFE0V38
```

### Способ 2: Paste .env (Быстрее!)

Нажми "Paste .env" и вставь:

```env
VITE_FIREBASE_API_KEY=AIzaSyBqKkucrcXnCWsC07w3DwvPkBbhI9XJKIE
VITE_FIREBASE_AUTH_DOMAIN=akadiledu.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=akadiledu
VITE_FIREBASE_STORAGE_BUCKET=akadiledu.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=78627994035
VITE_FIREBASE_APP_ID=1:78627994035:web:eb93f14c26e6c9d96273c6
VITE_FIREBASE_MEASUREMENT_ID=G-8HFHFE0V38
```

**Для всех Environment (Production, Preview, Development)**

---

## ⚠️ Распространенные Ошибки

### 1. "Build Failed" - Missing Dependencies
**Решение:** Убедись что в Vercel Settings:
- Install Command: `npm install`
- Node.js Version: 18.x или выше

### 2. "Firebase not configured"
**Решение:** Проверь Environment Variables в Vercel Dashboard
- Settings → Environment Variables
- Все 7 переменных должны быть добавлены

### 3. "404 on refresh"
**Решение:** Проверь `vercel.json`:
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

### 4. "Console.log visible in production"
**Решение:** Уже настроено в `vite.config.js`:
```javascript
terserOptions: {
  compress: {
    drop_console: true
  }
}
```

---

## 🔍 Проверка После Деплоя

### 1. Откройти Deployment URL
```
https://your-project.vercel.app
```

### 2. Проверь DevTools Console (F12)
Должны видеть:
```
✅ Firebase initialized successfully
```

Не должно быть:
```
❌ Firebase initialization error
```

### 3. Проверь Функционал:
- [ ] Сайт открывается
- [ ] Регистрация работает
- [ ] Email verification приходит
- [ ] Google Sign-In работает
- [ ] Firestore читает/пишет
- [ ] Роутинг работает (F5 на /profile)

---

## 🔥 Firebase Configuration После Деплоя

### После получения Vercel URL:

#### 1. Authorized Domains:
```
Firebase Console → Authentication → Settings → Authorized domains
→ Add: your-project.vercel.app
```

#### 2. Google Sign-In:
```
Firebase Console → Authentication → Sign-in method → Google
→ Web SDK configuration → Authorized redirect URIs:
→ Add: https://your-project.vercel.app/__/auth/handler
```

---

## 📊 Build Logs - Что Должно Быть

### Успешный Build:
```
✓ Cloning completed
✓ Installing dependencies...
✓ npm install completed
✓ Running "npm run build"
✓ vite build completed
✓ Build completed in 45s
✓ Deployment ready
```

### Если Ошибка:
```
❌ Check Build Logs полностью
❌ Проверь Node.js version
❌ Проверь Environment Variables
❌ Проверь package.json
```

---

## 🎯 Troubleshooting Checklist

- [ ] Framework Preset = Vite
- [ ] Build Command = npm run build
- [ ] Output Directory = dist
- [ ] Node.js Version = 18.x+
- [ ] 7 Environment Variables добавлены
- [ ] vercel.json существует
- [ ] package.json корректный
- [ ] Git repository актуальный

---

## 💡 Полезные Команды

### Проверка локально:
```bash
# Test build
npm run build

# Test preview
npm run preview

# Check output
ls dist/
```

### Vercel CLI:
```bash
# Install
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs
```

---

## 🆘 Если Всё Равно Не Работает

### 1. Проверь Build Logs в Vercel:
```
Deployments → Latest → View Build Logs
```

### 2. Проверь Function Logs:
```
Deployments → Latest → View Function Logs
```

### 3. Redeploy:
```
Deployments → Latest → ⋯ → Redeploy
```

### 4. Очисти Build Cache:
```
Settings → General → Clear Build Cache
→ Redeploy
```

---

## ✅ Итоговый Чеклист

### Перед Деплоем:
- [x] Code pushed to GitHub
- [x] vercel.json exists
- [x] package.json correct
- [x] vite.config.js optimized

### Во Время Деплоя:
- [ ] Framework = Vite
- [ ] Build Command = npm run build
- [ ] Output = dist
- [ ] Environment Variables (7 штук)

### После Деплоя:
- [ ] Site loads
- [ ] Firebase works
- [ ] Auth works
- [ ] Add domain to Firebase
- [ ] Google Sign-In configured

---

**Успешного деплоя!** 🚀
