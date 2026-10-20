import i18n from '../i18n';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle,
  Bot,
  ChevronUp,
  ChevronDown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Info,
} from 'lucide-react';
import katex from 'katex';

const GlassParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white/10 dark:bg-white/5 blur-xl animate-pulse"
        style={{
          width: Math.random() * 40 + 10,
          height: Math.random() * 40 + 10,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `particle ${3 + Math.random() * 5}s ease-in-out infinite alternate`,
          animationDelay: `${Math.random() * 2}s`,
        }}
      />
    ))}
  </div>
);

const GradientBorder = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>
    <div
      className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl opacity-30 blur-sm animate-gradient-move"
      style={{ animation: 'gradient-rotate 3s ease infinite' }}
    />
    <div className="relative h-full w-full rounded-2xl overflow-hidden">{children}</div>
  </div>
);

function RenderLaTeX({ text, className = '' }) {
  if (!text) return null;

  const segments = String(text).split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (!seg) return null;

        const isDisplay = seg.startsWith('$$') && seg.endsWith('$$');
        const isInline = !isDisplay && seg.startsWith('$') && seg.endsWith('$');

        if ((isDisplay || isInline) && seg.length > (isDisplay ? 4 : 2)) {
          const inner = seg.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1).trim();
          try {
            const html = katex.renderToString(inner, {
              throwOnError: false,
              displayMode: isDisplay,
              trust: false,
            });
            return (
              <span
                key={idx}
                className={isDisplay ? 'block my-3 text-lg' : 'inline-block mx-1'}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code
                key={idx}
                className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono"
              >
                {inner}
              </code>
            );
          }
        }
        return <span key={idx}>{seg}</span>;
      })}
    </span>
  );
}

const PremiumButton = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  icon: Icon,
}) => {
  const variants = {
    primary: {
      base: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      hover: 'hover:from-blue-700 hover:to-indigo-700',
      shadow: 'shadow-lg shadow-blue-500/30',
      text: 'text-white',
    },
    secondary: {
      base: 'bg-white dark:bg-gray-800',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
      shadow: 'shadow-sm',
      text: 'text-gray-700 dark:text-gray-200',
    },
    glass: {
      base: 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-md',
      hover: 'hover:bg-white/80 dark:hover:bg-gray-800/80',
      shadow: 'shadow-sm',
      text: 'text-gray-700 dark:text-gray-200',
    },
  };

  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden
        ${v.base} ${v.hover} ${v.shadow} ${v.text}
        px-4 py-2.5 rounded-xl
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        transform active:scale-95
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

      {Icon && <Icon className={`w-5 h-5 ${children ? 'mr-2' : ''}`} />}
      {children}
    </button>
  );
};

