import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen } from 'lucide-react';
import MyCourses from './MyCourses';

export default function Home({ user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('mode') && searchParams.get('oobCode')) {
      navigate('/__/auth/action?' + searchParams.toString(), { replace: true });
    }
  }, [searchParams, navigate]);
  if (user?.emailVerified) return <MyCourses />;
  return (
    <section className="py-12 sm:py-20 max-w-3xl">
      <BookOpen className="w-12 h-12 text-primary-600 mb-8" aria-hidden="true" />
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
        {t('home.welcome')}
      </h1>
      <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-xl">
        {t('home.introduction')}
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          className="btn-primary inline-flex items-center gap-3"
          to={user ? '/email-verification-required' : '/login'}
        >
          {user ? t('auth.checkEmail') : t('auth.signIn')}
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>
        {!user && (
          <Link className="btn-secondary" to="/signup">
            {t('auth.signup')}
          </Link>
        )}
      </div>
    </section>
  );
}
