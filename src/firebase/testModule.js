import i18n from '../i18n';
import { ref, push, set, get, update, remove } from 'firebase/database';
import { rtdb } from './config';
import { auth } from './config';

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
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));
  if (!rtdb) throw new Error(i18n.t('ui.databaseIsUnavailable2'));

  const testsRef = ref(rtdb, 'tests');
  const newTestRef = push(testsRef);
  const testId = newTestRef.key;

  const test = {
    id: testId,
    title: testData.title || i18n.t('common.untitledTest'),
    variant: testData.variant || 1,
    language: testData.language || 'kk',
    mode: testData.mode || 'single',
    creativeMode: Boolean(testData.creativeMode),
    subjects: testData.subjects || [],
    createdBy: user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalQuestions: testData.totalQuestions || 0,
    timeLimit: testData.timeLimit || 60,
    sections: testData.sections || {},
    isActive: true,
    deviceId: getDeviceId(),
  };

  await set(newTestRef, test);

  const verifySnapshot = await get(newTestRef);
  if (!verifySnapshot.exists()) {
    throw new Error(i18n.t('ui.couldNotVerifyTheSavedTest'));
  }

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

export const fetchAllTests = async () => {
  const testsRef = ref(rtdb, 'tests');
  const snapshot = await get(testsRef);

  if (snapshot.exists()) {
    const tests = [];
    snapshot.forEach((childSnapshot) => {
      const testData = childSnapshot.val();
      tests.push({
        id: childSnapshot.key,
        ...testData,
      });
    });

    return tests;
  }

  return [];
};

export const fetchTestsBySubject = async (subject) => {
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
};

export const fetchTestById = async (testId) => {
  const testRef = ref(rtdb, `tests/${testId}`);
  const snapshot = await get(testRef);

  if (snapshot.exists()) {
    const testData = {
      id: snapshot.key,
      ...snapshot.val(),
    };

    return testData;
  }

  throw new Error(i18n.t('ui.testNotFound'));
};

export const createTestSection = async (testId, sectionData) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const sectionsRef = ref(rtdb, `tests/${testId}/sections`);
  const newSectionRef = push(sectionsRef);
  const sectionId = newSectionRef.key;

  const section = {
    id: sectionId,
    title: sectionData.title,
    description: sectionData.description || '',
    order: sectionData.order || 1,
    questions: {},
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
  };

  await set(newSectionRef, section);

  return sectionId;
};

export const createQuestion = async (testId, sectionId, questionData) => {
  const user = auth.currentUser;
  if (!user) throw new Error(i18n.t('ui.signInToContinue'));

  const questionsRef = ref(rtdb, `tests/${testId}/sections/${sectionId}/questions`);
  const newQuestionRef = push(questionsRef);
  const questionId = newQuestionRef.key;

  const question = {
    id: questionId,
    contentHtml: questionData.contentHtml || '',
    contentText: questionData.contentText || '',
    imageUrls: questionData.imageUrls || [],
    options: questionData.options || {},
    correct: questionData.correct || [],
    type: questionData.type || 'multiple-choice',
    order: questionData.order || 1,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
  };

  await set(newQuestionRef, question);

  await updateTestQuestionCount(testId);

  return questionId;
};

const updateTestQuestionCount = async (testId) => {
  try {
    const testRef = ref(rtdb, `tests/${testId}`);
    const testSnapshot = await get(testRef);

    if (testSnapshot.exists()) {
      const testData = testSnapshot.val();
      let totalQuestions = 0;

      if (testData.sections) {
        Object.values(testData.sections).forEach((section) => {
          if (section.questions) {
            totalQuestions += Object.keys(section.questions).length;
          }
        });
      }

      await update(testRef, { totalQuestions });
    }
  } catch (error) {}
};

export const checkFirebaseConnection = async () => {
  try {
    if (!rtdb) {
      throw new Error(i18n.t('ui.databaseIsUnavailable3'));
    }

    if (!auth.currentUser) {
      throw new Error(i18n.t('ui.signInToContinue'));
    }

    const testRef = ref(rtdb, 'connection_test');
    const testData = {
      timestamp: new Date().toISOString(),
      user: auth.currentUser.uid,
    };

    await set(testRef, testData);

    await remove(testRef);

    return true;
  } catch (error) {
    return false;
  }
};

export const getDatabaseInfo = async () => {
  const testsRef = ref(rtdb, 'tests');
  const snapshot = await get(testsRef);

  const info = {
    testsExist: snapshot.exists(),
    testsCount: snapshot.exists() ? Object.keys(snapshot.val()).length : 0,
    databaseUrl: rtdb.app.options.databaseURL,
    currentUser: auth.currentUser
      ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
        }
      : null,
  };

  return info;
};
