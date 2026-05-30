import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import QuestionCard from './QuestionCard';
import TopNavigator from './TopNavigator';
import { fetchTestQuestions, saveTestResult, saveTestProgress } from '../../firebase/rtdbApi';
import { getCurrentUser } from '../../firebase/auth';
import AppLoader from '../AppLoader';

export default function TestPlayer({ testConfig, onTestComplete, onBackToLanding }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { questionIndex: urlQuestionIndex } = useParams();
  const user = getCurrentUser();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [testStartTime] = useState(new Date());
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [warningText, setWarningText] = useState('');
  const [warned5, setWarned5] = useState(false);
  const [warned1, setWarned1] = useState(false);
  const [subjectsOrder, setSubjectsOrder] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);

  const isComposed = Array.isArray(testConfig.composedTests) && testConfig.composedTests.length > 0;

  // Load test questions
  useEffect(() => {
    loadTestQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testConfig?.testId]);

  const handleAutoSubmit = useCallback(() => {
    submitTest(true);
  }, [answers, questions]);

  // Timer
  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleAutoSubmit]);

  // Time warnings at 5 and 1 minutes
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft === 300 && !warned5) {
      setWarned5(true);
      setWarningText(t('test.warning5min'));
      setTimeout(() => setWarningText(''), 6000);
    }
    if (timeLeft === 60 && !warned1) {
      setWarned1(true);
      setWarningText(t('test.warning1min'));
      setTimeout(() => setWarningText(''), 6000);
    }
  }, [timeLeft, warned5, warned1, t]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveProgress();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [answers]);

  const loadTestQuestions = async () => {
    try {
      // Composed full/creative test: load questions from multiple underlying tests
      if (isComposed) {
        const allQuestions = [];
        for (const part of testConfig.composedTests) {
          if (!part?.testId) continue;
          const data = await fetchTestQuestions(part.testId);
          const qs = data.questions || [];
          qs.forEach((q) => {
            allQuestions.push({
              ...q,
              sectionTitle: q.sectionTitle || (part.subject ? t(`test.subjects.${part.subject}`) : q.sectionTitle),
              _sourceTestId: part.testId,
              _sourceSubject: part.subject || null
            });
          });
        }
        setQuestions(allQuestions);

        // Determine available subjects order for tabs
        const subjectsFromConfig = Array.isArray(testConfig.subjects) ? testConfig.subjects.filter(Boolean) : [];
        const subjectsFromQuestions = Array.from(new Set(allQuestions.map((q) => q._sourceSubject).filter(Boolean)));
        const orderedSubjects = subjectsFromConfig.length > 0
          ? subjectsFromConfig.filter((s) => subjectsFromQuestions.includes(s))
          : subjectsFromQuestions;
        setSubjectsOrder(orderedSubjects);
        setActiveSubject((prev) =>
          prev && orderedSubjects.includes(prev) ? prev : (orderedSubjects[0] || null)
        );

        const baseMinutes = testConfig.timeLimit || (testConfig.creativeMode ? 70 : 240);
        setTimeLeft(baseMinutes * 60);

        // Restore saved progress for composed tests if available
        try {
          if (user && testConfig.testId) {
            const raw = localStorage.getItem(`test_progress_${testConfig.testId}_${user.uid}`);
            if (raw) {
              const progress = JSON.parse(raw);
              setAnswers(progress.answers || {});
              const startQuestionIndex =
                typeof testConfig.startFromQuestion === 'number'
                  ? testConfig.startFromQuestion
                  : (progress.currentQuestionIndex ?? 0);
              setCurrentQuestionIndex(startQuestionIndex);
              if (progress.timeLeft) {
                setTimeLeft(progress.timeLeft);
              }
              setRestoredFromDraft(true);
            } else if (typeof testConfig.startFromQuestion === 'number') {
              setCurrentQuestionIndex(testConfig.startFromQuestion);
            } else {
              setCurrentQuestionIndex(0);
            }
          } else {
            setCurrentQuestionIndex(typeof testConfig.startFromQuestion === 'number' ? testConfig.startFromQuestion : 0);
          }
        } catch (e) {
          console.error('Error restoring composed test progress:', e);
          setCurrentQuestionIndex(typeof testConfig.startFromQuestion === 'number' ? testConfig.startFromQuestion : 0);
        }
      } else if (testConfig.testId) {
        // Simple single test
        const data = await fetchTestQuestions(testConfig.testId);
        const testData = data.testData || {};
        setQuestions(data.questions || []);

        // Update testConfig with real test data
        if (testData.title) {
          testConfig.title = testData.title;
        }
        if (testData.subjects) {
          testConfig.subjects = testData.subjects;
        }
        // Do not override mode explicitly set by TestLanding (e.g., 'single')
        if (!testConfig.mode && testData.mode) {
          testConfig.mode = testData.mode;
        }
        if (typeof testData.creativeMode === 'boolean' && testConfig.mode !== 'single') {
          testConfig.creativeMode = testData.creativeMode;
        }

        // Ensure variant from admin panel is always available (for certificates)
        if (typeof testData.variant === 'number') {
          testConfig.variant = testData.variant;
        }

        const effectiveMode = testConfig.mode || testData.mode;
        const isFullMode = effectiveMode === 'full';
        const isCreative = testData.creativeMode || testConfig.creativeMode;
        const baseMinutes = testData.timeLimit
          || testConfig.timeLimit
          || (isCreative ? 70 : (isFullMode ? 240 : 60));
        setTimeLeft(baseMinutes * 60);

        const progressKey = user && testConfig.testId
          ? `test_progress_${testConfig.testId}_${user.uid}`
          : null;
        const savedProgress = progressKey ? localStorage.getItem(progressKey) : null;

        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          setAnswers(progress.answers || {});
          const startQuestionIndex =
            urlQuestionIndex
              ? parseInt(urlQuestionIndex, 10) - 1
              : (typeof testConfig.startFromQuestion === 'number'
                  ? testConfig.startFromQuestion
                  : (progress.currentQuestionIndex ?? 0));
          setCurrentQuestionIndex(startQuestionIndex >= 0 ? startQuestionIndex : 0);
          if (progress.timeLeft) setTimeLeft(progress.timeLeft);
          setRestoredFromDraft(true);
        } else if (typeof testConfig.startFromQuestion === 'number') {
          setCurrentQuestionIndex(testConfig.startFromQuestion);
        } else if (urlQuestionIndex) {
          const idx = parseInt(urlQuestionIndex, 10) - 1;
          setCurrentQuestionIndex(Number.isFinite(idx) && idx >= 0 ? idx : 0);
        } else {
          setCurrentQuestionIndex(0);
        }
      } else {
        throw new Error('No testId provided');
      }
    } catch (error) {
      console.error('Error loading test:', error);
      alert(t('test.errorLoadingTest'));
      onBackToLanding();
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveSubjects = () => {
    const fromConfig = Array.isArray(testConfig.subjects)
      ? testConfig.subjects.filter(Boolean)
      : [];
    if (fromConfig.length > 0) return fromConfig;

    const fromQuestions = Array.from(
      new Set(
        (questions || [])
          .map((q) => q && q.sectionId)
          .filter(Boolean)
      )
    );

    return fromQuestions;
  };

  const saveProgress = async () => {
    if (!user || !testConfig.testId) return;

    const progress = {
      testId: testConfig.testId,
      testTitle: getTestTitle(),
      mode: testConfig.mode || (testConfig.creativeMode ? 'creative' : 'single'),
      subjects: getEffectiveSubjects(),
      profilePairId: testConfig.profilePairId || null,
      profileSubjects: Array.isArray(testConfig.profileSubjects) ? testConfig.profileSubjects : [],
      composedTests: Array.isArray(testConfig.composedTests) ? testConfig.composedTests : [],
      creativeMode: Boolean(testConfig.creativeMode),
      timeLimit: testConfig.timeLimit || null,
      startedAt: testConfig.startedAt || testStartTime.toISOString(),
      answers,
      currentQuestionIndex,
      timeLeft,
      lastSaved: new Date().toISOString()
    };

    const key = `test_progress_${testConfig.testId}_${user.uid}`;
    localStorage.setItem(key, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('testProgressSaved', { detail: progress }));
    setLastAutoSave(new Date().toISOString());

    try {
      await saveTestProgress(user.uid, testConfig.testId, progress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAnswerSelect = (questionId, selectedAnswers) => {
    const newAnswers = {
      ...answers,
      [questionId]: {
        selected: selectedAnswers,
        timestamp: Date.now()
      }
    };

    setAnswers(newAnswers);

    if (!user || !testConfig.testId) return;

    const progress = {
      testId: testConfig.testId,
      testTitle: getTestTitle(),
      mode: testConfig.mode || (testConfig.creativeMode ? 'creative' : 'single'),
      subjects: getEffectiveSubjects(),
      profilePairId: testConfig.profilePairId || null,
      profileSubjects: Array.isArray(testConfig.profileSubjects) ? testConfig.profileSubjects : [],
      composedTests: Array.isArray(testConfig.composedTests) ? testConfig.composedTests : [],
      creativeMode: Boolean(testConfig.creativeMode),
      timeLimit: testConfig.timeLimit || null,
      startedAt: testConfig.startedAt || testStartTime.toISOString(),
      answers: newAnswers,
      currentQuestionIndex,
      timeLeft,
      lastSaved: new Date().toISOString()
    };

    const key = `test_progress_${testConfig.testId}_${user.uid}`;
    localStorage.setItem(key, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('testProgressSaved', { detail: progress }));
    setLastAutoSave(new Date().toISOString());

    setTimeout(async () => {
      try {
        await saveTestProgress(user.uid, testConfig.testId, progress);
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }, 50);
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    // Update URL only for simple tests
    if (!isComposed && testConfig.testId) {
      navigate(`/test/${testConfig.testId}/question/${index + 1}`, { replace: true });
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      if (!isComposed && testConfig.testId) {
        navigate(`/test/${testConfig.testId}/question/${newIndex + 1}`, { replace: true });
      }
    }
  };

  const handleNextQuestion = () => {
    const total = activeSubject
      ? questions.filter((q) => q._sourceSubject === activeSubject).length
      : questions.length;

    if (currentQuestionIndex < total - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      if (!isComposed && testConfig.testId) {
        navigate(`/test/${testConfig.testId}/question/${newIndex + 1}`, { replace: true });
      }
    }
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const submitTest = async (autoSubmit = false) => {
    setSaving(true);

    try {
      if (!questions || questions.length === 0) {
        throw new Error('No questions available for scoring');
      }

      // Special UBT scoring for simple 40-question tests (1–40)
      // 1–25: single, 1 point each
      // 26–30: context questions, 1 point each
      // 31–35: matching, up to 2 points (0/1/2 based on matches)
      // 36–40: multi-answer, up to 2 points with partial 1-point scoring
      const isUbtSingle40 = !isComposed && !testConfig.creativeMode && questions.length === 40;

      let correctAnswersCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;
      const detailedResults = {};

      questions.forEach((question, index) => {
        if (!question || !question.id) {
          console.warn(`Question ${index} is missing ID`);
          return;
        }

        const userAnswer = answers[question.id];
        const correctAnswersList = question.correct || question.correctAnswers || [];
        const inferredType = question.type || ((correctAnswersList && correctAnswersList.length > 1) ? 'multi' : 'single');
        const order = typeof question.order === 'number' ? question.order : (index + 1);

        let isCorrect = false;
        let questionEarnedPoints = 0;
        let questionMaxPoints = 1;

        if (isUbtSingle40) {
          // UBT single-subject scoring by question order
          if (order >= 31 && order <= 35) {
            // Matching: two sub-questions, 0/1/2 points
            questionMaxPoints = 2;
            const correctMatches = question.correctMatches || {};
            const selectedMatches = (userAnswer && typeof userAnswer.selected === 'object' && !Array.isArray(userAnswer.selected))
              ? userAnswer.selected
              : {};
            const leftIds = Object.keys(correctMatches);

            let correctCount = 0;
            leftIds.forEach((leftId) => {
              if (selectedMatches[leftId] && selectedMatches[leftId] === correctMatches[leftId]) {
                correctCount += 1;
              }
            });

            if (correctCount === leftIds.length && leftIds.length > 0) {
              // Both matches correct
              isCorrect = true;
              questionEarnedPoints = questionMaxPoints;
            } else if (correctCount > 0) {
              // Exactly one match correct
              questionEarnedPoints = 1;
            }
          } else if (order >= 36 && order <= 40) {
            // Multi-answer with partial scoring and strict rules
            questionMaxPoints = 2;

            const normalizeArray = (arr) =>
              Array.from(new Set((Array.isArray(arr) ? arr : []).filter((v) => typeof v === 'string' && v.trim()))).sort();

            const userSelected = normalizeArray(userAnswer?.selected);
            const correctSelected = normalizeArray(correctAnswersList);

            if (userSelected.length === 0 || correctSelected.length === 0) {
              questionEarnedPoints = 0;
            } else if (userSelected.length > 3) {
              // Selecting more than 3 options is forbidden → 0 points
              questionEarnedPoints = 0;
            } else {
              const correctSet = new Set(correctSelected);
              const hasWrong = userSelected.some((key) => !correctSet.has(key));

              if (hasWrong) {
                // Any wrong option → 0 points
                questionEarnedPoints = 0;
              } else {
                const correctCount = correctSelected.length;
                const userCount = userSelected.length;

                if (correctCount === 1) {
                  // Only exact selection of the single correct answer gives 2 points
                  if (userCount === 1 && correctSet.has(userSelected[0])) {
                    questionEarnedPoints = 2;
                    isCorrect = true;
                  } else {
                    questionEarnedPoints = 0;
                  }
                } else if (correctCount === 2) {
                  if (userCount === 2 && userSelected.every((k) => correctSet.has(k))) {
                    // Both answers correct
                    questionEarnedPoints = 2;
                    isCorrect = true;
                  } else if (userCount === 1 && correctSet.has(userSelected[0])) {
                    // One of two correct answers chosen
                    questionEarnedPoints = 1;
                  } else {
                    questionEarnedPoints = 0;
                  }
                } else if (correctCount === 3) {
                  if (userCount === 3 && userSelected.every((k) => correctSet.has(k))) {
                    // All three correct
                    questionEarnedPoints = 2;
                    isCorrect = true;
                  } else if (userCount === 2 && userSelected.every((k) => correctSet.has(k))) {
                    // Any two of three correct
                    questionEarnedPoints = 1;
                  } else {
                    questionEarnedPoints = 0;
                  }
                } else {
                  // Fallback for unexpected counts: only exact match gives full points
                  if (
                    userCount === correctCount &&
                    JSON.stringify(userSelected) === JSON.stringify(correctSelected)
                  ) {
                    questionEarnedPoints = 2;
                    isCorrect = true;
                  } else {
                    questionEarnedPoints = 0;
                  }
                }
              }
            }
          } else {
            // 1–25 and 26–30: standard single-choice, 1 point
            questionMaxPoints = 1;
            if (Array.isArray(userAnswer?.selected) && correctAnswersList.length > 0) {
              const userSelectedSorted = [...userAnswer.selected].sort();
              const correctAnswersSorted = [...correctAnswersList].sort();
              if (JSON.stringify(userSelectedSorted) === JSON.stringify(correctAnswersSorted)) {
                isCorrect = true;
                questionEarnedPoints = 1;
              }
            }
          }
        } else {
          // Generic scoring for other modes/tests
          const pointsRaw = Number(question.points);
          const questionPoints = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 1;
          questionMaxPoints = questionPoints;

          if (inferredType === 'matching') {
            const correctMatches = question.correctMatches || {};
            const selectedMatches = (userAnswer && typeof userAnswer.selected === 'object' && !Array.isArray(userAnswer.selected))
              ? userAnswer.selected
              : {};
            const leftIds = Object.keys(correctMatches);

            if (leftIds.length > 0 && leftIds.every((leftId) => selectedMatches[leftId] === correctMatches[leftId])) {
              isCorrect = true;
              questionEarnedPoints = questionPoints;
            }
          } else {
            if (Array.isArray(userAnswer?.selected) && correctAnswersList.length > 0) {
              try {
                const userSelectedSorted = [...userAnswer.selected].sort();
                const correctAnswersSorted = [...correctAnswersList].sort();
                if (JSON.stringify(userSelectedSorted) === JSON.stringify(correctAnswersSorted)) {
                  isCorrect = true;
                  questionEarnedPoints = questionPoints;
                }
              } catch (error) {
                console.warn(`Error comparing answers for question ${question.id}:`, error);
                isCorrect = false;
              }
            }
          }
        }

        detailedResults[question.id] = {
          selected: userAnswer?.selected || (inferredType === 'matching' ? {} : []),
          correct: isCorrect,
          correctAnswer: inferredType === 'matching' ? (question.correctMatches || {}) : correctAnswersList,
          timeSpent: userAnswer?.timestamp
            ? Math.floor((userAnswer.timestamp - testStartTime.getTime()) / 1000)
            : 0
        };

        if (isCorrect) {
          correctAnswersCount++;
        }
        totalPoints += questionMaxPoints;
        earnedPoints += questionEarnedPoints;
      });

      const rawScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const score = Number.isNaN(rawScore) ? 0 : rawScore;

      const effectiveMode = testConfig.mode || (isUbtSingle40 ? 'single' : 'practice');
      const effectiveSubjects = getEffectiveSubjects();

      const result = {
        testId: testConfig.testId || 'unknown',
        testTitle: getTestTitle(),
        mode: effectiveMode,
        subjects: effectiveSubjects,
        profilePairId: testConfig.profilePairId || null,
        profileSubjects: Array.isArray(testConfig.profileSubjects) ? testConfig.profileSubjects : [],
        variant: typeof testConfig.variant === 'number' ? testConfig.variant : null,
        uid: user?.uid,
        displayName: user?.displayName || user?.email,
        startedAt: testStartTime.toISOString(),
        finishedAt: new Date().toISOString(),
        answers: detailedResults,
        score,
        scorePercent: score,
        totalCorrect: correctAnswersCount,
        totalQuestions: questions.length,
        totalPoints,
        earnedPoints,
        canViewAnswers: score >= 50,
        autoSubmit: Boolean(autoSubmit),
        timeSpent: Math.floor((new Date() - testStartTime) / 1000)
      };

      if (!result.testId || !result.uid) {
        throw new Error('Invalid test result: missing required fields');
      }

      await saveTestResult(result);

      if (user && testConfig.testId) {
        localStorage.removeItem(`test_progress_${testConfig.testId}_${user.uid}`);
      }

      window.dispatchEvent(new CustomEvent('testCompleted', { detail: result }));

      navigate('/test-ubt', { replace: true });

      onTestComplete(result);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert(t('test.errorSubmittingTest'));
    } finally {
      setSaving(false);
      setShowSubmitModal(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getTestTitle = () => {
    if (testConfig.title && testConfig.title !== 'Test from URL' && testConfig.title !== 'Test') {
      return testConfig.title;
    }
    if (testConfig.subjects && testConfig.subjects.length > 0) {
      return t('test.fullMockTest');
    }
    return 'ҰБТ тесті';
  };

  const getModeLabel = () => {
    if (testConfig.creativeMode || testConfig.mode === 'creative') {
      return t('test.creativeModeTitle');
    }
    if (testConfig.mode === 'full') {
      return t('test.fullMockTest');
    }
    if (testConfig.mode === 'single') {
      return t('test.singleSubject');
    }
    return 'ҰБТ тесті';
  };

  const getSubjectsLine = () => {
    if (!Array.isArray(testConfig.subjects) || testConfig.subjects.length === 0) return '';
    const labels = testConfig.subjects.map((subjId) => t(`test.subjects.${subjId}`));
    return labels.join(' → ');
  };

  if (loading) {
    return <AppLoader text={t('test.loadingTest')} />;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('test.noQuestionsFound')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('test.noQuestionsDesc')}
          </p>
          <button
            onClick={onBackToLanding}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('test.backToTests')}
          </button>
        </div>
      </div>
    );
  }

  const visibleQuestions = activeSubject
    ? questions.filter((q) => q._sourceSubject === activeSubject)
    : questions;

  if (visibleQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('test.noQuestionsFound')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('test.noQuestionsDesc')}
          </p>
          <button
            onClick={onBackToLanding}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('test.backToTests')}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const answeredQuestions = visibleQuestions.map((q) => ({
    id: q.id,
    answered: !!answers[q.id]
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={onBackToLanding}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div>
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                  {getModeLabel()}
                </h1>
                {getSubjectsLine() && (
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px] sm:max-w-xs">
                    {getSubjectsLine()}
                  </div>
                )}
                {testConfig.creativeMode && (
                  <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-300 mt-0.5">
                    {t('test.creativeModeNote')}
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                  {getAnsweredCount()}/{questions.length}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-green-600">{getAnsweredCount()}</span>
                <span className="mx-1">/</span>
                <span className="font-semibold">{questions.length}</span>
              </div>

              {timeLeft !== null && (
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs sm:text-sm ${
                    timeLeft < 300
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : timeLeft < 600
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {warningText && (
        <div className="fixed top-14 left-0 right-0 z-50 flex justify-center px-2">
          <div
            className={`px-4 py-2 rounded-xl shadow-lg text-xs sm:text-sm font-medium border ${
              timeLeft <= 60
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
            }`}
            role="status"
            aria-live="assertive"
          >
            {warningText}
          </div>
        </div>
      )}

      {/* Subject tabs for composed tests */}
      {subjectsOrder.length > 0 && (
        <div className="container mx-auto px-2 sm:px-4 mt-2 max-w-5xl">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {subjectsOrder.map((subj) => {
              const isActive = activeSubject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => {
                    setActiveSubject(subj);
                    setCurrentQuestionIndex(0);
                  }}
                  className={`whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`test.subjects.${subj}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Navigator */}
      <TopNavigator
        questions={answeredQuestions}
        currentIndex={currentQuestionIndex}
        onQuestionSelect={navigateToQuestion}
      />

      {false && restoredFromDraft && (
        <div />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-5xl pb-20 sm:pb-24">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            selectedAnswers={
              currentQuestion?.type === 'matching'
                ? (
                    answers[currentQuestion.id]?.selected &&
                    typeof answers[currentQuestion.id]?.selected === 'object' &&
                    !Array.isArray(answers[currentQuestion.id]?.selected)
                      ? answers[currentQuestion.id]?.selected
                      : {}
                  )
                : (Array.isArray(answers[currentQuestion.id]?.selected)
                      ? answers[currentQuestion.id]?.selected
                      : [])
            }
            onAnswerSelect={handleAnswerSelect}
          />
        )}
      </div>

      {/* Floating Navigation Footer */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-3 shadow-xl">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-1.5 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('test.previous')}</span>
                <span className="sm:hidden">{t('test.prev')}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl transition-all text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t('test.submit')}
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === visibleQuestions.length - 1}
                className="flex items-center space-x-1.5 px-3 py-2 text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 rounded-xl"
              >
                <span className="hidden sm:inline">{t('test.next')}</span>
                <span className="sm:hidden">{t('test.next')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('test.confirmSubmit')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('test.answeredCount', { answered: getAnsweredCount(), total: questions.length })}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('test.submitWarning')}
            </p>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => submitTest()}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? t('test.submitting') : t('test.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
