/**
 * Firebase Authentication Module
 * 
 * Handles user authentication with Email/Password and Google sign-in
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import { createUserProfile as createRTDBProfile, logUserSession, getUserSessions, createSecurityAlert } from './realtimeDb';
import { createSessionProfile, detectSuspiciousActivity } from '../utils/deviceInfo';

/**
 * Initialize Firebase with persistence
 */
export async function initializeAuth() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }
  
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Auth persistence set to LOCAL');
  } catch (error) {
    console.error('Auth persistence error:', error);
  }
}

/**
 * Sign up with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} profileData - Additional profile data (firstName, lastName)
 * @returns {Promise<Object>} - User credential
 */
export async function signupWithEmail(email, password, profileData = {}) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (profileData.firstName || profileData.lastName) {
      const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
      await updateProfile(user, { displayName });
    }

    // Send verification email
    await sendEmailVerification(user);
    console.log('✅ Verification email sent to:', email);

    // 🔥 CREATE USER PROFILE IN REALTIME DATABASE
    try {
      const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || email.split('@')[0];
      
      await createRTDBProfile(user.uid, {
        email: user.email,
        name: displayName,
        phone: profileData.phone || '',
        role: 'student',
        status: 'active',
        registeredAt: new Date().toISOString(),
        emailVerified: false
      });
      
      console.log('✅ User profile created in Realtime DB');
    } catch (dbError) {
      console.error('⚠️ Failed to create Realtime DB profile:', dbError);
      // Не блокируем регистрацию если база недоступна
    }

    // ✅ Пользователь остается залогиненным, но App.jsx покажет ему
    // страницу подтверждения email и не даст доступ к контенту
    console.log('✅ User registered and logged in - awaiting email verification');

    return userCredential;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User credential
 */
export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User logged in:', user.email);
    console.log('📧 Email verified:', user.emailVerified);
    
    // 🔒 SECURITY: Log session with IP and device info
    try {
      const sessionProfile = await createSessionProfile();
      await logUserSession(user.uid, sessionProfile);
      
      // Check for suspicious activity
      const userSessions = await getUserSessions(user.uid);
      const securityCheck = detectSuspiciousActivity(userSessions, sessionProfile);
      
      if (securityCheck.suspicious) {
        console.warn('🚨 Suspicious activity detected!', securityCheck.flags);
        
        // Create security alert
        await createSecurityAlert(user.uid, {
          type: 'suspicious_login',
          riskLevel: securityCheck.riskLevel,
          flags: securityCheck.flags,
          session: sessionProfile
        });
      }
      
      console.log('✅ Session logged and analyzed');
    } catch (sessionError) {
      console.warn('⚠️ Could not log session:', sessionError);
      // Continue anyway - login should still work
    }

    return userCredential;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} - User credential
 */
export async function loginWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Create or update user profile in Firestore (optional - don't block login)
    try {
      const nameParts = (user.displayName || '').split(' ');
      await createOrUpdateUserProfile(user.uid, {
        email: user.email,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        avatarUrl: user.photoURL || '',
        lastLoginAt: new Date().toISOString(),
        emailVerified: user.emailVerified
      });
    } catch (firestoreError) {
      console.warn('⚠️ Could not update Firestore profile (offline?):', firestoreError.message);
      // Continue anyway
    }

    console.log('✅ User logged in with Google:', user.email);
    return userCredential;
  } catch (error) {
    console.error('❌ Google login error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Log out current user
 * @returns {Promise<void>}
 */
export async function logout() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  try {
    await signOut(auth);
    console.log('✅ User logged out');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Send email verification to current user
 * @param {Object} user - Firebase user object
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail(user) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  if (!user) {
    throw new Error('No user provided');
  }

  try {
    await sendEmailVerification(user);
    console.log('✅ Verification email sent');
  } catch (error) {
    console.error('Send verification error:', error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} - Unsubscribe function
 */
export function onAuthStateChanged(callback) {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured, auth state listener disabled');
    return () => {};
  }

  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated user
 * @returns {Object|null} - Current user or null
 */
export function getCurrentUser() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  return auth.currentUser;
}
