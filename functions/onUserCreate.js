/**
 * АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПРОФИЛЯ В REALTIME DB
 * При регистрации нового пользователя
 * 
 * Cloud Function для Firebase
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { initializeApp } from 'firebase-admin/app';

// Инициализация Firebase Admin (только один раз!)
let app;
try {
  app = initializeApp();
} catch (error) {
  // Уже инициализирован
}

/**
 * Автоматически создаёт профиль пользователя в Realtime DB
 * после регистрации через Firebase Authentication
 */
export const onUserCreated = onCall(async (request) => {
  const { uid, email, displayName } = request.data;
  
  if (!uid || !email) {
    throw new HttpsError('invalid-argument', 'Missing required fields: uid and email');
  }
  
  const db = getDatabase();
  const userRef = db.ref(`users/${uid}`);
  
  try {
    // Проверяем, не существует ли уже профиль
    const snapshot = await userRef.once('value');
    if (snapshot.exists()) {
      return { 
        success: true, 
        message: 'Profile already exists',
        existed: true 
      };
    }
    
    // Создаём новый профиль
    const userData = {
      uid: uid,
      email: email,
      name: displayName || email.split('@')[0],
      phone: '',
      role: 'student',
      status: 'active',
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: false,
      ipHistory: {},
      sessions: {},
      purchasedCourses: {},
      isDeleted: false
    };
    
    await userRef.set(userData);
    
    console.log('✅ User profile created in Realtime DB:', uid, email);
    
    return { 
      success: true, 
      message: 'Profile created successfully',
      created: true,
      userData: userData
    };
    
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw new HttpsError('internal', 'Failed to create user profile: ' + error.message);
  }
});

/**
 * АЛЬТЕРНАТИВА: Триггер на создание пользователя в Auth
 * Автоматически срабатывает при регистрации
 */
import { onUserCreated as onAuthUserCreated } from 'firebase-functions/v2/identity';

export const createUserProfileOnSignup = onAuthUserCreated(async (event) => {
  const user = event.data;
  
  const db = getDatabase();
  const userRef = db.ref(`users/${user.uid}`);
  
  try {
    // Проверяем существование
    const snapshot = await userRef.once('value');
    if (snapshot.exists()) {
      console.log('⏭️  Profile already exists:', user.uid);
      return;
    }
    
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      phone: user.phoneNumber || '',
      role: 'student',
      status: 'active',
      registeredAt: user.metadata.creationTime,
      lastLogin: user.metadata.lastSignInTime || user.metadata.creationTime,
      emailVerified: user.emailVerified || false,
      ipHistory: {},
      sessions: {},
      purchasedCourses: {},
      isDeleted: false
    };
    
    await userRef.set(userData);
    
    console.log('✅ Auto-created profile for:', user.email);
    
  } catch (error) {
    console.error('❌ Error in auto-create trigger:', error);
  }
});
