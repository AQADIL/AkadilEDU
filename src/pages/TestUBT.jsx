import { useTranslation } from 'react-i18next';

export default function TestUBT() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {t('sidebar.testUBT')}
      </h1>
      
      <div className="card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          UBT practice tests coming soon...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          This page will be implemented with test functionality later.
        </p>
      </div>
    </div>
  );
}
