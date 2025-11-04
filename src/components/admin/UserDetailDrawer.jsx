import { useState, useEffect } from 'react';
import { X, Save, MapPin, Clock, Monitor, Wifi, Smartphone, AlertTriangle, Shield } from 'lucide-react';
import { updateUserProfile, getUserSessions } from '../../firebase/realtimeDb';

export default function UserDetailDrawer({ user, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student'
  });
  const [sessions, setSessions] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info, sessions, courses

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
      const userSessions = await getUserSessions(user.uid);
      setSessions(userSessions || {});
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const getSecurityBadge = () => {
    const status = user.securityStatus;
    if (!status || status === 'low') return null;
    
    const colors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colors[status]}`}>
        <AlertTriangle className="w-3 h-3" />
        Уровень риска: {status.toUpperCase()}
      </span>
    );
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
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
            {getSecurityBadge()}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'info'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Информация
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
                activeTab === 'sessions'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Shield className="w-4 h-4" />
              Сессии и IP
              {Object.keys(sessions).length > 0 && (
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {Object.keys(sessions).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'courses'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Курсы
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
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
          </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {/* IP History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  IP История
                </h3>
                {user.ipHistory && Object.keys(user.ipHistory).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(user.ipHistory).map(([ip, data]) => (
                      <div key={ip} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {ip}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Последний вход: {new Date(data.lastSeen).toLocaleString('ru-RU')}
                            </p>
                            {data.device && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <Monitor className="w-3 h-3 inline mr-1" />
                                {data.device.browser} на {data.device.os}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Нет данных об IP
                  </p>
                )}
              </div>

              {/* All Sessions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Все Сессии ({Object.keys(sessions).length})
                </h3>
                {Object.keys(sessions).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(sessions).sort((a, b) => 
                      new Date(b[1].timestamp) - new Date(a[1].timestamp)
                    ).map(([sessionId, session]) => (
                      <div key={sessionId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.device?.browser || 'Unknown'} на {session.device?.os || 'Unknown'}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(session.timestamp).toLocaleString('ru-RU')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">IP:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{session.ip}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Устройство:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{session.device?.deviceType || 'Unknown'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Timezone:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{session.device?.timezone || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Нет активных сессий
                  </p>
                )}
              </div>

              {/* Security Alerts */}
              {user.securityAlerts && Object.keys(user.securityAlerts).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Предупреждения Безопасности
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(user.securityAlerts).map(([alertId, alert]) => (
                      <div key={alertId} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-l-4 border-orange-500">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
                          {alert.type === 'suspicious_login' && 'Подозрительный вход'}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                          Уровень риска: {alert.riskLevel}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {new Date(alert.timestamp).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Купленные курсы
              </h3>
              {user.purchasedCourses && Object.keys(user.purchasedCourses).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(user.purchasedCourses).map(([courseId, data]) => (
                    <div key={courseId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Course ID: {courseId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Нет купленных курсов
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
