import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle } from 'lucide-react';
import { auth } from '../firebase/config';
import { applyActionCode } from 'firebase/auth';
import AppLoader from '../components/AppLoader';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      // Проверяем что это email verification action
      if (mode !== 'verifyEmail' || !oobCode) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      try {
        // Применяем код верификации
        await applyActionCode(auth, oobCode);
        
        // Обновляем текущего пользователя
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }

        setStatus('success');

        // Redirect на login через 3 секунды
        setTimeout(() => {
          navigate('/login', { 
            state: { emailVerified: true } 
          });
        }, 3000);

      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');

        switch (error.code) {
          case 'auth/expired-action-code':
            setError(t('auth.errors.expiredCode'));
            break;
          case 'auth/invalid-action-code':
            setError(t('auth.errors.invalidCode'));
            break;
          case 'auth/user-disabled':
            setError(t('auth.errors.userDisabled'));
            break;
          default:
            setError(t('auth.errors.verificationFailed'));
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate, t]);

  if (status === 'loading') {
    return <AppLoader text={t('auth.verifying')} />;
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t('auth.emailVerified')} 🎉
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.emailVerifiedMessage')}
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ✅ {t('auth.nowYouCanLogin')}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t('auth.redirectingToLogin')}
          </p>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {t('auth.verificationFailed')} ❌
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/signup')}
            className="w-full btn-primary"
          >
            {t('auth.tryAgain')}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('auth.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
