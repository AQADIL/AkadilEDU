import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TopNavigator({ questions, currentIndex, onQuestionSelect }) {
  const { t } = useTranslation();

  const answeredCount = questions.filter(q => q.answered).length;
  const remainingCount = questions.length - answeredCount;

  const scrollToQuestion = (index) => {
    const element = document.getElementById(`question-pill-${index}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      });
    }
  };

  const handleQuestionClick = (index) => {
    onQuestionSelect(index);
    scrollToQuestion(index);
  };

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30 sticky top-12 sm:top-16 z-20">
      <div className="container mx-auto px-2 sm:px-4 py-1.5 sm:py-2 max-w-5xl">
        {/* Question Navigator */}
        <div className="relative">
          <div 
            id="question-navigator-container"
            className="overflow-x-auto scrollbar-hide"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitScrollbar: { display: 'none' }
            }}
          >
            <div className="flex space-x-1 sm:space-x-1.5 py-1 min-w-max justify-center">
              {questions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered = question.answered;
                
                return (
                  <button
                    key={question.id || index}
                    id={`question-pill-${index}`}
                    onClick={() => handleQuestionClick(index)}
                    className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
                      isCurrent
                        ? 'bg-blue-500 text-white shadow-md ring-1 ring-blue-300 dark:ring-blue-700'
                        : isAnswered
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimal Progress bar */}
          <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-0.5">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-0.5 rounded-full transition-all duration-500"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </div>
  );
}
