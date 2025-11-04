# 🔒 Автоматическое Выкидывание Сессий

## 🎯 Концепция: "Только Один Может Смотреть"

Когда кто-то входит в аккаунт с нового устройства, **все предыдущие сессии автоматически завершаются**. Это решает проблему шаринга аккаунтов.

---

## 🚀 Как Это Работает

### Сценарий:

1. **Друг 1** входит с Device A → Сессия A активна
2. **Друг 2** входит с Device B → **Сессия A выкинута!** → Сессия B активна
3. **Друг 3** входит с Device C → **Сессия B выкинута!** → Сессия C активна

### Результат:
- Только **последняя сессия** остаётся активной
- Все остальные получают **SessionRevokedModal**

---

## 📱 UX Flow

### User A (на старом устройстве):

```
[Смотрит курс]
              ↓
[Новый вход обнаружен]
              ↓
[Modal появляется]
╔═══════════════════════════════════════╗
║   ⚠️  Сессия Завершена                ║
║                                       ║
║  Обнаружен вход с другого устройства  ║
║                                       ║
║  Был выполнен вход в ваш аккаунт с    ║
║  другого устройства. В целях           ║
║  безопасности предыдущая сессия была  ║
║  автоматически завершена.              ║
║  Только один может смотреть            ║
║  одновременно.                         ║
║                                       ║
║  [Понятно, войти снова]               ║
║                                       ║
║  Если это были не вы, немедленно      ║
║  смените пароль                        ║
╚═══════════════════════════════════════╝
              ↓
[Перенаправление на login]
```

### User B (на новом устройстве):

```
[Вводит email/password]
              ↓
[Login успешен]
              ↓
[Старые сессии revoked]
              ↓
[Полный доступ к контенту]
```

---

## 💻 Техническая Реализация

### 1. Session Manager

**Файл:** `src/firebase/sessionManager.js`

```javascript
export async function revokeOtherSessions(uid, currentSessionId) {
  // Получить все сессии пользователя
  const sessions = await getUserSessions(uid);
  
  // Revoke все кроме текущей
  for (const sessionId in sessions) {
    if (sessionId !== currentSessionId && sessions[sessionId].active) {
      await update(ref(database, `users/${uid}/sessions/${sessionId}`), {
        active: false,
        revoked: true,
        revokedAt: new Date().toISOString(),
        revokedReason: 'new_session_detected'
      });
    }
  }
}
```

### 2. Интеграция в App.jsx

```javascript
// При каждом входе
const sessionProfile = await createSessionProfile();
await logUserSession(firebaseUser.uid, sessionProfile);

// 🚨 ВЫКИДЫВАЕМ ДРУГИЕ СЕССИИ
const revokeResult = await revokeOtherSessions(
  firebaseUser.uid, 
  sessionProfile.sessionId
);

console.log(`🔒 Revoked ${revokeResult.revoked} other sessions`);
```

### 3. Проверка Revoked Status

**TODO:** Добавить периодическую проверку в App.jsx:

```javascript
useEffect(() => {
  // Проверять каждые 30 секунд
  const interval = setInterval(async () => {
    if (currentUser && currentSessionId) {
      const isRevoked = await checkSessionRevoked(
        currentUser.uid, 
        currentSessionId
      );
      
      if (isRevoked) {
        setShowRevokedModal(true);
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 5000);
      }
    }
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, [currentUser, currentSessionId]);
```

---

## 🌐 i18n Переводы

### Казахский (kk):
```json
{
  "security.sessionRevoked.title": "Сессия аяқталды",
  "security.sessionRevoked.message": "Басқа құрылғыдан кіру анықталды",
  "security.sessionRevoked.explanation": "Сіздің аккаунтқа басқа құрылғыдан кіру болды. Қауіпсіздік себептері бойынша алдыңғы сессия автоматты түрде аяқталды. Тек бір құрылғыдан қарауға болады.",
  "security.sessionRevoked.button": "Түсінікті, қайта кіру"
}
```

### Русский (ru):
```json
{
  "security.sessionRevoked.title": "Сессия завершена",
  "security.sessionRevoked.message": "Обнаружен вход с другого устройства",
  "security.sessionRevoked.explanation": "Был выполнен вход в ваш аккаунт с другого устройства. В целях безопасности предыдущая сессия была автоматически завершена. Только один может смотреть одновременно.",
  "security.sessionRevoked.button": "Понятно, войти снова"
}
```

### English (en):
```json
{
  "security.sessionRevoked.title": "Session Ended",
  "security.sessionRevoked.message": "Login from another device detected",
  "security.sessionRevoked.explanation": "Someone logged into your account from another device. For security reasons, the previous session was automatically ended. Only one can watch at a time.",
  "security.sessionRevoked.button": "Got it, sign in again"
}
```

---

## 👤 Admin Panel Improvements

