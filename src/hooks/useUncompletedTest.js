import i18n from '../i18n';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from '../firebase/auth';

export function useUncompletedTest() {
  const [uncompletedTest, setUncompletedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkForUncompletedTest = useCallback(
    (currentUser = null) => {
      const userToCheck = currentUser || user;

      if (!userToCheck) {
        setLoading(false);
        return;
      }

      const allKeys = Object.keys(localStorage);
      const testProgressKeys = allKeys.filter(
        (key) => key.startsWith(`test_progress_`) && key.endsWith(`_${userToCheck.uid}`),
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

          const isComposedId =
            typeof progress.testId === 'string' &&
            (progress.testId.startsWith('creative_') || progress.testId.startsWith('full_'));
          const hasComposedMeta =
            Array.isArray(progress.composedTests) && progress.composedTests.length > 0;

          if (isComposedId && !hasComposedMeta) {
            localStorage.removeItem(progressKey);
            setUncompletedTest(null);
            setLoading(false);
            return;
          }

          const lastSaved = new Date(progress.lastSaved);
          const now = new Date();
          const hoursSinceLastSave = (now - lastSaved) / (1000 * 60 * 60);

          if (hoursSinceLastSave < 6 && progress.timeLeft > 0) {
            const isComposed = hasComposedMeta;
            setUncompletedTest({
              testId: progress.testId,
              testTitle: progress.testTitle || i18n.t('ui.test'),
              timeLeft: progress.timeLeft,
              currentQuestionIndex: progress.currentQuestionIndex,
              totalAnswered: Object.keys(progress.answers || {}).length,
              lastSaved: progress.lastSaved,
              mode: progress.mode || null,
              hasComposed: isComposed,
              subjects: Array.isArray(progress.subjects) ? progress.subjects : [],
            });
          } else {
            localStorage.removeItem(progressKey);
            setUncompletedTest(null);
          }
        } catch {
          localStorage.removeItem(progressKey);
        }
      }

      setLoading(false);
    },
    [user],
  );

  const clearUncompletedTest = useCallback(() => {
    if (!user || !uncompletedTest) return;

    const progressKey = `test_progress_${uncompletedTest.testId}_${user.uid}`;
    localStorage.removeItem(progressKey);
    setUncompletedTest(null);

    window.dispatchEvent(new CustomEvent('testProgressCleared'));
  }, [user, uncompletedTest]);

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
  }, [checkForUncompletedTest]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        checkForUncompletedTest(user);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    window.addEventListener('testProgressSaved', handleStorageChange);
    window.addEventListener('testProgressCleared', handleStorageChange);
    const handleCompleted = () => setUncompletedTest(null);
    window.addEventListener('testCompleted', handleCompleted);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('testProgressSaved', handleStorageChange);
      window.removeEventListener('testProgressCleared', handleStorageChange);
      window.removeEventListener('testCompleted', handleCompleted);
    };
  }, [checkForUncompletedTest, user]);

  return {
    uncompletedTest,
    loading,
    clearUncompletedTest,
    refreshCheck: checkForUncompletedTest,
  };
}
