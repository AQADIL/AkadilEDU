import i18n from '../../i18n';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Eye,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  Type,
  Link,
} from 'lucide-react';
import sanitizeHtml from '../../utils/sanitizeHtml';
import MatchingDrag from '../MatchingDrag';
import katex from 'katex';

export default function QuestionEditor({ question, onSave, onCancel }) {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const [formData, setFormData] = useState({
    contentHtml: '',
    contentText: '',
    imageUrls: [],
    inlineImageUrls: [],
    options: {
      A: { type: 'text', value: '', image: null },
      B: { type: 'text', value: '', image: null },
      C: { type: 'text', value: '', image: null },
      D: { type: 'text', value: '', image: null },
    },
    correct: ['A'],
    points: 1,
    order: 1,
    matchLeft: ['', ''],
    matchRight: ['', '', '', ''],
    matchCorrect: ['', ''],
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [contentMode] = useState('text');
  const [showMathPalette, setShowMathPalette] = useState(false);

  useEffect(() => {
    if (question) {
      const isMatching =
        typeof question.order === 'number' && question.order >= 31 && question.order <= 35;

      let matchLeft = ['', ''];
      let matchRight = ['', '', '', ''];
      let matchCorrect = ['', ''];

      if (isMatching && Array.isArray(question.matchPairs)) {
        const safePairs = question.matchPairs;
        const leftMap = new Map();
        const rightMap = new Map();

        safePairs.forEach((item) => {
          if (item?.left?.id && !leftMap.has(item.left.id)) {
            leftMap.set(item.left.id, {
              id: item.left.id,
              label: item.left.label || '',
            });
          }
          if (item?.right?.id && !rightMap.has(item.right.id)) {
            rightMap.set(item.right.id, {
              id: item.right.id,
              label: item.right.label || '',
            });
          }
        });

        const leftItems = Array.from(leftMap.values());
        const rightItems = Array.from(rightMap.values());

        if (leftItems[0]) matchLeft[0] = leftItems[0].label || '';
        if (leftItems[1]) matchLeft[1] = leftItems[1].label || '';

        rightItems.slice(0, 4).forEach((item, idx) => {
          matchRight[idx] = item.label || '';
        });

        const correctMatches =
          question.correctMatches && typeof question.correctMatches === 'object'
            ? question.correctMatches
            : {};
        const rightIdList = rightItems.map((item) => item.id);
        leftItems.slice(0, 2).forEach((leftItem, idx) => {
          const rid = correctMatches[leftItem.id];
          if (!rid) return;
          const rIndex = rightIdList.indexOf(rid);
          if (rIndex >= 0 && rIndex < 4) {
            matchCorrect[idx] = String.fromCharCode(65 + rIndex);
          }
        });
      }

      const baseOrder = question.order || 1;
      const basePoints = question.points || 1;
      const isComplexBlock = typeof baseOrder === 'number' && baseOrder >= 36 && baseOrder <= 40;

      setFormData({
        contentHtml: question.contentHtml || '',
        contentText: question.contentText || '',
        imageUrls: question.imageUrls || [],
        inlineImageUrls: question.inlineImageUrls || [],
        options: question.options || {
          A: { type: 'text', value: '', image: null },
          B: { type: 'text', value: '', image: null },
          C: { type: 'text', value: '', image: null },
          D: { type: 'text', value: '', image: null },
        },
        correct: question.correct || ['A'],
        points: isComplexBlock && (!Number.isFinite(basePoints) || basePoints < 2) ? 2 : basePoints,
        order: baseOrder,
        matchLeft,
        matchRight,
        matchCorrect,
      });
    }
  }, [question]);

  const handleContentChange = (value) => {
    if (contentMode === 'html') {
      setFormData((prev) => ({ ...prev, contentHtml: value }));
    } else {
      setFormData((prev) => ({ ...prev, contentText: value }));
    }
  };

  const isMatching =
    typeof formData.order === 'number' && formData.order >= 31 && formData.order <= 35;

  const insertTextAtCursor = (text) => {
    if (!text) return;
    const textarea = textareaRef.current;
    const key = contentMode === 'html' ? 'contentHtml' : 'contentText';
    const value = formData[key] || '';

    if (!textarea) {
      const newValue = `${value}${text}`;
      setFormData((prev) => ({ ...prev, [key]: newValue }));
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const beforeText = value.slice(0, start);
    const afterText = value.slice(end);
    const newValue = `${beforeText}${text}${afterText}`;
    const caret = start + text.length;

    setFormData((prev) => ({ ...prev, [key]: newValue }));

    setTimeout(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(caret, caret);
    }, 0);
  };

  const applyFormatting = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const key = contentMode === 'html' ? 'contentHtml' : 'contentText';
    const value = formData[key] || '';
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const beforeText = value.slice(0, start);
    const afterText = value.slice(end);
    const newValue = `${beforeText}${before}${selected || ''}${after}${afterText}`;

    setFormData((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    const newStart = start + before.length;
    const newEnd = newStart + (selected || '').length;
    setTimeout(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const handleInsertPhoto = () => {
    const url = prompt(t('admin.enterImageUrl'));
    if (!url || !url.trim()) return;
    const textarea = textareaRef.current;
    const key = contentMode === 'html' ? 'contentHtml' : 'contentText';
    const value = formData[key] || '';
    const start = textarea ? (textarea.selectionStart ?? 0) : value.length;
    const end = textarea ? (textarea.selectionEnd ?? 0) : value.length;
    const beforeText = value.slice(0, start);
    const afterText = value.slice(end);
    const newValue = `${beforeText}PHOTO${afterText}`;

    setFormData((prev) => ({
      ...prev,
      [key]: newValue,
      inlineImageUrls: [...(prev.inlineImageUrls || []), url.trim()],
    }));

    setTimeout(() => {
      const node = textareaRef.current;
      if (!node) return;
      const caret = start + 'PHOTO'.length;
      node.focus();
      node.setSelectionRange(caret, caret);
    }, 0);
  };

  const handleOptionChange = (optionKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [optionKey]: {
          ...prev.options[optionKey],
          [field]: value,
        },
      },
    }));
  };

  const handleCorrectAnswerToggle = (optionKey) => {
    setFormData((prev) => {
      const isComplexBlock = typeof prev.order === 'number' && prev.order >= 36 && prev.order <= 40;

      let newCorrect;
      if (prev.correct.includes(optionKey)) {
        newCorrect = prev.correct.filter((key) => key !== optionKey);
      } else {
        if (isComplexBlock && prev.correct.length >= 3) {
          alert(i18n.t('ui.selectUpTo_3CorrectAnswersFor'));
          return prev;
        }
        newCorrect = [...prev.correct, optionKey];
      }

      if (newCorrect.length === 0) {
        newCorrect = [optionKey];
      }

      return {
        ...prev,
        correct: newCorrect,
      };
    });
  };

  const handleAddImageUrl = () => {
    const url = prompt(t('admin.enterImageUrl'));
    if (url && url.trim()) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, url.trim()],
      }));
    }
  };

  const handleRemoveImageUrl = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleMatchLeftChange = (index, value) => {
    setFormData((prev) => {
      const next = Array.isArray(prev.matchLeft) ? [...prev.matchLeft] : ['', ''];
      next[index] = value;
      return { ...prev, matchLeft: next };
    });
  };

  const handleMatchRightChange = (index, value) => {
    setFormData((prev) => {
      const next = Array.isArray(prev.matchRight) ? [...prev.matchRight] : ['', '', '', ''];
      next[index] = value;
      return { ...prev, matchRight: next };
    });
  };

  const handleMatchCorrectChange = (index, value) => {
    setFormData((prev) => {
      const next = Array.isArray(prev.matchCorrect) ? [...prev.matchCorrect] : ['', ''];
      next[index] = value;
      return { ...prev, matchCorrect: next };
    });
  };

  const addNewOption = () => {
    const existingKeys = Object.keys(formData.options);
    const isStandard = formData.order <= 35;

    if (isStandard && existingKeys.length >= 4) {
      alert(i18n.t('ui.theFirst_35QuestionsHave_4Options'));
      return;
    }

    if (!isStandard && existingKeys.length >= 6) {
      alert(i18n.t('ui.upTo_6OptionsAf'));
      return;
    }

    const alphabet = 'ABCDEF';

    let nextKey = null;
    for (let i = 0; i < alphabet.length; i++) {
      if (!existingKeys.includes(alphabet[i])) {
        nextKey = alphabet[i];
        break;
      }
    }

    if (nextKey) {
      setFormData((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          [nextKey]: { type: 'text', value: '', image: null },
        },
      }));
    } else {
      alert(i18n.t('ui.maximumNumberOfOptionsReached'));
    }
  };

  const removeOption = (optionKey) => {
    const remainingOptions = Object.keys(formData.options).filter((key) => key !== optionKey);
    const isStandard = formData.order <= 35;

    if (isStandard && remainingOptions.length < 4) {
      alert(i18n.t('ui.theFirst_35QuestionsRequireExactly_4'));
      return;
    }

    if (!isStandard && remainingOptions.length < 2) {
      alert(i18n.t('ui.atLeast_2OptionsAreRequired'));
      return;
    }

    setFormData((prev) => {
      const newOptions = { ...prev.options };
      delete newOptions[optionKey];

      const newCorrect = prev.correct.filter((key) => key !== optionKey);

      return {
        ...prev,
        options: newOptions,
        correct: newCorrect.length > 0 ? newCorrect : [remainingOptions[0]],
      };
    });
  };

  const handleSave = () => {
    const content = contentMode === 'html' ? formData.contentHtml : formData.contentText;
    if (!content.trim()) {
      alert(t('admin.questionContentRequired'));
      return;
    }
    const isMatching =
      typeof formData.order === 'number' && formData.order >= 31 && formData.order <= 35;

    if (isMatching) {
      const left = Array.isArray(formData.matchLeft) ? formData.matchLeft : [];
      const right = Array.isArray(formData.matchRight) ? formData.matchRight : [];
      const correctMap = Array.isArray(formData.matchCorrect) ? formData.matchCorrect : [];

      if (!left[0]?.trim() || !left[1]?.trim()) {
        alert(t('admin.questionContentRequired'));
        return;
      }

      const filledRights = right.filter((v) => v && v.trim());
      if (filledRights.length < 4) {
        alert(t('admin.allOptionsRequired'));
        return;
      }

      if (!correctMap[0] || !correctMap[1]) {
        alert(t('admin.correctAnswerRequired'));
        return;
      }
    } else {
      if (formData.correct.length === 0) {
        alert(t('admin.correctAnswerRequired'));
        return;
      }

      const hasEmptyOptions = Object.values(formData.options).some(
        (option) => !option.value?.trim() && !option.image?.trim(),
      );
      if (hasEmptyOptions) {
        alert(t('admin.allOptionsRequired'));
        return;
      }
    }

    const { matchLeft, matchRight, matchCorrect, ...restForm } = formData;

    const isComplexBlock =
      !isMatching &&
      typeof formData.order === 'number' &&
      formData.order >= 36 &&
      formData.order <= 40;
    let extraProps = {};
    if (isComplexBlock) {
      const correctCount = Array.isArray(formData.correct) ? formData.correct.length : 0;
      const maxSelect = correctCount > 0 ? Math.min(correctCount, 3) : 1;
      extraProps = {
        type: correctCount > 1 ? 'multi' : 'single',
        maxSelect,
      };
    }

    let questionData = {
      ...question,
      ...restForm,
      ...extraProps,
      id: question?.id,
      sectionId: question?.sectionId,
    };

    if (isMatching) {
      const leftLabels = Array.isArray(matchLeft) ? matchLeft : [];
      const rightLabels = Array.isArray(matchRight) ? matchRight : [];

      const leftItems = [
        { id: 'L1', label: (leftLabels[0] || '').trim() },
        { id: 'L2', label: (leftLabels[1] || '').trim() },
      ];

      const rightItems = ['R1', 'R2', 'R3', 'R4'].map((id, idx) => ({
        id,
        label: (rightLabels[idx] || '').trim(),
      }));

      const matchPairs = [];
      if (rightItems[0].label) matchPairs.push({ left: leftItems[0], right: rightItems[0] });
      if (rightItems[1].label) matchPairs.push({ left: leftItems[0], right: rightItems[1] });
      if (rightItems[2].label) matchPairs.push({ left: leftItems[1], right: rightItems[2] });
      if (rightItems[3].label) matchPairs.push({ left: leftItems[1], right: rightItems[3] });

      const correctMatches = {};
      const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
      const safeCorrect = Array.isArray(matchCorrect) ? matchCorrect : [];
      ['L1', 'L2'].forEach((leftId, idx) => {
        const letter = (safeCorrect[idx] || '').trim().toUpperCase();
        const rIdx = letterToIndex[letter];
        if (rIdx != null && rightItems[rIdx] && rightItems[rIdx].label) {
          correctMatches[leftId] = rightItems[rIdx].id;
        }
      });

      questionData = {
        ...questionData,
        type: 'matching',
        matchPairs,
        correctMatches,
        options: {},
        correct: [],
      };
    }

    onSave(questionData);
  };

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

  const renderInlineContent = (content) => {
    if (!content) return null;

    const parts = content.split(
      /(\[\[img:\s*[^\]]+\]\]|\bPHOTO\b|data:image\/[^^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi,
    );

    let photoIndex = 0;

    return parts.map((part, index) => {
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
            style={{ maxHeight: '120px', objectFit: 'contain' }}
          />
        );
      }

      if (/^PHOTO$/i.test(part.trim())) {
        const sources =
          Array.isArray(formData.inlineImageUrls) && formData.inlineImageUrls.length > 0
            ? formData.inlineImageUrls
            : Array.isArray(formData.imageUrls)
              ? formData.imageUrls
              : [];
        const url = sources[photoIndex] || null;
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
            style={{ maxHeight: '120px', objectFit: 'contain' }}
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
            style={{ maxHeight: '120px', objectFit: 'contain' }}
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
            style={{ maxHeight: '120px', objectFit: 'contain' }}
          />
        );
      }

      return <span key={`text-${index}`}>{renderMathInText(part, `txt-${index}`)}</span>;
    });
  };

  const renderPreview = () => {
    const content = contentMode === 'html' ? formData.contentHtml : formData.contentText;

    let previewPairs = [];
    let previewSelected = {};

    if (isMatching) {
      const leftLabels = Array.isArray(formData.matchLeft) ? formData.matchLeft : [];
      const rightLabels = Array.isArray(formData.matchRight) ? formData.matchRight : [];

      const leftItems = [
        { id: 'L1', label: (leftLabels[0] || '').trim() },
        { id: 'L2', label: (leftLabels[1] || '').trim() },
      ];

      const rightItems = ['R1', 'R2', 'R3', 'R4'].map((id, idx) => ({
        id,
        label: (rightLabels[idx] || '').trim(),
      }));

      const pairs = [];
      if (rightItems[0].label) pairs.push({ left: leftItems[0], right: rightItems[0] });
      if (rightItems[1].label) pairs.push({ left: leftItems[0], right: rightItems[1] });
      if (rightItems[2].label) pairs.push({ left: leftItems[1], right: rightItems[2] });
      if (rightItems[3].label) pairs.push({ left: leftItems[1], right: rightItems[3] });

      previewPairs = pairs;

      const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
      const safeCorrect = Array.isArray(formData.matchCorrect) ? formData.matchCorrect : [];
      const selected = {};

      ['L1', 'L2'].forEach((leftId, idx) => {
        const letter = (safeCorrect[idx] || '').trim().toUpperCase();
        const rIdx = letterToIndex[letter];
        if (rIdx != null && rightItems[rIdx] && rightItems[rIdx].label) {
          selected[leftId] = rightItems[rIdx].id;
        }
      });

      previewSelected = selected;
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.questionPreview')}
          </h3>

          <div className="prose dark:prose-invert max-w-none">
            {contentMode === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
            ) : (
              <div className="question-content text-gray-900 dark:text-white">
                {renderInlineContent(content)}
              </div>
            )}
          </div>

          {formData.imageUrls.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Question image ${index + 1}`}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '300px' }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">{t('admin.answerOptions')}</h4>
          {isMatching ? (
            <MatchingDrag
              pairs={previewPairs}
              value={previewSelected}
              onChange={() => {}}
              disabled={true}
              renderLabel={(text) => renderInlineContent(text)}
            />
          ) : (
            Object.entries(formData.options).map(([key, option]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border-2 ${
                  formData.correct.includes(key)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{key}.</span>
                  <div className="flex-1">
                    {option.type === 'image' && option.image ? (
                      <img
                        src={option.image}
                        alt={`Option ${key}`}
                        className="max-w-full h-auto rounded"
                        style={{ maxHeight: '150px' }}
                      />
                    ) : (
                      <span className="text-gray-900 dark:text-white question-content">
                        {renderInlineContent(option.value || '')}
                      </span>
                    )}
                  </div>
                  {formData.correct.includes(key) && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {t('admin.correct')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {question?.id ? t('admin.editQuestion') : t('admin.createQuestion')}
          </h2>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? t('admin.editMode') : t('admin.previewMode')}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{t('admin.saveQuestion')}</span>
          </button>
        </div>
      </div>

      {previewMode ? (
        renderPreview()
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('admin.questionContent')}
                  </h3>
                  <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] sm:text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Type className="h-3 w-3" />
                    <span>{t('admin.textMode')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    type="button"
                    onClick={() => applyFormatting('**', '**')}
                    className="px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={i18n.t('ui.bold')}
                  >
                    <span className="font-bold">{i18n.t('ui.b')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('_', '_')}
                    className="px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 italic"
                    title={i18n.t('ui.italic')}
                  >
                    {i18n.t('ui.i')}
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertPhoto}
                    className="px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-1"
                    title={i18n.t('common.photo')}
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>{i18n.t('common.photo')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMathPalette((v) => !v)}
                    className="px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={i18n.t('ui.mathSymbols')}
                  >
                    <span>{i18n.t('ui.x')}</span>
                  </button>
                </div>
              </div>

              {showMathPalette && (
                <div className="mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-2 text-[11px] sm:text-xs space-y-2">
                  {[
                    {
                      label: 'Basic',
                      items: ['+', '−', '·', '÷', '=', '≠', '≈', '≡'],
                    },
                    {
                      label: 'Relations / sets',
                      items: ['<', '≤', '>', '≥', '∈', '∉', '⊂', '⊆', '⊄', '⊇'],
                    },
                    {
                      label: 'Greek',
                      items: ['α', 'β', 'γ', 'Δ', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'Ω'],
                    },
                    {
                      label: 'Powers / indices',
                      items: ['^2', '^3', '^n', '_1', '_2', '_n'],
                    },
                    {
                      label: 'Fractions / roots',
                      items: ['1/2', 'a/b', '\\frac{a}{b}', '\\sqrt{x}'],
                    },
                    {
                      label: 'Other',
                      items: ['∞', '°', '′', '→', '', '∑', '∏', '∫'],
                    },
                  ].map((group) => (
                    <div key={group.label} className="flex flex-wrap items-center gap-1">
                      <span className="font-semibold text-gray-600 dark:text-gray-300 mr-1">
                        {group.label}:
                      </span>
                      {group.items.map((item) => (
                        <button
                          key={`${group.label}-${item}`}
                          type="button"
                          onClick={() => insertTextAtCursor(item)}
                          className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={contentMode === 'html' ? formData.contentHtml : formData.contentText}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder={
                  contentMode === 'html'
                    ? t('admin.enterHTMLContent')
                    : t('admin.enterQuestionText')
                }
              />

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('admin.additionalImages')}
                  </label>
                  <button
                    onClick={handleAddImageUrl}
                    className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{t('admin.addImage')}</span>
                  </button>
                </div>

                {formData.imageUrls.length > 0 && (
                  <div className="space-y-2">
                    {formData.imageUrls.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <Link className="h-4 w-4 text-gray-500" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                          {url}
                        </span>
                        <button
                          onClick={() => handleRemoveImageUrl(index)}
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('admin.questionOrder')}
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('admin.points')}
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, points: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            {isMatching ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('admin.answerOptions')}
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {[0, 1].map((idx) => (
                      <div key={idx}>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {idx + 1})
                        </label>
                        <input
                          type="text"
                          value={
                            Array.isArray(formData.matchLeft) ? formData.matchLeft[idx] || '' : ''
                          }
                          onChange={(e) => handleMatchLeftChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder={t('admin.enterQuestionText')}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label}>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {label})
                        </label>
                        <input
                          type="text"
                          value={
                            Array.isArray(formData.matchRight) ? formData.matchRight[idx] || '' : ''
                          }
                          onChange={(e) => handleMatchRightChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder={t('admin.optionText')}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {[0, 1].map((idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{idx + 1})</span>
                      <select
                        value={
                          Array.isArray(formData.matchCorrect)
                            ? formData.matchCorrect[idx] || ''
                            : ''
                        }
                        onChange={(e) => handleMatchCorrectChange(idx, e.target.value)}
                        className="ml-2 flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs"
                      >
                        <option value="">{t('admin.correct')}</option>
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('admin.answerOptions')}
                  </h3>
                  <button
                    onClick={addNewOption}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{i18n.t('ui.addOption')}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(formData.options).map(([key, option]) => (
                    <div
                      key={key}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {t('admin.option')} {key}
                        </span>

                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.correct.includes(key)}
                              onChange={() => handleCorrectAnswerToggle(key)}
                              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {t('admin.correct')}
                            </span>
                          </label>

                          {Object.keys(formData.options).length > 2 && (
                            <button
                              onClick={() => removeOption(key)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title={i18n.t('ui.removeOption')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <select
                            value={option.type}
                            onChange={(e) => handleOptionChange(key, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          >
                            <option value="text">{t('admin.textOption')}</option>
                            <option value="image">{t('admin.imageOption')}</option>
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={option.value || ''}
                            onChange={(e) => handleOptionChange(key, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                            placeholder={
                              option.type === 'image'
                                ? t('admin.optionDescription')
                                : t('admin.optionText')
                            }
                          />
                        </div>

                        {option.type === 'image' && (
                          <div>
                            <input
                              type="text"
                              value={option.image || ''}
                              onChange={(e) => handleOptionChange(key, 'image', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              placeholder={t('admin.imageUrl')}
                            />
                            {option.image && (
                              <img
                                src={option.image}
                                alt={`Option ${key} preview`}
                                className="mt-2 max-w-full h-auto rounded border"
                                style={{ maxHeight: '100px' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('admin.correctAnswers')}: {formData.correct.join(', ') || t('admin.none')}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
