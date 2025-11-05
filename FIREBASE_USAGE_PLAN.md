# 💰 Firebase Usage Plan - $300 за 3 месяца

## 💵 Бюджет: $100/месяц

---

## 📊 Текущее Использование:

### ✅ **Authentication** (Free)
- Email/Password login
- Google OAuth
- Email verification
- Password reset

### ✅ **Realtime Database** (~$10/месяц)
```
Используется для:
- User sessions (активные сессии)
- Security alerts (подозрительная активность)
- User profiles (базовые данные)
- Device tracking (устройства пользователей)

Стоимость:
- $5/GB stored (~1GB = $5)
- $1/GB downloaded (~20GB = $20)
Итого: ~$10/месяц при 1000 активных пользователей
```

### ✅ **Firestore** (~$5/месяц)
```
Используется для:
- User profiles (подробные данные)
- Course data (информация о курсах)

Стоимость:
- $0.18 за GB storage (~5GB = $0.90)
- $0.06 за 100K reads (~500K reads = $3)
- $0.18 за 100K writes (~100K writes = $1.80)
Итого: ~$5/месяц
```

### ✅ **Hosting** (~$5/месяц)
```
Используется для:
- Static site hosting (HTML/CSS/JS)
- PWA manifest и service worker

Стоимость:
- $0.15 за GB transferred (~30GB = $4.50)
Итого: ~$5/месяц при средней посещаемости
```

### ✅ **Cloud Functions** (~$2/месяц)
```
Используется для:
- Scheduled cleanups (удаление старых сессий)
- Background tasks

Стоимость:
- $0.40 за 1M invocations (~5K вызовов = $0.002)
- $0.0000025 за GB-second compute (~1000GB-s = $2.50)
Итого: ~$2/месяц
```

**ИТОГО СЕЙЧАС: ~$22/месяц**

---

## 🚀 Что Можно Добавить с $300:

### 1. 🎥 **Firebase Storage - ВИДЕО КУРСОВ** ($40-50/месяц)

**Зачем:**
- Хостить видео курсов БЕЗ YouTube
- Контроль доступа (только купившие смотрят)
- Без рекламы YouTube
- Защита от пиратства

**Стоимость:**
```javascript
// Хранение
10GB видео × $0.026/GB = $0.26/месяц

// Трафик (главное!)
100GB скачиваний × $0.12/GB = $12/месяц

// HLS Streaming (адаптивное качество)
1000 часов просмотра × $0.05 = $50/месяц

Итого: ~$50/месяц для небольшой аудитории
```

**Пример использования:**
```javascript
// Upload video
const storage = getStorage();
const videoRef = ref(storage, `courses/math-101/lesson-1.mp4`);
await uploadBytes(videoRef, videoFile);

// Get secure URL (только для авторизованных)
const url = await getDownloadURL(videoRef);

// Access control через Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /courses/{courseId}/{video} {
      allow read: if request.auth != null && 
                     firestore.get(/databases/(default)/documents/users/$(request.auth.uid))
                     .data.purchasedCourses[courseId] == true;
    }
  }
}
```

---

### 2. 📄 **Storage - ДОКУМЕНТЫ И ФАЙЛЫ** ($5-10/месяц)

**Зачем:**
- PDF сертификаты после курса
- Учебные материалы (конспекты, задания)
- Аватары пользователей (высокое качество)
- Превью курсов (изображения)

**Стоимость:**
```javascript
// Хранение
5GB файлов × $0.026/GB = $0.13/месяц

// Трафик
50GB скачиваний × $0.12/GB = $6/месяц

Итого: ~$6/месяц
```

**Пример:**
```javascript
// Upload avatar
const avatarRef = ref(storage, `avatars/${userId}.jpg`);
await uploadBytes(avatarRef, avatarFile);

// Upload certificate
const certRef = ref(storage, `certificates/${userId}/${courseId}.pdf`);
await uploadBytes(certRef, certificatePDF);
```

