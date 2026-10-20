import i18n from '../i18n';
import { parseQuizWithAI } from '../api/aiParser';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  PenLine,
  Upload,
  Check,
  FileUp,
  Loader2,
  Sparkles,
  Edit3,
  Save,
  Eye,
  X,
} from 'lucide-react';
import { ref, update } from 'firebase/database';
import { database } from '../firebase/realtimeDb';

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import katex from 'katex';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function MathText({ text }) {
  if (!text) return null;
  const segments = String(text).split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return (
    <span>
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
            });
            return (
              <span
                key={idx}
                className={isDisplay ? 'block my-0.5' : 'inline-block mx-0.5 align-middle'}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code key={idx} className="px-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
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

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY = null;
    let lineText = '';
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        fullText += lineText.trim() + '\n';
        lineText = '';
      }
      lineText += item.str + ' ';
      lastY = y;
    }
    if (lineText.trim()) fullText += lineText.trim() + '\n';
    fullText += '\n';
  }
  return fullText;
}

function EditableQuestionCard({ q, index, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(q);

  const save = () => {
    onChange(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(q);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-3 bg-white dark:bg-gray-700 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-600">#{index + 1}</span>
          <div className="flex gap-1">
            <button
              onClick={save}
              className="p-1 bg-green-100 dark:bg-green-900/30 rounded hover:bg-green-200"
            >
              <Save className="w-3.5 h-3.5 text-green-600" />
            </button>
            <button
              onClick={cancel}
              className="p-1 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
        <input
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono"
        />
        {draft.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-1.5">
            <button
              onClick={() => setDraft({ ...draft, correct: oi })}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${oi === draft.correct ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-400'}`}
            >
              {oi === draft.correct ? <Check className="w-3 h-3" /> : String.fromCharCode(65 + oi)}
            </button>
            <input
              value={opt}
              onChange={(e) => {
                const o = [...draft.options];
                o[oi] = e.target.value;
                setDraft({ ...draft, options: o });
              }}
              className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono"
            />
          </div>
        ))}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
            {i18n.t('ui.solution')}
          </label>
          <input
            value={draft.explanation || ''}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            className="w-full px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-600 rounded text-xs font-mono"
            placeholder={i18n.t('ui.enterTheFullSolutionWithFormulas')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs group relative">
      <div className="flex items-start gap-2">
        <span className="font-bold text-indigo-500 w-5 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
            <MathText text={q.text} />
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {q.options?.map((opt, oi) => (
              <span
                key={oi}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${oi === q.correct ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}`}
              >
                {String.fromCharCode(65 + oi)}) <MathText text={opt} />
              </span>
            ))}
          </div>

          {q.explanation && (
            <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800/50">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {i18n.t('ui.solution2')}
              </span>
              <p className="text-[10px] text-emerald-800 dark:text-emerald-200 mt-1 leading-relaxed">
                <MathText text={q.explanation} />
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLessonQuizManager({
  courseId,
  lessonId,
  moduleId,
  quiz,
  onQuizUpdate,
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [parseText, setParseText] = useState('');
  const [manualQ, setManualQ] = useState({
    text: '',
    options: ['', '', '', ''],
    correct: 0,
    explanation: '',
  });
  const [saving, setSaving] = useState(false);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [, setPreviewSource] = useState(null);
  const fileInputRef = useRef(null);

  const questions = quiz?.questions || [];

  const saveQuizToFirebase = async (updatedQuiz) => {
    if (!database || !courseId || !moduleId || !lessonId) return;
    setSaving(true);
    try {
      const path = `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/quiz`;
      await update(ref(database, path), updatedQuiz);
      if (onQuizUpdate) onQuizUpdate(updatedQuiz);
    } catch (e) {
      alert(t('common.error') + ': ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiParse = async (inputText) => {
    if (!inputText?.trim()) return;
    setAiParsing(true);
    setAiError(null);
    try {
      const parsed = await parseQuizWithAI(inputText);
      if (parsed.length === 0) {
        setAiError(t('courseDetail.quizNoQuestionsFound'));
        return;
      }
      setParsedPreview(parsed);
    } catch (err) {
      setAiError(err.message || i18n.t('courseDetail.quizAiErrorGeneric'));
    } finally {
      setAiParsing(false);
    }
  };

  const handleTextParse = () => {
    setPreviewSource('text');
    handleAiParse(parseText);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert(t('courseDetail.quizPdfOnly'));
      return;
    }
    setPdfParsing(true);
    setAiError(null);
    setParsedPreview(null);
    setPreviewSource('pdf');
    try {
      const text = await extractTextFromPdf(file);
      await handleAiParse(text);
    } catch (err) {
      setAiError('PDF: ' + err.message);
    } finally {
      setPdfParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmPreview = async () => {
    if (!parsedPreview?.length) return;
    const updated = {
      title: quiz?.title || t('courseDetail.quizTitle'),
      questions: [...questions, ...parsedPreview],
    };
    await saveQuizToFirebase(updated);
    setParsedPreview(null);
    setPreviewSource(null);
    setParseText('');
    setMode(null);
  };

  const handlePreviewEdit = (idx, updatedQ) => {
    const copy = [...parsedPreview];
    copy[idx] = updatedQ;
    setParsedPreview(copy);
  };

  const handlePreviewDelete = (idx) => {
    setParsedPreview((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleManualAdd = () => {
    if (!manualQ.text.trim() || manualQ.options.filter((o) => o.trim()).length < 2) return;
    const newQ = {
      id: `q_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      text: manualQ.text.trim(),
      options: manualQ.options.filter((o) => o.trim()),
      correct: manualQ.correct,
      explanation: manualQ.explanation.trim(),
    };
    const updated = {
      title: quiz?.title || t('courseDetail.quizTitle'),
      questions: [...questions, newQ],
    };
    saveQuizToFirebase(updated);
    setManualQ({ text: '', options: ['', '', '', ''], correct: 0, explanation: '' });
  };

  const updateQuestion = (qId, idx, updatedQ) => {
    const qs = qId
      ? questions.map((q) => (q.id === qId ? { ...q, ...updatedQ } : q))
      : questions.map((q, i) => (i === idx ? { ...q, ...updatedQ } : q));
    saveQuizToFirebase({ ...quiz, questions: qs });
  };

  const deleteQuestion = (qId, idx) => {
    const qs = qId ? questions.filter((q) => q.id !== qId) : questions.filter((_, i) => i !== idx);
    saveQuizToFirebase({ ...quiz, questions: qs });
  };

  const clearAll = () => {
    if (!window.confirm(t('courseDetail.quizClearConfirm'))) return;
    saveQuizToFirebase({ title: quiz?.title || '', questions: [] });
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Plus
            className={`w-5 h-5 text-indigo-500 transition-transform ${isOpen ? 'rotate-45' : ''}`}
          />
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {t('courseDetail.quizManage')}
          </span>
          {questions.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
              {questions.length}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-indigo-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-indigo-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4 animate-fade-in">
          {questions.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {t('courseDetail.quizQuestions')} ({questions.length})
                </p>
                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700">
                  {t('courseDetail.quizClearAll')}
                </button>
              </div>
              {questions.map((q, i) => (
                <EditableQuestionCard
                  key={q.id || i}
                  q={q}
                  index={i}
                  onChange={(updated) => updateQuestion(q.id, i, updated)}
                  onDelete={() => deleteQuestion(q.id, i)}
                />
              ))}
            </div>
          )}

          {parsedPreview && parsedPreview.length > 0 && (
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {t('courseDetail.quizPreviewTitle')}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                    {parsedPreview.length} {t('courseDetail.quizQuestionsCount')}
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {parsedPreview.map((q, i) => (
                  <EditableQuestionCard
                    key={q.id || i}
                    q={q}
                    index={i}
                    onChange={(updated) => handlePreviewEdit(i, updated)}
                    onDelete={() => handlePreviewDelete(i)}
                  />
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleConfirmPreview}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {t('courseDetail.quizConfirmSave', { count: parsedPreview.length })}
                </button>
                <button
                  onClick={() => {
                    setParsedPreview(null);
                    setPreviewSource(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {!mode && !parsedPreview?.length && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMode('pdf')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <FileUp className="w-3.5 h-3.5" /> {t('courseDetail.quizUploadPdf')}
                </button>
                <button
                  onClick={() => setMode('parse')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> {t('courseDetail.quizImportText')}
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" /> {t('courseDetail.quizAddManual')}
                </button>
              </div>

              {questions.length > 0 && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {i18n.t('ui.solutionTools')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const data = questions.map((q, i) => ({
                          questionNumber: i + 1,
                          text: q.text,
                          options: q.options,
                          correct: q.correct,
                          explanation: q.explanation || '',
                        }));
                        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                        alert(i18n.t('ui.copiedToClipboard'));
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      {i18n.t('ui.copyExport')}
                    </button>
                    <button
                      onClick={() => {
                        const text = prompt(i18n.t('ui.pasteSolutionsAsJson'));
                        if (!text) return;
                        try {
                          const solutions = JSON.parse(text);
                          if (!Array.isArray(solutions))
                            throw new Error(i18n.t('ui.invalidFormat'));
                          const updated = questions.map((q, i) => {
                            const sol = solutions.find((s) => s.questionNumber === i + 1);
                            return sol?.explanation ? { ...q, explanation: sol.explanation } : q;
                          });
                          saveQuizToFirebase({ ...quiz, questions: updated });
                          alert(i18n.t('ui.solutionsImported'));
                        } catch {
                          alert(i18n.t('common.invalidJson'));
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      {i18n.t('ui.importSolutions')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'pdf' && (
            <div className="space-y-3 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                {t('courseDetail.quizPdfHint')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              {!pdfParsing && !parsedPreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-rose-300 dark:border-rose-700 rounded-xl hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  <FileUp className="w-8 h-8 text-rose-400" />
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    {t('courseDetail.quizSelectPdf')}
                  </span>
                </button>
              )}
              {(pdfParsing || aiParsing) && (
                <div className="flex items-center justify-center gap-2 py-8 text-rose-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">{t('courseDetail.quizAiParsing')}</span>
                </div>
              )}
              {aiError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                  {aiError}
                </div>
              )}
              {!pdfParsing && !aiParsing && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setMode(null);
                      setParsedPreview(null);
                      setAiError(null);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'parse' && (
            <div className="space-y-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                {t('courseDetail.quizImportHint')}
              </p>
              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                placeholder={t('courseDetail.quizPastePlaceholder')}
              />
              {aiError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                  {aiError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleTextParse}
                  disabled={aiParsing || saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {aiParsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
                      {t('courseDetail.quizAiParsing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> {t('courseDetail.quizAiImport')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMode(null);
                    setParseText('');
                    setAiError(null);
                    setParsedPreview(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <input
                type="text"
                value={manualQ.text}
                onChange={(e) => setManualQ({ ...manualQ, text: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                placeholder={t('courseDetail.quizQuestionText')}
              />
              {manualQ.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => setManualQ({ ...manualQ, correct: i })}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${i === manualQ.correct ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-500'}`}
                  >
                    {i === manualQ.correct ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const o = [...manualQ.options];
                      o[i] = e.target.value;
                      setManualQ({ ...manualQ, options: o });
                    }}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-2 focus:ring-purple-500"
                    placeholder={`${String.fromCharCode(65 + i)}) ...`}
                  />
                </div>
              ))}
              <input
                type="text"
                value={manualQ.explanation}
                onChange={(e) => setManualQ({ ...manualQ, explanation: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                placeholder={t('courseDetail.quizExplanation')}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleManualAdd}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {saving ? '...' : t('courseDetail.quizAdd')}
                </button>
                <button
                  onClick={() => setMode(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
