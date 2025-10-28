# AkadilEDU v2.0 - Educational Platform

Modern, responsive educational platform built with React, Vite, Tailwind CSS, and progressive web app capabilities.

## 🚀 Features (Prompt 1 - Completed)

### ✅ Implemented
- **Modern UI Framework**: React 18 + Vite + Tailwind CSS
- **Responsive Layout**: Mobile-first design with collapsible sidebar
- **Header Component**: Logo, language selector (kk/ru/en), theme toggle (light/dark), profile button
- **Sidebar Navigation**: 
  - Desktop: Icon-only collapsed by default, expands on hover
  - Mobile: Full-screen drawer with hamburger menu
  - Routes: Home, Courses, My Courses, UBT Test, Shop, Admin (hidden by default)
- **Profile Modal**: 
  - Edit profile fields (name, email, phone)
  - Password change placeholders
  - Avatar upload UI with progress indicator
  - Calls placeholder functions ready for Firebase integration
- **Internationalization (i18n)**: 
  - Three languages: Kazakh (kk), Russian (ru), English (en)
  - React-i18next integration
  - Language persists to localStorage
- **Theme System**:
  - Light/Dark mode toggle
  - Smooth transitions
  - Theme persists to localStorage
- **Cookie Consent**:
  - Banner for essential cookies only
  - Settings dialog to manage stored data
  - Clear all data option
- **PWA Support**:
  - Manifest.json configured
  - Service worker for offline caching
  - "Add to Home Screen" ready
- **Routing**: React Router v6 with clean URLs (no .html files)
- **Storage Policy**: localStorage with consent management for theme, language, and profile data

### ✅ Prompt 2 Completed - Firebase Integration
- Firebase Authentication (Email/Password + Google) ✅
- Email verification enforcement ✅
- Firebase Storage for avatar uploads ✅
- Firestore for user profiles and courses ✅
- Login/Signup pages ✅
- Auth state management ✅
- Admin initialization system ✅

### 🔜 Coming in Prompt 3
- Admin panel
- User management
- Course administration
- Login history tracking

## 📁 Project Structure

```
akadiledu-v2/
├── public/
│   ├── icons/               # PWA icons (placeholders - replace with real icons)
│   ├── manifest.json        # PWA manifest
│   └── sw.js               # Service worker
├── src/
│   ├── components/
│   │   ├── Header.jsx       # Top navigation bar
│   │   ├── Sidebar.jsx      # Responsive sidebar menu
│   │   ├── ProfileModal.jsx # User profile editor
│   │   └── CookieConsent.jsx # Cookie consent banner
│   ├── pages/
│   │   ├── Home.jsx         # Landing page
│   │   ├── Courses.jsx      # Course catalog (placeholder)
│   │   ├── MyCourses.jsx    # User's enrolled courses (placeholder)
│   │   ├── TestUBT.jsx      # UBT practice tests (placeholder)
│   │   └── Shop.jsx         # Course shop (placeholder)
│   ├── styles/
│   │   └── index.css        # Tailwind base styles + custom CSS
│   ├── utils/
│   │   ├── storage.js       # localStorage wrapper with consent management
│   │   └── placeholders.js  # Placeholder functions for Firebase (Prompt 2)
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Entry point
│   └── i18n.js              # i18next configuration
├── index.html               # Single HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.cjs      # Tailwind CSS configuration
├── postcss.config.cjs       # PostCSS configuration
├── vercel.json              # Deployment config (SPA fallback)
└── README.md                # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Modern web browser

### Step 1: Install Dependencies

```bash
cd C:\Users\ACER\WebstormProjects\akadiledu-v2
npm install
```

### Step 2: Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Step 3: Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Step 4: Preview Production Build

```bash
npm run preview
```

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.cjs` to customize the primary color palette:

```js
colors: {
  primary: {
    500: '#5b8cc9', // Main brand color (from legacy AkadilEDU)
    // ... other shades
  }
}
```

### Icons
Replace placeholder icons in `public/icons/` with actual PNG files:
- Use https://realfavicongenerator.net/ to generate all sizes
- Or create manually: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### Translations
Add or modify translations in `src/i18n.js`:

```js
const resources = {
  en: { translation: { ... } },
  ru: { translation: { ... } },
  kk: { translation: { ... } }
};
```

## 🔥 Firebase Integration (Completed)

### Firebase Modules Implemented

#### 1. Authentication (`src/firebase/auth.js`)
- **`signupWithEmail(email, password, profileData)`** - Create account with email/password
- **`loginWithEmail(email, password)`** - Sign in with email/password
- **`loginWithGoogle()`** - Sign in with Google popup
- **`logout()`** - Sign out current user
- **`sendVerificationEmail(user)`** - Send email verification
- **`onAuthStateChanged(callback)`** - Listen to auth state

#### 2. Storage (`src/firebase/storage.js`)
- **`uploadUserAvatar(uid, file, onProgress)`** - Upload avatar (max 5MB)
- **`deleteUserAvatar(avatarUrl)`** - Delete avatar from Storage
- **`uploadCourseCover(courseId, file, onProgress)`** - Upload course cover (admin only)

#### 3. Firestore (`src/firebase/firestore.js`)
- **`createOrUpdateUserProfile(uid, profileData)`** - Save user profile
- **`getUserProfile(uid)`** - Get user profile
- **`checkAdminStatus(uid)`** - Check if user is admin
- **`createAdmin(uid, displayName, createdByUid)`** - Create admin
- **`listCourses()`** - Get all courses
- **`getCourse(courseId)`** - Get single course
- **`saveCourse(courseId, data)`** - Create/update course
- **`getAllUsers()`** - Get all users (admin only)
- **`logAuthEvent(uid, ip, ua)`** - Log login events

