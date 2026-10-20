import i18n from '../i18n';

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

export async function uploadUserAvatar(uid, file, onProgress) {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 5 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    throw new Error(i18n.t('ui.onlyJpgAndPngImagesAreAllowed'));
  }

  if (file.size > maxSize) {
    throw new Error(i18n.t('ui.maximumFileSizeIs_5Mb'));
  }

  const timestamp = Date.now();
  const fileName = `${uid}_${timestamp}.${file.name.split('.').pop()}`;
  const storageRef = ref(storage, `user_avatars/${uid}/${fileName}`);

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
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

export async function deleteUserAvatar(avatarUrl) {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  if (!avatarUrl) {
    return;
  }

  try {
    let path = avatarUrl;
    if (avatarUrl.includes('firebase')) {
      const urlObj = new URL(avatarUrl);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        path = decodeURIComponent(pathMatch[1]);
      }
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    if (error.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}

export async function uploadCourseCover(courseId, file, onProgress) {
  if (!isFirebaseConfigured()) {
    throw new Error(i18n.t('ui.serviceConfigurationIsUnavailable'));
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const maxSize = 10 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    throw new Error(i18n.t('ui.onlyJpgPngAndWebpImagesAre'));
  }

  if (file.size > maxSize) {
    throw new Error(i18n.t('ui.maximumFileSizeIs_10Mb'));
  }

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
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}
