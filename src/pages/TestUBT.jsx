import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import TestLanding from '../components/test/TestLanding';
import TestPlayer from '../components/test/TestPlayer';
import ResultView from '../components/test/ResultView';
import { getCurrentUser, onAuthStateChanged } from '../firebase/auth';
import AppLoader from '../components/AppLoader';

export default function TestUBT() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { testId, questionIndex } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing'); // landing, test, results
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        navigate('/login');
      } else {
        // Check URL parameters first
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
                const hasComposed = Array.isArray(progress.composedTests) && progress.composedTests.length > 0;

                if (hasComposed) {
                  const isCreative = progress.mode === 'creative' || progress.creativeMode;
                  const testConfig = {
                    testId: progress.testId,
                    title: progress.testTitle || 'Resumed Test',
                    mode: progress.mode || (isCreative ? 'creative' : 'full'),
                    subjects: Array.isArray(progress.subjects) ? progress.subjects : [],
                    profilePairId: progress.profilePairId || null,
                    profileSubjects: Array.isArray(progress.profileSubjects) ? progress.profileSubjects : [],
                    composedTests: progress.composedTests,
                    creativeMode: Boolean(progress.creativeMode),
                    timeLimit: progress.timeLimit || (isCreative ? 70 : 240),
                    startedAt: progress.startedAt || new Date().toISOString(),
                    startFromQuestion: questionIndex
                      ? parseInt(questionIndex) - 1
                      : (progress.currentQuestionIndex ?? 0)
                  };
                  setSelectedTest(testConfig);
                  setCurrentView('test');
                  return;
                }
              }

              // If we cannot restore, go back to landing without trying to load fake testId from RTDB
              navigate('/test-ubt', { replace: true });
            } catch (error) {
              console.error('Error resuming composed test from URL:', error);
              navigate('/test-ubt', { replace: true });
            }
          } else {
            // Simple test from direct URL
            const testConfig = {
              testId: testId,
              startFromQuestion: questionIndex ? parseInt(questionIndex) - 1 : 0
            };
            setSelectedTest(testConfig);
            setCurrentView('test');
          }
        } else {
          // Check if we need to resume a test from state (e.g., from AppWrapper modal)
          const state = location.state;
          if (state?.resumeTest && state?.testId) {
            try {
              const progressKey = `test_progress_${state.testId}_${firebaseUser.uid}`;
              const raw = localStorage.getItem(progressKey);

              if (raw) {
                const progress = JSON.parse(raw);
                const hasComposed = Array.isArray(progress.composedTests) && progress.composedTests.length > 0;

                if (hasComposed) {
                  const isCreative = progress.mode === 'creative' || progress.creativeMode;
                  const testConfig = {
                    testId: progress.testId,
                    title: progress.testTitle || 'Resumed Test',
                    mode: progress.mode || (isCreative ? 'creative' : 'full'),
                    subjects: Array.isArray(progress.subjects) ? progress.subjects : [],
                    profilePairId: progress.profilePairId || null,
                    profileSubjects: Array.isArray(progress.profileSubjects) ? progress.profileSubjects : [],
                    composedTests: progress.composedTests,
                    creativeMode: Boolean(progress.creativeMode),
                    timeLimit: progress.timeLimit || (isCreative ? 70 : 240),
                    startedAt: progress.startedAt || new Date().toISOString(),
                    startFromQuestion: progress.currentQuestionIndex ?? 0
                  };
                  setSelectedTest(testConfig);
                  setCurrentView('test');
                  return;
                }
              }

              // Fallback: treat as simple test config, TestPlayer will load by testId
              const testConfig = {
                testId: state.testId,
                title: 'Resumed Test'
              };
              setSelectedTest(testConfig);
              setCurrentView('test');
            } catch (error) {
              console.error('Error resuming test from state:', error);
            }
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
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {currentView === 'landing' && (
        <TestLanding onStartTest={handleStartTest} />
      )}
      
      {currentView === 'test' && selectedTest && (
        <TestPlayer 
          testConfig={selectedTest} 
          onTestComplete={handleTestComplete}
          onBackToLanding={handleBackToLanding}
        />
      )}
      
      {currentView === 'results' && testResults && (
        <ResultView 
          results={testResults} 
          onBackToLanding={handleBackToLanding}
        />
      )}
    </div>
  );
}
