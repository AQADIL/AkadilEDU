# 🔒 Умная Система Безопасности с Risk Scoring

## 📋 Обзор

Вместо жёсткого автоматического блокирования по IP, система использует **device binding + risk scoring + мягкие меры**.

---

## 🎯 Ключевые Принципы

### ✅ НЕ блокируем автоматически
- Сначала просим подтверждение через email
- Ограничиваем доступ к контенту (не блокируем аккаунт)
- Даём возможность пользователю подтвердить устройство
- Админ принимает финальное решение

### ✅ Device Binding
- Постоянный `deviceId` хранится в `localStorage`
- Генерируется один раз и не меняется
- Используется для идентификации устройства

### ✅ Risk Scoring
- Каждое действие даёт баллы риска
- Пороги: <6 OK, 6-11 soft, 12+ strong
- Действия зависят от score, не от одного флага

---

## 🔧 Техническая Реализация

### 1. Device ID Generation

**Файл:** `src/utils/deviceInfo.js`

```javascript
function getOrCreateDeviceId() {
  const STORAGE_KEY = 'akadil_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  
  return deviceId;
}
```

**Что хранится:**
- `localStorage['akadil_device_id']` = уникальный UUID
- Сохраняется навсегда (пока пользователь не очистит localStorage)

---

### 2. Session Structure

**Realtime Database:** `users/{uid}/sessions/{sessionId}`

```json
{
  "sessionId": "1730745600000-abc123",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "device": {
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "browser": "Chrome",
    "os": "Windows",
    "platform": "Win32",
    "deviceType": "Desktop",
    "fingerprint": "a1b2c3d4",
    "timezone": "Asia/Almaty",
    "language": "ru-RU"
  },
  "ip": "5.34.1.199",
  "ipHash": "e3b0c44298fc1c14...SHA256",
  "timestamp": "2025-11-04T18:00:00.000Z",
  "firstSeen": "2025-11-04T18:00:00.000Z",
  "lastSeen": "2025-11-04T18:00:00.000Z",
  "active": true,
  "revoked": false,
  "limited": false,
  "riskScore": 0
}
```

---

### 3. Risk Scoring Algorithm

**Файл:** `src/utils/riskScoring.js`

#### Баллы за Действия:

| Действие | Баллы | Порог |
|----------|-------|-------|
| Новое устройство | +2 | - |
| Новый IP | +1 | - |
| >5 устройств за 24ч | +6 | 5 devices |
| >5 IP за 24ч | +4 | 5 IPs |
| Гео-прыжок (<1ч) | +5 | - |
| >2 одновременных сессий | +8 | 2 sessions |

#### Пороги Действий:

```javascript
score < 6   → allow          // Нормальный вход
score 6-11  → soft_verify    // Email + ограничение контента
score >= 12 → strong_verify  // 2FA + блокировка контента
```

---

### 4. Действия по Уровням Риска

#### 🟢 Low Risk (score < 6)

```javascript
action: 'allow'
```

**Что происходит:**
- ✅ Вход разрешён
- ✅ Полный доступ к контенту
- ✅ Сессия залогирована

---

#### 🟡 Medium Risk (score 6-11)

```javascript
action: 'soft_verify'
```

**Что происходит:**
- ✅ Вход разрешён, но с ограничениями
- ⚠️ Контент доступен в ограниченном режиме
- 📧 Email уведомление: "Подтвердите вход"
- 🔔 In-app уведомление
- 🚨 Alert создаётся для админа
- 🔒 `session.limited = true`

**Пользователь видит:**
```
⚠️ Обнаружена нестандартная активность
Мы заметили вход с нового устройства или IP.
Если это вы — подтвердите по ссылке в email.
```

**Админ видит:**
```
Medium Risk Alert
User: user@example.com
Score: 8
Flags: new_device, new_ip
Action: Email sent, content limited
```

---

#### 🔴 High Risk (score >= 12)

```javascript
action: 'strong_verify'
```

**Что происходит:**
- ⚠️ Вход разрешён, но контент заблокирован
- 🔒 Требуется 2FA или email верификация
- 🚫 Видео/курсы недоступны до подтверждения
- 📧 Email с кодом верификации
- 🚨 Critical alert для админа
- 🔒 `status: locked_for_review`

**Пользователь видит:**
```
🚨 Требуется подтверждение аккаунта
Обнаружена подозрительная активность.
Введите код из email для доступа к контенту.
```

**Админ видит:**
```
High Risk Alert - Requires Review
User: user@example.com
Score: 14
Flags: multiple_devices, multiple_ips, concurrent_sessions
Action: Content locked, 2FA required
[Разблокировать] [Заблокировать] [Whitelist Device]
```

---

#### ⚠️ Session Limit

```javascript
action: 'limit_sessions'
```

**Что происходит:**
- 🛑 Достигнут лимит одновременных сессий (3)
- 🔄 Требуется выйти со старого устройства
- 📱 Показывается модалка "Управление сессиями"

**Пользователь видит:**
```
⚠️ Достигнут лимит устройств
У вас уже 3 активных сессии.
Выберите устройство для выхода:
[ ] Chrome на Windows (5 мин назад)
[ ] Safari на macOS (2 часа назад)
[ ] Firefox на Linux (1 день назад)
[Выйти с выбранного] [Выйти со всех]
```

---

