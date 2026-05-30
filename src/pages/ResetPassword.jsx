import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '../firebase/config';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import AppLoader from '../components/AppLoader';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [status, setStatus] = useState('verifying'); // verifying, ready, success, error
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const oobCode = searchParams.get('oobCode');

  // Verify the reset code on component mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setStatus('error');
        setError('Сілтеме дұрыс емес немесе мерзімі өткен');
        return;
      }

      try {
        // Verify the password reset code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setStatus('ready');
      } catch (error) {
        console.error('Verify code error:', error);
        setStatus('error');
        
        switch (error.code) {
          case 'auth/expired-action-code':
            setError('Сілтеменің мерзімі өткен. Жаңа сұрау жіберіңіз.');
            break;
          case 'auth/invalid-action-code':
            setError('Сілтеме дұрыс емес немесе әлдеқашан қолданылған.');
            break;
          case 'auth/user-disabled':
            setError('Бұл аккаунт өшірілген.');
            break;
          default:
            setError('Сілтемені тексеру сәтсіз аяқталды. Қайталап көріңіз.');
        }
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 6) {
      setError('Пароль кемінде 6 таңбадан тұруы керек');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Парольдер сәйкес келмейді');
      return;
    }

    setLoading(true);

    try {
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { passwordReset: true } });
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      
      switch (error.code) {
        case 'auth/expired-action-code':
          setError('Сілтеменің мерзімі өткен. Жаңа сұрау жіберіңіз.');
          break;
        case 'auth/invalid-action-code':
          setError('Сілтеме дұрыс емес немесе әлдеқашан қолданылған.');
          break;
        case 'auth/weak-password':
          setError('Пароль тым әлсіз. Күрделірек пароль таңдаңыз.');
          break;
        default:
          setError('Парольді жаңарту сәтсіз аяқталды. Қайталап көріңіз.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state - verifying code
  if (status === 'verifying') {
    return <AppLoader text="Сілтемені тексеруде..." />;
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Пароль сәтті жаңартылды!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Енді жаңа парольмен кіре аласыз
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Логин бетіне бағыттауда...
          </div>
        </div>
      </div>
    );
  }

  // Error state - invalid or expired link
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Қате орын алды
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/forgot-password')}
              className="btn-primary"
            >
              Жаңа сұрау жіберу
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary"
            >
              Кіруге оралу
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form - ready to reset password
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              AkadilEDU
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Жаңа пароль орнату
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <p className="text-sm text-primary-800 dark:text-primary-300">
              <strong>{email}</strong> үшін жаңа пароль орнатасыз
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Жаңа пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Кемінде 6 таңба
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Парольді растаңыз
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Жаңартылуда...
                </>
              ) : (
                'Парольді жаңарту'
              )}
            </button>
          </form>

          {/* Note */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              💡 Егер хатты көрмесең, <strong>Спам</strong> қалтасын да тексер
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
