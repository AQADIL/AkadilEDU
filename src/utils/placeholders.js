/**
 * Firebase integration functions
 * Connected to Firebase Auth, Storage, and Firestore
 */

import { uploadUserAvatar, deleteUserAvatar } from '../firebase/storage';
import { createOrUpdateUserProfile, checkAdminStatus } from '../firebase/firestore';
import { getCurrentUser } from '../firebase/auth';

/**
 * Upload user avatar to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<string>} - Download URL
 */
export async function uploadAvatar(file, onProgress) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be logged in to upload avatar');
  }

  return await uploadUserAvatar(user.uid, file, onProgress);
}

/**
 * Remove user avatar from Firebase Storage
 * @param {string} path - Storage path of the avatar
 * @returns {Promise<void>}
 */
export async function removeAvatar(path) {
  return await deleteUserAvatar(path);
}

/**
 * Save profile data to Firestore
 * @param {Object} profileData - User profile data
 * @returns {Promise<void>}
 */
export async function onProfileSave(profileData) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be logged in to save profile');
  }

  return await createOrUpdateUserProfile(user.uid, profileData);
}

/**
 * Check if current user has admin privileges
 * @returns {Promise<boolean>}
 */
export async function checkAdminClaim() {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }

  return await checkAdminStatus(user.uid);
}
