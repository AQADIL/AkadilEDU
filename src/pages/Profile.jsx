import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Calendar, Edit2, Save, X, Camera, Shield } from 'lucide-react';
import { auth } from '../firebase/config';
import { getUserProfile, updateUserProfile } from '../firebase/firestore';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    bio: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      
      if (profile) {
        setFormData({
          displayName: profile.displayName || '',
          phoneNumber: profile.phoneNumber || '',
          dateOfBirth: profile.dateOfBirth || '',
          address: profile.address || '',
          bio: profile.bio || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      await updateUserProfile(user.uid, formData);
      
      // Reload profile
      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phoneNumber: userProfile.phoneNumber || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        address: userProfile.address || '',
        bio: userProfile.bio || ''
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('profile.title')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                {userProfile?.photoURL ? (
                  <img 
                    src={userProfile.photoURL} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {userProfile?.displayName || 'User'}
              </h2>
              <p className="text-sm sm:text-base text-blue-100 mb-2">
                {userProfile?.email}
              </p>
              
              {/* Role Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">
                  {userProfile?.role === 'admin' ? t('profile.admin') : t('profile.student')}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('profile.edit')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.displayName')}
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('profile.displayNamePlaceholder')}
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{formData.displayName || '-'}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              {t('profile.email')}
            </label>
            <p className="text-gray-900 dark:text-white">{userProfile?.email}</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              {t('profile.phoneNumber')}
            </label>
            {editing ? (
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="+7 (___) ___-__-__"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{formData.phoneNumber || '-'}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              {t('profile.dateOfBirth')}
            </label>
            {editing ? (
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{formData.dateOfBirth || '-'}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.address')}
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('profile.addressPlaceholder')}
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{formData.address || '-'}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.bio')}
            </label>
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder={t('profile.bioPlaceholder')}
              />
            ) : (
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{formData.bio || '-'}</p>
            )}
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                {t('profile.cancel')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Card (Student only) */}
      {userProfile?.role !== 'admin' && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('profile.coursesCompleted')}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">85%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('profile.averageScore')}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">24</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('profile.testsCompleted')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