function SolutionQuestionCard({ question, questionNum, userAnswer, correctAnswer, solutionText }) {
  const isCorrect = userAnswer === correctAnswer;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/10 group-hover:to-purple-50/10 dark:group-hover:from-blue-900/10 dark:group-hover:to-purple-900/10 transition-all duration-500" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`
              w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${
                isCorrect
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              }
            `}
            >
              {isCorrect ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {i18n.t('ui.question')}
                {questionNum}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-sm font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {isCorrect ? i18n.t('admin.correct') : i18n.t('common.error')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <RenderLaTeX
            text={question}
            className="text-base sm:text-lg text-gray-900 dark:text-gray-100 leading-relaxed"
          />
        </div>

        <div className="space-y-3">
          <div
            className={`
            p-3 rounded-xl text-sm
            ${
              isCorrect
                ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50'
                : 'bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
            }
          `}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {i18n.t('ui.yourAnswer')}
              </span>
            </div>
            <RenderLaTeX
              text={userAnswer}
              className={
                isCorrect
                  ? 'text-emerald-800 dark:text-emerald-200'
                  : 'text-red-800 dark:text-red-200 line-through'
              }
            />
          </div>

          {!isCorrect && (
            <div className="p-3 rounded-xl text-sm bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {i18n.t('ui.correctAnswer')}
                </span>
              </div>
              <RenderLaTeX
                text={correctAnswer}
                className="text-emerald-800 dark:text-emerald-200 font-semibold"
              />
            </div>
          )}
        </div>

        {solutionText && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {i18n.t('ui.solution3')}
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <RenderLaTeX text={solutionText} />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-blue-500/5 to-purple-500/5 rounded-bl-2xl pointer-events-none" />
    </div>
  );
}

export default function SANAFloatingChat({
  questions = [],
  userAnswers = [],
  correctAnswers = [],
  solutions = {},
  isOpen: controlledOpen,
  onToggle: controlledToggle,
  onExportAll,
}) {
  useTranslation();
  const [localOpen, setLocalOpen] = useState(false);
  const [solutionIndex, setSolutionIndex] = useState(0);

  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const toggle =
    controlledToggle !== undefined ? controlledToggle : () => setLocalOpen((prev) => !prev);

  const answeredQuestions = useMemo(() => {
    return questions
      .map((q, i) => {
        const userText = userAnswers[i];
        const correctText = correctAnswers[i];
        const selectedIdx = q.options?.findIndex((o) => o === userText);
        const correctIdx = q.correct;

        const isCorrect = selectedIdx !== undefined && selectedIdx === correctIdx;

        return {
          question: q,
          userAnswer: userText,
          correctAnswer: correctText,
          solution: solutions[q.id] || solutions[i] || q.explanation || null,
          isCorrect: isCorrect,
          selectedIdx: selectedIdx,
          originalIndex: i,
        };
      })

      .filter((item) => item.userAnswer !== undefined && item.userAnswer !== null);
  }, [questions, userAnswers, correctAnswers, solutions]);

  const nextSolution = () => {
    if (solutionIndex < answeredQuestions.length - 1) {
      setSolutionIndex((prev) => prev + 1);
    }
  };

  const prevSolution = () => {
    if (solutionIndex > 0) {
      setSolutionIndex((prev) => prev - 1);
    }
  };

  const handleExportAll = () => {
    if (onExportAll) {
      const exportData = answeredQuestions.map((item, i) => ({
        questionNumber: i + 1,
        question: item.question.text,
        userAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        solution: item.solution,
        isCorrect: item.isCorrect,
      }));
      onExportAll(exportData);
    }
  };

  const wrongCount = answeredQuestions.filter((q) => !q.isCorrect).length;

  if (answeredQuestions.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes gradient-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -30px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes particle {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
        }
        @keyframes check-mark {
          0% { stroke-dasharray: 0 100; opacity: 0; }
          100% { stroke-dasharray: 100 100; opacity: 1; }
        }
        @keyframes cross-mark {
          0% { stroke-dasharray: 0 100; opacity: 0; }
          100% { stroke-dasharray: 100 100; opacity: 1; }
        }
        @keyframes ping-slow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        .animate-gradient-move { animation: gradient-rotate 3s ease infinite; }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-check-mark { animation: check-mark 0.6s ease-out forwards; }
        .animate-cross-mark { animation: cross-mark 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggle}
          className={`
            relative group
            w-16 h-16 rounded-full
            bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
            shadow-2xl shadow-indigo-500/40
            flex items-center justify-center
            transition-all duration-500 ease-out
            hover:scale-110 hover:shadow-indigo-500/60
            active:scale-95
          `}
        >
          <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />

          <div className="relative z-10">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>

          {answeredQuestions.length > 0 && (
            <div
              className={`absolute -top-1 -right-1 w-7 h-7 ${wrongCount > 0 ? 'bg-red-500' : 'bg-emerald-500'} border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center shadow-lg`}
            >
              <span className="text-[10px] font-bold text-white">
                {wrongCount > 0 ? wrongCount : '✓'}
              </span>
            </div>
          )}
        </button>
      </div>

      <div
        className={`
        fixed bottom-24 right-6 z-40
        w-[90vw] max-w-[420px] max-h-[80vh]
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${
          open
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-24 opacity-0 scale-95 pointer-events-none'
        }
      `}
      >
        <div className="relative h-full flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-black/10 backdrop-blur-xl">
          <GlassParticles />

          <GradientBorder className="flex-1">
            <div className="relative z-10 px-5 py-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {i18n.t('ui.sanaAi')}
                      </h3>
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {wrongCount > 0
                        ? i18n.t('review.mistakes', {
                            v0: wrongCount,
                            v1: answeredQuestions.length,
                          })
                        : i18n.t('review.allCorrect', { v0: answeredQuestions.length })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportAll}
                    className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
                    title={i18n.t('ui.exportAll')}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggle}
                    className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm">
              {answeredQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {i18n.t('ui.noQuestionsInThisTest')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {i18n.t('ui.solutions')}
                    </span>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                      {solutionIndex + 1} / {answeredQuestions.length}
                    </span>
                  </div>

                  <div className="animate-fade-in-up">
                    {answeredQuestions[solutionIndex] && (
                      <SolutionQuestionCard
                        question={
                          answeredQuestions[solutionIndex].question.contentText ||
                          answeredQuestions[solutionIndex].question.text
                        }
                        questionNum={answeredQuestions[solutionIndex].originalIndex + 1}
                        userAnswer={answeredQuestions[solutionIndex].userAnswer}
                        correctAnswer={answeredQuestions[solutionIndex].correctAnswer}
                        solutionText={answeredQuestions[solutionIndex].solution}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <PremiumButton
                      onClick={prevSolution}
                      disabled={solutionIndex === 0}
                      variant="glass"
                      icon={ChevronDown}
                      className="w-12 h-12 !p-0 !rounded-xl"
                    >
                      <ChevronDown
                        className={`w-5 h-5 ${solutionIndex === 0 ? 'opacity-30' : ''}`}
                      />
                    </PremiumButton>

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {i18n.t('ui.viewQuestion')}
                    </span>

                    <PremiumButton
                      onClick={nextSolution}
                      disabled={solutionIndex === answeredQuestions.length - 1}
                      variant="primary"
                      icon={ChevronUp}
                      className="w-12 h-12 !p-0 !rounded-xl"
                    >
                      <ChevronUp
                        className={`w-5 h-5 ${solutionIndex === answeredQuestions.length - 1 ? 'opacity-30' : ''}`}
                      />
                    </PremiumButton>
                  </div>
                </>
              )}
            </div>

            <div className="relative z-10 px-5 py-3 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-t border-white/20">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Info className="w-3 h-3" />
                <span>{i18n.t('ui.reviewTheSuppliedAnswersAndExplanationsFor')}</span>
              </div>
            </div>
          </GradientBorder>
        </div>
      </div>
    </>
  );
}
