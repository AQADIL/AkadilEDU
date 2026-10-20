import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUp, HelpCircle } from 'lucide-react';

export default function CourseQuotes() {
  const { t } = useTranslation();
  const quotes = t('courseDetail.quotes', { returnObjects: true });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [showShareHelp, setShowShareHelp] = useState(false);
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const gestureRef = useRef(null);
  const [swipe, setSwipe] = useState(null);
  const gradientId = useId();
  const helpId = useId();
  const quote = quotes[quoteIndex];

  const nextQuote = () => {
    if (gestureRef.current || swipe) return;
    setQuoteIndex(
      (current) => (current + 1 + Math.floor(Math.random() * (quotes.length - 1))) % quotes.length,
    );
  };

  useEffect(() => {
    const section = sectionRef.current;
    let timer;
    let settling = false;

    const reset = () => {
      clearTimeout(timer);
      gestureRef.current = null;
      settling = false;
      setSwipe(null);
    };

    const settle = (complete) => {
      const gesture = gestureRef.current;
      if (!gesture || settling) return;
      settling = true;
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280;
      setSwipe({ ...gesture, distance: complete ? gesture.height : 0, settling: true, duration });
      timer = setTimeout(() => {
        if (complete) setQuoteIndex(gesture.nextIndex);
        reset();
      }, duration);
    };

    const start = (event) => {
      if (settling || window.matchMedia('(min-width: 1024px)').matches) return;
      if (event.touches.length !== 1) {
        settle(false);
        return;
      }
      if (
        event.target.closest('button, a, input, textarea, select') &&
        !event.target.closest('[data-quote-swipe]')
      )
        return;
      const touch = event.touches[0];
      const rect = cardRef.current.getBoundingClientRect();
      if (touch.clientY < Math.max(rect.top, Math.min(rect.bottom, window.innerHeight) - 150))
        return;
      gestureRef.current = {
        identifier: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        lastY: touch.clientY,
        lastTime: event.timeStamp,
        samples: [{ y: touch.clientY, time: event.timeStamp }],
        velocity: 0,
        distance: 0,
        height: rect.height,
        nextIndex:
          (quoteIndex + 1 + Math.floor(Math.random() * (quotes.length - 1))) % quotes.length,
        locked: false,
      };
    };

    const move = (event) => {
      const gesture = gestureRef.current;
      if (!gesture || settling) return;
      if (event.touches.length !== 1) {
        settle(false);
        return;
      }
      const touch = Array.from(event.touches).find(
        (item) => item.identifier === gesture.identifier,
      );
      if (!touch) return;
      const vertical = gesture.y - touch.clientY;
      const horizontal = Math.abs(gesture.x - touch.clientX);
      if (!gesture.locked) {
        if (vertical < -8 || (horizontal > 8 && horizontal > vertical)) {
          reset();
          return;
        }
        if (vertical < 8) return;
        gesture.locked = true;
      }
      if (!event.cancelable) {
        reset();
        return;
      }
      event.preventDefault();
      gesture.distance = Math.max(0, Math.min(vertical, gesture.height));
      const recent = gesture.samples.filter((sample) => event.timeStamp - sample.time <= 100);
      const first = recent[0] || gesture.samples[gesture.samples.length - 1];
      gesture.velocity =
        touch.clientY < gesture.lastY
          ? (first.y - touch.clientY) / Math.max(1, event.timeStamp - first.time)
          : 0;
      gesture.samples = [...recent, { y: touch.clientY, time: event.timeStamp }];
      gesture.lastY = touch.clientY;
      gesture.lastTime = event.timeStamp;
      setSwipe({ ...gesture });
    };

    const end = (event) => {
      const gesture = gestureRef.current;
      if (!gesture || settling) return;
      if (
        !Array.from(event.changedTouches).some((touch) => touch.identifier === gesture.identifier)
      )
        return;
      if (!gesture.locked) {
        reset();
        return;
      }
      const flick =
        gesture.distance > 60 && gesture.velocity > 0.5 && event.timeStamp - gesture.lastTime < 120;
      settle(gesture.distance >= Math.min(180, gesture.height * 0.35) || flick);
    };

    const cancel = () => settle(false);
    section.addEventListener('touchstart', start, { passive: true });
    section.addEventListener('touchmove', move, { passive: false });
    section.addEventListener('touchend', end);
    section.addEventListener('touchcancel', cancel);
    window.addEventListener('resize', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      clearTimeout(timer);
      gestureRef.current = null;
      section.removeEventListener('touchstart', start);
      section.removeEventListener('touchmove', move);
      section.removeEventListener('touchend', end);
      section.removeEventListener('touchcancel', cancel);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, [quoteIndex, quotes.length]);

  const renderQuote = (displayQuote, preview = false) => (
    <>
      <svg
        className="absolute inset-0 w-full h-full opacity-5 dark:opacity-10 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`${gradientId}-${preview ? 'next' : 'current'}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgb(59, 130, 246)" />
            <stop offset="100%" stopColor="rgb(147, 51, 234)" />
          </linearGradient>
        </defs>
        <circle
          cx="10"
          cy="10"
          r="40"
          fill={`url(#${gradientId}-${preview ? 'next' : 'current'})`}
        />
        <circle
          cx="90"
          cy="90"
          r="40"
          fill={`url(#${gradientId}-${preview ? 'next' : 'current'})`}
        />
      </svg>
      <div className="relative max-w-3xl mx-auto text-center space-y-8">
        <img
          src="/icons/logo-прозрачный.png"
          alt={t('ui.akadileduLogo')}
          className="w-28 h-28 sm:w-36 sm:h-36 object-contain mx-auto"
        />
        <blockquote className="space-y-6" aria-live={preview ? 'off' : 'polite'} aria-atomic="true">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
            &ldquo;{displayQuote.text}&rdquo;
          </p>
          <footer className="flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-primary-200 dark:bg-primary-700" aria-hidden="true" />
            <cite className="text-base sm:text-lg text-primary-600 dark:text-primary-400 font-semibold not-italic">
              {displayQuote.author}
            </cite>
            <span className="h-px w-12 bg-primary-200 dark:bg-primary-700" aria-hidden="true" />
          </footer>
        </blockquote>
        <button
          type="button"
          tabIndex={preview ? -1 : undefined}
          onClick={() => setShowShareHelp((shown) => !shown)}
          aria-expanded={showShareHelp}
          aria-controls={preview ? undefined : helpId}
          aria-label={t('courseDetail.quoteShare')}
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
        >
          <HelpCircle className="w-5 h-5" aria-hidden="true" />
        </button>
        <p
          id={preview ? undefined : helpId}
          hidden={!showShareHelp}
          className="text-sm text-gray-600 dark:text-gray-300"
        >
          {t('courseDetail.quoteShareHelp')}
        </p>
      </div>
    </>
  );

  const progress = swipe ? swipe.distance / swipe.height : 0;
  const inset = 30 * (1 - progress);

  return (
    <section ref={sectionRef} className="relative" aria-label={t('courseDetail.quoteTitle')}>
      <div
        ref={cardRef}
        className="min-h-[60vh] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-12 relative overflow-hidden"
      >
        {renderQuote(quote)}
        {swipe && (
          <div
            aria-hidden="true"
            data-quote-preview
            className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 p-6 sm:p-12 pointer-events-none motion-reduce:transition-none"
            style={{
              transform: `translateY(${swipe.height - swipe.distance}px)`,
              clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%)`,
              transition: swipe.settling
                ? `transform ${swipe.duration}ms cubic-bezier(0.16, 1, 0.3, 1), clip-path ${swipe.duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
                : 'none',
            }}
          >
            {renderQuote(quotes[swipe.nextIndex], true)}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-3 pt-6">
        <button
          type="button"
          onClick={nextQuote}
          disabled={Boolean(swipe)}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          {t('courseDetail.quoteNext')}
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          data-quote-swipe
          onClick={nextQuote}
          aria-label={t('courseDetail.quoteNext')}
          className="lg:hidden flex min-h-11 flex-col items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
        >
          <span className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
          <span className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
            {t('courseDetail.quoteSwipe')}
          </span>
        </button>
      </div>
    </section>
  );
}
