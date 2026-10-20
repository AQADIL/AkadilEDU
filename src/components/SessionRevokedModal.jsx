import { AlertTriangle, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SessionRevokedModal({ onClose }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-4">
            <AlertTriangle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
          {t('security.sessionRevoked.title')}
        </h2>

        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          {t('security.sessionRevoked.message')}
        </p>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <LogOut className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900 dark:text-orange-200">
              <p className="font-semibold mb-1">{t('security.sessionRevoked.reason')}</p>
              <p>{t('security.sessionRevoked.explanation')}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {t('security.sessionRevoked.button')}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          {t('security.sessionRevoked.help')}
        </p>
      </div>
    </div>
  );
}
