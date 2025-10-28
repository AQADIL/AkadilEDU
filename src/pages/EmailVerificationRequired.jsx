import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, RefreshCw, Loader2, CheckCircle, LogOut } from 'lucide-react';
import { auth } from '../firebase/config';
import { sendEmailVerification } from 'firebase/auth';
import { logout } from '../firebase/auth';

export default function EmailVerificationRequired() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [checking, setChecking] = useState(false);

  const user = auth.currentUser;
  const userEmail = user?.email || '';

  const handleResend = async () => {
    setResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      await sendEmailVerification(auth.currentUser);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Resend verification error:', error);
      
      if (error.code === 'auth/too-many-requests') {
        setResendError(t('auth.errors.tooManyRequests'));
      } else {
        setResendError(t('auth.errors.resendFailed'));
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      // Reload user to get latest emailVerified status
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        // Email verified! Redirect to home
        navigate('/');
        window.location.reload(); // Force reload to update auth state
      } else {
        // Still not verified
        setResendError(t('emailVerification.notYetVerified'));
        setTimeout(() => setResendError(''), 3000);
      }
    } catch (error) {
      console.error('Check verification error:', error);
      setResendError(t('emailVerification.checkFailed'));
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 overflow-auto animate-gradient">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(0.9); }
          66% { transform: translate(20px, -20px) scale(1.1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(15px, 15px) rotate(180deg); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4 py-4 sm:py-8">
        <div className="w-full max-w-2xl my-4 sm:my-8">
          {/* Main Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Header with Icon */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-10 text-center relative overflow-hidden animate-gradient-header">
              <div className="absolute inset-0 bg-grid-white/10"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-bounce shadow-2xl ring-4 ring-white/30">
                  <Mail className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white drop-shadow-2xl" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 drop-shadow-2xl px-4">
                  {t('emailVerification.verificationRequired')}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl font-medium drop-shadow-lg text-blue-50 px-4">
                  {t('emailVerification.almostThere')}
                </p>
              </div>
              
              <style jsx>{`
                @keyframes gradient-header {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                .animate-gradient-header {
                  background-size: 200% 200%;
                  animation: gradient-header 6s ease infinite;
                }
              `}</style>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6">
              {/* Email Display */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg">
                  {t('emailVerification.sentVerificationTo')}
                </p>
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-xl p-3 sm:p-4 lg:p-5 border-2 border-blue-300 dark:border-blue-700 shadow-lg animate-gradient-box">
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-100 break-all">
                    {userEmail}
                  </p>
                  
                  <style jsx>{`
                    @keyframes gradient-box {
                      0% { border-color: rgb(147 197 253); }
                      33% { border-color: rgb(165 180 252); }
                      66% { border-color: rgb(196 181 253); }
                      100% { border-color: rgb(147 197 253); }
                    }
                    .animate-gradient-box {
                      animation: gradient-box 4s ease infinite;
                    }
                  `}</style>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 border-2 border-blue-200 dark:border-blue-800 shadow-lg animate-gradient-border">
                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 sm:mb-4 lg:mb-5 flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
                  <span className="text-2xl sm:text-3xl">📬</span>
                  {t('emailVerification.howToVerify')}
                </h3>
                <ol className="space-y-3 sm:space-y-4 text-sm sm:text-base text-blue-900 dark:text-blue-200">
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md animate-gradient-badge">1</span>
                    <span className="pt-0.5 sm:pt-1">{t('emailVerification.step1Check')}</span>
                  </li>
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md animate-gradient-badge">2</span>
                    <span className="pt-0.5 sm:pt-1">{t('emailVerification.step2FindEmail')}</span>
                  </li>
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md animate-gradient-badge">3</span>
                    <span className="pt-0.5 sm:pt-1">{t('emailVerification.step3ClickLink')}</span>
                  </li>
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md animate-gradient-badge">4</span>
                    <span className="pt-0.5 sm:pt-1">{t('emailVerification.step4ReturnHere')}</span>
                  </li>
                </ol>
                
                <style jsx>{`
                  @keyframes gradient-badge {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }
                  .animate-gradient-badge {
                    background-size: 200% 200%;
                    animation: gradient-badge 3s ease infinite;
                  }
                  .animate-gradient-border {
                    animation: gradient-box 5s ease infinite;
                  }
                `}</style>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                      {t('emailVerification.checkSpamWarning')}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      {t('emailVerification.spamExplanation')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success/Error Messages */}
              {resendSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                    {t('emailVerification.resendSuccess')}
                  </p>
                </div>
              )}

              {resendError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    {resendError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 pt-2">
                {/* Check Verification */}
                <button
                  onClick={handleCheckVerification}
                  disabled={checking}
                  className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 sm:gap-3 shadow-xl animate-gradient-button"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      <span className="text-sm sm:text-base lg:text-lg">{t('emailVerification.checking')}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-sm sm:text-base lg:text-lg">{t('emailVerification.iVerified')}</span>
                    </>
                  )}
                </button>

                {/* Resend Email */}
                <button
                  onClick={handleResend}
                  disabled={resending || resendSuccess}
                  className="w-full px-6 py-3 sm:px-8 sm:py-4 bg-white dark:bg-gray-700 border-2 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl hover:bg-blue-50 dark:hover:bg-gray-600 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 animate-border-pulse"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      <span className="text-sm sm:text-base">{t('emailVerification.resending')}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-sm sm:text-base">{t('emailVerification.resendEmail')}</span>
                    </>
                  )}
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-3 sm:px-8 sm:py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-base sm:text-lg rounded-xl sm:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{t('emailVerification.logoutAndTryAnother')}</span>
                </button>
              </div>
              
              {/* Button Animations */}
              <style jsx>{`
                @keyframes gradient-button {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes border-pulse {
                  0%, 100% { border-color: rgb(37 99 235); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                  50% { border-color: rgb(79 70 229); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
                }
                .animate-gradient-button {
                  background-size: 200% 200%;
                  animation: gradient-button 4s ease infinite;
                }
                .animate-border-pulse {
                  animation: border-pulse 2s ease infinite;
                }
              `}</style>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              {t('emailVerification.needHelp')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
