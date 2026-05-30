# AkadilEdu v2 - Comprehensive Educational Platform

## 📋 Table of Contents

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

## 📖 Project Overview

AkadilEdu v2 is a modern, comprehensive educational platform built with React and Firebase. It provides a complete learning management system with course management, user authentication, role-based access control, multilingual support, and PWA capabilities. The platform is designed to support both administrators and students with distinct interfaces and functionalities.

---

## 🛠 Technology Stack

### Frontend Technologies

- **React 18.2.0** - Core JavaScript library for building user interfaces
- **Vite 4.4.5** - Fast build tool and development server
- **React Router DOM 6.15.0** - Client-side routing for single-page applications
- **Tailwind CSS 3.3.3** - Utility-first CSS framework for styling
- **Headless UI 1.7.13** - Unstyled, fully accessible UI components
- **Lucide React 0.263.1** - Beautiful & consistent icon toolkit
- **React-i18next 13.0.2** - Internationalization framework for React
- **i18next 23.4.4** - Core internationalization library
- **i18next-browser-languagedetector 7.1.0** - Browser language detection for i18next
- **React Hot Toast 2.4.1** - Lightweight notification system
- **React Hook Form 7.45.4** - Performant, flexible and extensible forms
- **React Player 2.13.0** - React component for playing video and audio
- **Firebase 10.1.0** - Client-side Firebase SDK for web applications

### Backend Technologies

- **Firebase Authentication** - User authentication service (Email/Password, Google, Apple Sign-In)
- **Firebase Firestore** - NoSQL document database for data storage
- **Firebase Storage** - Cloud storage for files and media
- **Firebase Realtime Database** - Real-time database for live data synchronization
- **Firebase Cloud Functions** - Serverless backend functions (if needed)
- **Firebase Hosting** - Static site hosting and CDN

### Development Tools

- **ESLint 8.47.0** - JavaScript linting utility for code quality
- **PostCSS 8.4.27** - CSS transformation tool with plugins
- **Autoprefixer 10.4.15** - PostCSS plugin to parse CSS and add vendor prefixes
- **Git** - Version control system
- **Node.js** - JavaScript runtime environment

### Deployment & Hosting

- **Vercel** - Platform for frontend frameworks and static sites
- **Firebase Hosting** - Google's hosting service for web applications
- **Vercel Analytics** - Performance monitoring and analytics

---

## 🏗 Architecture

### Frontend Architecture

The frontend follows a component-based architecture with clear separation of concerns:

- **Component-Driven Development**: Reusable UI components in `src/components/`
- **Page-Based Routing**: Individual page components in `src/pages/`
- **Custom Hooks**: Reusable logic in `src/hooks/`
- **Utility Functions**: Helper functions in `src/utils/`
- **Service Layer**: Firebase integration in `src/firebase/`
- **State Management**: Local state with React hooks and Firebase real-time listeners
- **Routing**: Client-side routing with React Router
- **Styling**: Utility-first approach with Tailwind CSS
- **Internationalization**: Multi-language support with react-i18next

### Backend Architecture

The backend leverages Firebase's serverless architecture:

- **Firebase Authentication**: Handles user authentication and authorization
- **Firestore Database**: Stores application data (courses, users, progress)
- **Firebase Storage**: Manages file uploads (videos, documents, images)
- **Realtime Database**: Handles real-time features like live updates
- **Security Rules**: Enforces data access control and validation
- **Cloud Functions**: Server-side logic for complex operations (if needed)

---

## 📁 Project Structure

### Root Directory Files

| File | Purpose |
|------|---------|
| `package.json` | Project metadata, dependencies, and npm scripts |
| `package-lock.json` | Lock file for exact dependency versions |
| `vite.config.js` | Vite build tool configuration |
| `tailwind.config.cjs` | Tailwind CSS configuration and custom theme |
| `postcss.config.cjs` | PostCSS configuration with Autoprefixer |
| `.eslintrc.cjs` | ESLint configuration for code linting |
| `.gitignore` | Git ignore patterns for version control |
| `index.html` | Main HTML entry point for the application |
| `firebase.json` | Firebase project configuration |
| `.firebaserc` | Firebase project alias configuration |
| `vercel.json` | Vercel deployment configuration |
| `.vercelignore` | Files to ignore during Vercel deployment |
| `.env.example` | Environment variables template |
| `database-import.json` | Sample database structure for import |
| `firebase-realtime-rules.json` | Realtime database security rules |
| `firebase-rtdb-rules.json` | Additional RTDB security rules |
| `TEMP_RULES_FOR_TESTING.json` | Temporary security rules for testing |
| `MIGRATE_NOW.bat` | Windows batch script for migration |
| `BACKEND_HOSTING.md` | Backend hosting documentation |
| `UBT_TEST_SYSTEM_README.md` | UBT test system documentation |

### Source Directory (`src/`)

