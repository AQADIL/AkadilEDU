import i18n from '../i18n';
import { updatePassword, updateProfile } from 'firebase/auth';

import { uploadUserAvatar, deleteUserAvatar } from '../firebase/storage';
import { updateUserProfile, isUserAdmin } from '../firebase/realtimeDb';
import { getCurrentUser } from '../firebase/auth';

export async function uploadAvatar(file, onProgress) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error(i18n.t('ui.signInToUploadAnAvatar'));
  }

  return await uploadUserAvatar(user.uid, file, onProgress);
}

export async function removeAvatar(path) {
  return await deleteUserAvatar(path);
}

export async function onProfileSave(profileData) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error(i18n.t('ui.signInToSaveYourProfile'));
  }

  const { firstName = '', lastName = '', phone = '', avatarUrl = '', password } = profileData;
  if (password) await updatePassword(user, password);
  const name = [firstName, lastName].filter(Boolean).join(' ');
  await updateProfile(user, { displayName: name, photoURL: avatarUrl || null });
  return updateUserProfile(user.uid, { firstName, lastName, name, phone, avatarUrl });
}

export async function checkAdminClaim() {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }

  return await isUserAdmin(user.uid);
}
