import i18n from '../i18n';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@headlessui/react';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import { uploadAvatar, removeAvatar, onProfileSave } from '../utils/profile';

export default function ProfileModal({ isOpen, onClose, onAvatarChange, userProfile }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen && userProfile) {
      setProfile({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        avatarUrl: userProfile.avatarUrl || '',
      });
    }
  }, [isOpen, userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert(i18n.t('ui.selectAJpgOrPngImage'));
      return;
    }

    if (file.size > maxSize) {
      alert(i18n.t('ui.imageMustBeSmallerThan_5Mb'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const downloadURL = await uploadAvatar(file, (progress) => {
        setUploadProgress(progress);
      });

      setProfile((prev) => ({ ...prev, avatarUrl: downloadURL }));
      onAvatarChange?.(downloadURL);
    } catch {
      alert(i18n.t('ui.couldNotUploadAvatar'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile.avatarUrl) return;

    if (!confirm(t('profile.removeAvatar') + '?')) return;

    try {
      await removeAvatar(profile.avatarUrl);
      setProfile((prev) => ({ ...prev, avatarUrl: '' }));
      onAvatarChange?.('');
    } catch {
      alert(i18n.t('ui.couldNotRemoveAvatar'));
    }
  };

  const handleSave = async () => {
    if (passwords.newPassword || passwords.confirmPassword) {
      if (passwords.newPassword !== passwords.confirmPassword) {
        alert(i18n.t('ui.passwordsDoNotMatch'));
        return;
      }
    }

    try {
      await onProfileSave({
        ...profile,
        ...(passwords.newPassword && { password: passwords.newPassword }),
      });

      alert(t('common.success'));
      onClose();
    } catch {
      alert(i18n.t('ui.couldNotSaveProfile'));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('profile.title')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={i18n.t('ui.avatar')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {profile.firstName?.[0]?.toUpperCase() ||
                        i18n.t('common.unknownUser').charAt(0)}
                    </span>
                  )}
                </div>

                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <label className="btn-primary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {profile.avatarUrl ? t('profile.changeAvatar') : t('profile.uploadAvatar')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {profile.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('profile.removeAvatar')}
                  </button>
                )}
              </div>

              {uploading && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.firstName')}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.lastName')}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder={i18n.t('auth.emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder={i18n.t('profile.phonePlaceholder')}
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('profile.password')}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('profile.newPassword')}
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                      placeholder={i18n.t('auth.passwordPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('profile.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                      placeholder={i18n.t('auth.passwordPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onClose} className="flex-1 btn-secondary">
              {t('profile.cancel')}
            </button>
            <button onClick={handleSave} className="flex-1 btn-primary">
              {t('profile.save')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
