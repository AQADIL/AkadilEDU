# 🚀 ЗАПУСК BACKEND ДЛЯ PUSH УВЕДОМЛЕНИЙ

## ШАГ 1: Скачать Service Account Key

1. Откройте: **https://console.firebase.google.com/project/akadiledu/settings/serviceaccounts/adminsdk**

2. Нажмите **"Generate new private key"**

3. Скачается файл типа: `akadiledu-firebase-adminsdk-xxxxx-12345.json`

4. Переименуйте его в: **`serviceAccountKey.json`**

5. Положите в папку: **`C:\Users\ACER\WebstormProjects\akadiledu-v2\backend\`**

## ШАГ 2: Запустить Backend

Откройте новый терминал и выполните:

```bash
cd C:\Users\ACER\WebstormProjects\akadiledu-v2\backend
npm start
```

Должно показать:
```
🚀 Backend server running on http://localhost:3001
📱 Push notification endpoint: http://localhost:3001/api/send-push-to-all
```

## ШАГ 3: Готово!

Теперь:
1. Запустите фронтенд: `npm run dev` (в основной папке)
2. Войдите в админ панель
3. Заполните форму push уведомления
4. Нажмите "Отправить"
5. **Работает!** ✅

---

## Где Что Находится:

```
akadiledu-v2/
├── backend/                         ← Backend сервер
│   ├── server.js                   ← Express сервер
│   ├── package.json                ← Зависимости
│   ├── serviceAccountKey.json      ← ВАШ КЛЮЧ (скачать!)
│   └── SETUP.md                    ← Инструкция
│
├── src/                            ← Фронтенд
│   └── pages/admin/
│       └── AdminDashboard.jsx      ← Админ панель (обновлена)
│
└── functions/                      ← Cloud Functions (не нужны)
```

---

## Troubleshooting

### Ошибка: "Cannot find module 'serviceAccountKey.json'"
**Решение:** Скачайте Service Account Key (Шаг 1 выше)

### Ошибка: "Port 3001 already in use"
**Решение:** Кто-то уже использует порт 3001. Измените в `server.js`:
```javascript
const PORT = 3002; // Другой порт
```

И в `AdminDashboard.jsx`:
```javascript
const BACKEND_URL = 'http://localhost:3002';
```

### Ошибка: "Failed to fetch"
**Решение:** Backend не запущен. Запустите: `npm start` в папке `backend/`

### Ошибка: "ECONNREFUSED"
**Решение:** Backend недоступен. Проверьте что он запущен на порту 3001

---

## Production Deploy (Позже)

Когда будете готовы, можно задеплоить backend на:

### **Heroku (Бесплатно)**
```bash
cd backend
heroku create akadiledu-backend
git push heroku main
```

### **Railway (Бесплатно $5)**
```bash
cd backend
railway login
railway up
```

### **Render (Бесплатно)**
1. Зайдите на render.com
2. New → Web Service
3. Connect Git repo
4. Deploy

После деплоя обновите URL в `AdminDashboard.jsx`:
```javascript
const BACKEND_URL = 'https://your-backend.herokuapp.com';
```

---

## ✅ Преимущества этого решения:

- ✅ **БЕЗ Blaze плана** - работает на бесплатном
- ✅ **Прямая отправка** - из админ панели
- ✅ **Полный контроль** - ваш код, ваш сервер
- ✅ **Легко деплоить** - на любой платформе
- ✅ **Логи в БД** - все действия записываются

**Готово! Теперь push уведомления работают! 🚀**