---

### 3. 📧 **Cloud Functions - EMAIL NOTIFICATIONS** ($10-15/месяц)

**Зачем:**
- Welcome email после регистрации
- Course purchase confirmation
- Certificate ready notification
- Password reset emails (кастомные)
- Weekly digest (что нового на платформе)

**Стоимость:**
```javascript
// Functions compute
10K emails/месяц × 5 секунд × $0.0000025 = $0.125

// SendGrid / Mailgun API
10K emails × $0.001 = $10

Итого: ~$10/месяц
```

**Пример:**
```javascript
// functions/src/index.js
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const mailOptions = {
    from: 'AkadilEDU <noreply@akadiledu.com>',
    to: user.email,
    subject: 'Қош келдіңіз! / Welcome to AkadilEDU',
    html: `
      <h1>Қош келдіңіз, ${user.displayName}!</h1>
      <p>Сіздің аккаунтыңыз сәтті жасалды.</p>
      <a href="https://akadiledu.com/courses">Курстарды көру</a>
    `
  };
  
  await transporter.sendMail(mailOptions);
});
```

---

### 4. 🤖 **Cloud Functions - АВТОМАТИЗАЦИЯ** ($5-10/месяц)

**Зачем:**
- Генерация PDF сертификатов
- Обработка изображений (resize avatars)
- Scheduled cleanup (старые сессии)
- Analytics aggregation
- Backup данных

**Стоимость:**
```javascript
// Scheduled functions (cron jobs)
Daily cleanup × 30 дней × 2 секунды = 60 секунд compute
60 × $0.0000025 = $0.00015

// Image processing
100 avatars/месяц × 5 секунд × $0.0000025 = $0.00125

Итого: ~$5/месяц (с запасом)
```

**Примеры:**
```javascript
// Auto cleanup старых сессий (каждый день в 3:00)
exports.cleanupOldSessions = functions.pubsub
  .schedule('0 3 * * *')
  .timeZone('Asia/Almaty')
  .onRun(async (context) => {
    const db = admin.database();
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const sessionsRef = db.ref('sessions');
    const oldSessions = await sessionsRef
      .orderByChild('timestamp')
      .endAt(oneWeekAgo)
      .once('value');
    
    const updates = {};
    oldSessions.forEach(session => {
      updates[session.key] = null; // Delete
    });
    
    await sessionsRef.update(updates);
    console.log(`Deleted ${Object.keys(updates).length} old sessions`);
  });

// Resize avatar при загрузке
exports.processAvatar = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.name.startsWith('avatars/')) return;
    
    const bucket = admin.storage().bucket();
    const filePath = object.name;
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    
    await bucket.file(filePath).download({ destination: tempFilePath });
    
    // Resize to 200x200
    await sharp(tempFilePath)
      .resize(200, 200)
      .toFile(tempFilePath + '_thumb');
    
    await bucket.upload(tempFilePath + '_thumb', {
      destination: filePath.replace('avatars/', 'avatars/thumb_')
    });
  });
```

---

### 5. 💬 **Realtime Database - CHAT** ($5-10/месяц)

**Зачем:**
- Чат между студентами в курсе
- Q&A с преподавателем
- Комментарии к урокам
- Real-time notifications

**Стоимость:**
```javascript
// Storage
Chat messages × 1KB × 10K сообщений = 10MB = $0.05

// Bandwidth (главное!)
10K сообщений × 100 reads каждое = 1M reads × 1KB = 1GB = $1

Итого: ~$5-10/месяц
```

**Пример структуры:**
```javascript
{
  "chats": {
    "course-math-101": {
      "messages": {
        "msg1": {
          "userId": "USER_UID",
          "userName": "Нурбол Алибаев",
          "text": "Как решить задачу 5?",
          "timestamp": 1699123456789
        }
      }
    }
  }
}

// React component
const messagesRef = ref(database, `chats/${courseId}/messages`);
onValue(messagesRef, (snapshot) => {
  setMessages(snapshot.val());
});
```

