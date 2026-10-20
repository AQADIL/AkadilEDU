import i18n from '../i18n';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '../firebase/messaging';

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';

  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export default function PushPermissionRequest({ userId }) {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [platform] = useState(() => detectPlatform());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    const status = getNotificationPermissionStatus();
    if (status === 'default') {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    if (requesting) return;
    setVisible(false);
  };

  const handleEnable = async () => {
    try {
      setRequesting(true);

      await requestNotificationPermission(userId || undefined);

      setVisible(false);
      setRequesting(false);
    } catch {
      setRequesting(false);
      setVisible(false);
    }
  };

  if (!visible) return null;

  const arrowText = i18n.t('ui.chooseAllowInYourBrowser');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative max-w-sm w-[90%] rounded-3xl border border-white/15 bg-white/10 dark:bg-slate-900/40 shadow-2xl backdrop-blur-xl px-6 py-5 text-center text-slate-900 dark:text-slate-50"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="mb-3 text-lg font-semibold tracking-tight">
              {i18n.t('ui.enableNotifications2')}
            </div>
            <div className="mb-5 text-sm text-slate-700/90 dark:text-slate-200/80">
              {i18n.t('ui.receiveLessonAndTestUpdates')}
            </div>

            <div className="flex items-center justify-center gap-3 mb-3">
              <button
                type="button"
                onClick={handleEnable}
                disabled={requesting}
                className="inline-flex min-w-[110px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-md shadow-emerald-500/40 hover:brightness-110 active:scale-[0.97] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {requesting ? i18n.t('ui.pleaseWait') : i18n.t('courseDetail.quizAdd')}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={requesting}
                className="inline-flex min-w-[80px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 hover:bg-white/20 active:scale-[0.97] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {i18n.t('ui.later')}
              </button>
            </div>

            {requesting && (
              <div className="mt-2 flex flex-col items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200">
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-1.5"
                >
                  <span>{arrowText}</span>
                  <span></span>
                </motion.div>

                {platform === 'ios' && (
                  <motion.div
                    className="mt-1 text-2xl"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.6 }}
                  >
                    ↓
                  </motion.div>
                )}
                {platform === 'android' && (
                  <motion.div
                    className="mt-1 text-2xl"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.6 }}
                  >
                    ↑
                  </motion.div>
                )}
                {platform === 'desktop' && (
                  <motion.div
                    className="mt-1 text-2xl"
                    initial={{ opacity: 0, x: 4, y: 4 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.6 }}
                  ></motion.div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
