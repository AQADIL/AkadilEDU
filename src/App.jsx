import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProfileModal from './components/ProfileModal';
import CookieConsent from './components/CookieConsent';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import SessionRevokedModal from './components/SessionRevokedModal';
import BlockedAccountOverlay from './components/BlockedAccountOverlay';
import { useSessionValidator } from './hooks/useSessionValidator';
import { requestNotificationPermission, setupForegroundMessageListener } from './firebase/messaging';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
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

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const SecurityAlerts = lazy(() => import('./pages/admin/SecurityAlerts'));
import AdminGuard from './components/AdminGuard';
import { storage } from './utils/storage';
import { onAuthStateChanged, initializeAuth } from './firebase/auth';
import { getUserProfile, logAuthEvent } from './firebase/firestore';
import { getUserProfile as getRTDBProfile, createUserProfile, logUserSession } from './firebase/realtimeDb';
import { isFirebaseConfigured } from './firebase/config';
import './i18n';

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [showSessionRevokedModal, setShowSessionRevokedModal] = useState(false);
  const [localSessionId, setLocalSessionId] = useState(null);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null);

  // Version check (without clearing PWA cache)
  useEffect(() => {
    const APP_VERSION = '2.1.0';
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion !== APP_VERSION) {
      console.log(' New version detected:', APP_VERSION);
      // Clear localStorage but preserve session and device IDs
      const sessionId = localStorage.getItem('akadil_current_session');
      const deviceId = localStorage.getItem('akadil_device_id');
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore important data
      if (sessionId) localStorage.setItem('akadil_current_session', sessionId);
      if (deviceId) localStorage.setItem('akadil_device_id', deviceId);
      localStorage.setItem('app_version', APP_VERSION);
      
      // Service Worker will auto-update via sw.js version change
      console.log(' Version updated, PWA cache preserved');
    }
  }, []);

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
    
    // Setup foreground message listener
    setupForegroundMessageListener();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    // Set maximum loading time (10 seconds)
    const loadingTimeout = setTimeout(() => {
      console.warn(' Loading timeout - forcing app to show');
      setLoading(false);
    }, 10000);

    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      clearTimeout(loadingTimeout);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore (optional)
          let profile = null;
          try {
            profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (firestoreError) {
            console.warn(' Firestore unavailable (offline?):', firestoreError.message);
            // Continue without Firestore profile
          }

          // Check/Create Realtime DB profile
          try {
            console.log(' Checking Realtime DB profile for:', firebaseUser.email);
            let rtdbProfile = await getRTDBProfile(firebaseUser.uid);
            
            if (!rtdbProfile) {
              console.log(' Creating new Realtime DB profile...');
              const isAdmin = firebaseUser.email === 'youtub.maj@gmail.com';
              console.log(' Role will be:', isAdmin ? 'admin' : 'student');
              
              rtdbProfile = await createUserProfile(firebaseUser.uid, {
                email: firebaseUser.email,
                name: firebaseUser.displayName || profile?.name || 'User',
                role: isAdmin ? 'admin' : 'student'
              });
              
              console.log(' Realtime DB profile created:', rtdbProfile);
            } else {
              console.log(' Realtime DB profile exists:', rtdbProfile);
              
              // Check if user is blocked - сразу проверяем блокировку
              if (rtdbProfile.status === 'suspended') {
                console.warn('🚨 User account is blocked!');
                setIsUserBlocked(true);
                setBlockReason(rtdbProfile.suspensionReason || null);
                
                // Если пользователь заблокирован, прекращаем дальнейшие проверки
                // Это нужно, чтобы показать экран блокировки и не продолжать дальнейшую логику
                setLoading(false);
                return;
              } else {
                setIsUserBlocked(false);
                setBlockReason(null);
              }
            }
          } catch (rtdbError) {
            console.error(' Realtime DB Error:', rtdbError);
            console.error(' Make sure Realtime Database is created in Firebase Console!');
          }

          // Log session with IP tracking AND smart security analysis
          try {
            const { createSessionProfile } = await import('./utils/deviceInfo');
            const { calculateRiskScore, getActionMessage } = await import('./utils/riskScoring');
            const { getUserSessions, createSecurityAlert } = await import('./firebase/realtimeDb');
            const { revokeOtherSessions } = await import('./firebase/sessionManager');
            
            const sessionProfile = await createSessionProfile();
            
            // Log session
            await logAuthEvent(firebaseUser.uid, sessionProfile.ip).catch(() => {});
            await logUserSession(firebaseUser.uid, sessionProfile).catch(() => {});
            
            // SINGLE ACTIVE SESSION - только один может смотреть!
            const { getCurrentSession, checkSessionRevoked } = await import('./firebase/sessionManager');
            const localStoredSession = localStorage.getItem('akadil_current_session');
            
            // Проверяем сценарий 1: Если мы уже имеем сохраненную локально сессию
            if (localStoredSession) {
              // Проверим, действительна ли она или была выкинута
              const isRevoked = await checkSessionRevoked(firebaseUser.uid, localStoredSession);
              
              if (isRevoked) {
                // Нашу сессию выкинули с другого устройства
                console.warn('🚨 Our session was revoked by another device!');
                setShowSessionRevokedModal(true);
                setTimeout(() => {
                  localStorage.removeItem('akadil_current_session');
                  window.location.href = '/login';
                }, 3000);
                return; // Прекращаем дальнейшую обработку
              } else {
                // Эта сессия действительна, продолжаем использовать её без обновления
                console.log('🟢 Continuing with existing valid session: ' + localStoredSession);
                setLocalSessionId(localStoredSession);
              }
            } else {
              // У нас нет сохраненной сессии, создаем новую и отменяем другие сессии
              console.log('🆕 Creating new session: ' + sessionProfile.sessionId);
              
              // Выкидываем других
              const revokeResult = await revokeOtherSessions(firebaseUser.uid, sessionProfile.sessionId);
              if (revokeResult.revoked > 0) {
                console.log(`🔒 Revoked ${revokeResult.revoked} other sessions - only one active now!`);
              }
              
              // Сохраняем новую сессию
              localStorage.setItem('akadil_current_session', sessionProfile.sessionId);
              setLocalSessionId(sessionProfile.sessionId);
            }
            
            // SMART SECURITY CHECK: Calculate risk score
            const userSessions = await getUserSessions(firebaseUser.uid);
            const riskAssessment = calculateRiskScore(userSessions, sessionProfile, []);
            
            console.log(' Risk Assessment:', {
              score: riskAssessment.score,
              level: riskAssessment.level,
              action: riskAssessment.action,
              message: getActionMessage(riskAssessment.action)
            });
            
            // Handle based on risk level
            if (riskAssessment.action === 'soft_verify') {
              // Soft response: notify but allow access with limitations
              console.warn(' Medium risk detected - soft verification required');
              
              await createSecurityAlert(firebaseUser.uid, {
                type: 'medium_risk_login',
                riskLevel: 'medium',
                riskScore: riskAssessment.score,
                flags: riskAssessment.flags,
                action: 'soft_verify',
                session: sessionProfile,
                message: 'Обнаружена нестандартная активность. Проверьте email для подтверждения.'
              });
              
              // TODO: Send email notification
              // TODO: Show in-app notification
              
            } else if (riskAssessment.action === 'strong_verify') {
              // Strong response: require verification, limit content
              console.error(' HIGH RISK detected - strong verification required');
              
              await createSecurityAlert(firebaseUser.uid, {
                type: 'high_risk_login',
                riskLevel: 'high',
                riskScore: riskAssessment.score,
                flags: riskAssessment.flags,
                action: 'strong_verify',
                session: sessionProfile,
                message: 'Обнаружена подозрительная активность. Доступ к контенту ограничен до подтверждения.'
              });
              
              // TODO: Request 2FA/email verification
              // TODO: Lock content access
              // TODO: Show verification modal
              
            } else if (riskAssessment.action === 'limit_sessions') {
              // Session limit reached
              console.warn(' Session limit reached');
              
              await createSecurityAlert(firebaseUser.uid, {
                type: 'session_limit',
                riskLevel: 'medium',
                riskScore: riskAssessment.score,
                flags: riskAssessment.flags,
                action: 'limit_sessions',
                session: sessionProfile,
                message: `Достигнут лимит одновременных сессий (${riskAssessment.details.concurrentSessions})`
              });
              
              // TODO: Show session management modal
            }
            
            // Always create alert if requiresReview
            if (riskAssessment.requiresReview) {
              console.log(' Alert created for admin review');
            }
            
          } catch (error) {
            console.warn(' Session logging error:', error.message);
          }

          // Проверка блокировки перенесена выше, сразу после загрузки профиля

          // Check email verification
          setShowVerificationBanner(!firebaseUser.emailVerified);
          
          // Request push notification permission after 2 seconds (give time for app to load)
          setTimeout(async () => {
            try {
              console.log(' Requesting push notification permission...');
              const token = await requestNotificationPermission(firebaseUser.uid);
              if (token) {
                console.log(' Push notifications enabled');
                console.log('✅ Push notifications enabled');
              } else {
                console.warn('⚠️ User denied notification permission');
              }
            } catch (error) {
              console.warn('⚠️ Push notification setup error:', error);
            }
          }, 2000);
        } catch (error) {
          console.error('❌ Error in auth flow:', error);
          // Don't block login completely
        }
      } else {
        setUserProfile(null);
        setShowVerificationBanner(false);
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  // 🔒 REAL-TIME SESSION VALIDATION
  const handleSessionInvalidated = async () => {
    console.error('🚨 Session invalidated - logging out!');
    setShowSessionRevokedModal(true);
    
    // Logout после 3 секунд
    setTimeout(async () => {
      try {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('./firebase/config');
        await signOut(auth);
        localStorage.removeItem('akadil_current_session');
        setLocalSessionId(null);
        setShowSessionRevokedModal(false);
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout error:', error);
      }
    }, 3000);
  };

  // Активировать валидатор сессии
  useSessionValidator(user, localSessionId, handleSessionInvalidated);

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
        {/* Account blocked overlay */}
        {user && isUserBlocked && (
          <BlockedAccountOverlay reason={blockReason} />
        )}
        
        {/* Session Revoked Modal */}
        {showSessionRevokedModal && (
          <SessionRevokedModal
            onClose={() => {
              setShowSessionRevokedModal(false);
              window.location.href = '/login';
            }}
          />
        )}

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
        <main className="lg:pl-16 pt-20 sm:pt-24 pb-16 transition-all duration-300">
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
              
              {/* Admin Routes - Protected by AdminGuard */}
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
              
              {/* 404 Page - catch all */}
              <Route path="*" element={<NotFound />} />
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
