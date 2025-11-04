# ☁️ НАСТРОЙКА CLOUD FUNCTIONS

## 🎯 Автоматическое Создание Профилей

После деплоя Cloud Functions, новые пользователи **автоматически** получат профиль в Realtime DB при регистрации!

---

## 📦 Что Уже Готово

✅ `functions/onUserCreate.js` - функция создания профиля
✅ `functions/index.js` - экспорт функций
✅ `functions/package.json` - зависимости

---

## 🚀 ДЕПЛОЙ CLOUD FUNCTIONS

### Шаг 1: Установить Firebase CLI (если ещё нет)

```bash
npm install -g firebase-tools
```

---

### Шаг 2: Логин в Firebase

```bash
firebase login
```

---

### Шаг 3: Инициализировать Functions (если ещё нет)

```bash
firebase init functions
```

Выбери:
- ✅ Use an existing project: `akadiledu`
- ✅ Language: JavaScript
- ✅ ESLint: No (или Yes, если хочешь)
- ✅ Install dependencies: Yes

---

### Шаг 4: Деплой Functions

```bash
firebase deploy --only functions
```

---

## ✅ Что Будет Задеплоено

### 1. `createUserProfileOnSignup` (Триггер)

**Автоматически** срабатывает при регистрации нового пользователя:
- Firebase Auth регистрирует пользователя
- Триггер создаёт профиль в Realtime DB
- Пользователь получает полный профиль

### 2. `onUserCreated` (Вызываемая функция)

Можно вызвать вручную из фронтенда:
```javascript
const createProfile = httpsCallable(functions, 'onUserCreated');
await createProfile({ uid, email, displayName });
```

---

## 🔧 Использование на Фронтенде

### Добавить в `src/firebase/auth.js`:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app);

// После регистрации
export async function createUserProfileInDB(user) {
  try {
    const createProfile = httpsCallable(functions, 'onUserCreated');
    const result = await createProfile({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    console.log('✅ Profile created:', result.data);
  } catch (error) {
    console.error('❌ Failed to create profile:', error);
  }
}
```

---

## 📊 Проверка Деплоя

После деплоя:

```bash
firebase functions:log
```

Или в Firebase Console:
1. Functions → Dashboard
2. Должна быть: `createUserProfileOnSignup`
3. Logs покажут выполнение

---

## 🧪 Тестирование

### Способ 1: Зарегистрировать нового пользователя

1. Открой сайт
2. Зарегистрируй тестового пользователя
3. Проверь Firebase Console → Realtime Database → users
4. Должен появиться новый профиль!

### Способ 2: Вызвать функцию вручную

```javascript
// В консоли браузера (F12)
const functions = firebase.functions();
const create = functions.httpsCallable('onUserCreated');

await create({
  uid: 'test_uid_123',
  email: 'test@example.com',
  displayName: 'Test User'
});
```

---

## 🔄 Для Существующих Пользователей

Cloud Functions **НЕ** создадут профили для старых пользователей!

Для них используй скрипт миграции:
```bash
node scripts/migrateAuthUsers.js
```

---

## 💡 Как Это Работает

```
1. Пользователь регистрируется
   ↓
2. Firebase Authentication создаёт аккаунт
   ↓
3. Триггер createUserProfileOnSignup срабатывает
   ↓
4. Создаётся профиль в Realtime Database
   ↓
5. Готово! Пользователь может войти
```

---

## ⚠️ Важно

1. **Functions работают только после деплоя!**
2. **Локально триггеры НЕ сработают** (только эмулятор)
3. **Бесплатный план** Firebase имеет лимиты
4. **Проверяй логи** если что-то не работает

---

## 🆘 Если Ошибки

### `PERMISSION_DENIED`

**Решение:** Проверь Security Rules в Realtime Database

### `Function not found`

**Решение:** Задеплой снова:
```bash
firebase deploy --only functions
```

### `Module not found`

**Решение:**
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## 📈 Стоимость

Cloud Functions Spark Plan (бесплатный):
- ✅ 2M вызовов/месяц
- ✅ 400,000 GB-секунд
- ✅ 200,000 CPU-секунд

Для образовательного проекта - **более чем достаточно!**

---

## 🎯 Итого

После деплоя:
- ✅ Новые пользователи → автоматически получают профиль
- ✅ Старые пользователи → миграция скриптом
- ✅ Всё работает автоматически!

---

**ГОТОВО!** ☁️🎉
