# 🔐 Firebase Password Reset System

Полная интеграция системы сброса пароля с Firebase Authentication.

---

## 📋 Как Это Работает

### 1. Firebase Action URL

Firebase использует **один URL для всех email действий**:
```
https://akadiledu-v2-3.vercel.app/__/auth/action
```

Когда пользователь кликает на ссылку в письме, Firebase добавляет параметры:
```
?mode=resetPassword&oobCode=xyz123&apiKey=abc456
```

---

## 🎯 Процесс Сброса Пароля

### Шаг 1: Пользователь Забыл Пароль

На странице `/login` пользователь кликает **"Парольді ұмыттыңыз ба?"**

```javascript
// ForgotPassword.jsx
import { sendPasswordResetEmail } from 'firebase/auth';

sendPasswordResetEmail(auth, email)
  .then(() => alert("Email отправлен!"))
  .catch(console.error);
```

### Шаг 2: Firebase Отправляет Email

Firebase автоматически отправляет письмо с ссылкой:
```
https://your-domain.com/__/auth/action?mode=resetPassword&oobCode=XXXX
```

### Шаг 3: Auth Action Router

`AuthAction.jsx` обрабатывает все типы action ссылок:

```javascript
// AuthAction.jsx
const mode = searchParams.get('mode');

switch (mode) {
  case 'verifyEmail':
    navigate('/verify-email?...'); // Email verification
    break;
  case 'resetPassword':
    navigate('/reset-password?...'); // Password reset
    break;
  case 'recoverEmail':
    navigate('/recover-email?...'); // Email recovery
    break;
}
```

### Шаг 4: Reset Password Page

`ResetPassword.jsx` выполняет сброс:

```javascript
// 1. Verify the code
const email = await verifyPasswordResetCode(auth, oobCode);

// 2. Show form to enter new password
// User enters new password + confirm

// 3. Confirm password reset
await confirmPasswordReset(auth, oobCode, newPassword);

// 4. Success! Redirect to login
navigate('/login');
```

---

## 📂 Структура Файлов

```
src/
├── pages/
│   ├── ForgotPassword.jsx    ✅ Send reset email
│   ├── AuthAction.jsx         ✅ Route based on mode
│   ├── ResetPassword.jsx      ✅ Reset password form
│   ├── VerifyEmail.jsx        ✅ Email verification
│   └── Login.jsx              ✅ Login page
├── firebase/
│   ├── auth.js                ✅ sendPasswordResetEmail()
│   └── config.js              ✅ Firebase init
└── App.jsx                    ✅ Routes configuration
```

---

## 🔄 Маршруты

### Public Routes (без авторизации):
```javascript
/login                     → Login page
/signup                    → Signup page
/forgot-password           → Send reset email
/verify-email              → Email verification
/reset-password            → Reset password form
/__/auth/action            → Firebase action router
```

### Protected Routes (требуют авторизации):
```javascript
/courses                   → Courses catalog
/my-courses                → User's courses
/test-ubt                  → UBT tests
/shop                      → Shop
```

---

## 🎨 UI/UX Features

### ForgotPassword.jsx
- ✅ Email input field
- ✅ Loading spinner
- ✅ Success message with redirect
- ✅ Error handling
- ✅ Link back to login
- ✅ Same styling as login/signup

### ResetPassword.jsx
- ✅ **Verifying state** - проверяет код
- ✅ **Ready state** - форма для ввода пароля
- ✅ **Success state** - пароль изменен
- ✅ **Error state** - невалидный/expired код
- ✅ New password input (with show/hide)
- ✅ Confirm password input
- ✅ Password validation (min 6 chars)
- ✅ Passwords match validation
- ✅ Shows user email
- ✅ Note: "Егер хатты көрмесең, Спам қалтасын да тексер"

### AuthAction.jsx
- ✅ Loading indicator
- ✅ Auto-redirect based on mode
- ✅ Preserves query parameters

---

## 🔑 Firebase Methods Used

### From `firebase/auth`:

```javascript
// 1. Send reset email
import { sendPasswordResetEmail } from 'firebase/auth';
await sendPasswordResetEmail(auth, email);

// 2. Verify reset code
import { verifyPasswordResetCode } from 'firebase/auth';
const email = await verifyPasswordResetCode(auth, oobCode);

// 3. Confirm new password
import { confirmPasswordReset } from 'firebase/auth';
await confirmPasswordReset(auth, oobCode, newPassword);

// 4. Apply email verification code
import { applyActionCode } from 'firebase/auth';
await applyActionCode(auth, oobCode);
```

---

## ⚠️ Error Handling

### Common Firebase Errors:

