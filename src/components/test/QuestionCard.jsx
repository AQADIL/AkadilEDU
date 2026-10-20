import i18n from '../../i18n';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import sanitizeHtml from '../../utils/sanitizeHtml';
import MatchingDrag from '../MatchingDrag';
import katex from 'katex';

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswers,
  onAnswerSelect,
}) {
  const { t } = useTranslation();
  const [imageErrors, setImageErrors] = useState(new Set());
  const [selectedOptions, setSelectedOptions] = useState(
    Array.isArray(selectedAnswers) ? selectedAnswers : [],
  );

  useEffect(() => {
    setSelectedOptions(Array.isArray(selectedAnswers) ? selectedAnswers : []);
  }, [selectedAnswers]);

  const isMatching = question?.type === 'matching';

  const isMulti =
    !isMatching &&
    (question?.type === 'multi' || (question?.correct && question.correct.length > 1));

  const maxSelect =
    question?.maxSelect && question.maxSelect > 0 ? question.maxSelect : isMulti ? 3 : 1;

  const sanitizeHTML = (html) => {
    return sanitizeHtml(html);
  };

  const renderItalic = (text, keyPrefix) => {
    if (!text) return null;
    const parts = [];
    const regex = /_(.+?)_/g;
    let lastIndex = 0;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`${keyPrefix}-it-${idx}-n`}>{text.slice(lastIndex, match.index)}</span>,
        );
        idx += 1;
      }
      parts.push(<em key={`${keyPrefix}-it-${idx}-e`}>{match[1]}</em>);
      idx += 1;
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={`${keyPrefix}-it-rest`}>{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  const renderMathInText = (text, keyPrefix) => {
    if (!text) return null;

    const segments = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
    return segments.map((seg, idx) => {
      if (!seg) return null;
      const isDisplay = seg.startsWith('$$') && seg.endsWith('$$');
      const isInline = !isDisplay && seg.startsWith('$') && seg.endsWith('$');

      if ((isDisplay || isInline) && seg.length > (isDisplay ? 4 : 2)) {
        const inner = seg.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1).trim();
        let html = '';
        try {
          html = katex.renderToString(inner, {
            throwOnError: false,
            displayMode: isDisplay,
          });
        } catch {
          return (
            <span
              key={`${keyPrefix}-math-fallback-${idx}`}
              className="inline-flex items-baseline px-1 mx-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[0.95em] align-middle"
            >
              {inner}
            </span>
          );
        }

        return (
          <span
            key={`${keyPrefix}-math-${idx}`}
            className={isDisplay ? 'block my-2' : 'inline-block mx-0.5'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      return (
        <span key={`${keyPrefix}-norm-${idx}`}>
          {renderBoldItalic(seg, `${keyPrefix}-norm-${idx}`)}
        </span>
      );
    });
  };

  const renderBoldItalic = (text, keyPrefix) => {
    if (!text) return null;
    const parts = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const normal = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`${keyPrefix}-b-${idx}-n`}>
            {renderItalic(normal, `${keyPrefix}-b-${idx}-n`)}
          </span>,
        );
        idx += 1;
      }
      parts.push(
        <strong key={`${keyPrefix}-b-${idx}-s`}>
          {renderItalic(match[1], `${keyPrefix}-b-${idx}-s`)}
        </strong>,
      );
      idx += 1;
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      const rest = text.slice(lastIndex);
      parts.push(
        <span key={`${keyPrefix}-b-rest`}>{renderItalic(rest, `${keyPrefix}-b-rest`)}</span>,
      );
    }
    return parts;
  };

  const handleOptionSelect = (optionKey) => {
    if (!question) return;
    const current = Array.isArray(selectedOptions) ? selectedOptions : [];
    let newSelection;

    if (isMulti) {
      if (current.includes(optionKey)) {
        newSelection = current.filter((key) => key !== optionKey);
      } else {
        if (current.length >= maxSelect) {
          return;
        }
        newSelection = [...current, optionKey];
      }
    } else {
      newSelection = [optionKey];
    }

    setSelectedOptions(newSelection);
    onAnswerSelect(question.id, newSelection);
  };

  const handleImageError = (src) => {
    setImageErrors((prev) => new Set([...prev, src]));
  };

  const renderInlineForContext = (content, inlineUrls, photoRef, keyPrefix) => {
    if (!content) return null;

    const parts = content.split(
      /(\[\[img:\s*[^\]]+\]\]|\bPHOTO\b|data:image\/[^^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi,
    );

    return (
      <>
        {parts.map((part, index) => {
          if (!part) return null;

          const markerMatch = part.match(/^\[\[img:\s*([^\]]+)\]\]$/i);
          if (markerMatch) {
            const url = (markerMatch[1] || '').trim();
            if (!url) return null;
            return (
              <img
                key={`${keyPrefix}-marker-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          if (/^PHOTO$/i.test(part.trim())) {
            const urls = Array.isArray(inlineUrls) ? inlineUrls : [];
            const url = urls[photoRef.current] || null;
            photoRef.current += 1;
            if (!url) {
              return <span key={`${keyPrefix}-photo-text-${index}`}>{i18n.t('common.photo')}</span>;
            }
            return (
              <img
                key={`${keyPrefix}-photo-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          if (part.match(/^data:image\/[^^\s]+$/i)) {
            const url = part.trim();
            return (
              <img
                key={`${keyPrefix}-data-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          if (part.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/i)) {
            const url = part.trim();
            return (
              <img
                key={`${keyPrefix}-url-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          return (
            <span key={`${keyPrefix}-text-${index}`}>
              {renderMathInText(part, `${keyPrefix}-txt-${index}`)}
            </span>
          );
        })}
      </>
    );
  };

  const renderContent = (content) => {
    if (!content) return null;

    if (content.includes('<') && content.includes('>')) {
      return (
        <div
          className="question-content prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
        />
      );
    }

    const parts = content.split(
      /(\[\[img:\s*[^\]]+\]\]|\bPHOTO\b|data:image\/[^^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi,
    );

    let photoIndex = 0;

    return (
      <div className="question-content">
        {parts.map((part, index) => {
          if (!part) return null;

          const markerMatch = part.match(/^\[\[img:\s*([^\]]+)\]\]$/i);
          if (markerMatch) {
            const url = (markerMatch[1] || '').trim();
            if (!url) return null;
            return (
              <img
                key={`marker-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          if (/^PHOTO$/i.test(part.trim())) {
            const urls = Array.isArray(question?.inlineImageUrls) ? question.inlineImageUrls : [];
            const url = urls[photoIndex];
            photoIndex += 1;
            if (!url) {
              return <span key={`photo-text-${index}`}>{i18n.t('common.photo')}</span>;
            }
            return (
              <img
                key={`photo-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          if (part.match(/^data:image\/[^^\s]+$/i)) {
            const url = part.trim();
            return (
              <img
                key={`data-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          if (part.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/i)) {
            const url = part.trim();
            return (
              <img
                key={`url-${index}`}
                src={url}
                alt=""
                className="inline-block align-middle max-w-full h-auto my-0.5 mx-1"
                loading="lazy"
                onError={() => handleImageError(url)}
                style={{
                  display: imageErrors.has(url) ? 'none' : 'inline-block',
                  maxHeight: window.innerWidth < 640 ? 140 : 180,
                  objectFit: 'contain',
                }}
              />
            );
          }

          return <span key={`text-${index}`}>{renderMathInText(part, `txt-${index}`)}</span>;
        })}
      </div>
    );
  };

  const renderOption = (optionKey, option) => {
    const selectedArray = Array.isArray(selectedOptions) ? selectedOptions : [];
    const isSelected = selectedArray.includes(optionKey);

    return (
      <button
        key={optionKey}
        data-option={optionKey}
        onClick={() => handleOptionSelect(optionKey)}
        className={`w-full p-2.5 sm:p-3 lg:p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
          isSelected
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-solid shadow-lg'
            : 'border-blue-300 border-dashed hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
        }`}
      >
        <div className="flex items-start space-x-2">
          <div
            className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {optionKey}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {option.type === 'image' && option.image ? (
              <div className="space-y-2">
                {option.value && (
                  <div className="text-gray-900 dark:text-white">{renderContent(option.value)}</div>
                )}
                <img
                  src={option.image}
                  alt={`Option ${optionKey}`}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  loading="lazy"
                  onError={() => handleImageError(option.image)}
                  style={{
                    display: imageErrors.has(option.image) ? 'none' : 'block',
                    maxHeight: '200px',
                    objectFit: 'contain',
                  }}
                />
                {imageErrors.has(option.image) && (
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">{t('test.imageLoadError')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-900 dark:text-white">
                {renderContent(option.value || option.text)}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  if (!question) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{t('test.questionNotFound')}</p>
      </div>
    );
  }

  const isContextQuestion =
    typeof question?.order === 'number' &&
    question.order >= 26 &&
    question.order <= 30 &&
    typeof question.contentHtml === 'string' &&
    question.contentHtml.includes('<hr');

  return (
    <div className="relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-5 bg-repeat-space"
        style={{
          backgroundImage: 'url(/icons/logo-прозрачный.png)',
          backgroundSize: '150px 150px',
          backgroundPosition: 'center',
          zIndex: 1,
        }}
      />

      <div className="relative z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold">
              {t('test.questionNumber', { current: questionNumber, total: totalQuestions })}
            </h2>
            <div className="flex items-center space-x-2 text-blue-100">
              {question.points && (
                <span className="text-xs sm:text-sm">
                  {question.points} {t('test.points')}
                </span>
              )}
            </div>
          </div>

          <div className="w-full bg-blue-500/30 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-white rounded-full h-1.5 sm:h-2 transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            {isContextQuestion ? (
              (() => {
                const html = question.contentHtml || '';
                const [rawContext = '', rawQuestion = ''] = html.split(/<hr\s*\/?>([\s\S]*)/i);
                const contextText = rawContext.trim();
                const questionText = rawQuestion.trim();
                const inlineUrls = Array.isArray(question.inlineImageUrls)
                  ? question.inlineImageUrls
                  : [];
                const photoRef = { current: 0 };

                return (
                  <>
                    {contextText && (
                      <div className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white leading-relaxed mb-3 sm:mb-4">
                        {renderInlineForContext(contextText, inlineUrls, photoRef, 'ctx')}
                      </div>
                    )}

                    {question.imageUrls && question.imageUrls.length > 0 && (
                      <div className="mt-1 sm:mt-2 mb-3 sm:mb-4 space-y-2">
                        {question.imageUrls.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`Question attachment ${index + 1}`}
                            className="max-w-full h-auto rounded-lg shadow-sm mx-auto block"
                            loading="lazy"
                            onError={() => handleImageError(imageUrl)}
                            style={{
                              display: imageErrors.has(imageUrl) ? 'none' : 'block',
                              maxHeight: window.innerWidth < 640 ? 220 : 320,
                              objectFit: 'contain',
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="my-3 sm:my-4">
                      <div className="border-t-2 border-gray-300 dark:border-gray-600 opacity-80" />
                    </div>

                    {questionText && (
                      <div className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white leading-relaxed">
                        {renderInlineForContext(questionText, inlineUrls, photoRef, 'q')}
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                <div className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white leading-relaxed">
                  {question.contentText && renderContent(question.contentText)}
                  {!question.contentText &&
                    question.contentHtml &&
                    renderContent(question.contentHtml)}
                  {!question.contentText &&
                    !question.contentHtml &&
                    question.content &&
                    renderContent(question.content)}
                </div>

                {question.imageUrls && question.imageUrls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {question.imageUrls.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Question attachment ${index + 1}`}
                        className="max-w-full h-auto rounded-lg shadow-sm mx-auto block"
                        loading="lazy"
                        onError={() => handleImageError(imageUrl)}
                        style={{
                          display: imageErrors.has(imageUrl) ? 'none' : 'block',
                          maxHeight: window.innerWidth < 640 ? '200px' : '300px',
                          objectFit: 'contain',
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            {isMatching ? (
              <>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
                  {t('test.matchingHint')}
                </p>
                <MatchingDrag
                  pairs={question.matchPairs || []}
                  value={selectedAnswers || {}}
                  onChange={(value) => onAnswerSelect(question.id, value)}
                  disabled={false}
                  renderLabel={(text) => renderContent(text)}
                />
              </>
            ) : (
              <>
                <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
                  {t('test.selectAnswer')}
                  {isMulti && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                      ({t('test.multipleAnswersAllowed')})
                    </span>
                  )}
                </h3>
                {question.options &&
                  Object.entries(question.options).map(([key, option]) =>
                    renderOption(key, option),
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .pulse-animation {
          animation: pulse 0.3s ease-in-out;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        .question-content img {
          display: block;
          margin: 0.5rem auto;
        }
        
        .watermark-bg {
          background-image: url('/icons/logo-прозрачный.png');
          background-repeat: repeat;
          background-size: 120px 120px;
          opacity: 0.03;
        }
      `}</style>
    </div>
  );
}