### Firebase Configuration

The app is configured with your Firebase project:

```javascript
Project ID: akadiledu
Auth Domain: akadiledu.firebaseapp.com
Storage Bucket: akadiledu.firebasestorage.app
```

**Authentication Methods Enabled:**
- ✅ Email/Password
- ✅ Google Sign-In
- ✅ Apple Sign-In

### Admin Account Setup

**Admin Email**: `youtub.maj@gmail.com`  
**Password**: `Admin123@`

⚠️ **IMPORTANT**: After first login, immediately:
1. Change your password via Profile modal
2. Verify the admin document exists in Firestore
3. Test admin panel access (Prompt 3)

### Security Rules Required

**See `FIREBASE_RULES.md` for complete security rules.**

You must apply these rules in Firebase Console:

1. **Firestore Rules**: Database → Rules → Copy from FIREBASE_RULES.md
2. **Storage Rules**: Storage → Rules → Copy from FIREBASE_RULES.md

### Pages Added

- **`/`** - Public home page (accessible without login) 🆕
- **`/login`** - Email/Password + Google + Apple sign-in
- **`/signup`** - Registration with email verification + Google/Apple
- **Email Verification Banner** - Appears when email not verified
- **Sign In Button** - Shows in header when not logged in 🆕
- **Logout Button** - In header dropdown when logged in

### IP Logging

**Visible Console Logging** 🆕
- IP address detection logs appear in browser console
- Format: `🌐 IP Address detected: xxx.xxx.xxx.xxx`
- Login events logged: `📝 Login event logged for user: email@example.com IP: xxx.xxx.xxx.xxx`
- Fallback message if IP unavailable: `⚠️ Could not fetch IP address`
- All login events saved to Firestore `auth_logs` collection

## 📱 PWA Testing

### Test "Add to Home Screen"

1. **Chrome Desktop**: Open DevTools → Application → Manifest → "Update on reload"
2. **Chrome Mobile**: Menu → "Add to Home screen"
3. **iOS Safari**: Share → "Add to Home Screen"

### Service Worker Status
Check in DevTools → Application → Service Workers

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

The `vercel.json` is already configured for SPA routing.

### Other Platforms
Ensure the hosting platform redirects all routes to `/index.html` for client-side routing.

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🔒 Privacy & Data Storage

### Essential Cookies
The app stores only essential data in localStorage:
- `ak_consent` - User consent status
- `ak_theme` - Theme preference (light/dark)
- `ak_lang` - Language preference (kk/ru/en)

### Profile Data (with consent)
- `users.profile` - User profile information (name, email, phone, avatar)

### No Tracking
- No analytics cookies
- No third-party tracking
- No cookies sent to external servers (until Firebase is added in Prompt 2)

## 🧪 Testing Checklist

### Visual Tests
- [ ] Header displays correctly on mobile and desktop
- [ ] Sidebar collapses/expands on desktop hover
- [ ] Sidebar opens as drawer on mobile
- [ ] Theme toggle switches between light/dark
- [ ] Language selector changes UI language
- [ ] Profile modal opens and closes
- [ ] Avatar upload shows progress
- [ ] Cookie consent banner appears on first visit
- [ ] All routes navigate correctly

### Functional Tests
- [ ] Theme preference persists after reload
- [ ] Language preference persists after reload
- [ ] Profile data saves to localStorage (with consent)
- [ ] Avatar upload calls placeholder function
- [ ] Cookie settings dialog allows clearing data
- [ ] Service worker registers successfully
- [ ] App works offline (cached assets)

### Accessibility Tests
- [ ] All interactive elements are keyboard accessible
- [ ] Focus rings visible on tab navigation
- [ ] ARIA labels present on icon buttons
- [ ] Color contrast meets WCAG standards

## 🐛 Known Limitations

1. **Icons**: Placeholder icons need to be replaced with actual PWA icons
2. **Avatar Upload**: Currently uses object URLs (temporary) - will be replaced with Firebase Storage in Prompt 2
3. **Auth**: No authentication yet - coming in Prompt 2
4. **Admin Panel**: Admin route exists but requires Prompt 3 implementation
5. **Courses**: Course data is placeholder - will use Firestore in Prompt 2

## 📚 Tech Stack

- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.3
- **Routing**: React Router 6.20
- **i18n**: react-i18next 13.5
- **UI Components**: Headless UI 1.7
- **Icons**: Lucide React 0.294
- **Language**: JavaScript (ES2020+)

## 🤝 Contributing

This is a private educational platform. Code structure follows:
- Component-based architecture
- Tailwind utility-first styling
- Modular file organization
- Clear separation of concerns

## 📄 License

Private project for AkadilEDU platform.

---

## ✅ Prompt 1 Completion Status

All requirements from Prompt 1 have been implemented:
- ✅ React + Vite project structure
- ✅ Tailwind CSS configuration
- ✅ Header with logo, language, theme, profile
- ✅ Responsive sidebar (desktop hover, mobile drawer)
- ✅ Profile modal with avatar upload UI
- ✅ i18n with kk/ru/en languages
- ✅ Theme toggle (light/dark)
- ✅ Cookie consent banner
- ✅ PWA manifest and service worker
- ✅ Clean routing (no .html files)
- ✅ localStorage with consent management
- ✅ Placeholder functions for Firebase
- ✅ Production-quality code
- ✅ README with setup instructions

**Ready for Prompt 2: Firebase Integration**

**Prompt 2 Complete!** Type `GO next` to proceed with Admin Panel implementation (Prompt 3).
