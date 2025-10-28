import { useTranslation } from 'react-i18next';

export default function MyCourses() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {t('sidebar.myCourses')}
      </h1>
      
      <div className="card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Your enrolled courses will appear here...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          This page will be implemented with Firebase integration in Prompt 2.
        </p>
      </div>
    </div>
  );
}
