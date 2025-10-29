import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProfileModal from './components/ProfileModal';
import CookieConsent from './components/CookieConsent';
import EmailVerificationBanner from './components/EmailVerificationBanner';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const TestUBT = lazy(() => import('./pages/TestUBT'));
const Shop = lazy(() => import('./pages/Shop'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AuthAction = lazy(() => import('./pages/AuthAction'));
const EmailVerificationRequired = lazy(() => import('./pages/EmailVerificationRequired'));
const NotFound = lazy(() => import('./pages/NotFound'));
import { storage } from './utils/storage';
import { onAuthStateChanged, initializeAuth } from './firebase/auth';
import { getUserProfile, logAuthEvent } from './firebase/firestore';
import { isFirebaseConfigured } from './firebase/config';
import './i18n';

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  useEffect(() => {
    // Initialize theme
    const savedTheme = storage.getTheme();
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Initialize Firebase Auth
    if (isFirebaseConfigured()) {
      initializeAuth();
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);

          // Log authentication event
          try {
            // Try to get IP address
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            console.log('🌐 IP Address detected:', ipData.ip);
            await logAuthEvent(firebaseUser.uid, ipData.ip);
            console.log('📝 Login event logged for user:', firebaseUser.email, 'IP:', ipData.ip);
          } catch (error) {
            console.warn('⚠️ Could not fetch IP address:', error.message);
            await logAuthEvent(firebaseUser.uid, 'unknown');
            console.log('📝 Login event logged for user:', firebaseUser.email, 'IP: unknown');
          }

          // Check email verification
          setShowVerificationBanner(!firebaseUser.emailVerified);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        setShowVerificationBanner(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAvatarChange = (newAvatarUrl) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, avatarUrl: newAvatarUrl });
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Email Verification Banner */}
        {user && showVerificationBanner && (
          <EmailVerificationBanner
            user={user}
            onClose={() => setShowVerificationBanner(false)}
          />
        )}

        {/* Header - Always visible */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onProfileClick={() => setIsProfileOpen(true)}
          userAvatar={userProfile?.avatarUrl || ''}
          user={user}
        />

        {/* Sidebar - Always visible */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="lg:pl-16 pt-8 pb-16 transition-all duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <Routes>
              {/* Public routes - accessible without login */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
              <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Firebase Auth Action Handler */}
              <Route path="/__/auth/action" element={<AuthAction />} />
              
              {/* Email Verification Required Page */}
              <Route path="/email-verification-required" element={<EmailVerificationRequired />} />

              {/* Protected routes - require authentication AND email verification */}
              <Route
                path="/courses"
                element={
                  user ? (
                    user.emailVerified ? (
                      <Courses />
                    ) : (
                      <Navigate to="/email-verification-required" />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/my-courses"
                element={
                  user ? (
                    user.emailVerified ? (
                      <MyCourses />
                    ) : (
                      <Navigate to="/email-verification-required" />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/test-ubt"
                element={
                  user ? (
                    user.emailVerified ? (
                      <TestUBT />
                    ) : (
                      <Navigate to="/email-verification-required" />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/shop"
                element={
                  user ? (
                    user.emailVerified ? (
                      <Shop />
                    ) : (
                      <Navigate to="/email-verification-required" />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              
              {/* 404 Page - catch all */}
              <Route path="*" element={<NotFound />} />
              {/* Admin route will be added in Prompt 3 */}
              </Routes>
            </Suspense>
          </div>
        </main>

        {/* Profile Modal */}
        {user && (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onAvatarChange={handleAvatarChange}
            userProfile={userProfile}
          />
        )}

        {/* Cookie Consent */}
        <CookieConsent />
      </div>
    </BrowserRouter>
  );
}

export default App;
