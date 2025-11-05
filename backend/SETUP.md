# 🚀 Backend Setup для Push Notifications

## Шаг 1: Получить Service Account Key

1. Откройте Firebase Console: https://console.firebase.google.com/project/akadiledu/settings/serviceaccounts/adminsdk
2. Нажмите "Generate new private key"
3. Скачайте файл (он будет называться `akadiledu-firebase-adminsdk-xxxxx.json`)
4. Переименуйте в `serviceAccountKey.json`
5. Положите в папку `backend/`

⚠️ **ВАЖНО:** Не коммитьте этот файл в Git! Он уже в .gitignore

## Шаг 2: Установить зависимости

```bash
cd backend
npm install
```

## Шаг 3: Запустить сервер

```bash
npm start
```

Должно показать:
```
🚀 Backend server running on http://localhost:3001
📱 Push notification endpoint: http://localhost:3001/api/send-push-to-all
```

## Шаг 4: Готово!

Теперь админ панель будет отправлять push через ваш backend вместо Cloud Functions!

---

## Troubleshooting

### "Cannot find module 'serviceAccountKey.json'"
Скачайте Service Account Key из Firebase Console (шаг 1)

### "Port 3001 already in use"
Измените PORT в server.js:
```javascript
const PORT = 3002; // Другой порт
```

### "ECONNREFUSED localhost:3001"
Backend не запущен. Выполните `npm start` в папке backend/

---

## Production Deploy (Опционально)

Можно задеплоить на:
- **Heroku** (бесплатно)
- **Railway** (бесплатно $5 кредитов)
- **Render** (бесплатно)
- **DigitalOcean** ($5/месяц)

После деплоя обновите URL в AdminDashboard.jsx:
```javascript
const BACKEND_URL = 'https://your-backend.herokuapp.com';
```