```javascript
switch (error.code) {
  case 'auth/expired-action-code':
    // Code expired (usually 24 hours)
    message = 'Сілтеменің мерзімі өткен';
    break;
    
  case 'auth/invalid-action-code':
    // Invalid or already used
    message = 'Сілтеме дұрыс емес';
    break;
    
  case 'auth/user-disabled':
    // Account disabled
    message = 'Аккаунт өшірілген';
    break;
    
  case 'auth/weak-password':
    // Password too weak
    message = 'Пароль тым әлсіз';
    break;
    
  case 'auth/user-not-found':
    // Email doesn't exist
    message = 'Пайдаланушы табылмады';
    break;
}
```

---

## 🔧 Configuration

### vercel.json
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

Это позволяет React Router обрабатывать `/__/auth/action`

### Firebase Console Settings

1. **Authentication → Templates → Password reset**
   - Action URL: `https://your-domain.com/__/auth/action`
   - Customize email template (optional)

2. **Authentication → Settings → Authorized domains**
   - Add: `your-domain.vercel.app`
   - Add: `your-custom-domain.com` (if any)

---

## 🧪 Testing Locally

### 1. Start dev server:
```bash
npm run dev
```

### 2. Test forgot password:
```
1. Go to http://localhost:3005/forgot-password
2. Enter your email
3. Check email inbox
4. Click reset link
5. Should open: http://localhost:3005/__/auth/action?mode=resetPassword&...
6. Auto-redirects to: http://localhost:3005/reset-password?mode=resetPassword&...
7. Enter new password
8. Success! Redirects to login
```

### 3. Test with Firebase Emulator (Optional):
```bash
firebase emulators:start --only auth
```

---

## 🚀 Production Deployment

### After deploying to Vercel:

1. **Get your production URL:**
   ```
   https://akadiledu-v2-3.vercel.app
   ```

2. **Update Firebase Console:**
   ```
   Authentication → Settings → Authorized domains
   → Add: akadiledu-v2-3.vercel.app
   ```

3. **Test in production:**
   ```
   1. Go to /forgot-password
   2. Enter email
   3. Check inbox
   4. Click link → should work!
   ```

---

## 📊 User Flow Diagram

```
[Login Page]
    ↓
[Click "Forgot Password?"]
    ↓
[ForgotPassword Page]
    ↓ (sendPasswordResetEmail)
[Firebase sends email]
    ↓
[User clicks link in email]
    ↓
[/__/auth/action?mode=resetPassword&oobCode=XXX]
    ↓ (AuthAction router)
[/reset-password?mode=resetPassword&oobCode=XXX]
    ↓ (verifyPasswordResetCode)
[Show reset password form]
    ↓ (user enters new password)
[confirmPasswordReset]
    ↓
[Success! Auto-redirect to /login]
    ↓
[User logs in with new password]
```

---

## 🎯 Localization (i18n)

Все тексты на **казахском языке**:

```javascript
// ResetPassword.jsx
"Жаңа пароль орнату"          // Set new password
"Парольді растаңыз"           // Confirm password
"Пароль сәтті жаңартылды!"    // Password reset successfully
"Егер хатты көрмесең..."      // If you don't see email...

// ForgotPassword.jsx
"Парольді қалпына келтіру"    // Reset password
"Хат жіберілді"               // Email sent
"Кіруге оралу"                // Back to login
```

---

## ✅ Checklist

- [x] ForgotPassword page created
- [x] ResetPassword page created
- [x] AuthAction router created
- [x] Routes added to App.jsx
- [x] Firebase methods integrated
- [x] Error handling implemented
- [x] UI/UX polished
- [x] Kazakh localization
- [x] Loading states
- [x] Success states
- [x] Password validation
- [x] Show/hide password toggle
- [x] Responsive design

---

## 🐛 Troubleshooting

### Issue: Link doesn't work
**Solution:** Check Firebase Authorized domains

### Issue: "Invalid action code"
**Solution:** Code might be expired or already used. Request new email.

### Issue: Can't redirect to /__/auth/action
**Solution:** Check vercel.json rewrites configuration

### Issue: Password reset email not arriving
**Solution:** 
1. Check spam folder
2. Check Firebase Console → Authentication → Templates
3. Verify email is correct

---

## 📚 Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email)
- [Vercel Rewrites](https://vercel.com/docs/projects/project-configuration#rewrites)
- [React Router v6](https://reactrouter.com/en/main)

---

## 🎉 Success!

Полная система сброса пароля готова к использованию! 🚀

**Features:**
- ✅ Firebase Integration
- ✅ Email verification
- ✅ Password reset
- ✅ Modern UI/UX
- ✅ Full error handling
- ✅ Kazakh localization
- ✅ Production ready