---

### 6. 📊 **Firebase Analytics + Crashlytics** (БЕСПЛАТНО!)

**Зачем:**
- Отслеживать популярные курсы
- Conversion funnel (регистрация → покупка)
- User retention (возвращаемость)
- Crash reports (баги в приложении)

**Пример:**
```javascript
import { logEvent } from 'firebase/analytics';

// Track course view
logEvent(analytics, 'course_view', {
  course_id: 'math-101',
  course_name: 'Математика 101'
});

// Track purchase
logEvent(analytics, 'purchase', {
  value: 5000,
  currency: 'KZT',
  course_id: 'math-101'
});
```

---

### 7. 🔔 **Cloud Messaging (FCM)** (БЕСПЛАТНО!)

**Зачем:**
- Push notifications на телефон
- "Новый урок доступен!"
- "Твой курс истекает через 3 дня"
- "Сертификат готов"

**Пример:**
```javascript
// functions/src/index.js
exports.sendNewCourseNotification = functions.firestore
  .document('courses/{courseId}')
  .onCreate(async (snap, context) => {
    const course = snap.data();
    
    const message = {
      notification: {
        title: 'Новый курс!',
        body: `${course.title} теперь доступен`,
      },
      topic: 'all_users'
    };
    
    await admin.messaging().send(message);
  });
```

---

## 📈 Рекомендуемый План Расходов:

### **Месяц 1: Базовая Инфраструктура** ($50)
- ✅ Realtime DB + Firestore: $15
- ✅ Hosting: $5
- ✅ Cloud Functions (cleanup): $5
- 📧 Email notifications: $10
- 🎥 Storage (документы): $10
- 🤖 Functions (automation): $5

**Итого: ~$50/месяц**

### **Месяц 2-3: Масштабирование** ($80-100)
Когда пользователей больше:
- 🎥 Video hosting: +$30-40
- 💬 Chat система: +$10
- 📊 Advanced analytics: +$10
- 🔧 More cloud functions: +$10

**Итого: ~$90-100/месяц**

---

## 💡 Что Делать Прямо Сейчас:

### 1. **Включить Storage** (БЕСПЛАТНО начать)
```bash
firebase init storage
```

### 2. **Email Notifications**
```bash
npm install nodemailer
# Setup SendGrid / Mailgun
```

### 3. **Analytics** (УЖЕ ЕСТЬ!)
Просто начни логировать события в коде.

### 4. **Scheduled Functions**
```bash
# В functions/package.json
"firebase-functions": "^4.0.0"
```

---

## 🎯 Приоритеты:

### **HIGH PRIORITY** (делай первым):
1. ✅ **Analytics** - узнать какие курсы популярные
2. 📧 **Email notifications** - улучшить UX
3. 📄 **Storage для документов** - сертификаты, PDF

### **MEDIUM PRIORITY** (потом):
4. 🎥 **Video hosting** - когда будет много курсов
5. 💬 **Chat** - когда будет community
6. 🤖 **Advanced automation** - масштабирование

### **LOW PRIORITY** (если останется бюджет):
7. 🔍 **Search index** (Algolia)
8. 📊 **Advanced analytics** (Mixpanel)
9. 💳 **Payment processing** (Stripe Cloud Functions)

---

## ⚠️ ВАЖНО:

### Мониторинг Расходов:
```javascript
// Firebase Console → Usage and Billing
// Настрой alerts:
- Email alert at $50
- Email alert at $80
- Hard limit at $100
```

### Оптимизация:
1. **Кешируй данные** где можно
2. **Batch operations** вместо множественных reads
3. **Pagination** для больших списков
4. **Compress images** перед загрузкой
5. **Lazy load** видео и файлы

---

**С $300 на 3 месяца ты можешь сделать ОЧЕНЬ мощную платформу!** 🚀
