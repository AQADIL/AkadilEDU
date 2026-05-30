import { ref, set, get, push, update, remove, child, orderByChild, query, limitToLast } from 'firebase/database';
import { auth, rtdb } from './config';

// Generate unique device ID for session tracking
const getDeviceId = () => {
  let deviceId = localStorage.getItem('ak_deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('ak_deviceId', deviceId);
  }
  return deviceId;
};

// Test Management Functions

export const createTest = async (testData) => {
  try {
    console.log('🚀 Creating test with data:', testData);
    
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('👤 Current user:', user.uid);

    const testRef = push(ref(rtdb, 'tests'));
    const testId = testRef.key;
    
    console.log('📝 Generated test ID:', testId);
    
    const test = {
      id: testId,
      title: testData.title,
      variant: testData.variant || 1,
      language: testData.language || 'kk',
      mode: testData.mode, // 'single' or 'full'
      subjects: testData.subjects || [],
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalQuestions: testData.totalQuestions || 0,
      timeLimit: testData.timeLimit, // in minutes
      sections: testData.sections || {}
    };

    console.log('💾 Test object to save:', test);
    
    await set(testRef, test);
    console.log('✅ Test saved successfully to Firebase with ID:', testId);
    
    return testId;
  } catch (error) {
    console.error('❌ Error creating test:', error);
    throw error;
  }
};

export const updateTest = async (testId, updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const testRef = ref(rtdb, `tests/${testId}`);
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid
    };

    await update(testRef, updatedData);
    return true;
  } catch (error) {
    console.error('Error updating test:', error);
    throw error;
  }
};

export const deleteTest = async (testId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const testRef = ref(rtdb, `tests/${testId}`);
    await remove(testRef);
    return true;
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
};

