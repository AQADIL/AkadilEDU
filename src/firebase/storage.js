/**
 * Firebase Storage Module
 * 
 * Handles file uploads (avatars) to Firebase Storage
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

/**
 * Upload user avatar to Firebase Storage
 * @param {string} uid - User ID
 * @param {File} file - Image file to upload
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<string>} - Download URL
 */
export async function uploadUserAvatar(uid, file, onProgress) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  // Validate file
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG and PNG are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }

  try {
    // Create storage reference
    const timestamp = Date.now();
    const fileName = `${uid}_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `user_avatars/${uid}/${fileName}`);

    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress callback
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          // Error callback
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Success callback
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Avatar uploaded successfully:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
}

/**
 * Delete user avatar from Firebase Storage
 * @param {string} avatarUrl - Full download URL or storage path
 * @returns {Promise<void>}
 */
export async function deleteUserAvatar(avatarUrl) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  if (!avatarUrl) {
    return; // Nothing to delete
  }

  try {
    // Extract path from URL if it's a full URL
    let path = avatarUrl;
    if (avatarUrl.includes('firebase')) {
      // Extract path from Firebase Storage URL
      const urlObj = new URL(avatarUrl);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        path = decodeURIComponent(pathMatch[1]);
      }
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('✅ Avatar deleted successfully');
  } catch (error) {
    console.error('Avatar delete error:', error);
    // Don't throw error if file doesn't exist
    if (error.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}

/**
 * Upload course cover image
 * @param {string} courseId - Course ID
 * @param {File} file - Image file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - Download URL
 */
export async function uploadCourseCover(courseId, file, onProgress) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum size is 10MB.');
  }

  try {
    const timestamp = Date.now();
    const fileName = `${courseId}_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `course_covers/${courseId}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Course cover uploaded successfully');
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Course cover upload error:', error);
    throw error;
  }
}
