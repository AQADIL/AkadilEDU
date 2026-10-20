import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUp, HelpCircle } from 'lucide-react';

export default function CourseQuotes() {
  const { t } = useTranslation();
  const quotes = t('courseDetail.quotes', { returnObjects: true });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [showShareHelp, setShowShareHelp] = useState(false);
  const touchStart = useRef(null);
  const gradientId = useId();
  const helpId = useId();
  const quote = quotes[quoteIndex];

  const nextQuote = () => {
    setQuoteIndex((current) => {
      const offset = 1 + Math.floor(Math.random() * (quotes.length - 1));
      return (current + offset) % quotes.length;
    });
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const verticalDistance = start.y - touch.clientY;
    const horizontalDistance = Math.abs(start.x - touch.clientX);
    if (verticalDistance >= 80 && verticalDistance > horizontalDistance * 2) nextQuote();
  };

  return (
    <section className="relative" aria-label={t('courseDetail.quoteTitle')}>
      <div
        className="min-h-[60vh] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-12 relative overflow-hidden"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full opacity-5 dark:opacity-10 pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" />
              <stop offset="100%" stopColor="rgb(147, 51, 234)" />
            </linearGradient>
          </defs>
          <circle cx="10" cy="10" r="40" fill={`url(#${gradientId})`} />
          <circle cx="90" cy="90" r="40" fill={`url(#${gradientId})`} />
        </svg>
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <img
            src="/icons/logo-прозрачный.png"
            alt={t('ui.akadileduLogo')}
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain mx-auto"
          />
          <blockquote className="space-y-6" aria-live="polite" aria-atomic="true">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer className="flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-primary-200 dark:bg-primary-700" aria-hidden="true" />
              <cite className="text-base sm:text-lg text-primary-600 dark:text-primary-400 font-semibold not-italic">
                {quote.author}
              </cite>
              <span className="h-px w-12 bg-primary-200 dark:bg-primary-700" aria-hidden="true" />
            </footer>
          </blockquote>
          <button
            type="button"
            onClick={() => setShowShareHelp((shown) => !shown)}
            aria-expanded={showShareHelp}
            aria-controls={helpId}
            aria-label={t('courseDetail.quoteShare')}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </button>
          <p
            id={helpId}
            hidden={!showShareHelp}
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            {t('courseDetail.quoteShareHelp')}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 pt-6">
        <button
          type="button"
          onClick={nextQuote}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          {t('courseDetail.quoteNext')}
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
        <p className="lg:hidden flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
          {t('courseDetail.quoteSwipe')}
        </p>
      </div>
    </section>
  );
}
