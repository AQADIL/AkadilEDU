# 🚀 Рекомендации по хостингу бэкенда

## ✅ Лучшие варианты для Node.js бэкенда:

### 1. **Railway.app** ⭐ РЕКОМЕНДУЮ
- **Бесплатно**: $5 кредитов/месяц (~500 часов)
- **Простота**: Push to deploy (GitHub integration)
- **Поддержка**: Node.js, PostgreSQL, Redis
- **URL**: https://railway.app
- **Что деплоить**: Папку `backend/` из вашего проекта

**Инструкция:**
```bash
# 1. Создать аккаунт на railway.app
# 2. New Project → Deploy from GitHub repo
# 3. Root Directory: /backend
# 4. Автоматически деплоится при push в main
```

---

### 2. **Render.com** ⭐ ОТЛИЧНЫЙ ВЫБОР
- **Бесплатно**: Free tier (с ограничениями)
- **Автоматический деплой**: GitHub/GitLab integration  
- **Поддержка**: Node.js, Python, Docker
- **URL**: https://render.com

**Плюсы:**
- SSL сертификаты автоматически
- Удобный dashboard
- Логи в реальном времени

---

### 3. **Fly.io** 🚁
- **Бесплатно**: 3 микро VM бесплатно
- **Быстро**: Деплой за минуты
- **Docker**: Поддержка контейнеров
- **URL**: https://fly.io

---

### 4. **Google Cloud Run** ☁️
- **Бесплатно**: 2 млн запросов/месяц
- **Масштабируемость**: Автоматическое масштабирование
- **Firebase интеграция**: Легко связать с Firebase
- **URL**: https://cloud.google.com/run

**Инструкция:**
```bash
# 1. Установить gcloud CLI
# 2. В папке backend:
gcloud run deploy akadil-backend --source .
```

---

### 5. **Cyclic.sh** 🔄
- **Бесплатно**: 10 000 запросов/месяц
- **Простота**: Один клик деплой
- **Serverless**: Автоматическое масштабирование
- **URL**: https://cyclic.sh

---

## 📁 Что нужно деплоить:

### Структура вашего бэкенда:
```
backend/
├── index.js                 # Главный файл сервера
├── package.json            # Зависимости
├── .env                    # Переменные окружения (НЕ коммитить!)
└── cleanup-database.js     # Утилиты
```

### Важные файлы:

**package.json** (должен содержать):
```json
{
  "name": "akadiledu-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🔒 Переменные окружения (.env):

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=akadiledu
FIREBASE_CLIENT_EMAIL=your-service-account@akadiledu.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server
PORT=3000
NODE_ENV=production
```

---

## ⚡ Быстрый старт (Railway - самый простой):

1. Зайди на https://railway.app
2. Войди через GitHub
3. New Project → Deploy from GitHub
4. Выбери репозиторий `akadiledu-v2`
5. Root Directory: `backend`
6. Add variables (из .env файла)
7. Deploy!

**Готово!** Railway даст тебе URL типа `https://akadiledu-backend-production.up.railway.app`

---

## 🎯 Рекомендация:

**Используй Railway.app** - самый простой и надежный вариант для начала.
Когда проект вырастет, можно перейти на Google Cloud Run для лучшей масштабируемости.

---

## ⚠️ Важно:

- **НЕ коммить** `.env` файл в GitHub!
- Все чувствительные данные добавляй через панель хостинга
- Используй Firebase Admin SDK для безопасности
- Настрой CORS для фронтенда

---

## 📞 Нужна помощь с деплоем?

Скажи какой хостинг выбрал - помогу настроить! 🚀
