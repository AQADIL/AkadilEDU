import { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase/config';
import { sendEmailVerification } from 'firebase/auth';

export default function EmailVerificationBanner({ user, onClose }) {
  const { t } = useTranslation();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  if (!user || user.emailVerified) {
    return null;
  }

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

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1">
            <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {t('emailVerification.title')}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                {t('emailVerification.message')}
              </p>
              {resendSuccess && (
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  ✅ {t('emailVerification.resendSuccess')}
                </p>
              )}
              {resendError && (
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                  ❌ {resendError}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={resending || resendSuccess}
              className="text-xs px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('emailVerification.resending')}
                </>
              ) : (
                t('emailVerification.resendButton')
              )}
            </button>
            <button
              onClick={onClose}
              className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
