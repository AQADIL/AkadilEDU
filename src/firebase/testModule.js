import { ref, push, set, get, update, remove } from 'firebase/database';
import { rtdb } from './config';
import { auth } from './config';

// Генерация уникального ID устройства
const getDeviceId = () => {
  let deviceId = localStorage.getItem('ak_deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('ak_deviceId', deviceId);
  }
  return deviceId;
};

// =================== ТЕСТЫ ===================

/**
 * Создание нового теста
 */
export const createTest = async (testData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    if (!rtdb) throw new Error('Firebase Realtime Database not initialized');

    const testsRef = ref(rtdb, 'tests');
    const newTestRef = push(testsRef);
    const testId = newTestRef.key;
    
    const test = {
      id: testId,
      title: testData.title || 'Untitled Test',
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
      deviceId: getDeviceId()
    };

    await set(newTestRef, test);
    
    // Проверяем что сохранилось
    const verifySnapshot = await get(newTestRef);
    if (!verifySnapshot.exists()) {
      throw new Error('Test was not saved properly');
    }
    
    return testId;
  } catch (error) {
    console.error('Error creating test:', error);
    throw error;
  }
};

/**
 * Обновление теста
 */
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

/**
 * Удаление теста
 */
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

/**
 * Получение всех тестов
 */
export const fetchAllTests = async () => {
  try {
    console.log('📚 [testModule] Fetching all tests...');
    
    const testsRef = ref(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const tests = [];
      snapshot.forEach((childSnapshot) => {
        const testData = childSnapshot.val();
        tests.push({
          id: childSnapshot.key,
          ...testData
        });
      });
      
      console.log('✅ [testModule] Fetched', tests.length, 'tests');
      return tests;
    }
    
    console.log('📭 [testModule] No tests found');
    return [];
  } catch (error) {
    console.error('❌ [testModule] Error fetching tests:', error);
    throw error;
  }
};

/**
 * Получение тестов по предмету
 */
export const fetchTestsBySubject = async (subject) => {
  try {
    console.log('🔍 [testModule] Fetching tests for subject:', subject);
    
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
      
      console.log('✅ [testModule] Found', tests.length, 'tests for subject:', subject);
      return tests;
    }
    
    return [];
  } catch (error) {
    console.error('❌ [testModule] Error fetching tests by subject:', error);
    throw error;
  }
};

/**
 * Получение теста по ID
 */
export const fetchTestById = async (testId) => {
  try {
    console.log('🔍 [testModule] Fetching test by ID:', testId);
    
    const testRef = ref(rtdb, `tests/${testId}`);
    const snapshot = await get(testRef);
    
    if (snapshot.exists()) {
      const testData = {
        id: snapshot.key,
        ...snapshot.val()
      };
      console.log('✅ [testModule] Test found:', testData);
      return testData;
    }
    
    throw new Error('Test not found');
  } catch (error) {
    console.error('❌ [testModule] Error fetching test by ID:', error);
    throw error;
  }
};

// =================== СЕКЦИИ ===================

/**
 * Создание секции теста
 */
export const createTestSection = async (testId, sectionData) => {
  try {
    console.log('📝 [testModule] Creating section for test:', testId);
    
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

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
      createdBy: user.uid
    };

    await set(newSectionRef, section);
    console.log('✅ [testModule] Section created successfully:', sectionId);
    
    return sectionId;
  } catch (error) {
    console.error('❌ [testModule] Error creating section:', error);
    throw error;
  }
};

// =================== ВОПРОСЫ ===================

/**
 * Создание вопроса
 */
export const createQuestion = async (testId, sectionId, questionData) => {
  try {
    console.log('❓ [testModule] Creating question for test:', testId, 'section:', sectionId);
    
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

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
      createdBy: user.uid
    };

    await set(newQuestionRef, question);
    console.log('✅ [testModule] Question created successfully:', questionId);
    
    // Обновляем счетчик вопросов в тесте
    await updateTestQuestionCount(testId);
    
    return questionId;
  } catch (error) {
    console.error('❌ [testModule] Error creating question:', error);
    throw error;
  }
};

/**
 * Обновление счетчика вопросов в тесте
 */
const updateTestQuestionCount = async (testId) => {
  try {
    const testRef = ref(rtdb, `tests/${testId}`);
    const testSnapshot = await get(testRef);
    
    if (testSnapshot.exists()) {
      const testData = testSnapshot.val();
      let totalQuestions = 0;
      
      if (testData.sections) {
        Object.values(testData.sections).forEach(section => {
          if (section.questions) {
            totalQuestions += Object.keys(section.questions).length;
          }
        });
      }
      
      await update(testRef, { totalQuestions });
      console.log('✅ [testModule] Updated question count for test:', testId, 'total:', totalQuestions);
    }
  } catch (error) {
    console.error('❌ [testModule] Error updating question count:', error);
  }
};

// =================== УТИЛИТЫ ===================

/**
 * Проверка доступности Firebase
 */
export const checkFirebaseConnection = async () => {
  try {
    console.log('🔍 [testModule] Checking Firebase connection...');
    
    if (!rtdb) {
      throw new Error('RTDB not initialized');
    }
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Попробуем записать тестовую запись
    const testRef = ref(rtdb, 'connection_test');
    const testData = {
      timestamp: new Date().toISOString(),
      user: auth.currentUser.uid
    };
    
    await set(testRef, testData);
    console.log('✅ [testModule] Firebase connection successful');
    
    // Удаляем тестовую запись
    await remove(testRef);
    
    return true;
  } catch (error) {
    console.error('❌ [testModule] Firebase connection failed:', error);
    return false;
  }
};

/**
 * Получение информации о базе данных
 */
export const getDatabaseInfo = async () => {
  try {
    const testsRef = ref(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    const info = {
      testsExist: snapshot.exists(),
      testsCount: snapshot.exists() ? Object.keys(snapshot.val()).length : 0,
      databaseUrl: rtdb.app.options.databaseURL,
      currentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email
      } : null
    };
    
    console.log('📊 [testModule] Database info:', info);
    return info;
  } catch (error) {
    console.error('❌ [testModule] Error getting database info:', error);
    throw error;
  }
};
