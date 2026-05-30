import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, onAuthStateChanged } from '../firebase/auth';

export function useUncompletedTest() {
  const [uncompletedTest, setUncompletedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        checkForUncompletedTest(firebaseUser);
      } else {
        setUncompletedTest(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Also check on localStorage changes (when test progress is saved)
  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        checkForUncompletedTest(user);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen to custom events from same window
    window.addEventListener('testProgressSaved', handleStorageChange);
    window.addEventListener('testProgressCleared', handleStorageChange);
    window.addEventListener('testCompleted', () => {
      setUncompletedTest(null);
    });
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('testProgressSaved', handleStorageChange);
      window.removeEventListener('testProgressCleared', handleStorageChange);
      window.removeEventListener('testCompleted', handleStorageChange);
    };
  }, [user]);

  const checkForUncompletedTest = useCallback((currentUser = null) => {
    const userToCheck = currentUser || user;
    
    if (!userToCheck) {
      setLoading(false);
      return;
    }

    // Check localStorage for any uncompleted tests
    const allKeys = Object.keys(localStorage);
    const testProgressKeys = allKeys.filter(key => 
      key.startsWith(`test_progress_`) && key.endsWith(`_${userToCheck.uid}`)
    );

    if (testProgressKeys.length > 0) {
      const progressKey = testProgressKeys[0];
      try {
        const raw = localStorage.getItem(progressKey);
        if (!raw) {
          setUncompletedTest(null);
          setLoading(false);
          return;
        }

        const progress = JSON.parse(raw);

        // Detect composed tests (creative/full) saved in old format without composedTests metadata
        const isComposedId =
          typeof progress.testId === 'string' &&
          (progress.testId.startsWith('creative_') || progress.testId.startsWith('full_'));
        const hasComposedMeta = Array.isArray(progress.composedTests) && progress.composedTests.length > 0;

        if (isComposedId && !hasComposedMeta) {
          // Old saved composed test that we cannot safely resume – clear it
          localStorage.removeItem(progressKey);
          setUncompletedTest(null);
          setLoading(false);
          return;
        }

        // Check if test is still valid (not expired)
        const lastSaved = new Date(progress.lastSaved);
        const now = new Date();
        const hoursSinceLastSave = (now - lastSaved) / (1000 * 60 * 60);
        
        // If less than 6 hours since last save and still has time left
        if (hoursSinceLastSave < 6 && progress.timeLeft > 0) {
          const isComposed = hasComposedMeta;
          setUncompletedTest({
            testId: progress.testId,
            testTitle: progress.testTitle || 'Тест',
            timeLeft: progress.timeLeft,
            currentQuestionIndex: progress.currentQuestionIndex,
            totalAnswered: Object.keys(progress.answers || {}).length,
            lastSaved: progress.lastSaved,
            mode: progress.mode || null,
            hasComposed: isComposed,
            subjects: Array.isArray(progress.subjects) ? progress.subjects : []
          });
        } else {
          // Remove expired test
          localStorage.removeItem(progressKey);
          setUncompletedTest(null);
        }
      } catch (error) {
        console.error('Error parsing test progress:', error);
        localStorage.removeItem(progressKey);
      }
    }
    
    setLoading(false);
  }, [user]);

  const clearUncompletedTest = useCallback(() => {
    if (!user || !uncompletedTest) return;

    const progressKey = `test_progress_${uncompletedTest.testId}_${user.uid}`;
    localStorage.removeItem(progressKey);
    setUncompletedTest(null);
    
    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('testProgressCleared'));
  }, [user, uncompletedTest]);

  return {
    uncompletedTest,
    loading,
    clearUncompletedTest,
    refreshCheck: checkForUncompletedTest
  };
}
