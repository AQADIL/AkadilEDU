import i18n from '../i18n';
import { ref, set, get, push, update, remove } from 'firebase/database';
import { auth, rtdb } from './config';

const getDeviceId = () => {
  let deviceId = localStorage.getItem('ak_deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('ak_deviceId', deviceId);
  }
  return deviceId;
};

export const createTest = async (testData) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error(i18n.t('ui.signInToContinue'));
  }

  const testRef = push(ref(rtdb, 'tests'));
  const testId = testRef.key;

  const test = {
    id: testId,
    title: testData.title,
    variant: testData.variant || 1,
    language: testData.language || 'kk',
    mode: testData.mode,
    subjects: testData.subjects || [],
    createdBy: user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalQuestions: testData.totalQuestions || 0,
    timeLimit: testData.timeLimit,
    sections: testData.sections || {},
  };

  await set(testRef, test);

  return testId;
};

export const updateTest = async (testId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const testRef = ref(rtdb, `tests/${testId}`);
  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: user.uid,
  };

  await update(testRef, updatedData);
  return true;
};

export const deleteTest = async (testId) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const testRef = ref(rtdb, `tests/${testId}`);
  await remove(testRef);
  return true;
};

export const fetchAvailableTests = async () => {
  const testsRef = ref(rtdb, 'tests');
  const snapshot = await get(testsRef);

  if (snapshot.exists()) {
    const tests = [];
    snapshot.forEach((childSnapshot) => {
      tests.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });
    return tests;
  }
  return [];
};

export const fetchTestsBySubject = async (subject) => {
  try {
    const testsRef = ref(rtdb, 'tests');
    const snapshot = await get(testsRef);

    if (snapshot.exists()) {
      const tests = [];
      snapshot.forEach((childSnapshot) => {
        const testData = childSnapshot.val();
        if (testData.subjects && testData.subjects.includes(subject)) {
          tests.push({
            id: childSnapshot.key,
            ...testData,
          });
        }
      });

      return tests;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const fetchTestQuestions = async (testId) => {
  const testRef = ref(rtdb, `tests/${testId}`);
  const snapshot = await get(testRef);

  if (!snapshot.exists()) {
    throw new Error(i18n.t('ui.testNotFound'));
  }

  const testData = snapshot.val();
  const allQuestions = [];

  if (testData.sections) {
    Object.values(testData.sections).forEach((section) => {
      if (section.questions) {
        Object.values(section.questions).forEach((question) => {
          allQuestions.push({
            ...question,
            sectionTitle: section.title,
          });
        });
      }
    });
  }

  allQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    questions: allQuestions,
    timeLimit: testData.timeLimit || 60,
    testData: testData,
  };
};

export const createQuestion = async (testId, sectionId, questionData) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const questionRef = push(ref(rtdb, `tests/${testId}/sections/${sectionId}/questions`));
  const questionId = questionRef.key;

  const question = {
    id: questionId,
    order: questionData.order,
    contentHtml: questionData.contentHtml,
    contentText: questionData.contentText,
    imageUrls: questionData.imageUrls || [],
    options: questionData.options,
    correct: questionData.correct,
    points: questionData.points || 1,
    createdBy: user.uid,
    createdAt: new Date().toISOString(),
  };

  await set(questionRef, question);

  const testRef = ref(rtdb, `tests/${testId}`);
  const testSnapshot = await get(testRef);
  if (testSnapshot.exists()) {
    const testData = testSnapshot.val();
    const newTotal = (testData.totalQuestions || 0) + 1;
    await update(testRef, { totalQuestions: newTotal });
  }

  return questionId;
};

export const updateQuestion = async (testId, sectionId, questionId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const questionRef = ref(rtdb, `tests/${testId}/sections/${sectionId}/questions/${questionId}`);
  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: user.uid,
  };

  await update(questionRef, updatedData);
  return true;
};

export const deleteQuestion = async (testId, sectionId, questionId) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const questionRef = ref(rtdb, `tests/${testId}/sections/${sectionId}/questions/${questionId}`);
  await remove(questionRef);

  const testRef = ref(rtdb, `tests/${testId}`);
  const testSnapshot = await get(testRef);
  if (testSnapshot.exists()) {
    const testData = testSnapshot.val();
    const newTotal = Math.max(0, (testData.totalQuestions || 0) - 1);
    await update(testRef, { totalQuestions: newTotal });
  }

  return true;
};

