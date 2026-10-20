import i18n from '../i18n';
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
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        await auth.currentUser.getIdToken(true);
        navigate('/');
        window.location.reload();
      } else {
        setResendError(t('emailVerification.notYetVerified'));
        setTimeout(() => setResendError(''), 3000);
      }
    } catch {
      setResendError(t('emailVerification.checkFailed'));
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/10 dark:bg-primary-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <style>{`
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

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12">
        <div className="w-full max-w-3xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
            <div className="relative p-8 sm:p-12 text-center overflow-hidden bg-gradient-to-br from-primary-500 to-blue-600 dark:from-primary-600 dark:to-blue-700">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/20">
                  <Mail className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  {t('emailVerification.verificationRequired')}
                </h1>
                <p className="text-lg sm:text-xl text-white/90 font-medium">
                  {t('emailVerification.almostThere')}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-12 space-y-6">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-base sm:text-lg">
                  {t('emailVerification.sentVerificationTo')}
                </p>
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 sm:p-5 border-2 border-primary-200 dark:border-primary-700">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {i18n.t('ui.emailSentTo')}
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-primary-900 dark:text-primary-100 break-all">
                    {userEmail}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3 text-lg">
                  <span className="text-2xl"></span>
                  {t('emailVerification.howToVerify')}
                </h3>
                <ol className="space-y-4 text-base">
                  <li className="flex gap-4 items-start group">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                      1
                    </span>
                    <span className="pt-1 text-gray-700 dark:text-gray-300">
                      {t('emailVerification.step1Check')}
                    </span>
                  </li>
                  <li className="flex gap-4 items-start group">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                      2
                    </span>
                    <span className="pt-1 text-gray-700 dark:text-gray-300">
                      {t('emailVerification.step2FindEmail')}
                    </span>
                  </li>
                  <li className="flex gap-4 items-start group">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                      3
                    </span>
                    <span className="pt-1 text-gray-700 dark:text-gray-300">
                      {t('emailVerification.step3ClickLink')}
                    </span>
                  </li>
                  <li className="flex gap-4 items-start group">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                      4
                    </span>
                    <span className="pt-1 text-gray-700 dark:text-gray-300">
                      {t('emailVerification.step4ReturnHere')}
                    </span>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex gap-3">
                  <span className="text-2xl"></span>
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

              <div className="grid grid-cols-1 gap-4 pt-4">
                <button
                  onClick={handleCheckVerification}
                  disabled={checking}
                  className="w-full px-8 py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('emailVerification.checking')}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>{t('emailVerification.iVerified')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResend}
                  disabled={resending || resendSuccess}
                  className="w-full px-8 py-4 bg-white dark:bg-gray-700 border-2 border-primary-600 dark:border-primary-500 text-primary-700 dark:text-primary-400 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-gray-600 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('emailVerification.resending')}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>{t('emailVerification.resendEmail')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t('emailVerification.logoutAndTryAnother')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('emailVerification.needHelp')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