| Directory/File | Purpose |
|----------------|---------|
| `main.jsx` | Application entry point and React initialization |
| `App.jsx` | Main application component with routing setup |
| `i18n.js` | Internationalization configuration and translations |
| `components/` | Reusable UI components |
| `pages/` | Page-level components for routing |
| `hooks/` | Custom React hooks for reusable logic |
| `firebase/` | Firebase configuration and service functions |
| `utils/` | Utility functions and helpers |
| `styles/` | Global styles and CSS files |

#### Components Directory (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `AdminGuard.jsx` | HOC for admin-only route protection |
| `BlockedAccountOverlay.jsx` | UI for blocked account notification |
| `CookieConsent.jsx` | Cookie consent management component |
| `CustomVideoPlayer.jsx` | Custom video player with controls |
| `EmailVerificationBanner.jsx` | Banner for email verification reminder |
| `Header.jsx` | Main navigation header component |
| `ProfileModal.jsx` | User profile modal component |
| `SessionRevokedModal.jsx` | Modal for session revocation notification |
| `Sidebar.jsx` | Navigation sidebar component |
| `admin/` | Admin-specific components |
| `test/` | Test-related components |

#### Pages Directory (`src/pages/`)

| Page | Purpose |
|------|---------|
| `AuthAction.jsx` | Authentication action handler page |
| `CourseDetail.jsx` | Individual course detail page |
| `Courses.jsx` | Courses listing page |
| `EmailVerificationRequired.jsx` | Email verification requirement page |
| `ForgotPassword.jsx` | Password recovery page |
| `Home.jsx` | Homepage/landing page |
| `Login.jsx` | User login page |
| `MyCourses.jsx` | User's enrolled courses page |
| `NotFound.jsx` | 404 error page |
| `Profile.jsx` | User profile page |
| `ResetPassword.jsx` | Password reset page |
| `Shop.jsx` | Course shop/marketplace page |
| `Signup.jsx` | User registration page |
| `TestUBT.jsx` | UBT test interface page |
| `VerifyEmail.jsx` | Email verification page |
| `admin/` | Admin-specific pages |

### Public Directory (`public/`)

| File/Directory | Purpose |
|----------------|---------|
| `firebase-messaging-sw.js` | Firebase messaging service worker for push notifications |
| `manifest.json` | PWA manifest file for app installation |
| `icons/` | Application icons for various sizes and platforms |

### Configuration Files

| File | Purpose |
|------|---------|
| `firebase.json` | Firebase project configuration and hosting settings |
| `.firebaserc` | Firebase project aliases for multiple environments |
| `vercel.json` | Vercel deployment configuration and build settings |
| `.eslintrc.cjs` | ESLint rules and configuration for code quality |
| `tailwind.config.cjs` | Tailwind CSS customization and theme configuration |
| `postcss.config.cjs` | PostCSS plugin configuration |
| `vite.config.js` | Vite build tool configuration and plugins |

---

## ✨ Key Features

- **Multi-language Support**: Kazakh, Russian, and English languages
- **Role-Based Access Control**: Admin and Student roles with different permissions
- **Course Management**: Create, edit, and manage educational courses
- **Video Streaming**: Custom video player with progress tracking
- **Progress Tracking**: Monitor learning progress and completion
- **PWA Capabilities**: Installable app with offline support
- **Real-time Updates**: Live data synchronization
- **Secure Authentication**: Multiple auth providers (Email, Google, Apple)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **File Management**: Upload and manage course materials
- **Test System**: Integrated testing and assessment tools
- **Admin Dashboard**: Comprehensive admin interface
- **User Profiles**: Detailed user management and profiles

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 16+ installed
- Firebase project created
- Git for version control

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd akadiledu-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Configure Firebase**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login to Firebase: `firebase login`
   - Initialize Firebase: `firebase init`
   - Deploy security rules: `firebase deploy --only firestore:rules,storage`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 🔥 Firebase Configuration

### Firebase Services Used

1. **Authentication**
   - Email/Password authentication
   - Google Sign-In
   - Apple Sign-In
   - Email verification

2. **Firestore Database**
   - Users collection
   - Courses collection
   - Progress tracking
   - Test results

3. **Firebase Storage**
   - Course videos
   - Document uploads
   - User avatars
   - Course materials

4. **Realtime Database**
   - Live updates
   - Session management
   - Real-time notifications

### Security Rules

- **Firestore Rules**: Control data access based on user roles and authentication
- **Storage Rules**: Restrict file access to authorized users
- **Realtime Database Rules**: Secure real-time data access

---

## 🔐 Authentication System

### Supported Providers

- **Email/Password**: Traditional authentication method
- **Google Sign-In**: OAuth integration with Google
- **Apple Sign-In**: OAuth integration with Apple

### Authentication Flow

1. User initiates login/signup
2. Firebase Auth handles authentication
3. User profile created/updated in Firestore
4. JWT token generated and stored
5. User redirected based on role and verification status

### Session Management

- JWT tokens for session management
- Automatic token refresh
- Session revocation handling
- Secure logout functionality

---

## 👥 Role-Based Access Control

### User Roles

- **Admin**: Full access to all features and user management
- **Student**: Access to courses, tests, and personal progress

### Access Control Implementation

