import { useTranslation } from 'react-i18next';
import { onValue, ref, update } from 'firebase/database';
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProfileModal from './components/ProfileModal';
import CookieConsent from './components/CookieConsent';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import SessionRevokedModal from './components/SessionRevokedModal';
import BlockedAccountOverlay from './components/BlockedAccountOverlay';
import AppWrapper from './components/AppWrapper';
import { useSessionValidator } from './hooks/useSessionValidator';

const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const EmailVerificationRequired = lazy(() => import('./pages/EmailVerificationRequired'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const TestUBT = lazy(() => import('./pages/TestUBT'));
const AuthAction = lazy(() => import('./pages/AuthAction'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const SecurityAlerts = lazy(() => import('./pages/admin/SecurityAlerts'));
const TestManager = lazy(() => import('./components/admin/TestManager'));
import AdminGuard from './components/AdminGuard';
import { storage } from './utils/storage';
import { createSessionProfile } from './utils/deviceInfo';
import { onAuthStateChanged, initializeAuth } from './firebase/auth';

import {
  getUserProfile as getRTDBProfile,
  createUserProfile,
  database,
} from './firebase/realtimeDb';
import { auth, isFirebaseConfigured } from './firebase/config';
import i18n from './i18n';
import AppLoader from './components/AppLoader';
import PushPermissionRequest from './components/PushPermissionRequest';

function App() {
  useTranslation();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [showSessionRevokedModal, setShowSessionRevokedModal] = useState(false);
  const [localSessionId, setLocalSessionId] = useState(null);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [blockReason, setBlockReason] = useState(null);

  useEffect(() => {
    const savedTheme = storage.getTheme();
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (isFirebaseConfigured()) {
      initializeAuth();
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    let active = true;
    let stopProfile = () => {};
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      stopProfile();
      setUser(firebaseUser);
      setUserProfile(null);
      setIsUserBlocked(false);
      setProfileError(false);
      setBlockReason(null);
      setShowVerificationBanner(Boolean(firebaseUser && !firebaseUser.emailVerified));
      if (!firebaseUser) {
        setLocalSessionId(null);
        setLoading(false);
        return;
      }
      try {
        const existing = await getRTDBProfile(firebaseUser.uid);
        if (!existing)
          await createUserProfile(firebaseUser.uid, {
            email: firebaseUser.email,
            name: firebaseUser.displayName || '',
          });
        if (!active || auth.currentUser?.uid !== firebaseUser.uid) return;
        stopProfile = onValue(
          ref(database, 'users/' + firebaseUser.uid),
          (snapshot) => {
            const profile = snapshot.val();
            setUserProfile(profile);
            setIsUserBlocked(profile?.status === 'suspended' || profile?.isDeleted === true);
            setBlockReason(profile?.suspendedReason || null);
          },
          () => setProfileError(true),
        );
        const sessionKey = 'akadil_session_' + firebaseUser.uid;
        let sessionId = localStorage.getItem(sessionKey);
        const token = await firebaseUser.getIdTokenResult();
        if (!sessionId && token.claims.admin !== true) {
          const session = await createSessionProfile();
          sessionId = session.sessionId;
          await update(ref(database, 'users/' + firebaseUser.uid), {
            ['sessions/' + sessionId]: session,
            currentSession: sessionId,
            lastLogin: session.timestamp,
          });
          localStorage.setItem(sessionKey, sessionId);
        }
        if (active && auth.currentUser?.uid === firebaseUser.uid) setLocalSessionId(sessionId);
      } catch {
        if (active) setProfileError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      stopProfile();
      unsubscribe();
    };
  }, []);

  const handleSessionInvalidated = async () => {
    setShowSessionRevokedModal(true);

    setTimeout(async () => {
      try {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('./firebase/config');
        await signOut(auth);
        if (user) localStorage.removeItem('akadil_session_' + user.uid);
        setLocalSessionId(null);
        setShowSessionRevokedModal(false);
        window.location.href = '/login';
      } catch (error) {}
    }, 3000);
  };

  useSessionValidator(user, localSessionId, handleSessionInvalidated);

  const handleAvatarChange = (newAvatarUrl) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, avatarUrl: newAvatarUrl });
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center p-8">
        {i18n.t('configuration.unavailable')}
      </div>
    );
  }
  if (profileError)
    return (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-8"
      >
        <p>{i18n.t('common.loadError')}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          {i18n.t('common.retry')}
        </button>
      </div>
    );
  if (loading) {
    return <AppLoader text={i18n.t('common.loading')} fullScreen />;
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppWrapper>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          {user && isUserBlocked && <BlockedAccountOverlay reason={blockReason} />}

          {showSessionRevokedModal && (
            <SessionRevokedModal
              onClose={() => {
                setShowSessionRevokedModal(false);
                window.location.href = '/login';
              }}
            />
          )}

          {user && showVerificationBanner && (
            <EmailVerificationBanner user={user} onClose={() => setShowVerificationBanner(false)} />
          )}

          <Header
            onMenuClick={() => setIsSidebarOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
            userAvatar={userProfile?.avatarUrl || ''}
            user={user}
          />

          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="lg:pl-16 pt-20 sm:pt-24 pb-16 transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <Suspense fallback={<AppLoader text={i18n.t('ui.loadingPage')} fullScreen={false} />}>
                <Routes>
                  <Route path="/" element={<Home user={user} />} />
                  <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                  <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
                  <Route
                    path="/forgot-password"
                    element={user ? <Navigate to="/" /> : <ForgotPassword />}
                  />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route path="/__/auth/action" element={<AuthAction />} />

                  <Route
                    path="/email-verification-required"
                    element={<EmailVerificationRequired />}
                  />

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
                    path="/courses/:id"
                    element={
                      user ? (
                        user.emailVerified ? (
                          <CourseDetail />
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
                    path="/my-courses/:id"
                    element={
                      user ? (
                        user.emailVerified ? (
                          <CourseDetail />
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
                    path="/test/:testId"
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
                    path="/test/:testId/question/:questionIndex"
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
                  <Route path="/shop" element={<Navigate to="/courses" replace />} />

                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminGuard>
                        <UsersManagement />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/security"
                    element={
                      <AdminGuard>
                        <SecurityAlerts />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/tests"
                    element={
                      <AdminGuard>
                        <TestManager />
                      </AdminGuard>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </main>

          {user && (
            <ProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              onAvatarChange={handleAvatarChange}
              userProfile={userProfile}
            />
          )}

          {user && <PushPermissionRequest userId={user.uid} />}

          <CookieConsent />
        </div>
      </AppWrapper>
    </BrowserRouter>
  );
}

export default App;
