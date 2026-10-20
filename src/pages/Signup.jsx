import i18n from '../i18n';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { signupWithEmail, loginWithGoogle } from '../firebase/auth';

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setError(i18n.t('ui.enterYourFullName'));
      return false;
    }

    if (!formData.email) {
      setError(i18n.t('ui.enterYourEmail'));
      return false;
    }

    if (formData.password.length < 6) {
      setError(i18n.t('ui.passwordMustContainAtLeast_6Characters2'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(i18n.t('ui.passwordsDoNotMatch'));
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signupWithEmail(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/email-verification-required');
      }, 1500);
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError(i18n.t('ui.anAccountWithThisEmailAlreadyExists'));
          break;
        case 'auth/invalid-email':
          setError(i18n.t('auth.errors.invalidEmail'));
          break;
        case 'auth/weak-password':
          setError(i18n.t('ui.useAPasswordWithAtLeast_6'));
          break;
        default:
          setError(error.message || i18n.t('auth.errors.signupFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();

      navigate('/');
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError(i18n.t('ui.signupCancelled'));
      } else {
        setError(i18n.t('ui.googleSignupFailedTryAgain'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t('auth.checkYourEmail')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.verificationEmailSentTo')}
          </p>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
              {formData.email}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
              {t('auth.importantNote')}
            </p>
            <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
              <li>• {t('auth.checkSpamFolder')}</li>
              <li>• {t('auth.clickLinkInEmail')}</li>
              <li>• {t('auth.dontCloseThisPage')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-2">
              {t('auth.whatToDoNext')}
            </p>
            <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-2 list-decimal list-inside">
              <li>{t('auth.step1OpenEmail')}</li>
              <li>{t('auth.step2FindLetter')}</li>
              <li>{t('auth.step3ClickButton')}</li>
              <li>{t('auth.step4ReturnAndLogin')}</li>
            </ol>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('auth.afterVerification')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              {t('auth.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{i18n.t('ui.a')}</span>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {i18n.t('header.logo')}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('auth.createAccount')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              {t('auth.emailVerificationNote')}
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                htmlFor="signup-field-0"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('auth.firstName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-field-0"
                  name="firstName"
                  autoComplete="given-name"
                  type="text"

                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={i18n.t('ui.firstName')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-field-1"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('auth.lastName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-field-1"
                  name="lastName"
                  autoComplete="family-name"
                  type="text"

                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={i18n.t('ui.lastName')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-field-2"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-field-2"
                  name="email"
                  autoComplete="email"
                  type="email"

                  value={formData.email}
                  onChange={handleChange}
                  placeholder={i18n.t('ui.youremailcom')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-field-3"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-field-3"
                  name="password"
                  autoComplete="new-password"
                  type="password"

                  value={formData.password}
                  onChange={handleChange}
                  placeholder={i18n.t('language.russian2')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-field-4"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-field-4"
                  name="confirmPassword"
                  autoComplete="new-password"
                  type="password"

                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={i18n.t('language.russian2')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('auth.creatingAccount')}
                </>
              ) : (
                t('auth.signUp')
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-3 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('auth.google')}
          </button>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              {t('auth.signInHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
