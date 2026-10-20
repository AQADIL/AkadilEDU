import i18n from '../i18n';
export default function AppLoader({ text = i18n.t('common.loading'), fullScreen = true }) {
  const containerClass = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'
    : 'flex items-center justify-center w-full';

  return (
    <div className={containerClass}>
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <span className="app-loader-eye" aria-label={i18n.t('ui.loading')} />
        </div>
        {text && (
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm sm:text-base">{text}</p>
        )}
        <style>{`
          :root {
            --loader-eye-bg: #ffffff;
            --loader-eye-border: rgb(2,60,115);
            --loader-eye-lid: rgb(1,45,90);
            --loader-eye-pupil: rgb(2,60,115);
          }

          .dark {
            --loader-eye-bg: #020617;
            --loader-eye-border: rgb(2,60,115);
            --loader-eye-lid: #020617;
            --loader-eye-pupil: rgb(2,60,115);
          }
          .app-loader-eye {
            position: relative;
            width: 78px;
            height: 78px;
            border-radius: 50%;
            background: var(--loader-eye-bg);
            border: 8px solid var(--loader-eye-border);
            overflow: hidden;
            box-sizing: border-box;
          }

          .app-loader-eye::after {
            content: '';
            position: absolute;
            left: 0;
            top: -50%;
            width: 100%;
            height: 100%;
            background: var(--loader-eye-lid);
            z-index: 5;
            border-bottom: 8px solid var(--loader-eye-border);
            box-sizing: border-box;
            animation: eyeShade 3s infinite;
          }

          .app-loader-eye::before {
            content: '';
            position: absolute;
            left: 20px;
            bottom: 15px;
            width: 32px;
            height: 32px;
            z-index: 2;
            background: var(--loader-eye-pupil);
            border-radius: 50%;
            animation: eyeMove 3s infinite;
          }

          @keyframes eyeShade {
            0% { transform: translateY(0); }
            20% { transform: translateY(5px); }
            40%, 50% { transform: translateY(-5px); }
            60% { transform: translateY(-8px); }
            75% { transform: translateY(5px); }
            100% { transform: translateY(10px); }
          }

          @keyframes eyeMove {
            0% { transform: translate(0, 0); }
            20% { transform: translate(0, 5px); }
            40%, 50% { transform: translate(0, -5px); }
            60% { transform: translate(-10px, -5px); }
            75% { transform: translate(-20px, 5px); }
            100% { transform: translate(0, 10px); }
          }
        `}</style>
      </div>
    </div>
  );
}