## 📊 База Данных

### Структура Realtime Database:

```
/users/{uid}/
  ├── sessions/              # Все сессии пользователя
  │   ├── {sessionId}/
  │   │   ├── deviceId
  │   │   ├── device {...}
  │   │   ├── ip
  │   │   ├── ipHash
  │   │   ├── active
  │   │   ├── revoked
  │   │   └── limited
  │   └── ...
  ├── ipHistory/             # История IP
  │   └── {ipKey}/
  │       ├── ip
  │       ├── lastSeen
  │       └── device {...}
  ├── trustedDevices/        # Доверенные устройства
  │   └── {deviceId}: true
  ├── securityAlerts/        # Алерты пользователя
  │   └── {alertId}/
  │       ├── type
  │       ├── riskScore
  │       ├── action
  │       └── timestamp
  └── securityStatus
      ├── riskLevel: "high"
      ├── lastAlert
      └── requiresReview: true

/adminSecurityAlerts/{alertId}/
  ├── uid
  ├── type
  ├── riskScore
  ├── riskLevel
  ├── action
  ├── flags [...]
  ├── session {...}
  ├── resolved: false
  └── timestamp
```

---

## 🎨 UI Компоненты

### 1. Device Management (Пользователь)

**Страница:** `/profile/devices`

```
Мои Устройства

✅ Это устройство (текущее)
   Chrome на Windows
   Последний вход: Сейчас
   [Выйти]

📱 Safari на macOS
   Последний вход: 2 часа назад
   IP: 57.129.19.171
   [Выйти с этого устройства]

🖥️ Firefox на Linux
   Последний вход: 1 день назад
   IP: 212.96.87.86
   [Выйти с этого устройства]

[Выйти со всех устройств]
```

---

### 2. Security Alerts (Админ)

**Страница:** `/admin/security`

```
Security Alerts

Фильтры: [Все] [High] [Medium] [Unresolved]

🔴 HIGH RISK - Требует проверки
User: user@example.com
Score: 14 | Time: 10 мин назад
Flags:
  • Multiple devices (6 за 24ч)
  • Multiple IPs (4 за 24ч)
  • Concurrent sessions (3)

Session Details:
  Device: Chrome на Windows
  IP: 5.34.1.199
  Location: Kazakhstan, Almaty

[Mark Resolved] [Lock Account] [Whitelist Device] [Contact User]

---

🟡 MEDIUM RISK
User: another@example.com
Score: 8 | Time: 1 час назад
Flags:
  • New device
  • Rapid IP change

[Mark Resolved] [Send Email]
```

---

### 3. Verification Modal

**Показывается при strong_verify:**

```
🔒 Подтверждение Входа

Мы обнаружили вход с нового устройства.
Для вашей безопасности требуется подтверждение.

Введите код из email:
[____] [____] [____] [____]

Не получили код? [Отправить повторно]

[Подтвердить]
```

---

## 🚀 Следующие Шаги (TODO)

### Frontend:
- [ ] Device Management UI (`/profile/devices`)
- [ ] Verification Modal (2FA/Email)
- [ ] In-app notifications for security alerts
- [ ] Session limit modal

### Backend:
- [ ] Email notification service
- [ ] 2FA system
- [ ] Cloud Function для риск-анализа
- [ ] Whitelist management

### Admin:
- [ ] Enhanced security panel with actions
- [ ] Device whitelist management
- [ ] Bulk actions (resolve all, lock multiple)
- [ ] Analytics dashboard

---

## 💡 Преимущества Над Простым IP-Блокингом

| Старый Подход | Новый Подход |
|--------------|--------------|
| ❌ Автоблокировка по IP | ✅ Мягкие меры сначала |
| ❌ Ложные позитивы (VPN, мобильный интернет) | ✅ Device binding + score |
| ❌ Нет восстановления | ✅ Email подтверждение |
| ❌ Админ видит только факт | ✅ Админ видит context + может действовать |
| ❌ Пользователь не знает почему | ✅ Пользователь получает уведомления |

---

## 📈 Тестирование

### Симуляция High Risk:

1. Открой сайт в разных браузерах
2. Используй VPN для смены IP
3. Логинься с 4+ IP за короткое время
4. Открой 3+ вкладки одновременно

**Ожидается:**
- Risk score > 12
- Alert в `/admin/security`
- Email уведомление
- Content locked

---

## 🔐 Security & Privacy

### IP Hashing:
- Plain IP хранится только для админа
- `ipHash` (SHA-256) используется для анализа
- TTL 90 дней для старых сессий

### Device ID:
- Хранится в `localStorage`
- Можно очистить (выход со всех устройств)
- Не передаётся третьим лицам

---

## 📚 Документация API

### `calculateRiskScore(sessions, currentSession, trustedDevices)`

**Параметры:**
- `sessions` - Object: все сессии пользователя
- `currentSession` - Object: текущая сессия
- `trustedDevices` - Array: список доверенных deviceId

**Возвращает:**
```javascript
{
  score: 14,
  level: 'high',
  flags: [...],
  details: {
    uniqueDevices24h: 6,
    uniqueIPs24h: 4,
    concurrentSessions: 3
  },
  action: 'strong_verify',
  requiresReview: true
}
```

---

**СИСТЕМА ГОТОВА К ТЕСТИРОВАНИЮ!** 🚀