export const saveTestResult = async (resultData) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = {
    attemptId,
    uid: user.uid,
    displayName: user.displayName || user.email,
    testId: resultData.testId,
    testTitle: resultData.testTitle,
    mode: resultData.mode || 'practice',
    subjects: resultData.subjects || [],
    variant: typeof resultData.variant === 'number' ? resultData.variant : null,
    startedAt: resultData.startedAt,
    finishedAt: resultData.finishedAt,

    answers: Object.keys(resultData.answers || {}).reduce((acc, questionId) => {
      const answer = resultData.answers[questionId];
      if (answer) {
        acc[questionId] = {
          s: answer.selected || [],
          c: Boolean(answer.correct),
          t: answer.timeSpent || 0,
        };
      }
      return acc;
    }, {}),
    score: resultData.score,
    scorePercent:
      typeof resultData.scorePercent === 'number' ? resultData.scorePercent : resultData.score,
    totalCorrect: resultData.totalCorrect,
    totalQuestions: resultData.totalQuestions,
    totalPoints: resultData.totalPoints ?? null,
    earnedPoints: resultData.earnedPoints ?? null,
    canViewAnswers: resultData.canViewAnswers,
    autoSubmit: resultData.autoSubmit || false,
    timeSpent: resultData.timeSpent,

    deviceId: getDeviceId(),
    timestamp: Date.now(),
  };

  const userResultRef = ref(rtdb, `userResults/${user.uid}/${attemptId}`);
  await set(userResultRef, result);

  if (resultData.testId) {
    const fullResultRef = ref(rtdb, `results/${resultData.testId}/${user.uid}/${attemptId}`);
    const scorePercent =
      typeof resultData.scorePercent === 'number' ? resultData.scorePercent : resultData.score;
    const normalizedAnswers = Object.keys(resultData.answers || {}).reduce((acc, questionId) => {
      const answer = resultData.answers[questionId];
      if (answer) {
        const sel = answer.selected;
        acc[questionId] = {
          selected: Array.isArray(sel) || (sel && typeof sel === 'object') ? sel : sel ? [sel] : [],
          correct: Boolean(answer.correct),
          timeSec: answer.timeSpent || 0,
        };
      }
      return acc;
    }, {});

    const fullResult = {
      attemptId,
      uid: user.uid,
      displayName: user.displayName || user.email,
      startedAt: resultData.startedAt,
      finishedAt: resultData.finishedAt,
      answers: normalizedAnswers,
      score: scorePercent,
      scorePercent,
      totalCorrect: resultData.totalCorrect,
      totalQuestions: resultData.totalQuestions,
      canViewAnswers: Boolean(resultData.canViewAnswers),
      meta: {
        deviceId: getDeviceId(),
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now(),
      },
    };

    await set(fullResultRef, fullResult);
  }
  return attemptId;
};

export const fetchUserResults = async (userId) => {
  if (!userId) userId = auth.currentUser?.uid;
  if (!userId) throw new Error(i18n.t('ui.signInToContinue'));

  const userResultsRef = ref(rtdb, `userResults/${userId}`);
  const snapshot = await get(userResultsRef);

  if (snapshot.exists()) {
    const results = [];
    snapshot.forEach((childSnapshot) => {
      results.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });
    return results.sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  }
  return [];
};

export const fetchTestResult = async (testId, userId, attemptId) => {
  if (!userId) userId = auth.currentUser?.uid;
  if (!userId) throw new Error(i18n.t('ui.signInToContinue'));

  const resultRef = ref(rtdb, `results/${testId}/${userId}/${attemptId}`);
  const snapshot = await get(resultRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
};

export const saveTestProgress = async (userId, testId, progressData) => {
  if (!userId) userId = auth.currentUser?.uid;
  if (!userId) throw new Error(i18n.t('ui.signInToContinue'));

  const progressRef = ref(rtdb, `testProgress/${userId}/${testId}`);
  const progress = {
    ...progressData,
    savedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
  };

  await set(progressRef, progress);
  return true;
};

export const fetchTestProgress = async (userId, testId) => {
  if (!userId) userId = auth.currentUser?.uid;
  if (!userId) throw new Error(i18n.t('ui.signInToContinue'));

  const progressRef = ref(rtdb, `testProgress/${userId}/${testId}`);
  const snapshot = await get(progressRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
};

export const clearTestProgress = async (userId, testId) => {
  if (!userId) userId = auth.currentUser?.uid;
  if (!userId) throw new Error(i18n.t('ui.signInToContinue'));

  const progressRef = ref(rtdb, `testProgress/${userId}/${testId}`);
  await remove(progressRef);
  return true;
};

export const fetchAllTestResults = async (testId) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const resultsRef = ref(rtdb, `results/${testId}`);
  const snapshot = await get(resultsRef);

  if (snapshot.exists()) {
    const allResults = [];
    snapshot.forEach((userSnapshot) => {
      userSnapshot.forEach((attemptSnapshot) => {
        allResults.push({
          id: attemptSnapshot.key,
          ...attemptSnapshot.val(),
        });
      });
    });
    return allResults.sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  }
  return [];
};

export const getTestStatistics = async (testId) => {
  const results = await fetchAllTestResults(testId);

  if (results.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      topScore: 0,
      averageTime: 0,
    };
  }

  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const passCount = results.filter((result) => result.score >= 50).length;
  const totalTime = results.reduce((sum, result) => sum + (result.timeSpent || 0), 0);

  return {
    totalAttempts: results.length,
    averageScore: Math.round(totalScore / results.length),
    passRate: Math.round((passCount / results.length) * 100),
    topScore: Math.max(...results.map((r) => r.score)),
    averageTime: Math.round(totalTime / results.length),
  };
};
