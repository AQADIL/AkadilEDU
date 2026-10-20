import i18n from '../i18n';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@headlessui/react';
import { Cookie, Settings, X } from 'lucide-react';
import { storage } from '../utils/storage';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const hasConsent = storage.hasConsent();
    if (!hasConsent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    storage.giveConsent();
    setShowBanner(false);
  };

  const handleDecline = () => {
    setShowBanner(false);
  };

  const handleClearData = () => {
    if (confirm(t('cookie.clearConfirm'))) {
      storage.clearAll();
      window.location.reload();
    }
  };

  if (!showBanner) {
    return (
      <>
        <button
          onClick={() => setShowSettings(true)}
          className="fixed bottom-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow z-40"
          aria-label={t('cookie.settings')}
        >
          <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <SettingsDialog
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onClearData={handleClearData}
        />
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Cookie className="w-8 h-8 text-primary-500" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('cookie.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('cookie.message')}</p>

              <div className="flex flex-wrap gap-3">
                <button onClick={handleAccept} className="btn-primary">
                  {t('cookie.accept')}
                </button>
                <button onClick={handleDecline} className="btn-secondary">
                  {t('cookie.decline')}
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors"
                >
                  {t('cookie.settings')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onClearData={handleClearData}
      />
    </>
  );
}

function SettingsDialog({ isOpen, onClose, onClearData }) {
  const { t } = useTranslation();
  const hasConsent = storage.hasConsent();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('cookie.settings')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {i18n.t('ui.essentialStorage')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {i18n.t('ui.usedForAuthenticationAndSavedPreferences')}
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>
                  <code className="text-xs">{i18n.t('ui.aktheme')}</code>
                  {i18n.t('ui.themePreference')}
                </li>
                <li>
                  <code className="text-xs">{i18n.t('ui.aklang')}</code>
                  {i18n.t('ui.languagePreference')}
                </li>
                <li>
                  <code className="text-xs">{i18n.t('ui.akconsent')}</code>
                  {i18n.t('ui.consentPreference')}
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {i18n.t('ui.profileData')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {i18n.t('ui.yourAccountProfileIsStoredInFirebase')}
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>
                  <code className="text-xs">{i18n.t('ui.usersprofile')}</code>
                  {i18n.t('ui.yourProfileInformation')}
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {i18n.t('ui.status')}
                <span className="font-medium text-gray-900 dark:text-white">
                  {hasConsent ? 'Accepted' : 'Not accepted'}
                </span>
              </p>

              <button
                onClick={onClearData}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                {t('cookie.clear')}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
