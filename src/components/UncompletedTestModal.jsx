import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle, Play, X } from 'lucide-react';

export default function UncompletedTestModal({ 
  uncompletedTest, 
  onContinue, 
  onAbandon, 
  onClose 
}) {
  const { t } = useTranslation();

  if (!uncompletedTest) return null;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('test.uncompletedTestWarning')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Test Info */}
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {uncompletedTest.testTitle}
            </h4>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>{t('test.timeRemaining')}:</span>
                <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 font-medium">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(uncompletedTest.timeLeft)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>{t('test.answered')}:</span>
                <span className="font-medium">
                  {uncompletedTest.totalAnswered} {t('test.questions')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>{t('test.currentQuestion')}:</span>
                <span className="font-medium">
                  {uncompletedTest.currentQuestionIndex + 1}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>{t('test.lastSaved')}:</span>
                <span className="font-medium">
                  {formatDate(uncompletedTest.lastSaved)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('test.uncompletedTestDescription')}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>{t('test.continueTest')}</span>
          </button>
          
          <button
            onClick={onAbandon}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {t('test.abandonTest')}
          </button>
        </div>

        {/* Warning Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          {t('test.abandonWarning')}
        </p>
      </div>
    </div>
  );
}
