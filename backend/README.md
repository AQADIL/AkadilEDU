# Backend для Push Уведомлений

Express сервер для отправки Firebase Cloud Messaging уведомлений.

## Деплой на Vercel

### 1. Установите Vercel CLI (опционально):
```bash
npm i -g vercel
```

### 2. Или через Vercel Dashboard:

1. Зайдите на https://vercel.com
2. Импортируйте репозиторий: `AQADIL/akadiledu-v2-1`
3. **Root Directory:** укажите `backend`
4. Framework Preset: Other
5. Build Command: оставьте пустым
6. Output Directory: оставьте пустым
7. Install Command: `npm install`

### 3. Добавьте Environment Variables:

В Vercel Dashboard → Settings → Environment Variables добавьте:

```
FIREBASE_SERVICE_ACCOUNT
```

**Значение:** Весь JSON из `serviceAccountKey.json` как строка:

```json
{"type":"service_account","project_id":"akadiledu","private_key_id":"a248c125f24ec72134f9e94a3eab652974044164","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC5j/x9LOhZrxGQ\nfwqxNHuXF3AM1Uj5y3dgReRw3YIOsc5AtZD/BvDVmRaB2y4/sz3SYX0+rAONjIR+\nvJzsLGcbaF8zL8cftpmYmsf49NxwB4PHfSjzkRkGUpmm4ZojQpOmx2hhv5l5Rnae\n/SE6x6FdP8ytt4t+cK2et2hBc6LG8ZfCiT+raNtKWArDlJTbSU5UaYhEYC5YTiB8\nFrBZR1hwG6bmgd1IilNaHRPsA3ecStMexbPcPskUkNpsrUiDWpmxgyxPp7DMr+gv\nEPYLIk2IFp9OWSS3pXcC+oGoK1fjgcNpHCu0on8gls5MkV3I8MvFaK1ZZUesnFIZ\nl2xuSZUhAgMBAAECggEASfx9hSFrMRsLC0yEJFyTLI6VSCCgXKzCF7o2V8QSD67Y\nWFesjOqlCt1jqnoMSiy66Q+i4uKt9fnBeFDW1pnrsHNgheW2ZNAnFMAeHIbw/6AX\nbGpcciT3z9wOVIoeLZHlkjluxo6g8EhmkoTGA4xGLAp8nwUQUuU1bJOfN32WOPC6\nBG160us4kxwK8j1x1BoeVgI0drwBy+a7FtfN9beTTTpqlYkSQe8pproTmSDFCES4\n7dbCaQeqWv6aE3xiidNV6s0G+b4P2hDcP9OVxA5xFPrOKPtfL0CFeNKLUf6xEH5U\nphJ8znKUzPEfT+NR5C8jYqAGZ0zZl529D/onGxiDMwKBgQD/KFDk8IpGQGUR3Mm1\ngd69pj0d7qZZePu2nhIQsan7whAmi2lnJSd7jm9EH/8TUcapR01AXYfcqih2VPlB\nMDvnTcZ0W3W7q7B7ULPnEIa4kiHDBhNqYZfCAE6INTD0B0KS4F40J8dHV7XB5iw9\nyp6P+9CrO6ia6ld0S8tRgQY+8wKBgQC6LNd+fWwfxotzsbGjwPiLKdXiQWH8khPO\nWCh2gxnbYtnY5EG0MngmijkcnjKuURKmF16Vrb/Fc5VD7uJuiKggYkSnY7L5Ga6m\npjz8uItvYp2rvslALmh1jpKPROIXzfgA2msL6fQGvaNH6CAWewRTyFh1uiXxx2d/\nO0WDcYaomwKBgAx1a33CQP4tJsI4haDXNokMFO/hNz4nKiNAlKE8C5C/aQp4xCzF\nI6hkzAoHhezrkUeys5Lw/jFIHbGpdII6WLJymb4UuSrwty1OQ3qE1A8vE3byVQBc\nw4w1d6Au+LTxpc6GJhNl3dUd80IEeySJQDTHlujFgPYPezWyfbr9EdEBAoGAUvhf\nBVEyGasrROFBMKB0Y9i+KDpJR/119DTXu5FLubkBKyb2nS8M2ugo8bcTERqye/DY\nR06Ks52CPSc+JFKk0uHYhNzqyxcF/eECNwKrqXVCnWLGX+MOzK1AZbcmJ8O0LfUp\nVcLq7QIgvZAWlM44LHqR6c2O0YSzfEFXBnBWudcCgYAMva5jJ1TIYRdwVMnbztOG\nQ7pGDIPRoii3iyoGnIeuzJIPZVfAoS+WsyHBnE+B4QA2artrXtvsFwTvHb8vEiKv\nXiX+tNfnRQe/KKNwg7HTegbVPirsKkGAjCHQjyyRofgLAVNCRW+VTXl5cFozjTT9\n2UGT7BsqcoWWWvEpPHP2zQ==\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@akadiledu.iam.gserviceaccount.com","client_id":"104038152065741110064","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40akadiledu.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

**ВАЖНО:** Вставьте как **одну строку** без переносов!

### 4. Deploy:

Vercel автоматически задеплоит после push на GitHub.

Или вручную:
```bash
cd backend
vercel --prod
```

### 5. Обновите URL в AdminDashboard:

После деплоя Vercel даст URL типа:
```
https://akadiledu-backend.vercel.app
```

Замените в `src/pages/admin/AdminDashboard.jsx`:
```javascript
const response = await fetch('https://akadiledu-backend.vercel.app/api/send-push-to-all', {
  // вместо localhost:3001
```

## Локальный запуск:

```bash
npm install
npm start
```

Работает на http://localhost:3001

## API Endpoint:

```
POST /api/send-push-to-all
```

Body:
```json
{
  "title": "Заголовок",
  "message": "Сообщение",
  "adminUid": "admin-user-id"
}
```
