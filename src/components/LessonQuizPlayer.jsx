import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, ChevronRight, ChevronDown, Flame, Trophy, BookOpen } from 'lucide-react';
import { ref, get, set } from 'firebase/database';
import { database } from '../firebase/realtimeDb';
import { auth } from '../firebase/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import katex from 'katex';

const QUIZ_COVER_GIFS = Object.values(import.meta.glob('../assets/quiz-covers/*.gif', { eager: true, import: 'default' }));

function getRandomQuizCover() {
  if (!QUIZ_COVER_GIFS.length) return '';
  return QUIZ_COVER_GIFS[Math.floor(Math.random() * QUIZ_COVER_GIFS.length)];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL  = import.meta.env.VITE_GEMINI_MODEL  || 'gemini-2.5-flash';

/* ── KaTeX math renderer ── */
function RenderMath({ text, className = '' }) {
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
            const html = katex.renderToString(inner, { throwOnError: false, displayMode: isDisplay });
            return <span key={idx} className={isDisplay ? 'block my-1' : 'inline-block mx-0.5 align-middle'} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <code key={idx} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{inner}</code>;
          }
        }
        return <span key={idx}>{seg}</span>;
      })}
    </span>
  );
}

/* ── Confetti burst ── */
const CONFETTI_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6','#8b5cf6','#22c55e','#f97316'];
function ConfettiBurst({ count = 40 }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: 5 + Math.random() * 90, delay: Math.random() * 0.5,
    dur: 0.8 + Math.random() * 1.2, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 7, round: Math.random() > 0.5, rot: Math.random() * 360,
  })), [count]);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {pieces.map(p => (
        <div key={p.id} className="absolute qz-confetti" style={{
          left: `${p.x}%`, top: '-10px', width: p.size, height: p.size,
          background: p.color, borderRadius: p.round ? '50%' : '2px',
          transform: `rotate(${p.rot}deg)`,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
        }} />
      ))}
    </div>
  );
}

/* ── Fire streak badge ── */
function FireBadge({ streak }) {
  if (streak < 2) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold qz-fire-pulse"
      style={{ background: 'linear-gradient(135deg,#ff6b00,#ff9500)', color: '#fff', boxShadow: '0 2px 8px rgba(255,107,0,0.4)' }}>
      <Flame className="w-3 h-3" /> {streak}x
    </span>
  );
}