export const fetchAvailableTests = async () => {
  try {
    const testsRef = ref(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const tests = [];
      snapshot.forEach((childSnapshot) => {
        tests.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return tests;
    }
    return [];
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw error;
  }
};

export const fetchTestsBySubject = async (subject) => {
  try {
    console.log('🔍 Fetching tests for subject:', subject);
    const testsRef = ref(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const tests = [];
      snapshot.forEach((childSnapshot) => {
        const testData = childSnapshot.val();
        if (testData.subjects && testData.subjects.includes(subject)) {
          tests.push({
            id: childSnapshot.key,
            ...testData
          });
        }
      });
      console.log('📚 Found tests for subject', subject, ':', tests);
      return tests;
    }
    return [];
  } catch (error) {
    console.error('Error fetching tests by subject:', error);
    return [];
  }
};

export const fetchTestQuestions = async (testId) => {
  try {
    const testRef = ref(rtdb, `tests/${testId}`);
    const snapshot = await get(testRef);
    
    if (!snapshot.exists()) {
      throw new Error('Test not found');
    }
    
    const testData = snapshot.val();
    const allQuestions = [];
    
    // Collect all questions from all sections
    if (testData.sections) {
      Object.values(testData.sections).forEach(section => {
        if (section.questions) {
          Object.values(section.questions).forEach(question => {
            allQuestions.push({
              ...question,
              sectionTitle: section.title
            });
          });
        }
      });
    }
    
    // Sort by order
    allQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return {
      questions: allQuestions,
      timeLimit: testData.timeLimit || 60,
      testData: testData
    };
  } catch (error) {
    console.error('Error fetching test questions:', error);
    throw error;
  }
};

// Question Management Functions

export const createQuestion = async (testId, sectionId, questionData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

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
      createdAt: new Date().toISOString()
    };

    await set(questionRef, question);
    
    // Update test's total questions count
    const testRef = ref(rtdb, `tests/${testId}`);
    const testSnapshot = await get(testRef);
    if (testSnapshot.exists()) {
      const testData = testSnapshot.val();
      const newTotal = (testData.totalQuestions || 0) + 1;
      await update(testRef, { totalQuestions: newTotal });
    }

    return questionId;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

export const updateQuestion = async (testId, sectionId, questionId, updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const questionRef = ref(rtdb, `tests/${testId}/sections/${sectionId}/questions/${questionId}`);
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid
    };

    await update(questionRef, updatedData);
    return true;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

export const deleteQuestion = async (testId, sectionId, questionId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const questionRef = ref(rtdb, `tests/${testId}/sections/${sectionId}/questions/${questionId}`);
    await remove(questionRef);
    
    // Update test's total questions count
    const testRef = ref(rtdb, `tests/${testId}`);
    const testSnapshot = await get(testRef);
    if (testSnapshot.exists()) {
      const testData = testSnapshot.val();
      const newTotal = Math.max(0, (testData.totalQuestions || 0) - 1);
      await update(testRef, { totalQuestions: newTotal });
    }

    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Result Management Functions

export const saveTestResult = async (resultData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Оптимизированная структура - сохраняем только основной результат
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
      // Сжимаем answers - сохраняем только выбранные ответы и правильность
      answers: Object.keys(resultData.answers || {}).reduce((acc, questionId) => {
        const answer = resultData.answers[questionId];
        if (answer) {
          acc[questionId] = {
            s: answer.selected || [], // s = selected 
            c: Boolean(answer.correct), // c = correct
            t: answer.timeSpent || 0 // t = timeSpent
          };
        }
        return acc;
      }, {}),
      score: resultData.score,
      scorePercent: typeof resultData.scorePercent === 'number' ? resultData.scorePercent : resultData.score,
      totalCorrect: resultData.totalCorrect,
      totalQuestions: resultData.totalQuestions,
      totalPoints: resultData.totalPoints ?? null,
      earnedPoints: resultData.earnedPoints ?? null,
      canViewAnswers: resultData.canViewAnswers,
      autoSubmit: resultData.autoSubmit || false,
      timeSpent: resultData.timeSpent,
      // Минимальные метаданные
      deviceId: getDeviceId(),
      timestamp: Date.now()
    };

    // Save to user results collection
    const userResultRef = ref(rtdb, `userResults/${user.uid}/${attemptId}`);
    await set(userResultRef, result);

    // Also save to central results collection for analytics and new UBT module schema
    if (resultData.testId) {
      const fullResultRef = ref(rtdb, `results/${resultData.testId}/${user.uid}/${attemptId}`);
      const scorePercent = typeof resultData.scorePercent === 'number' ? resultData.scorePercent : resultData.score;
      const normalizedAnswers = Object.keys(resultData.answers || {}).reduce((acc, questionId) => {
        const answer = resultData.answers[questionId];
        if (answer) {
          const sel = answer.selected;
          acc[questionId] = {
            // Preserve arrays for single/multi and objects for matching
            selected: Array.isArray(sel) || (sel && typeof sel === 'object') ? sel : (sel ? [sel] : []),
            correct: Boolean(answer.correct),
            timeSec: answer.timeSpent || 0
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
          timestamp: Date.now()
        }
      };

      await set(fullResultRef, fullResult);
    }
    return attemptId;
  } catch (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
};

export const fetchUserResults = async (userId) => {
  try {
    if (!userId) userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const userResultsRef = ref(rtdb, `userResults/${userId}`);
    const snapshot = await get(userResultsRef);
    
    if (snapshot.exists()) {
      const results = [];
      snapshot.forEach((childSnapshot) => {
        results.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return results.sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching user results:', error);
    throw error;
  }
};

export const fetchTestResult = async (testId, userId, attemptId) => {
  try {
    if (!userId) userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const resultRef = ref(rtdb, `results/${testId}/${userId}/${attemptId}`);
    const snapshot = await get(resultRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error fetching test result:', error);
    throw error;
  }
};

// Progress Management Functions

export const saveTestProgress = async (userId, testId, progressData) => {
  try {
    if (!userId) userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const progressRef = ref(rtdb, `testProgress/${userId}/${testId}`);
    const progress = {
      ...progressData,
      savedAt: new Date().toISOString(),
      deviceId: getDeviceId()
    };

    await set(progressRef, progress);
    return true;
  } catch (error) {
    console.error('Error saving test progress:', error);
    throw error;
  }
};

export const fetchTestProgress = async (userId, testId) => {
  try {
    if (!userId) userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const progressRef = ref(rtdb, `testProgress/${userId}/${testId}`);
    const snapshot = await get(progressRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error fetching test progress:', error);
    throw error;
  }
};

export const clearTestProgress = async (userId, testId) => {
  try {
    if (!userId) userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const progressRef = ref(rtdb, `testProgress/${userId}/${testId}`);
    await remove(progressRef);
    return true;
  } catch (error) {
    console.error('Error clearing test progress:', error);
    throw error;
  }
};

// Admin Functions

export const fetchAllTestResults = async (testId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const resultsRef = ref(rtdb, `results/${testId}`);
    const snapshot = await get(resultsRef);
    
    if (snapshot.exists()) {
      const allResults = [];
      snapshot.forEach((userSnapshot) => {
        userSnapshot.forEach((attemptSnapshot) => {
          allResults.push({
            id: attemptSnapshot.key,
            ...attemptSnapshot.val()
          });
        });
      });
      return allResults.sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching all test results:', error);
    throw error;
  }
};

export const getTestStatistics = async (testId) => {
  try {
    const results = await fetchAllTestResults(testId);
    
    if (results.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        topScore: 0,
        averageTime: 0
      };
    }

    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const passCount = results.filter(result => result.score >= 50).length;
    const totalTime = results.reduce((sum, result) => sum + (result.timeSpent || 0), 0);

    return {
      totalAttempts: results.length,
      averageScore: Math.round(totalScore / results.length),
      passRate: Math.round((passCount / results.length) * 100),
      topScore: Math.max(...results.map(r => r.score)),
      averageTime: Math.round(totalTime / results.length)
    };
  } catch (error) {
    console.error('Error calculating test statistics:', error);
    throw error;
  }
};
