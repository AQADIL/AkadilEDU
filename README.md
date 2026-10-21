# AkadilEdu v2 - Comprehensive Educational Platform

**Copyright (c) 2026 Akadil Alish. All rights reserved.** This is proprietary software. Using, copying, modifying, redistributing or deploying the project for your own purposes requires prior written permission from Akadil Alish. See [LICENSE](LICENSE) for the full terms and exceptions.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
  - [Frontend Technologies](#frontend-technologies)
  - [Backend Technologies](#backend-technologies)
  - [Development Tools](#development-tools)
  - [Deployment & Hosting](#deployment--hosting)
- [Architecture](#architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
- [Project Structure](#project-structure)
  - [Root Directory Files](#root-directory-files)
  - [Source Directory (`src/`)](#source-directory-src)
  - [Public Directory (`public/`)](#public-directory-public)
  - [Configuration Files](#configuration-files)
- [Key Features](#key-features)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Firebase Configuration](#firebase-configuration)
- [Authentication System](#authentication-system)
- [Role-Based Access Control](#role-based-access-control)
- [Internationalization (i18n)](#internationalization-i18n)
- [PWA Features](#pwa-features)
- [Deployment](#deployment)
- [Admin Account Setup](#admin-account-setup)
- [Security & Privacy](#security--privacy)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Project Overview

AkadilEdu v2 is a modern, comprehensive educational platform built with React and Firebase. It provides a complete learning management system with course management, user authentication, role-based access control, multilingual support, and PWA capabilities. The platform is designed to support both administrators and students with distinct interfaces and functionalities.

---

## Technology Stack

### Frontend Technologies

| Technology | Purpose |
| --- | --- |
| React 18 | Components, hooks and state |
| Vite 7 | Development server and production builds |
| React Router 7 | Application navigation |
| Tailwind CSS 4 | Styling, responsive layouts and brand colors |
| Headless UI | Interface primitives |
| Lucide React | Icons |
| Framer Motion | Animation |
| i18next and react-i18next | Three-language interface |
| i18next-browser-languagedetector | Saved and browser language detection |
| Plyr 3 | Custom YouTube playback controls |
| KaTeX | Mathematical notation |
| PDF.js | PDF processing |
| DOMPurify | HTML sanitization |
| Firebase Web SDK 12 | Authentication, database and storage |

Exact versions are recorded in `package-lock.json`.

### Backend Technologies

- **Firebase Authentication**: Email/password and Google sign-in, verification and password recovery.
- **Realtime Database**: Profiles, courses, enrollments, progress, tests and sessions.
- **Cloud Storage**: Supported uploaded images, documents, avatars and materials.
- **Cloud Functions**: Privileged operations, course assignment, notifications, catalog synchronization and AI-assisted imports.
- **Secret Manager**: Server-side AI credentials.
- **Firebase Hosting**: Production files, CDN, HTTPS and SPA routing.

### Development Tools

Node.js 22.12 or later, ESLint, Prettier, PostCSS, Node's built-in test runner, Firebase Emulator Suite, Git and GitHub Actions. Cloud Functions use Node.js 22.

### Deployment & Hosting

GitHub Actions deploys to Firebase through Workload Identity Federation. No service-account private key is stored in the repository.

---

## Architecture

### Frontend Architecture

The frontend follows a component-based architecture with clear separation of concerns:

- **Components** in `src/components/` provide reusable interfaces.
- **Pages** in `src/pages/` implement route-level screens.
- **Hooks** in `src/hooks/` handle session validation and reusable behavior.
- **Utilities** in `src/utils/` handle durations, URLs, sanitization, profiles and browser storage.
- **Services** in `src/firebase/` integrate authentication, database, storage, messaging and sessions.
- **API integration** in `src/api/` connects AI imports to the backend.
- **State management** uses React hooks and Firebase listeners.
- **Translations** for all three interface languages live in `src/i18n.js`.
- **Styling** uses Tailwind utilities, global CSS and the brand palette.

### Backend Architecture

Firebase Authentication identifies callers. Realtime Database rules restrict profiles, enrollments, courses and administrative records. Privileged Cloud Functions validate authorization and administrator custom claims.

The public course catalog contains summaries. The `syncCourseCatalog` trigger synchronizes it when a course changes. Assigned students access authorized content; administrators manage full course records.

Videos use external YouTube embeds. Materials use supported external links or Storage. External URLs remain shareable after a viewer obtains them. The current application stores course and user data in Realtime Database, not Firestore.

---

## Project Structure

### Root Directory Files

| File or directory | Purpose |
| --- | --- |
| `package.json`, `package-lock.json` | Dependencies, scripts and reproducible versions |
| `vite.config.js` | Development server and build |
| `tailwind.config.cjs` | Styling and brand colors |
| `postcss.config.cjs` | Tailwind PostCSS integration |
| `.eslintrc.cjs` | Lint configuration |
| `.env.example` | Browser and development configuration template |
| `.gitignore` | Excludes credentials, local state and generated output |
| `.githooks/` | Staged-file security guard |
| `.github/workflows/check.yml` | Checks and Firebase deployment |
| `index.html` | HTML entry point |
| `firebase.json`, `.firebaserc` | Firebase deployment and project aliases |
| `database.rules.json` | Realtime Database access rules |
| `storage.rules` | Storage access and upload rules |
| `functions/` | Server-side source and dependencies |
| `scripts/` | Security checks, migrations and release verification |
| `tests/` | Application and Firebase rule tests |
| `SECURITY.md` | Vulnerability reporting policy |
| `LICENSE` | Project ownership and usage terms |

### Source Directory (`src/`)

| Directory or file | Purpose |
| --- | --- |
| `main.jsx`, `App.jsx` | React initialization and routing |
| `i18n.js` | Kazakh, Russian and English translations |
| `components/` | Shared interfaces and features |
| `components/admin/` | Course, enrollment and test editors |
| `components/test/` | Questions, navigation and results |
| `pages/`, `pages/admin/` | User and administrative screens |
| `firebase/` | Firebase client services |
| `api/` | AI import integration |
| `hooks/` | Reusable behavior |
| `utils/` | Data and presentation helpers |
| `styles/` | Global styles |
| `assets/quiz-covers/` | GIF covers for topic tests |

#### Components Directory (`src/components/`)

| Component | Purpose |
| --- | --- |
| `Header.jsx`, `Sidebar.jsx` | Navigation, language, theme and profile |
| `AdminGuard.jsx` | Administrator navigation guard |
| `BlockedAccountOverlay.jsx` | Blocked-account state |
| `SessionRevokedModal.jsx` | Revoked-session state |
| `CookieConsent.jsx` | Consent preference |
| `VideoPlayer.jsx` | Existing player and progress updates |
| `CourseQuotes.jsx` | Quotes and fullscreen mobile swipe |
| `LessonQuizPlayer.jsx` | Lesson questions and results |
| `SANAFloatingChat.jsx` | SANA interface |
| `ProfileModal.jsx` | Profile interface |

#### Pages Directory (`src/pages/`)

| Page | Purpose |
| --- | --- |
| `Home.jsx` | Application entry screen |
| `CourseDetail.jsx` | Modules, lessons, materials and quizzes |
| `Courses.jsx`, `MyCourses.jsx` | Catalog and assigned courses |
| `TestUBT.jsx` | Exam practice |
| `Login.jsx`, `Signup.jsx` | Sign-in and registration |
| `ForgotPassword.jsx`, `ResetPassword.jsx` | Password recovery |
| `AuthAction.jsx`, `VerifyEmail.jsx` | Authentication actions and verification |
| `Profile.jsx` | Profile management |
| `NotFound.jsx` | Missing-route screen |
| `admin/` | Administrative pages |

### Public Directory (`public/`)

- `firebase-messaging-sw.js`: Push notifications and same-origin navigation.
- `manifest.json`: Application installation metadata.
- `icons/`: Application icons.

### Configuration Files

Browser variables are listed in `.env.example`; server variables are in `functions/.env.example`. Local environment files, credentials, database exports and build output are excluded from Git.

---

## Key Features

- Kazakh, Russian and English interfaces with runtime switching.
- Student and administrator workflows.
- Courses organized into modules and lessons.
- Administrator-assigned enrollments and expiration dates.
- YouTube lessons through the existing custom player.
- Saved lesson progress and course navigation.
- Lesson quizzes, topic tests, answer review and results.
- Mathematical notation and question images.
- Course documents and external learning materials.
- Original motivational quotes and fullscreen mobile swipe.
- GIF covers for topic tests.
- Profiles, email verification and session handling.
- Light and dark themes with responsive layouts.
- Push notifications and installation metadata.
- AI-assisted question imports through a server-side endpoint.

---

## Installation & Setup

### Prerequisites

Node.js 22.12 or later, npm, Git, access to this repository and a configured Firebase project. Firebase CLI is needed for deployment and emulators. CI uses Java 21 for rule emulators.

### Installation Steps

1. Clone the repository:

   ~~~sh
   git clone https://github.com/AQADIL/akadiledu-v2-1.git
   cd akadiledu-v2-1
   ~~~

2. Install locked dependencies:

   ~~~sh
   npm ci
   npm ci --prefix functions
   ~~~

3. Copy `.env.example` to `.env` and configure the selected project's web settings, local host and port.
4. Enable the authentication providers and authorize the development domain in Firebase Authentication.
5. Review [deployment](#deployment) and [administrator setup](#admin-account-setup) for existing installations.
6. Start the application:

   ~~~sh
   npm run dev
   ~~~

Vite prints the address. Missing configuration displays an unavailable state. There is no default demo account or seeded production data.

### Production Build

~~~sh
npm run check
npm run preview
~~~

Build output is written to `dist/` and excluded from Git.

---

## Environment Variables

Use `.env.example` as the template. All `VITE_*` values are public browser configuration.

| Variables | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web authentication |
| `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID` | Database and project |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Application identity |
| `VITE_FIREBASE_VAPID_KEY` | Web push |
| `VITE_FIREBASE_FUNCTIONS_REGION` | Callable Functions region |
| `VITE_DEV_HOST`, `VITE_DEV_PORT` | Local server |
| `VITE_SUPPORT_WHATSAPP_URL`, `VITE_SUPPORT_TELEGRAM_URL` | Support destinations |
| `VITE_IP_LOOKUP_URL` | IP lookup endpoint |
| `VITE_VIDEO_EMBED_ORIGIN` | YouTube embed origin |

Server configuration is listed in `functions/.env.example`:

- `GEMINI_API_URL` selects the server-side model endpoint.
- `DATABASE_REGION` selects the catalog trigger's database region.
- `GEMINI_API_KEY` is a Functions secret in Google Secret Manager.

Administrative scripts use Application Default Credentials and `FIREBASE_DATABASE_URL`. Keep credentials outside Git. Never put private keys, AI keys or service-account credentials in `VITE_*` variables.

---

## Firebase Configuration

### Firebase Services Used

| Service | Data or behavior |
| --- | --- |
| Authentication | Identity, verification, recovery and custom claims |
| Realtime Database | Profiles, courses, catalog, enrollments, progress, tests and sessions |
| Storage | Supported files and images |
| Cloud Functions | Privileged operations, catalog synchronization, notifications and AI imports |
| Hosting | Built application, SPA rewrites and response headers |

### Data Organization

- `users/{uid}`: Application profile.
- `users/{uid}/courses/{courseId}`: Enrollment and optional expiration.
- `users/{uid}/progress`: Learning progress.
- `courses/{courseId}`: Full course, modules and lessons.
- `courseCatalog/{courseId}`: Public summary.

Enrollment expiration uses a numeric millisecond `expiryDate` or no expiration. Lesson duration records contain minutes; display helpers format hours and minutes where needed.

### Security Rules

`database.rules.json` controls reads and writes by identity, account state, enrollment and administrator claims. `storage.rules` checks ownership, administrative access and supported uploads. Deploy the intended project's rules; never use permissive test rules in production.

---

## Authentication System

### Supported Providers

Email/password registration and sign-in, Google sign-in, email verification and password recovery. Configure providers and authorized domains in Firebase Authentication.

### Authentication Flow

1. The user signs in through Firebase Authentication.
2. The application loads or creates the Realtime Database profile.
3. Verification, account status and session checks determine the interface.
4. Firebase rules and Cloud Functions validate data operations.
5. Signing out ends the authenticated session.

### Session Management

The Firebase SDK manages persistence and token refresh. Application session records support validation and revoked-session notifications. Client guards control navigation; backend authorization remains necessary.

---

## Role-Based Access Control

### User Roles

- **Admin**: Full access to all features and user management
- **Student**: Access to courses, tests, and personal progress

### Access Control Implementation

- Route guards for protected pages
- Component-level access control
- Realtime Database and Storage security rules
- Required Firebase Auth administrator custom claims

### Admin Features

- User management
- Course creation and editing
- Progress monitoring
- Test management
- System configuration

### Student Features

- Course enrollment
- Video streaming
- Progress tracking
- Test participation
- Profile management

---

## Internationalization (i18n)

### Supported Languages

- **Kazakh (kk)**: Primary language
- **Russian (ru)**: Secondary language
- **English (en)**: International language

### Implementation

- **react-i18next**: React integration for i18next
- **i18next-browser-languagedetector**: Automatic language detection
- **Translation Files**: Organized by language in `i18n.js`
- **Dynamic Language Switching**: Runtime language changes
- **Fallback Support**: Graceful fallback to default language

### Translation Structure

Translations are organized by feature and component:
- Navigation and UI elements
- Form labels and messages
- Error messages and notifications
- Course content and descriptions
- Test questions and answers

---

## PWA Features

### Progressive Web App Capabilities

The application includes a manifest, icons and standalone display metadata. Installation availability depends on the browser. Responsive layouts support desktop and mobile screens.

### Service Worker

`firebase-messaging-sw.js` handles push notifications and same-origin destinations. Push requires permission and valid messaging configuration.

The current service worker does not implement a general offline course cache or background synchronization. Authentication, course data and video playback require network access.

### Manifest Configuration

`public/manifest.json` defines the name, icons, start URL, display mode and theme colors.

---

## Deployment

### GitHub Actions

`.github/workflows/check.yml` validates pull requests and pushes to `main`. Checks include security scanning, lint, tests, build, dependency audits and Database/Storage emulators.

After checks pass on `main`, the job deploys Functions, database rules, Storage rules and Hosting. The final verification checks the published build and its assets.

Production authentication uses Workload Identity Federation restricted to the repository and production workflow. Pull requests do not receive deployment access. Deployments are serialized.

### Repository Configuration

| Variable or secret | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Target project |
| `FIREBASE_HOSTING_URL` | Published site verification |
| `FIREBASE_WORKLOAD_IDENTITY_PROVIDER` | Google Cloud identity provider |
| `FIREBASE_DEPLOY_SERVICE_ACCOUNT` | Deployment identity |
| `GEMINI_API_URL` | Server-side model endpoint |
| `DATABASE_REGION` | Database trigger region |
| `FIREBASE_WEB_CONFIG` | Repository secret with the public browser environment as JSON |

The AI key stays in Secret Manager. Set it with `firebase functions:secrets:set GEMINI_API_KEY` before deploying the AI import function.

### Firebase Hosting

Configure the intended project, administrator claims and catalog before enforcing rules. Use the selected project or pass the intended project explicitly.

~~~sh
firebase deploy --only functions
firebase deploy --only database,storage,hosting
~~~

The Hosting predeploy hook builds the application. For existing installations, back up the database and verify account records, administrator claims and catalog data before activating updated rules.

---

## Admin Account Setup

There are no default administrator credentials in the repository.

1. Create and verify the intended account.
2. Configure Application Default Credentials and `FIREBASE_DATABASE_URL` in a trusted administrative environment.
3. Set `ADMIN_USER_UID` to the account UID and inspect the proposed change:

   ~~~sh
   node scripts/admin.mjs grant-admin "$ADMIN_USER_UID"
   ~~~

4. Apply the reviewed change:

   ~~~sh
   node scripts/admin.mjs grant-admin "$ADMIN_USER_UID" --apply
   ~~~

5. Refresh the session and verify administrator access.

Scripts default to a dry run. A database role label alone does not grant the required Auth custom claim.

---

## Security & Privacy

### Security Measures

- Authentication, account state and custom claims protect privileged actions.
- Database and Storage rules restrict data operations.
- AI credentials remain on the server.
- Supported HTML and external links are sanitized or normalized.
- Hosting supplies HTTPS and configured response headers.
- Git exclusions and the commit guard protect against accidental publication of credentials and generated files.

Read [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

### Local Storage Keys

- `ak_consent`: Consent preference.
- `ak_theme`: Theme.
- `ak_lang`: Language.

Other features keep local state such as unfinished tests and completion markers. Browser data is user-controlled and is not an authorization boundary.

### Sensitive Data

Do not commit environment files, service-account keys, database exports or passwords. Do not log credentials or personal records. Removing a credential from current files does not revoke it or erase historical copies.

---

## Available Scripts

### Development Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite |
| `npm run build` | Build production assets |
| `npm run preview` | Preview the local build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Node tests |
| `npm run check:security` | Check candidate files |
| `npm run check` | Security checks, lint, tests and build |
| `npm run format` | Format configured files |
| `npm run format:check` | Check formatting |

### Administrative Scripts

`npm run migrate` runs the profile migration in dry-run mode. `scripts/admin.mjs` also provides `grant-admin`, `sync-catalog` and `audit-password-fields`. Read the deployment guide before applying changes.

### Utility Scripts

~~~sh
npm audit
npm audit --prefix functions
npm outdated
~~~

---

## Testing

### Automated Checks

~~~sh
npm run check
npm audit --audit-level=high
npm audit --prefix functions --audit-level=high
~~~

The committed suite uses Node's built-in test runner. Database and Storage tests need emulators; ordinary `npm test` skips those checks when the corresponding emulator is unavailable.

### Firebase Rule Tests

CI uses an isolated demo project:

~~~sh
firebase emulators:exec --only database,storage --project demo-akadiledu-audit "node --test tests/database.rules.test.cjs tests/storage.rules.test.cjs"
~~~

### Release Verification

Check sign-in, verification, sign-out, administrator access, assigned and expired courses, video playback, quiz results and language switching. Inspect desktop and mobile layouts. AI imports, push notifications and external media depend on deployed configuration and providers.

---

## Known Limitations

- Courses and playback require a network connection.
- YouTube and external document URLs remain discoverable and shareable by viewers who receive them.
- Custom controls cannot guarantee video quality or add unsupported provider capabilities.
- Client-side tests and completion markers are not tamper-proof examination records.
- Push, installation and fullscreen vary by browser and device.
- Firebase quotas and external provider availability affect operation.
- Automated tests do not verify every production account or integration.

---

## Contributing

### Development Workflow

1. Create a descriptive branch from `main`.
2. Preserve existing functionality and unrelated changes.
3. Keep interface text in `src/i18n.js` for all three languages.
4. Use actual backend data and environment configuration.
5. Run relevant tests and `npm run check`.
6. Open a pull request with a short description and validation results.
7. Merge after checks pass; GitHub Actions deploys the release.

### Code Standards

Follow the existing JavaScript/JSX structure and ESLint configuration. Avoid unnecessary comments, debug logging, emoji, fabricated data and unfinished controls. Keep commit subjects short and descriptive.

Maintain this root README as the main overview. Update existing documentation; do not add extra README files without an explicit request.

Enable the staged-file guard:

~~~sh
git config core.hooksPath .githooks
~~~

---

## License

This project is proprietary intellectual property of **Akadil Alish**. All rights reserved.

The project's original source code, documentation and original assets may not be used, copied, modified, redistributed, sold or deployed for personal, educational, commercial or other purposes without prior written permission from Akadil Alish. Access to this repository does not itself grant permission to reuse the project.

See [LICENSE](LICENSE) for the complete terms. Third-party components retain their own licenses. These terms do not revoke previously granted valid licenses or override rights required by applicable law or hosting-platform terms. Authorized use of the hosted educational service is governed separately from reuse of this repository.

---

## Author

**Akadil Alish** — project author and owner of the original project materials.

---

## Support

Use [GitHub Issues](https://github.com/AQADIL/akadiledu-v2-1/issues) for bug reports and feature requests. Follow [SECURITY.md](SECURITY.md) for private vulnerability reports. Application support destinations are configured through environment variables.

---

## Version History

### v2.0.0 (Current)
- Complete rewrite with modern React
- Firebase integration
- PWA capabilities
- Multi-language support
- Admin dashboard
- Enhanced security

### v1.0.0 (Legacy)
- Basic educational platform
- Limited features
- Single language support

---

*Last updated: 2026-10-21*

---

*This README provides comprehensive documentation for the AkadilEdu v2 educational platform. For specific implementation details, refer to the source code and inline documentation.*
