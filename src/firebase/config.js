/**
 * Firebase Configuration
 * 
 * SECURITY NOTE: These credentials are for client-side use and are safe to expose.
 * Actual security is enforced through Firebase Security Rules.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqKkucrcXnCWsC07w3DwvPkBbhI9XJKIE",
  authDomain: "akadiledu.firebaseapp.com",
  databaseURL: "https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "akadiledu",
  storageBucket: "akadiledu.firebasestorage.app",
  messagingSenderId: "78627994035",
  appId: "1:78627994035:web:eb93f14c26e6c9d96273c6",
  measurementId: "G-8HFHFE0V38"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let isInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Initialize Firestore with offline persistence disabled (optional service)
  try {
    db = getFirestore(app);
    console.log('✅ Firestore initialized');
  } catch (firestoreError) {
    console.warn('⚠️ Firestore initialization failed (continuing without it):', firestoreError.message);
    db = null;
  }
  
  storage = getStorage(app);
  isInitialized = true;
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Graceful degradation check
export const isFirebaseConfigured = () => isInitialized;

export { app, auth, db, storage };
