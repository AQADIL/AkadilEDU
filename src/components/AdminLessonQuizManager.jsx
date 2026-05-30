import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ChevronDown, ChevronUp, PenLine, Upload, Check, FileUp, Loader2, Sparkles, Edit3, Save, Eye, X } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { database } from '../firebase/realtimeDb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import katex from 'katex';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL  = import.meta.env.VITE_GEMINI_MODEL  || 'gemini-2.5-flash';

/* ── KaTeX inline renderer for admin preview ── */
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
            const html = katex.renderToString(inner, { throwOnError: false, displayMode: isDisplay });
            return <span key={idx} className={isDisplay ? 'block my-0.5' : 'inline-block mx-0.5 align-middle'} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <code key={idx} className="px-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">{inner}</code>;
          }
        }
        return <span key={idx}>{seg}</span>;
      })}
    </span>
  );
}

/* ── Gemini AI quiz parser with improved prompt ── */
async function parseQuizWithAI(text) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

  const prompt = `You are an expert quiz parser for educational worksheets. Your task is to extract ALL questions from the text below and return structured JSON.

CRITICAL RULES FOR MATH/LATEX:
- ALL mathematical expressions MUST be wrapped in dollar signs: $...$ for inline, $$...$$ for display.
- Examples of what to wrap: variables (like $x$, $y$), expressions ($x^2 + 3x$), fractions ($\\frac{a}{b}$), integrals ($\\int_0^1 f(x)dx$), trig ($\\sin\\alpha$, $\\cos^2\\theta$), logs ($\\log_2 x$), roots ($\\sqrt{x}$), Greek letters ($\\alpha$, $\\beta$), subscripts ($a_1$), superscripts ($x^n$).
- If the source text already has $ delimiters, keep them exactly.
- If the source has raw math without $ (like "f(x)=x²-4x+3"), wrap it: "$f(x) = x^2 - 4x + 3$".
- Use proper LaTeX: ^ for superscript, _ for subscript, \\frac{}{} for fractions, \\sqrt{} for roots, \\int for integral, \\sin \\cos \\tan \\log \\ln for functions.
- Do NOT add extra spaces inside math. Keep it clean: "$x^2$" not "$ x ^ 2 $".
- Plain text (non-math) should NOT be wrapped in $.

OUTPUT JSON SCHEMA:
{"questions":[{"text":"question text with $math$","options":["option A with $math$","option B","option C","option D"],"correct":0,"explanation":""}]}

PARSING RULES:
- Extract EVERY numbered question (1. or 1) etc).
- Options may be labeled a)/b)/c)/d) or A)/B)/C)/D) — on same or separate lines.
- Remove leading question numbers (1., 2.) from "text" field.
- Remove leading option letters (a), A)) from each option string.
- If there is an answer key section ("Ключи ответа"/"Жауап кілттері"/"Answer key"/"Дұрыс жауап") at the end, use it to set "correct" (0-based: a=0, b=1, c=2, d=3).
- If no answer key, try to determine correct from context, else default to 0.
- "explanation" should be empty string unless provided.
- Be tolerant of formatting. Extract as many questions as possible.
- Text may be in Kazakh, Russian, or English.

INPUT TEXT:
"""
${text}
"""`;

  // Retry with exponential backoff for timeout/rate limit errors
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      const raw = typeof result?.response?.text === 'function' ? result.response.text() : '';

      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (_) {}
      if (!parsed) {
        const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        try { parsed = JSON.parse(m[1]); } catch (_) {}
      }
      if (!parsed) {
        const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
        if (s !== -1 && e > s) try { parsed = JSON.parse(raw.slice(s, e + 1)); } catch (_) {}
      }

      if (!parsed?.questions?.length) throw new Error('AI returned no questions');

      return parsed.questions.map((q, i) => ({
        id: `q_${Date.now()}_${Math.random().toString(16).slice(2, 8)}_${i}`,
        text: (q.text || '').trim(),
        options: Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [],
        correct: typeof q.correct === 'number' ? q.correct : 0,
        explanation: (q.explanation || '').trim(),
      })).filter(q => q.text && q.options.length >= 2);
    } catch (err) {
      console.error(`AI parsing attempt ${attempt + 1} failed:`, err);
      // Retry on timeout (408) or rate limit (429) errors
      if (attempt < maxRetries - 1 && (err.message?.includes('408') || err.message?.includes('429') || err.message?.includes('fetch'))) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw err;
    }
  }
  return [];
}

/* ── Extract text from PDF ── */
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

