import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, AlertCircle, Eye, Plus, Trash2, Link } from 'lucide-react';
import katex from 'katex';

export default function ContextBlockEditor({ sectionId, section, onSaveBlock, onCancel }) {
  const { t } = useTranslation();
  const [contextText, setContextText] = useState('');
  const [items, setItems] = useState(() => {
    const base = [];
    for (let i = 0; i < 5; i++) {
      const order = 26 + i;
      base.push({
        order,
        text: '',
        options: {
          A: '',
          B: '',
          C: '',
          D: ''
        },
        correct: 'A'
      });
    }
    return base;
  });
  const [contextInlineImageUrls, setContextInlineImageUrls] = useState([]);
  const [questionInlineImageUrls, setQuestionInlineImageUrls] = useState(() =>
    Array(5)
      .fill(null)
      .map(() => [])
  );
  const [contextImages, setContextImages] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const contextRef = useRef(null);
  const questionRefs = useRef([]);

  useEffect(() => {
    const questions = section?.questions || {};
    const byOrder = {};
    Object.entries(questions).forEach(([, q]) => {
      if (!q || typeof q.order !== 'number') return;
      if (q.order >= 26 && q.order <= 30) {
        byOrder[q.order] = q;
      }
    });

    // Try to restore context from first question's contentHtml (split by <hr />)
    let initialContext = '';
    const firstQ = byOrder[26];
    if (firstQ && typeof firstQ.contentHtml === 'string' && firstQ.contentHtml.includes('<hr')) {
      const parts = firstQ.contentHtml.split(/<hr\s*\/?>([\s\S]*)/i);
      if (parts && parts[0]) {
        const raw = parts[0];
        initialContext = raw
          .replace(/<br\s*\/?>(?=\s*<br\s*\/?>)/gi, '\n')
          .replace(/<br\s*\/?>(?!\s*<br\s*\/?>)/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    const nextItems = [];
    for (let i = 0; i < 5; i++) {
      const order = 26 + i;
      const q = byOrder[order];
      if (q) {
        const opts = q.options || {};
        const correctArr = Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : ['A']);
        nextItems.push({
          order,
          text: q.contentText || '',
          options: {
            A: opts.A?.value || '',
            B: opts.B?.value || '',
            C: opts.C?.value || '',
            D: opts.D?.value || ''
          },
          correct: correctArr[0] || 'A'
        });
      } else {
        nextItems.push({
          order,
          text: '',
          options: { A: '', B: '', C: '', D: '' },
          correct: 'A'
        });
      }
    }

    setItems(nextItems);
    if (initialContext) {
      setContextText(initialContext);
    }

    // Try to restore inline image URLs for context and all 5 questions (legacy flat inlineImageUrls)
    let restoredContextUrls = [];
    const restoredQuestionUrls = Array(5)
      .fill(null)
      .map(() => []);

    if (firstQ && Array.isArray(firstQ.inlineImageUrls) && firstQ.inlineImageUrls.length > 0) {
      const allUrls = firstQ.inlineImageUrls;
      let cursor = 0;

      const contextPhotoCount = (initialContext.match(/\bPHOTO\b/gi) || []).length;
      if (contextPhotoCount > 0) {
        restoredContextUrls = allUrls.slice(cursor, cursor + contextPhotoCount);
        cursor += contextPhotoCount;
      }

      for (let i = 0; i < 5; i++) {
        const q = byOrder[26 + i];
        const text = q?.contentText || '';
        const count = (text.match(/\bPHOTO\b/gi) || []).length;
        if (count > 0) {
          restoredQuestionUrls[i] = allUrls.slice(cursor, cursor + count);
          cursor += count;
        }
      }
    }

    setContextInlineImageUrls(restoredContextUrls);
    setQuestionInlineImageUrls(restoredQuestionUrls);

    if (firstQ && Array.isArray(firstQ.imageUrls)) {
      setContextImages(firstQ.imageUrls);
    }
  }, [section]);

  const renderItalic = (text, keyPrefix) => {
    if (!text) return null;
    const parts = [];
    const regex = /_(.+?)_/g;
    let lastIndex = 0;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`${keyPrefix}-it-${idx}-n`}>{text.slice(lastIndex, match.index)}</span>);
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
          </span>
        );
        idx += 1;
      }
      parts.push(
        <strong key={`${keyPrefix}-b-${idx}-s`}>
          {renderItalic(match[1], `${keyPrefix}-b-${idx}-s`)}
        </strong>
      );
      idx += 1;
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      const rest = text.slice(lastIndex);
      parts.push(
        <span key={`${keyPrefix}-b-rest`}>
          {renderItalic(rest, `${keyPrefix}-b-rest`)}
        </span>
      );
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
        } catch (_) {
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

  const renderInlineContent = (content, inlineUrls = []) => {
    if (!content) return null;

    const parts = content.split(/(\[\[img:\s*[^\]]+\]\]|\bPHOTO\b|data:image\/[^^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi);
    let photoIndex = 0;

    return parts.map((part, index) => {
      if (!part) return null;

      // Inline marker [[img: URL]]
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

      // PHOTO placeholder mapped to provided inlineUrls by order
      if (/^PHOTO$/i.test(part.trim())) {
        const url = Array.isArray(inlineUrls) ? inlineUrls[photoIndex] : null;
        photoIndex += 1;
        if (!url) {
          return <span key={`photo-text-${index}`}>PHOTO</span>;
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

      // data:image inline URL inside text
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

      // Direct http(s) image URL inside text
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

      return (
        <span key={`text-${index}`}>
          {renderMathInText(part, `txt-${index}`)}
        </span>
      );
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleContextKeyDown = (e) => {
    if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      applyFormattingToContext('**', '**');
    } else if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      applyFormattingToContext('_', '_');
    }
  };

  const handleQuestionKeyDown = (e, index) => {
    if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      applyFormattingToQuestion(index, '**', '**');
    } else if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      applyFormattingToQuestion(index, '_', '_');
    }
  };

  const handleOptionChange = (index, key, value) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      item.options = { ...item.options, [key]: value };
      next[index] = item;
      return next;
    });
  };

  const handleCorrectChange = (index, key) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], correct: key };
      return next;
    });
  };

  const applyFormattingToContext = (before, after) => {
    const textarea = contextRef.current;
    const value = contextText || '';
    if (!textarea) {
      setContextText(`${value}${before}${after}`);
      return;
    }
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const beforeText = value.slice(0, start);
    const afterText = value.slice(end);
    const newValue = `${beforeText}${before}${selected || ''}${after}${afterText}`;
    setContextText(newValue);
    const newStart = start + before.length;
    const newEnd = newStart + (selected || '').length;
    setTimeout(() => {
      const node = contextRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const applyFormattingToQuestion = (index, before, after) => {
    const textarea = questionRefs.current[index];
    const item = items[index] || {};
    const value = item.text || '';
    if (!textarea) {
      setItems(prev => {
        const next = [...prev];
        const updated = { ...next[index] };
        updated.text = `${value}${before}${after}`;
        next[index] = updated;
        return next;
      });
      return;
    }
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const beforeText = value.slice(0, start);
    const afterText = value.slice(end);
    const newValue = `${beforeText}${before}${selected || ''}${after}${afterText}`;
    setItems(prev => {
      const next = [...prev];
      const updated = { ...next[index] };
      updated.text = newValue;
      next[index] = updated;
      return next;
    });
    const newStart = start + before.length;
    const newEnd = newStart + (selected || '').length;
    setTimeout(() => {
      const node = questionRefs.current[index];
      if (!node) return;
      node.focus();
      node.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const insertImageMarker = (value, url) => {
    const prev = value || '';
    const trimmed = (url || '').trim();
    if (!trimmed) return prev;
    const needsSpace = prev && !/\s$/.test(prev);
    const sep = needsSpace ? ' ' : '';
    return `${prev}${sep}[[img: ${trimmed}]]`;
  };

  const handleInsertImageIntoContext = () => {
    const url = prompt(t('admin.enterImageUrl'));
    if (!url || !url.trim()) return;
    const clean = url.trim();
    const textarea = contextRef.current;
    const value = contextText || '';
    const start = textarea ? textarea.selectionStart ?? 0 : value.length;
    const end = textarea ? textarea.selectionEnd ?? 0 : value.length;
    const beforeText = value.slice(0, start);
    const afterText = value.slice(end);
    const newValue = `${beforeText}PHOTO${afterText}`;
    setContextText(newValue);
    setContextInlineImageUrls(prev => [...prev, clean]);
    setTimeout(() => {
      const node = contextRef.current;
      if (!node) return;
      const caret = start + 'PHOTO'.length;
      node.focus();
      node.setSelectionRange(caret, caret);
    }, 0);
  };

  const handleInsertImageIntoQuestion = (index) => {
    const url = prompt(t('admin.enterImageUrl'));
    if (!url || !url.trim()) return;
    const clean = url.trim();
    const textarea = questionRefs.current[index];
    const item = items[index] || {};
    const value = item.text || '';
    const start = textarea ? textarea.selectionStart ?? 0 : value.length;
    const end = textarea ? textarea.selectionEnd ?? 0 : value.length;
    const beforeText = value.slice(0, start);
    const afterText = value.slice(end);
    const newText = `${beforeText}PHOTO${afterText}`;
    setItems(prev => {
      const next = [...prev];
      const updated = { ...next[index] };
      updated.text = newText;
      next[index] = updated;
      return next;
    });
    setQuestionInlineImageUrls(prev => {
      const next = prev.map(arr => Array.isArray(arr) ? [...arr] : []);
      if (!next[index]) {
        next[index] = [];
      }
      next[index].push(clean);
      return next;
    });
    setTimeout(() => {
      const node = questionRefs.current[index];
      if (!node) return;
      const caret = start + 'PHOTO'.length;
      node.focus();
      node.setSelectionRange(caret, caret);
    }, 0);
  };

  const handleInsertImageIntoOption = (index, key) => {
    const url = prompt(t('admin.enterImageUrl'));
    if (!url || !url.trim()) return;
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      const options = { ...item.options };
      options[key] = insertImageMarker(options[key], url);
      item.options = options;
      next[index] = item;
      return next;
    });
  };

  const handleSave = () => {
    const trimmedContext = contextText.trim();
    if (!trimmedContext) {
      alert(t('admin.contextBlock.contextRequired'));
      return;
    }

    for (const item of items) {
      if (!item.text.trim()) {
        alert(t('admin.contextBlock.questionTextRequired', { order: item.order }));
        return;
      }
      const keys = ['A', 'B', 'C', 'D'];
      for (const k of keys) {
        if (!item.options[k].trim()) {
          alert(t('admin.contextBlock.optionRequired', { key: k, order: item.order }));
          return;
        }
      }
      if (!item.correct) {
        alert(t('admin.contextBlock.correctRequired', { order: item.order }));
        return;
      }
    }

    // Legacy flat list (for potential older consumers)
    const legacyInlineImageUrls = [
      ...(contextInlineImageUrls || []),
      ...questionInlineImageUrls.reduce((acc, arr) => acc.concat(arr || []), [])
    ];

    onSaveBlock(sectionId, {
      contextText: trimmedContext,
      items,
      contextImages,
      contextInlineImageUrls,
      questionInlineImageUrls,
      inlineImageUrls: legacyInlineImageUrls
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">

          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('admin.contextBlock.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              {t('admin.contextBlock.subtitle')}
            </p>
          </div>
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
            <span>{t('admin.saveQuestion') || 'Сохранить блок'}</span>
          </button>
        </div>
      </div>
      {previewMode ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.questionPreview')}
            </h3>
            <div className="flex items-center space-x-2 text-xs">
              {items.map((item, idx) => (
                <button
                  key={item.order}
                  type="button"
                  onClick={() => setPreviewIndex(idx)}
                  className={`px-2 py-1 rounded-full border text-xs ${
                    previewIndex === idx
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.order}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-900 dark:text-white question-content">
            {renderInlineContent(contextText, contextInlineImageUrls)}
          </div>

          {contextImages.length > 0 && (
            <div className="mb-4 space-y-2">
              {contextImages.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt="Context image"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '300px' }}
                />
              ))}
            </div>
          )}

          {items[previewIndex] && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('admin.contextBlock.questionTitle', { order: items[previewIndex].order })}
              </div>
              <div className="text-sm text-gray-900 dark:text-white mb-3 question-content">
                {renderInlineContent(items[previewIndex].text, questionInlineImageUrls[previewIndex] || [])}
              </div>
              <div className="space-y-1">
                {(['A', 'B', 'C', 'D']).map((key) => (
                  <div key={key} className="flex items-start space-x-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{key})</span>
                    <span className="text-gray-900 dark:text-white question-content">
                      {renderInlineContent(items[previewIndex].options[key] || '')}
                    </span>
                    {items[previewIndex].correct === key && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                        {t('admin.correct')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('admin.contextBlock.contextTitle')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  {t('admin.contextBlock.contextHint')}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => applyFormattingToContext('**', '**')}
                  className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Bold"
                >
                  <span className="font-bold">B</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormattingToContext('_', '_')}
                  className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 italic"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={handleInsertImageIntoContext}
                  className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="PHOTO"
                >
                  PHOTO
                </button>
              </div>
            </div>
            <textarea
              ref={contextRef}
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              onKeyDown={handleContextKeyDown}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={t('admin.contextBlock.contextPlaceholder')}
            />

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('admin.additionalImages')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt(t('admin.enterImageUrl'));
                    if (url && url.trim()) {
                      setContextImages(prev => [...prev, url.trim()]);
                    }
                  }}
                  className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>{t('admin.addImage')}</span>
                </button>
              </div>

              {contextImages.length > 0 && (
                <div className="space-y-2">
                  {contextImages.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <Link className="h-4 w-4 text-gray-500" />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setContextImages(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.order}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-200">
                      {item.order}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t('admin.contextBlock.questionTitle', { order: item.order })}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {t('admin.contextBlock.questionHint')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('admin.contextBlock.questionLabel')}
                      </label>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => applyFormattingToQuestion(index, '**', '**')}
                          className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Bold"
                        >
                          <span className="font-bold">B</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormattingToQuestion(index, '_', '_')}
                          className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 italic"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertImageIntoQuestion(index)}
                          className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="PHOTO"
                        >
                          PHOTO
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={(el) => {
                        questionRefs.current[index] = el;
                      }}
                      value={item.text}
                      onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                      onKeyDown={(e) => handleQuestionKeyDown(e, index)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder={t('admin.contextBlock.questionPlaceholder', { order: item.order })}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D']).map((key) => (
                      <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {t('admin.contextBlock.optionLabel', { key })}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleInsertImageIntoOption(index, key)}
                              className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="PHOTO"
                            >
                              PHOTO
                            </button>
                            <label className="flex items-center space-x-1 text-xs cursor-pointer">
                              <input
                                type="radio"
                                name={`correct-${item.order}`}
                                checked={item.correct === key}
                                onChange={() => handleCorrectChange(index, key)}
                                className="w-3 h-3 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                              />
                              <span className="text-gray-600 dark:text-gray-300">{t('admin.contextBlock.correctMark')}</span>
                            </label>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={item.options[key]}
                          onChange={(e) => handleOptionChange(index, key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder={t('admin.contextBlock.optionPlaceholder', { key })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        <AlertCircle className="h-4 w-4" />
        <span>{t('admin.contextBlock.footerHint')}</span>
      </div>
    </div>
  );
}