- Route guards for protected pages
- Component-level access control
- Firestore security rules
- Firebase Auth custom claims (if needed)

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

## 🌍 Internationalization (i18n)

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

## 📱 PWA Features

### Progressive Web App Capabilities

- **Offline Support**: Caching strategies for offline usage
- **App Installation**: Installable as native app
- **Push Notifications**: Firebase Cloud Messaging integration
- **Responsive Design**: Optimized for all screen sizes
- **Fast Loading**: Optimized assets and lazy loading

### Service Worker

- **firebase-messaging-sw.js**: Handles push notifications
- **Caching Strategy**: Network-first for critical assets
- **Background Sync**: Sync data when connection restored

### Manifest Configuration

- **App Name**: AkadilEdu v2
- **Icons**: Multiple sizes for various devices
- **Theme Colors**: Consistent branding
- **Display Mode**: Standalone app experience

---

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Link GitHub repository to Vercel
   - Configure build settings

2. **Environment Variables**
   - Add all required environment variables
   - Configure Firebase settings

3. **Build Configuration**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

4. **Deploy**
   - Automatic deployment on push to main branch
   - Preview deployments for pull requests

### Firebase Hosting

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

3. **Configure Security Rules**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

### Production Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] SSL certificate configured
- [ ] Domain settings updated
- [ ] Analytics and monitoring set up
- [ ] PWA manifest configured
- [ ] Service worker registered

---

## 👤 Admin Account Setup

### Default Admin Credentials

- **Email**: `youtub.maj@gmail.com`
- **Password**: `Admin123@`

### Admin Setup Process

1. Create admin account through signup
2. Verify email address
3. Set admin role in Firebase Console
4. Configure admin-specific permissions
5. Test admin functionality

### Firebase Project Configuration

- **Project ID**: `akadiledu`
- **Auth Domain**: `akadiledu.firebaseapp.com`
- **Storage Bucket**: `akadiledu.firebasestorage.app`

---

## 🔒 Security & Privacy

### Security Measures

- **Firebase Authentication**: Secure user authentication
- **Security Rules**: Database and storage access control
- **Input Validation**: Client and server-side validation
- **HTTPS Enforcement**: Secure data transmission
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Token-based request validation

### Privacy Features

- **Data Minimization**: Collect only necessary data
- **Cookie Consent**: GDPR-compliant cookie management
- **Data Encryption**: Encrypted data storage and transmission
- **User Consent**: Explicit consent for data processing
- **Data Portability**: User data export functionality
- **Right to Deletion**: Account and data deletion options

### Local Storage Keys

- `ak_consent`: Cookie consent preferences
- `ak_theme`: Theme selection (light/dark)
- `ak_lang`: Language preference

---

## 📜 Available Scripts

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Firebase Scripts

```bash
firebase deploy      # Deploy to Firebase
firebase serve       # Local Firebase server
firebase login       # Login to Firebase CLI
```

### Utility Scripts

```bash
npm audit            # Check for security vulnerabilities
npm outdated         # Check for outdated packages
```

---

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Feature and workflow testing
- **E2E Tests**: End-to-end user journey testing
- **Performance Tests**: Load and performance testing

### Testing Tools

- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing
- **Cypress**: End-to-end testing framework
- **Lighthouse**: Performance and accessibility testing

### Test Coverage

- Authentication flows
- Course management
- Video playback
- Progress tracking
- Multi-language support
- PWA functionality
- Responsive design

---

## ⚠️ Known Limitations

### Current Limitations

- **Offline Mode**: Limited offline functionality
- **Real-time Features**: Dependent on Firebase connection
- **File Upload Size**: Limited by Firebase Storage quotas
- **Concurrent Users**: Limited by Firebase pricing plan
- **Video Streaming**: Bandwidth-dependent performance

### Future Improvements

- Enhanced offline capabilities
- Advanced analytics dashboard
- Mobile app development
- API rate limiting
- Advanced search functionality
- Social learning features

---

## 🤝 Contributing

### Contribution Guidelines

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review process
6. Merge to main branch

### Code Standards

- Follow ESLint configuration
- Use TypeScript for new features
- Write comprehensive tests
- Update documentation
- Follow Git commit conventions

### Development Workflow

1. Setup development environment
2. Create feature branch from main
3. Implement changes with tests
4. Run linting and tests
5. Submit pull request
6. Address review feedback
7. Merge to main branch

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**AkadilEdu Development Team**

- **Project Lead**: Akadil
- **Frontend Development**: React, Vite, Tailwind CSS
- **Backend Development**: Firebase Services
- **UI/UX Design**: Modern, responsive design
- **DevOps**: Vercel, Firebase Hosting

---

## 📞 Support

For support and inquiries:

- **Email**: support@akadiledu.com
- **Documentation**: This README file
- **Issues**: GitHub Issues
- **Community**: Developer forums

---

## 🔄 Version History

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

*Last updated: [Current Date]*

---

*This README provides comprehensive documentation for the AkadilEdu v2 educational platform. For specific implementation details, refer to the source code and inline documentation.*