### Было:
```
Пользователь: 0qIO3Cpv0AaaZK8aXLO2Muutefg2
```

### Стало:
```
Пользователь: Нурбол Алибаев
Email: nur.alibaeva@gmail.com
```

---

## 📊 Database Structure

### Session после Revoke:

```json
{
  "users": {
    "zcroawDcNJXTNe7lsmFfX8AU4LL2": {
      "sessions": {
        "1730745600000-abc123": {
          "sessionId": "1730745600000-abc123",
          "deviceId": "550e8400-e29b-41d4-a716-446655440000",
          "ip": "5.34.1.199",
          "active": false,              // ← Выключена
          "revoked": true,               // ← Revoked флаг
          "revokedAt": "2025-11-04T19:00:00.000Z",
          "revokedReason": "new_session_detected"
        },
        "1730749200000-def456": {
          "sessionId": "1730749200000-def456",
          "deviceId": "660f9511-f3ac-52e5-b827-557766551111",
          "ip": "212.96.87.86",
          "active": true,                // ← Активна
          "revoked": false
        }
      }
    }
  }
}
```

---

## 🎭 Почему Это Их Выбесит

### До (без защиты):
```
👥 5 друзей → 1 аккаунт → ВСЕ смотрят
💰 Потеря денег
```

### После (с revoke):
```
👤 Друг 1: смотрит
👤 Друг 2: заходит → Друг 1 выкинут
👤 Друг 1: опять заходит → Друг 2 выкинут
👤 Друг 2: снова заходит → Друг 1 выкинут

🔄 ВОЙНА НАЧАЛАСЬ! 😡
💥 Через 10 минут они ругаются кто виноват
✅ Покупают каждому свой аккаунт
```

---

## 🔧 API Functions

### `revokeOtherSessions(uid, currentSessionId)`
Выкидывает все сессии кроме текущей.

**Параметры:**
- `uid` - ID пользователя
- `currentSessionId` - ID текущей сессии (не трогать)

**Возвращает:**
```javascript
{
  revoked: 3,  // Количество выкинутых сессий
  message: "3 sessions revoked"
}
```

---

### `checkSessionRevoked(uid, sessionId)`
Проверяет был ли пользователь выкинут.

**Параметры:**
- `uid` - ID пользователя
- `sessionId` - ID сессии для проверки

**Возвращает:**
```javascript
true   // Сессия revoked - показать modal
false  // Всё ОК
```

---

### `revokeAllSessions(uid)`
Выкидывает ВСЕ сессии (для "Выйти везде").

**Параметры:**
- `uid` - ID пользователя

**Возвращает:**
```javascript
{
  revoked: 5  // Все 5 сессий выкинуты
}
```

---

### `revokeSession(uid, sessionId, reason)`
Выкинуть конкретную сессию.

**Параметры:**
- `uid` - ID пользователя
- `sessionId` - ID сессии
- `reason` - Причина ('manual', 'admin_action', etc.)

**Возвращает:**
```javascript
true   // Success
false  // Error
```

---

## 🚀 Следующие Шаги (TODO)

### 1. ✅ DONE: Auto-revoke on login
### 2. ✅ DONE: SessionRevokedModal
### 3. ✅ DONE: i18n translations
### 4. ⏳ TODO: Periodic session check
```javascript
// В App.jsx добавить:
setInterval(() => checkIfRevoked(), 30000);
```

### 5. ⏳ TODO: Device Management Page
```
/profile/devices - список всех устройств
[Выйти с этого] [Выйти со всех]
```

### 6. ⏳ TODO: Admin Actions
```
Admin Panel → Force Logout User
Admin Panel → Revoke Specific Device
```

---

## 📖 Использование

### Automatic (Already Implemented):
```javascript
// Происходит автоматически при каждом входе
await revokeOtherSessions(uid, currentSessionId);
```

### Manual (User Action):
```javascript
// Кнопка "Выйти со всех устройств"
const handleLogoutEverywhere = async () => {
  await revokeAllSessions(currentUser.uid);
  logout();
};
```

### Admin Action:
```javascript
// Админ выкидывает конкретного пользователя
const handleForceLogout = async (userId) => {
  await revokeAllSessions(userId);
  alert('User kicked out from all devices');
};
```

---

## 🎯 Результат

### Для Честных Пользователей:
- ✅ Могут входить с любого устройства
- ✅ Понятное сообщение если выкинут
- ✅ Просто заходят снова

### Для Шарящих Аккаунт:
- ❌ Постоянно выкидывает друг друга
- ❌ Невозможно смотреть одновременно
- 💥 Ругаются между собой
- ✅ Вынуждены купить свои аккаунты

---

**СИСТЕМА РАБОТАЕТ! ТОЛЬКО ОДИН МОЖЕТ СМОТРЕТЬ!** 🔒
