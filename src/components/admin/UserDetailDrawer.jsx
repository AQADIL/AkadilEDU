import { useState, useEffect } from 'react';
import { X, Save, MapPin, Clock, Monitor } from 'lucide-react';
import { updateUserProfile, getUserAuthLogs } from '../../firebase/realtimeDb';

export default function UserDetailDrawer({ user, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student'
  });
  const [authLogs, setAuthLogs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'student'
      });
      loadAuthLogs();
    }
  }, [user]);

  const loadAuthLogs = async () => {
    try {
      const logs = await getUserAuthLogs(user.uid);
      setAuthLogs(logs.slice(0, 10)); // Last 10 logs
    } catch (error) {
      console.error('Error loading auth logs:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, formData);
      alert('Профиль обновлен!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Ошибка при обновлении профиля');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-gray-800 z-50 shadow-2xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Детали пользователя
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* UID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={user.uid}
                disabled
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Имя
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Роль
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="student">Студент</option>
                <option value="teacher">Учитель</option>
                <option value="admin">Админ</option>
              </select>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>

            {/* Auth Logs */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                История входов (последние 10)
              </h3>
              <div className="space-y-3">
                {authLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          IP: {log.ip}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Monitor className="w-3 h-3 inline mr-1" />
                          {log.ua}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(log.ts).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {authLogs.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Нет записей о входах
                  </p>
                )}
              </div>
            </div>

            {/* Purchased Courses */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Купленные курсы
              </h3>
              {user.purchasedCourses && Object.keys(user.purchasedCourses).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(user.purchasedCourses).map(([courseId, data]) => (
                    <div key={courseId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Course ID: {courseId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Прогресс: {Math.round((data.progress || 0) * 100)}%
                      </p>
                      {data.expiresAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Истекает: {new Date(data.expiresAt).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Нет купленных курсов
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