/* ── Editable question card for preview ── */
function EditableQuestionCard({ q, index, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(q);

  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(q); setEditing(false); };

  if (editing) {
    return (
      <div className="p-3 bg-white dark:bg-gray-700 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-600">#{index + 1}</span>
          <div className="flex gap-1">
            <button onClick={save} className="p-1 bg-green-100 dark:bg-green-900/30 rounded hover:bg-green-200"><Save className="w-3.5 h-3.5 text-green-600" /></button>
            <button onClick={cancel} className="p-1 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200"><X className="w-3.5 h-3.5 text-gray-500" /></button>
          </div>
        </div>
        <input value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })}
          className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono" />
        {draft.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-1.5">
            <button onClick={() => setDraft({ ...draft, correct: oi })}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${oi === draft.correct ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-400'}`}>
              {oi === draft.correct ? <Check className="w-3 h-3" /> : String.fromCharCode(65 + oi)}
            </button>
            <input value={opt} onChange={e => { const o = [...draft.options]; o[oi] = e.target.value; setDraft({ ...draft, options: o }); }}
              className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs group relative">
      <div className="flex items-start gap-2">
        <span className="font-bold text-indigo-500 w-5 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed"><MathText text={q.text} /></p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {q.options?.map((opt, oi) => (
              <span key={oi} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${oi === q.correct ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}`}>
                {String.fromCharCode(65 + oi)}) <MathText text={opt} />
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => setEditing(true)} className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded"><Edit3 className="w-3.5 h-3.5 text-indigo-500" /></button>
          <button onClick={onDelete} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLessonQuizManager({ courseId, lessonId, moduleId, quiz, onQuizUpdate }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [parseText, setParseText] = useState('');
  const [manualQ, setManualQ] = useState({ text: '', options: ['', '', '', ''], correct: 0, explanation: '' });
  const [saving, setSaving] = useState(false);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [parsedPreview, setParsedPreview] = useState(null); // array of questions to review before saving
  const [previewSource, setPreviewSource] = useState(null); // 'pdf' | 'text'
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
      console.error('Error saving quiz:', e);
      alert(t('common.error') + ': ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── AI parse → preview (not direct save) ── */
  const handleAiParse = async (inputText) => {
    if (!inputText?.trim()) return;
    setAiParsing(true);
    setAiError(null);
    try {
      const parsed = await parseQuizWithAI(inputText);
      if (parsed.length === 0) { setAiError(t('courseDetail.quizNoQuestionsFound')); return; }
      setParsedPreview(parsed);
    } catch (err) {
      console.error('AI parse error:', err);
      setAiError(err.message || 'AI parse error');
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
    if (file.type !== 'application/pdf') { alert(t('courseDetail.quizPdfOnly')); return; }
    setPdfParsing(true);
    setAiError(null);
    setParsedPreview(null);
    setPreviewSource('pdf');
    try {
      const text = await extractTextFromPdf(file);
      await handleAiParse(text);
    } catch (err) {
      console.error('PDF error:', err);
      setAiError('PDF: ' + err.message);
    } finally {
      setPdfParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Confirm preview → save to Firebase ── */
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
    setParsedPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const handleManualAdd = () => {
    if (!manualQ.text.trim() || manualQ.options.filter(o => o.trim()).length < 2) return;
    const newQ = {
      id: `q_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      text: manualQ.text.trim(),
      options: manualQ.options.filter(o => o.trim()),
      correct: manualQ.correct,
      explanation: manualQ.explanation.trim(),
    };
    const updated = { title: quiz?.title || t('courseDetail.quizTitle'), questions: [...questions, newQ] };
    saveQuizToFirebase(updated);
    setManualQ({ text: '', options: ['', '', '', ''], correct: 0, explanation: '' });
  };

  const updateQuestion = (qId, idx, updatedQ) => {
    const qs = qId
      ? questions.map(q => q.id === qId ? { ...q, ...updatedQ } : q)
      : questions.map((q, i) => i === idx ? { ...q, ...updatedQ } : q);
    saveQuizToFirebase({ ...quiz, questions: qs });
  };

  const deleteQuestion = (qId, idx) => {
    const qs = qId
      ? questions.filter(q => q.id !== qId)
      : questions.filter((_, i) => i !== idx);
    saveQuizToFirebase({ ...quiz, questions: qs });
  };

  const clearAll = () => {
    if (!window.confirm(t('courseDetail.quizClearConfirm'))) return;
    saveQuizToFirebase({ title: quiz?.title || '', questions: [] });
  };

  return (
    <div className="mt-4">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group">
        <div className="flex items-center gap-2">
          <Plus className={`w-5 h-5 text-indigo-500 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{t('courseDetail.quizManage')}</span>
          {questions.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">{questions.length}</span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4 animate-fade-in">

          {/* ── Existing questions with edit/delete ── */}
          {questions.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('courseDetail.quizQuestions')} ({questions.length})</p>
                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700">{t('courseDetail.quizClearAll')}</button>
              </div>
              {questions.map((q, i) => (
                <EditableQuestionCard key={q.id || i} q={q} index={i}
                  onChange={(updated) => updateQuestion(q.id, i, updated)}
                  onDelete={() => deleteQuestion(q.id, i)} />
              ))}
            </div>
          )}

          {/* ── AI Parsed Preview (review before saving) ── */}
          {parsedPreview && parsedPreview.length > 0 && (
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{t('courseDetail.quizPreviewTitle')}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                    {parsedPreview.length} {t('courseDetail.quizQuestionsCount')}
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {parsedPreview.map((q, i) => (
                  <EditableQuestionCard key={q.id || i} q={q} index={i}
                    onChange={(updated) => handlePreviewEdit(i, updated)}
                    onDelete={() => handlePreviewDelete(i)} />
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleConfirmPreview} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {t('courseDetail.quizConfirmSave', { count: parsedPreview.length })}
                </button>
                <button onClick={() => { setParsedPreview(null); setPreviewSource(null); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg">{t('common.cancel')}</button>
              </div>
            </div>
          )}

          {/* ── Action buttons ── */}
          {!mode && !parsedPreview?.length && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setMode('pdf')}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors">
                <FileUp className="w-3.5 h-3.5" /> {t('courseDetail.quizUploadPdf')}
              </button>
              <button onClick={() => setMode('parse')}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                <Upload className="w-3.5 h-3.5" /> {t('courseDetail.quizImportText')}
              </button>
              <button onClick={() => setMode('manual')}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors">
                <PenLine className="w-3.5 h-3.5" /> {t('courseDetail.quizAddManual')}
              </button>
            </div>
          )}

          {/* ── PDF upload mode ── */}
          {mode === 'pdf' && (
            <div className="space-y-3 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{t('courseDetail.quizPdfHint')}</p>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              {!pdfParsing && !parsedPreview && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-rose-300 dark:border-rose-700 rounded-xl hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer">
                  <FileUp className="w-8 h-8 text-rose-400" />
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{t('courseDetail.quizSelectPdf')}</span>
                </button>
              )}
              {(pdfParsing || aiParsing) && (
                <div className="flex items-center justify-center gap-2 py-8 text-rose-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">{t('courseDetail.quizAiParsing')}</span>
                </div>
              )}
              {aiError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">{aiError}</div>
              )}
              {!pdfParsing && !aiParsing && (
                <div className="flex justify-end">
                  <button onClick={() => { setMode(null); setParsedPreview(null); setAiError(null); }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg">{t('common.cancel')}</button>
                </div>
              )}
            </div>
          )}

          {/* ── Parse text mode ── */}
          {mode === 'parse' && (
            <div className="space-y-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('courseDetail.quizImportHint')}</p>
              <textarea value={parseText} onChange={(e) => setParseText(e.target.value)} rows={8}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                placeholder={`1. $f(x) = x^2 - 4x + 3$ функциясының нөлдерін табыңыз\na) $x=1, x=3$  b) $x=2, x=3$\nc) $x=-1, x=-3$  d) $x=0, x=4$\n\nКлючи ответа\n1. a)  2. c) ...`} />
              {aiError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">{aiError}</div>
              )}
              <div className="flex gap-2">
                <button onClick={handleTextParse} disabled={aiParsing || saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                  {aiParsing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('courseDetail.quizAiParsing')}</> : <><Sparkles className="w-3.5 h-3.5" /> {t('courseDetail.quizAiImport')}</>}
                </button>
                <button onClick={() => { setMode(null); setParseText(''); setAiError(null); setParsedPreview(null); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg">{t('common.cancel')}</button>
              </div>
            </div>
          )}

          {/* ── Manual mode ── */}
          {mode === 'manual' && (
            <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <input type="text" value={manualQ.text} onChange={(e) => setManualQ({ ...manualQ, text: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                placeholder={t('courseDetail.quizQuestionText')} />
              {manualQ.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setManualQ({ ...manualQ, correct: i })}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${i === manualQ.correct ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-500'}`}>
                    {i === manualQ.correct ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                  </button>
                  <input type="text" value={opt} onChange={(e) => { const o = [...manualQ.options]; o[i] = e.target.value; setManualQ({ ...manualQ, options: o }); }}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-2 focus:ring-purple-500"
                    placeholder={`${String.fromCharCode(65 + i)}) ...`} />
                </div>
              ))}
              <input type="text" value={manualQ.explanation} onChange={(e) => setManualQ({ ...manualQ, explanation: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                placeholder={t('courseDetail.quizExplanation')} />
              <div className="flex gap-2">
                <button onClick={handleManualAdd} disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                  {saving ? '...' : t('courseDetail.quizAdd')}
                </button>
                <button onClick={() => setMode(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg">{t('common.cancel')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
