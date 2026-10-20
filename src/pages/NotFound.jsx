import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-xl py-24 px-6 text-center space-y-5">
      <p className="text-sm font-semibold text-primary-600" aria-hidden="true">
        404
      </p>
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
        {t('notFound.title')}
      </h1>
      <p className="text-gray-600 dark:text-gray-300">{t('notFound.description')}</p>
      <Link to="/" className="inline-flex px-5 py-3 rounded-xl bg-primary-600 text-white">
        {t('common.home')}
      </Link>
    </section>
  );
}
