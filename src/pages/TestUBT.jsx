import i18n from '../i18n';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import TestLanding from '../components/test/TestLanding';
import TestPlayer from '../components/test/TestPlayer';
import ResultView from '../components/test/ResultView';
import { onAuthStateChanged } from '../firebase/auth';
import AppLoader from '../components/AppLoader';

export default function TestUBT() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { testId, questionIndex } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing');
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        navigate('/login');
      } else {
        if (testId) {
          const isComposedId =
            typeof testId === 'string' &&
            (testId.startsWith('creative_') || testId.startsWith('full_'));

          if (isComposedId) {
            try {
              const progressKey = `test_progress_${testId}_${firebaseUser.uid}`;
              const raw = localStorage.getItem(progressKey);

              if (raw) {
                const progress = JSON.parse(raw);
                const hasComposed =
                  Array.isArray(progress.composedTests) && progress.composedTests.length > 0;

                if (hasComposed) {
                  const isCreative = progress.mode === 'creative' || progress.creativeMode;
                  const testConfig = {
                    testId: progress.testId,
                    title: progress.testTitle || i18n.t('common.resumedTest'),
                    mode: progress.mode || (isCreative ? 'creative' : 'full'),
                    subjects: Array.isArray(progress.subjects) ? progress.subjects : [],
                    profilePairId: progress.profilePairId || null,
                    profileSubjects: Array.isArray(progress.profileSubjects)
                      ? progress.profileSubjects
                      : [],
                    composedTests: progress.composedTests,
                    creativeMode: Boolean(progress.creativeMode),
                    timeLimit: progress.timeLimit || (isCreative ? 70 : 240),
                    startedAt: progress.startedAt || new Date().toISOString(),
                    startFromQuestion: questionIndex
                      ? parseInt(questionIndex) - 1
                      : (progress.currentQuestionIndex ?? 0),
                  };
                  setSelectedTest(testConfig);
                  setCurrentView('test');
                  return;
                }
              }

              navigate('/test-ubt', { replace: true });
            } catch {
              navigate('/test-ubt', { replace: true });
            }
          } else {
            const testConfig = {
              testId: testId,
              startFromQuestion: questionIndex ? parseInt(questionIndex) - 1 : 0,
            };
            setSelectedTest(testConfig);
            setCurrentView('test');
          }
        } else {
          const state = location.state;
          if (state?.resumeTest && state?.testId) {
            try {
              const progressKey = `test_progress_${state.testId}_${firebaseUser.uid}`;
              const raw = localStorage.getItem(progressKey);

              if (raw) {
                const progress = JSON.parse(raw);
                const hasComposed =
                  Array.isArray(progress.composedTests) && progress.composedTests.length > 0;

                if (hasComposed) {
                  const isCreative = progress.mode === 'creative' || progress.creativeMode;
                  const testConfig = {
                    testId: progress.testId,
                    title: progress.testTitle || i18n.t('common.resumedTest'),
                    mode: progress.mode || (isCreative ? 'creative' : 'full'),
                    subjects: Array.isArray(progress.subjects) ? progress.subjects : [],
                    profilePairId: progress.profilePairId || null,
                    profileSubjects: Array.isArray(progress.profileSubjects)
                      ? progress.profileSubjects
                      : [],
                    composedTests: progress.composedTests,
                    creativeMode: Boolean(progress.creativeMode),
                    timeLimit: progress.timeLimit || (isCreative ? 70 : 240),
                    startedAt: progress.startedAt || new Date().toISOString(),
                    startFromQuestion: progress.currentQuestionIndex ?? 0,
                  };
                  setSelectedTest(testConfig);
                  setCurrentView('test');
                  return;
                }
              }

              const testConfig = {
                testId: state.testId,
                title: i18n.t('ui.resumedTest'),
              };
              setSelectedTest(testConfig);
              setCurrentView('test');
            } catch {}
          }
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location.state, testId, questionIndex]);

  const handleStartTest = (testConfig) => {
    setSelectedTest(testConfig);
    setCurrentView('test');
  };

  const handleTestComplete = (results) => {
    setTestResults(results);
    setCurrentView('results');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedTest(null);
    setTestResults(null);
  };

  if (loading) {
    return <AppLoader text={t('common.loading')} />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {currentView === 'landing' && <TestLanding onStartTest={handleStartTest} />}

      {currentView === 'test' && selectedTest && (
        <TestPlayer
          testConfig={selectedTest}
          onTestComplete={handleTestComplete}
          onBackToLanding={handleBackToLanding}
        />
      )}

      {currentView === 'results' && testResults && (
        <ResultView results={testResults} onBackToLanding={handleBackToLanding} />
      )}
    </div>
  );
}
