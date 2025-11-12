import { LockKeyhole, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Overlay component to show when a user's account is blocked
 */
export default function BlockedAccountOverlay({ reason = null }) {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl animate-fade-in p-6 text-center">
        <div className="bg-red-100 dark:bg-red-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <LockKeyhole className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('security.accountBlocked')}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {reason || t('security.contactSupport')}
        </p>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 text-left mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                {t('security.blockedExplanation')}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {t('security.blockedInstructions')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href="mailto:support@akadil.edu" 
            className="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            {t('security.contactEmail')}
          </a>
          <a 
            href="https://wa.me/+77471234567" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            {t('security.contactWhatsApp')}
          </a>
        </div>
      </div>
    </div>
  );
}
