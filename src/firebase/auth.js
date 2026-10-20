import i18n from '../i18n';

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
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import { createUserProfile as createRTDBProfile, updateUserProfile } from './realtimeDb';

export async function initializeAuth() {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {}
}

export async function signupWithEmail(email, password, profileData = {}) {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (profileData.firstName || profileData.lastName) {
    const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
    await updateProfile(user, { displayName });
  }

  await sendEmailVerification(user);

  try {
    const displayName =
      `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || email.split('@')[0];

    await createRTDBProfile(user.uid, {
      email: user.email,
      name: displayName,
      phone: profileData.phone || '',
      role: 'student',
      status: 'active',
      registeredAt: new Date().toISOString(),
      emailVerified: false,
    });
    await updateUserProfile(user.uid, { name: displayName, phone: profileData.phone || '' });
  } catch {}

  return userCredential;
}

export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
}

export async function loginWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const userCredential = await signInWithPopup(auth, provider);

  return userCredential;
}

export async function resetPassword(email) {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  const uid = auth.currentUser?.uid;
  await signOut(auth);
  if (uid) localStorage.removeItem('akadil_session_' + uid);
}

export async function sendVerificationEmail(user) {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  if (!user) {
    throw new Error(i18n.t('ui.userIsRequired'));
  }

  await sendEmailVerification(user);
}

export function onAuthStateChanged(callback) {
  if (!isFirebaseConfigured()) {
    return () => {};
  }

  return firebaseOnAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  return auth.currentUser;
}