/* ── Hero banner SVG ── */
function HeroBanner({ title, src }) {
  return (
    <div className="mx-2 sm:mx-3 rounded-2xl overflow-hidden relative" style={{ height: 192 }}>
      {src ? (
        <img src={src} alt={title} className="w-full h-full object-cover" style={{ objectPosition: 'center center' }} />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo-700 via-violet-700 to-blue-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">Quiz</p>
        <h3 className="text-white font-black text-base sm:text-lg leading-snug max-w-[260px]" style={{ textShadow:'0 2px 12px rgba(99,102,241,0.5)' }}>
          {title}
        </h3>
      </div>
    </div>
  );
}

/* ── Gemini-style AI icon ── */
let _gid = 0;
function GeminiIcon({ size = 22 }) {
  const uid = useRef(`gic${++_gid}`).current;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 13.8 8.5 21 12C13.8 15.5 12 22 12 22C12 22 10.2 15.5 3 12C10.2 8.5 12 2 12 2Z" fill={`url(#${uid})`}/>
      <defs>
        <linearGradient id={uid} x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="35%" stopColor="#818cf8"/>
          <stop offset="65%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#e879f9"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── AI thinking dots animation ── */
function AiThinkingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0,1,2].map(i => (
        <div key={i} className="w-2.5 h-2.5 rounded-full qz-thinking-dot"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

/* ── SVG reaction characters (toned down) ── */
function CorrectSvg() {
  return (
    <svg width="60" height="60" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="30" fill="#10b981"/>
      <ellipse cx="31" cy="35" rx="3" ry="3.5" fill="white">
        <animate attributeName="ry" values="3.5;0.8;3.5" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="49" cy="35" rx="3" ry="3.5" fill="white">
        <animate attributeName="ry" values="3.5;0.8;3.5" dur="3s" repeatCount="indefinite" begin="0.1s"/>
      </ellipse>
      <path d="M30 47 Q40 57 50 47" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M32 40 L37 45 L48 33" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}

function WrongSvg() {
  return (
    <svg width="60" height="60" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="30" fill="#ef4444"/>
      <ellipse cx="31" cy="34" rx="3" ry="3.5" fill="white"/>
      <ellipse cx="49" cy="34" rx="3" ry="3.5" fill="white"/>
      <path d="M32 51 Q40 45 48 51" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Dot progress indicator ── */
function DotProgress({ total, current, answers }) {
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-3">
      {Array.from({ length: total }, (_, i) => {
        const answered = answers[i];
        const isCurrent = i === current;
        let bg = 'bg-gray-200 dark:bg-gray-600';
        let ring = '';
        let size = 'w-3 h-3';
        if (answered?.correct === true) bg = 'bg-emerald-500';
        else if (answered?.correct === false) bg = 'bg-red-500';
        if (isCurrent) { ring = 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-gray-800'; size = 'w-3.5 h-3.5'; }
        return <div key={i} className={`${size} rounded-full ${bg} ${ring} transition-all duration-300`} />;
      })}
    </div>
  );
}

/* ── AI feedback generator (single request for all wrong answers) ── */
async function generateAiFeedback(questions, answers) {
  if (!GEMINI_API_KEY) return null;
  const wrongOnes = answers.filter(a => !a.correct).map(a => {
    const q = questions[a.questionIndex];
    return `- Сұрақ: "${q?.text}"\n  Оқушы жауабы: "${q?.options?.[a.selected]}"\n  Дұрыс жауап: "${q?.options?.[q?.correct]}"`;
  });
  const correctCount = answers.filter(a => a.correct).length;
  const total = answers.length;
  const pct = Math.round((correctCount / total) * 100);

  const prompt = `Сен мейірімді, жылы жүректі қазақ мектеп мұғалімісің. Оқушы тест тапсырды.
Нәтиже: ${correctCount}/${total} (${pct}%).
${wrongOnes.length > 0 ? `\nОқушы қателескен сұрақтар:\n${wrongOnes.join('\n')}\n` : ''}

Тапсырма:
1. Оқушыны жылы, мейірімді түрде мотивация бер (2-3 сөйлем). Аты жоқ болса «оқушы» деп атай бер.
2. ${wrongOnes.length > 0
  ? `Әр қате сұрақ бойынша ТОЛЫҚ түсіндірме жаз:
   - Оқушы қандай қате жасады және НЕГЕ бұл жауап дұрыс емес
   - Дұрыс жауаптың неліктен дұрыс екенін нақты, түсінікті тілмен түсіндір
   - Мүмкін болса, ережені немесе формуланы мысалмен көрсет
   - Математикалық өрнектерді $...$ ішіне ора (мысалы: $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$)`
  : 'Барлығы дұрыс жауап берді! Оқушыны жылы мақта және алға кеңес бер.'}
3. Соңында қысқаша нақты кеңес бер: бұл тақырыпты қайталаудың ең тиімді жолы қандай?
4. Бәрін қазақ тілінде жаз.
5. Жауапты толық, кесілмеген күйінде жаз.`;

  // Retry with exponential backoff for timeout errors
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: GEMINI_MODEL,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      });
      const result = await model.generateContent(prompt);
      return typeof result?.response?.text === 'function' ? result.response.text() : null;
    } catch (err) {
      console.error(`AI feedback attempt ${attempt + 1} failed:`, err);
      // Retry on timeout (408) or rate limit (429) errors
      if (attempt < maxRetries - 1 && (err.message?.includes('408') || err.message?.includes('429'))) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      return null;
    }
  }
  return null;
}

export default function LessonQuizPlayer({ quiz, courseId, lessonId, onComplete }) {
  const { t } = useTranslation();
  const REVIEW_PAGE_SIZE = 10;
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [bounceCorrect, setBounceCorrect] = useState(false);
  const [tappedOpt, setTappedOpt] = useState(null);
  // AI feedback state - generated once per quiz, saved to Firebase
  const [aiFeedback, setAiFeedback] = useState(null);
  const [savedAiFeedback, setSavedAiFeedback] = useState(null);
  const [aiAlreadyUsed, setAiAlreadyUsed] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false); // glassmorphism panel toggle
  const [workingOnMistakes, setWorkingOnMistakes] = useState(false);
  const [lastScore, setLastScore] = useState(null);
  const [savedAnswers, setSavedAnswers] = useState(null); // last attempt answers (legacy / latest)
  const [attempts, setAttempts] = useState([]); // all attempts history [{pct, timestamp, answers}]
  const [expandedAttempt, setExpandedAttempt] = useState(null); // index of expanded attempt
  const [reviewAttemptIndex, setReviewAttemptIndex] = useState(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [coverGif, setCoverGif] = useState(() => getRandomQuizCover());
  const [aiError, setAiError] = useState('');
  const containerRef = useRef(null);

  const questions = quiz?.questions || [];
  const total = questions.length;
  const q = questions[currentIndex];
  const reviewAnswers = useMemo(() => {
    if (reviewAttemptIndex === -1) return answers;
    if (reviewAttemptIndex !== null && attempts[reviewAttemptIndex]?.answers?.length) return attempts[reviewAttemptIndex].answers;
    if (savedAnswers?.length) return savedAnswers;
    if (attempts.length > 0) return attempts[attempts.length - 1].answers || [];
    return [];
  }, [answers, attempts, reviewAttemptIndex, savedAnswers]);
  const reviewPageCount = Math.max(1, Math.ceil(total / REVIEW_PAGE_SIZE));
  const reviewPageStart = reviewPage * REVIEW_PAGE_SIZE;
  const reviewPageQuestions = questions.slice(reviewPageStart, reviewPageStart + REVIEW_PAGE_SIZE);
  const reviewWrongAnswers = reviewAnswers.filter(a => !a.correct);

  useEffect(() => { loadBest(); }, [courseId, lessonId]);

  // Reset quiz state when lesson changes (auto-collapse on lesson switch)
  useEffect(() => {
    setExpanded(false);
    setStage('idle');
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setStreak(0);
    setAiFeedback(null);
    setShowAiPanel(false);
    setWorkingOnMistakes(false);
    setAttempts([]);
    setSavedAnswers(null);
    setSavedAiFeedback(null);
    setAiAlreadyUsed(false);
    setBestScore(null);
    setTotalAttempts(0);
    setLastScore(null);
    setExpandedAttempt(null);
    setReviewAttemptIndex(null);
    setReviewPage(0);
    setCoverGif(getRandomQuizCover());
    setAiError('');
  }, [lessonId]);

  const loadBest = async () => {
    const key = `quiz_best_${courseId}_${lessonId}`;
    const local = localStorage.getItem(key);
    if (local) setBestScore(parseInt(local, 10));
    if (!auth.currentUser || !database) return;
    try {
      const path = `quizResults/${auth.currentUser.uid}/${courseId}/${lessonId}`;
      const snap = await get(ref(database, path));
      if (snap.exists()) {
        const data = snap.val();
        if (data.bestScore) setBestScore(p => Math.max(p || 0, data.bestScore));
        if (data.totalAttempts) setTotalAttempts(data.totalAttempts);
        if (data.lastScore !== undefined) setLastScore(data.lastScore);
        if (data.aiFeedback) { setSavedAiFeedback(data.aiFeedback); setAiAlreadyUsed(true); }
        if (data.lastAnswers) setSavedAnswers(data.lastAnswers);
        if (Array.isArray(data.attempts)) setAttempts(data.attempts);
      }
    } catch {}
  };

  const saveBest = useCallback(async (score, tot, answersArr) => {
    const pct = Math.round((score / tot) * 100);
    const key = `quiz_best_${courseId}_${lessonId}`;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    if (pct > prev) localStorage.setItem(key, String(pct));
    setBestScore(o => Math.max(o || 0, pct));
    setLastScore(pct);
    if (!auth.currentUser || !database) return;
    try {
      const path = `quizResults/${auth.currentUser.uid}/${courseId}/${lessonId}`;
      const snap = await get(ref(database, path));
      const existing = snap.exists() ? snap.val() : {};
      const newAttempts = (existing.totalAttempts || 0) + 1;
      const lastAnswersToSave = (answersArr || []).map(a => ({
        questionIndex: a.questionIndex, selected: a.selected, correct: a.correct
      }));
      // Append to attempts history array
      const prevAttempts = Array.isArray(existing.attempts) ? existing.attempts : [];
      const newAttemptEntry = { pct, timestamp: Date.now(), answers: lastAnswersToSave };
      const updatedAttempts = [...prevAttempts, newAttemptEntry];
      await set(ref(database, path), {
        ...existing,
        bestScore: Math.max(existing.bestScore || 0, pct),
        lastScore: pct,
        lastAttempt: Date.now(),
        totalAttempts: newAttempts,
        lastAnswers: lastAnswersToSave,
        attempts: updatedAttempts,
      });
      setTotalAttempts(newAttempts);
      setSavedAnswers(lastAnswersToSave);
      setAttempts(updatedAttempts);
    } catch {}
  }, [courseId, lessonId]);

  // Save AI feedback to Firebase (only once per quiz per user)
  const saveAiFeedbackToFirebase = useCallback(async (fb) => {
    if (!auth.currentUser || !database) return;
    try {
      const path = `quizResults/${auth.currentUser.uid}/${courseId}/${lessonId}/aiFeedback`;
      await set(ref(database, path), fb);
    } catch {}
  }, [courseId, lessonId]);

  const handleStart = () => {
    setStage('playing'); setCurrentIndex(0); setAnswers([]);
    setSelectedOption(null); setStreak(0); setShowConfetti(false);
    setShakeWrong(false); setBounceCorrect(false); setAiFeedback(null);
    setShowAiPanel(false);
    setExpanded(true);
    setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const handleSelect = (idx) => {
    if (stage !== 'playing' || selectedOption !== null) return;
    setTappedOpt(idx);
    setTimeout(() => setTappedOpt(null), 250);
    setSelectedOption(idx);
    const correct = idx === q.correct;
    setAnswers(prev => [...prev, { questionIndex: currentIndex, selected: idx, correct }]);
    if (correct) {
      setStreak(s => s + 1);
      setBounceCorrect(true); setTimeout(() => setBounceCorrect(false), 600);
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1600);
    } else {
      setStreak(0);
      setShakeWrong(true); setTimeout(() => setShakeWrong(false), 500);
    }
    setStage('feedback');
  };

  const handleNext = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex(i => i + 1); setSelectedOption(null); setStage('playing');
    } else {
      const finalAnswers = [...answers];
      const s = finalAnswers.filter(a => a.correct).length;
      saveBest(s, total, finalAnswers);
      setStage('results');
      if (Math.round((s / total) * 100) >= 70) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); }
      if (onComplete) onComplete(s, total);
    }
  };

  const openReview = (attemptIndex) => {
    setReviewAttemptIndex(attemptIndex);
    setReviewPage(0);
    setStage('review');
    setShowAiPanel(false);
    setAiFeedback(null);
    setAiError('');
    setExpandedAttempt(null);
    setExpanded(true);
    setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const closeReview = () => {
    setStage('idle');
    setShowAiPanel(false);
    setReviewAttemptIndex(null);
    setReviewPage(0);
    setAiError('');
    setExpandedAttempt(null);
    setExpanded(false);
  };

  const toggleExpanded = () => {
    if (stage === 'playing' || stage === 'feedback') return;
    if (expanded) {
      setExpanded(false);
      if (stage === 'review') {
        setStage('idle');
        setShowAiPanel(false);
        setReviewAttemptIndex(null);
        setReviewPage(0);
        setAiError('');
      }
      setExpandedAttempt(null);
      return;
    }
    setExpanded(true);
  };

  // SANA AI: work on mistakes — uses best available answers from state or Firebase
  const handleWorkOnMistakes = async () => {
    const answersToUse = stage === 'review'
      ? reviewAnswers
      : answers.length > 0
        ? answers
        : attempts.length > 0
          ? (attempts[attempts.length - 1].answers || [])
          : savedAnswers?.length > 0
            ? savedAnswers
            : null;
    setAiError('');
    setAiFeedback(null);
    setShowAiPanel(true);
    if (aiFeedback) { setShowAiPanel(true); return; }
    if (savedAiFeedback && (reviewAttemptIndex === null || reviewAttemptIndex === -1 || reviewAttemptIndex === attempts.length - 1)) {
      setAiFeedback(savedAiFeedback);
      setShowAiPanel(true);
      return;
    }
    if (!answersToUse?.length) {
      setAiError(t('courseDetail.quizAiErrorNoAnswers'));
      return;
    }
    if (!GEMINI_API_KEY) {
      setAiError(t('courseDetail.quizAiErrorNoKey'));
      return;
    }
    if (!answersToUse.some(a => !a.correct)) {
      setAiError(t('courseDetail.quizAiErrorNoMistakes'));
      return;
    }
    setWorkingOnMistakes(true);
    try {
      const fb = await generateAiFeedback(questions, answersToUse);
      if (fb) {
        setAiFeedback(fb);
        setSavedAiFeedback(fb);
        setAiAlreadyUsed(true);
        saveAiFeedbackToFirebase(fb);
      } else {
        setAiError(t('courseDetail.quizAiErrorGeneric'));
      }
    } catch {}
    setWorkingOnMistakes(false);
  };

  if (!quiz || total === 0) return null;

  const score = answers.filter(a => a.correct).length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const isCorrect = selectedOption !== null && selectedOption === q?.correct;
  const hasTakenBefore = totalAttempts > 0 || (bestScore !== null && bestScore > 0);
  const reviewWrongCount = reviewAnswers.filter(a => !a.correct).length;
  const reviewAttemptMeta = reviewAttemptIndex >= 0 ? attempts[reviewAttemptIndex] : null;

  return (
    <div ref={containerRef} className="mt-5">
      <style>{`
        @keyframes qz-enter { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes qz-confetti { 0% { opacity:1; transform:translateY(0) rotate(0deg) } 100% { opacity:0; transform:translateY(340px) rotate(540deg) } }
        @keyframes qz-shake { 0%,100% { transform:translateX(0) } 20%,60% { transform:translateX(-4px) } 40%,80% { transform:translateX(4px) } }
        @keyframes qz-bounce { 0% { transform:scale(1) } 40% { transform:scale(1.025) } 100% { transform:scale(1) } }
        @keyframes qz-pop { 0% { transform:scale(1) } 50% { transform:scale(0.96) } 100% { transform:scale(1) } }
        @keyframes qz-fire { 0%,100% { transform:scale(1) } 50% { transform:scale(1.1) } }
        @keyframes qz-slide-up { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes qz-glow-pulse {
          0%,100% { box-shadow: 0 0 8px 2px rgba(99,102,241,0.25), 0 0 20px 4px rgba(59,130,246,0.15), inset 0 0 8px 0 rgba(99,102,241,0.08) }
          50% { box-shadow: 0 0 16px 4px rgba(99,102,241,0.4), 0 0 40px 8px rgba(59,130,246,0.25), inset 0 0 12px 0 rgba(99,102,241,0.12) }
        }
        @keyframes qz-border-flow {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        .qz-enter { animation: qz-enter 0.3s ease-out both }
        .qz-confetti { animation: qz-confetti ease-out forwards }
        .qz-shake { animation: qz-shake 0.4s ease-in-out }
        .qz-bounce { animation: qz-bounce 0.4s ease-out }
        .qz-pop { animation: qz-pop 0.18s ease-out }
        .qz-fire-pulse { animation: qz-fire 0.7s ease-in-out infinite }
        .qz-slide-up { animation: qz-slide-up 0.3s ease-out both }
        .qz-glow-btn { animation: qz-glow-pulse 2.5s ease-in-out infinite }
        @keyframes qz-thinking { 0%,80%,100%{transform:scale(0.4);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        .qz-thinking-dot { animation: qz-thinking 1.3s ease-in-out infinite both }
        /* SANA AI button – gradient border via ::before */
        .qz-sana-btn {
          position: relative;
          background: #ffffff;
          border-radius: 14px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          isolation: isolate;
          color: #111827;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }
        .qz-sana-btn:hover { transform: scale(1.02); }
        .qz-sana-btn:active { transform: scale(0.97); }
        .qz-sana-btn::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 15.5px;
          background: linear-gradient(135deg, #60a5fa, #6366f1, #a78bfa, #60a5fa);
          background-size: 300% 300%;
          animation: qz-border-flow 3s ease infinite;
          z-index: -1;
        }
        .dark .qz-sana-btn { background: #ffffff; color: #111827; }
        /* iOS 26 Liquid Glass */
        .qz-liquid-glass {
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(48px) saturate(200%) brightness(1.04);
          -webkit-backdrop-filter: blur(48px) saturate(200%) brightness(1.04);
          border: 0.5px solid rgba(255,255,255,0.55);
          box-shadow:
            0 4px 32px rgba(0,0,0,0.07),
            inset 0 1px 0 rgba(255,255,255,0.8),
            inset 0 -1px 0 rgba(0,0,0,0.04),
            inset 1px 0 0 rgba(255,255,255,0.35),
            inset -1px 0 0 rgba(255,255,255,0.15);
        }
        .dark .qz-liquid-glass {
          background: rgba(15,12,40,0.55);
          border: 0.5px solid rgba(255,255,255,0.1);
          box-shadow:
            0 4px 32px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(255,255,255,0.03);
        }
      `}</style>

      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md transition-shadow hover:shadow-lg">

        {/* ─── Header ─── */}
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 text-left transition-all hover:bg-gray-50/80 dark:hover:bg-gray-750/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {quiz.title || t('courseDetail.quizTitle')}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {total} {t('courseDetail.quizQuestionsCount')}
                </span>
                {bestScore > 0 && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/25 px-1.5 py-0.5 rounded-full">
                    {t('courseDetail.quizBestLabel')}: {bestScore}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(stage === 'playing' || stage === 'feedback') && (
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md tabular-nums">
                {currentIndex + 1}/{total}
              </span>
            )}
            <ChevronDown className={`w-4.5 h-4.5 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* ─── Expandable body ─── */}
        <div className={`transition-all duration-400 ease-in-out overflow-hidden ${expanded ? 'max-h-[6000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-gray-100 dark:border-gray-700 relative">
            {showConfetti && <ConfettiBurst />}

            {/* ── IDLE ── */}
            {stage === 'idle' && (
              <div className="qz-enter">
                {/* Full-width hero banner */}
                <HeroBanner title={quiz.title || t('courseDetail.quizTitle')} src={coverGif} />

                <div className="px-5 pb-8 pt-5 sm:px-6">
                  {/* ── First time: not taken yet ── */}
                  {!hasTakenBefore && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs mx-auto leading-relaxed">
                        {t('courseDetail.quizCheckKnowledge')}
                      </p>
                      <button onClick={handleStart}
                        className="inline-flex items-center gap-2 px-7 py-3.5 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 5px 18px rgba(99,102,241,0.38)' }}>
                        <BookOpen className="w-4 h-4" />
                        {t('courseDetail.quizStart')}
                      </button>
                    </div>
                  )}

                  {/* ── Already taken: review mode ── */}
                  {hasTakenBefore && (
                    <div className="space-y-5">

                      {/* Stats row */}
                      <div className="flex items-center justify-center gap-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/25 px-3 py-1.5 rounded-full">
                          <Trophy className="w-3.5 h-3.5" /> {t('courseDetail.quizBestLabel')}: {bestScore}%
                        </div>
                        {(lastScore !== null || bestScore !== null) && (
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-3 py-1.5 rounded-full">
                            {t('courseDetail.quizResultLabel')}: {lastScore ?? bestScore}%
                          </div>
                        )}
                      </div>

                      {/* ── Per-attempt history ── */}
                      {attempts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                            {t('courseDetail.quizPreviousAnswers')}
                          </p>
                          {[...attempts].reverse().map((attempt, revIdx) => {
                            const origIdx = attempts.length - 1 - revIdx;
                            const attemptDate = attempt.timestamp ? new Date(attempt.timestamp).toLocaleDateString('ru-RU', { day:'numeric', month:'short' }) : '';
                            const attemptAnswers = attempt.answers || [];
                            const correctInAttempt = attemptAnswers.filter(a => a.correct).length;
                            const pctColor = attempt.pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : attempt.pct >= 60 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400';
                            const isOpen = expandedAttempt === origIdx;
                            return (
                              <div key={origIdx} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Attempt header row */}
                                <button
                                  onClick={() => setExpandedAttempt(isOpen ? null : origIdx)}
                                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black ${attempt.pct >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/30' : attempt.pct >= 60 ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-red-100 dark:bg-red-900/20'} ${pctColor}`}>
                                      {attempt.pct}%
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                        {t('courseDetail.quizResultLabel')}
                                        {origIdx === attempts.length - 1 && <span className="ml-1.5 text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">{t('courseDetail.quizLatest')}</span>}
                                      </p>
                                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                        {correctInAttempt}/{total} • {attemptDate}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {/* Expanded answers */}
                                {isOpen && attemptAnswers.length > 0 && (
                                  <div className="px-3.5 py-3 space-y-1.5 bg-white dark:bg-gray-800 qz-slide-up">
                                    {attemptAnswers.map((a, ai) => {
                                      const qItem = questions[a.questionIndex];
                                      return (
                                        <div key={ai} className={`flex items-start gap-2 py-1.5 px-2.5 rounded-lg text-xs ${
                                          a.correct ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/15'
                                        }`}>
                                          <span className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded flex items-center justify-center ${a.correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {a.correct ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                              <RenderMath text={`${ai+1}. ${qItem?.text?.slice(0,90)}${(qItem?.text?.length??0)>90?'…':''}`} />
                                            </span>
                                            {!a.correct && qItem && (
                                              <div className="mt-0.5 text-[10px]">
                                                <span className="text-red-400 line-through mr-1"><RenderMath text={qItem.options?.[a.selected]||''} /></span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">→ <RenderMath text={qItem.options?.[qItem.correct]||''} /></span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="pt-2">
                                  <button
                                    onClick={() => openReview(origIdx)}
                                    className="w-full rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                                  >
                                    {t('courseDetail.quizReviewOpen')}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {stage === 'review' && (
              <div className="px-4 py-5 sm:px-6 sm:py-6 qz-enter space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{t('courseDetail.quizReviewTitle')}</p>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {t('courseDetail.quizResultLabel')}
                    </h3>
                    {reviewAttemptMeta?.timestamp && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(reviewAttemptMeta.timestamp).toLocaleString('ru-RU')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={closeReview}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {t('courseDetail.quizBack')}
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                    {reviewAnswers.filter(a => a.correct).length}/{total}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300">
                    {t('courseDetail.quizMistakesCount')}: {reviewWrongCount}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300">
                    {t('courseDetail.quizPageLabel')}: {reviewPage + 1}/{reviewPageCount}
                  </span>
                </div>

                {reviewWrongCount > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                      <button
                        onClick={handleWorkOnMistakes}
                        disabled={workingOnMistakes}
                        className="qz-sana-btn inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold disabled:opacity-50 border border-blue-300 shadow-none"
                      >
                        <GeminiIcon size={20} />
                        <span className="text-gray-900">SANA AI</span>
                        {workingOnMistakes && <AiThinkingDots />}
                      </button>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-blue-300 text-blue-600 bg-white text-xs font-black">?</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                        {t('courseDetail.quizSanaExplain')}
                      </span>
                    </div>

                    {showAiPanel && (
                      <div className="relative rounded-2xl overflow-hidden qz-slide-up" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.14),rgba(59,130,246,0.1))' }}>
                        <div className="qz-liquid-glass rounded-2xl p-5 sm:p-6">
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1,#a78bfa)' }}>
                              <GeminiIcon size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 dark:text-white">SANA AI</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">{t('courseDetail.quizAiHintTitle')}</p>
                            </div>
                          </div>
                          {reviewWrongAnswers.length > 0 && (
                            <div className="mb-4 space-y-2">
                              {reviewWrongAnswers.map((answerItem, wrongIndex) => {
                                const wrongQuestion = questions[answerItem.questionIndex];
                                return (
                                  <div key={`${answerItem.questionIndex}-${wrongIndex}`} className="rounded-xl border border-red-200/70 dark:border-red-800/40 bg-white/50 dark:bg-white/5 px-3 py-2.5">
                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                      <RenderMath text={`${answerItem.questionIndex + 1}. ${wrongQuestion?.text || ''}`} />
                                    </div>
                                    <div className="mt-1 text-[11px] text-red-500 dark:text-red-300">
                                      {t('courseDetail.quizYourAnswer')}: <RenderMath text={wrongQuestion?.options?.[answerItem.selected] || ''} />
                                    </div>
                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-300">
                                      {t('courseDetail.quizCorrectAnswer')}: <RenderMath text={wrongQuestion?.options?.[wrongQuestion?.correct] || ''} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {workingOnMistakes && !aiFeedback ? (
                            <div className="flex items-center gap-3 py-2">
                              <AiThinkingDots />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{t('courseDetail.quizAiHintLoading')}</span>
                            </div>
                          ) : aiError ? (
                            <div className="text-sm text-red-600 dark:text-red-300 leading-relaxed">{aiError}</div>
                          ) : aiFeedback ? (
                            <div className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-line">
                              <RenderMath text={aiFeedback} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {reviewPageQuestions.map((questionItem, pageIndex) => {
                    const questionIndex = reviewPageStart + pageIndex;
                    const reviewEntry = reviewAnswers.find(a => a.questionIndex === questionIndex);
                    const selected = reviewEntry?.selected;
                    return (
                      <div key={questionIndex} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{t('courseDetail.quizQuestionLabel')} {questionIndex + 1}</p>
                            <div className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed">
                              <RenderMath text={questionItem?.text} />
                            </div>
                          </div>
                          <span className={`mt-0.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${reviewEntry?.correct ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'}`}>
                            {reviewEntry?.correct ? t('courseDetail.quizReviewCorrect') : t('courseDetail.quizReviewWrong')}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {(questionItem?.options || []).map((optionText, optionIndex) => {
                            const isSelected = selected === optionIndex;
                            const isCorrectOption = questionItem?.correct === optionIndex;
                            let rowClass = 'border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30';
                            if (isSelected && isCorrectOption) rowClass = 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20';
                            else if (isSelected && !isCorrectOption) rowClass = 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20';
                            else if (isCorrectOption) rowClass = 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10';
                            return (
                              <div key={optionIndex} className={`rounded-xl border px-3.5 py-3 ${rowClass}`}>
                                <div className="flex items-start gap-3">
                                  <span className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${isSelected && !isCorrectOption ? 'bg-red-500 text-white' : isCorrectOption ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                    {String.fromCharCode(65 + optionIndex)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                                      <RenderMath text={optionText} />
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap mt-2">
                                      {isSelected && (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isCorrectOption ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'}`}>
                                          {t('courseDetail.quizYourAnswer')}
                                        </span>
                                      )}
                                      {isCorrectOption && (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300">
                                          {t('courseDetail.quizCorrectAnswer')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {reviewPageCount > 1 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => setReviewPage(p => Math.max(0, p - 1))}
                      disabled={reviewPage === 0}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50"
                    >
                      {t('courseDetail.quizPreviousPage')}
                    </button>
                    <button
                      onClick={() => setReviewPage(p => Math.min(reviewPageCount - 1, p + 1))}
                      disabled={reviewPage >= reviewPageCount - 1}
                      className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 text-xs font-bold disabled:opacity-50"
                    >
                      {t('courseDetail.quizNext')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── PLAYING / FEEDBACK ── */}
            {(stage === 'playing' || stage === 'feedback') && (
              <div className={`qz-enter ${shakeWrong ? 'qz-shake' : ''} ${bounceCorrect ? 'qz-bounce' : ''}`}>
                {/* Dot progress */}
                <DotProgress total={total} current={currentIndex} answers={answers} />

                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  {/* Question header + streak */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {t('courseDetail.quizQuestionLabel')} {currentIndex + 1} / {total}
                    </span>
                    <FireBadge streak={streak} />
                  </div>

                  {/* Question text with LaTeX */}
                  <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed mb-5">
                    <RenderMath text={q?.text} />
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {(q?.options || []).map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSel = selectedOption === idx;
                      const isCorr = idx === q?.correct;
                      const fb = stage === 'feedback';
                      const isTapped = tappedOpt === idx;

                      let border = 'border-gray-200 dark:border-gray-600';
                      let bg = 'bg-white dark:bg-gray-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:border-indigo-300 dark:hover:border-indigo-600';
                      let letterStyle = 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
                      let textCls = 'text-gray-700 dark:text-gray-200';
                      let endIcon = null;
                      let extraCls = '';

                      if (fb && isCorr) {
                        border = 'border-emerald-400 dark:border-emerald-500';
                        bg = 'bg-emerald-50 dark:bg-emerald-900/25';
                        letterStyle = 'bg-emerald-500 text-white shadow-sm';
                        textCls = 'text-emerald-800 dark:text-emerald-100 font-semibold';
                        endIcon = <Check className="w-4.5 h-4.5 text-emerald-500" />;
                        extraCls = 'qz-slide-up';
                      } else if (fb && isSel && !isCorr) {
                        border = 'border-red-400 dark:border-red-500';
                        bg = 'bg-red-50 dark:bg-red-900/20';
                        letterStyle = 'bg-red-500 text-white';
                        textCls = 'text-red-700 dark:text-red-300';
                        endIcon = <X className="w-4.5 h-4.5 text-red-400" />;
                      } else if (fb) {
                        bg = 'bg-gray-50 dark:bg-gray-800 opacity-40';
                      }

                      return (
                        <button
                          key={idx} onClick={() => handleSelect(idx)} disabled={fb}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 ${border} ${bg} ${extraCls} ${isTapped ? 'qz-pop' : ''} ${!fb ? 'cursor-pointer active:scale-[0.97]' : ''}`}
                        >
                          <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all duration-200 ${letterStyle}`}>
                            {fb && isCorr ? <Check className="w-4 h-4" /> : fb && isSel ? <X className="w-4 h-4" /> : letter}
                          </span>
                          <span className={`flex-1 text-sm leading-snug ${textCls}`}>
                            <RenderMath text={opt} />
                          </span>
                          {endIcon && <span className="flex-shrink-0 ml-1">{endIcon}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback banner with SVG character */}
                  {stage === 'feedback' && (
                    <div className={`mt-5 p-4 rounded-xl qz-slide-up ${
                      isCorrect
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/25 dark:to-green-900/20 border-2 border-emerald-300 dark:border-emerald-700'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/15 border-2 border-red-300 dark:border-red-700'
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* SVG animated character */}
                          <div className="flex-shrink-0">
                            {isCorrect ? <CorrectSvg /> : <WrongSvg />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                              {isCorrect
                                ? (streak >= 3 ? t('courseDetail.quizStreakFire') : t('courseDetail.quizCorrect'))
                                : t('courseDetail.quizWrong')}
                            </p>
                            {isCorrect && streak >= 2 && <FireBadge streak={streak} />}
                          </div>
                        </div>
                        <button onClick={handleNext}
                          className="flex items-center gap-1.5 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-md flex-shrink-0"
                          style={{
                            background: isCorrect ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            boxShadow: isCorrect ? '0 4px 12px rgba(16,185,129,0.4)' : '0 4px 12px rgba(99,102,241,0.4)',
                          }}>
                          {currentIndex + 1 < total
                            ? <>{t('courseDetail.quizNext')} <ChevronRight className="w-4 h-4" /></>
                            : <>{t('courseDetail.quizResults')} <ChevronRight className="w-4 h-4" /></>}
                        </button>
                      </div>
                      {q?.explanation && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-black/5 dark:border-white/5 leading-relaxed">
                          <RenderMath text={q.explanation} />
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RESULTS ── */}
            {stage === 'results' && (() => {
              const great = pct >= 80, good = pct >= 60;
              const ringColor = great ? '#10b981' : good ? '#6366f1' : '#ef4444';
              const circumference = 2 * Math.PI * 42;
              const msg = great ? t('courseDetail.quizExcellent') : good ? t('courseDetail.quizGood') : t('courseDetail.quizRetry');
              const wrongCount = answers.filter(a => !a.correct).length;
              const canWorkOnMistakes = pct > 50 && wrongCount > 0;

              return (
                <div className="px-5 py-8 sm:px-8 sm:py-10 qz-enter relative overflow-hidden">
                  <div className="relative z-20 text-center">

                    {/* Score ring */}
                    <div className="relative w-28 h-28 mx-auto mb-4">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="42" fill="none" strokeWidth="5" className="stroke-gray-100 dark:stroke-gray-700" />
                        <circle cx="48" cy="48" r="42" fill="none" strokeWidth="5"
                          stroke={ringColor} strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - pct / 100)}
                          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{pct}%</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{score} / {total}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{msg}</p>

                    {bestScore > 0 && bestScore !== pct && (
                      <div className="inline-flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/25 px-3 py-1.5 rounded-full mb-4">
                        <Trophy className="w-3 h-3" /> {t('courseDetail.quizBestLabel')}: {bestScore}%
                      </div>
                    )}

                    {/* Dot summary */}
                    <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
                      {answers.map((a, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${a.correct ? 'bg-emerald-500' : 'bg-red-400'}`}
                          title={`${i+1}. ${a.correct ? '✓' : '✗'}`} />
                      ))}
                    </div>

                    {/* Answer summary */}
                    <div className="max-w-md mx-auto mb-5 space-y-1.5 text-left">
                      {answers.map((a, i) => (
                        <div key={i} className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs ${
                          a.correct ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/15'
                        }`}>
                          <span className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${
                            a.correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {a.correct ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium flex-1 min-w-0">
                            <RenderMath text={`${i + 1}. ${questions[a.questionIndex]?.text?.slice(0, 70)}${(questions[a.questionIndex]?.text?.length ?? 0) > 70 ? '…' : ''}`} />
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => openReview(-1)}
                        className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold px-5 py-2.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        {t('courseDetail.quizReviewOpen')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
