import i18n from '../../i18n';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Save,
  Monitor,
  Wifi,
  Smartphone,
  AlertTriangle,
  Shield,
  BookOpen,
  Plus,
  Bell,
  BellOff,
  Trash2,
  Edit2,
  Calendar,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import {
  updateUserProfile,
  getUserSessions,
  getUserCourses,
  getUserPushStatus,
  removeUserCourse,
  updateUserCourse,
  toggleUserPushNotifications,
} from '../../firebase/realtimeDb';
import { useTranslation } from 'react-i18next';
import { auth } from '../../firebase/config';
import AssignCourseModal from './AssignCourseModal';

export default function UserDetailDrawer({ user, isOpen, onClose }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
  });
  const [sessions, setSessions] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [userCourses, setUserCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pushStatus, setPushStatus] = useState(null);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [newExpiryDays, setNewExpiryDays] = useState('');

  const handleUpdateCourseExpiry = async (courseId, course, action = 'add') => {
    if (!newExpiryDays || isNaN(parseInt(newExpiryDays))) {
      alert(i18n.t('ui.enterTheNumberOfDays'));
      return;
    }

    const daysToChange = parseInt(newExpiryDays);

    let currentExpiry;

    if (course.enrollment && course.enrollment.expiryDate) {
      currentExpiry = Number(course.enrollment.expiryDate);
    } else {
      currentExpiry = Date.now() + 24 * 60 * 60 * 1000;
    }

    const msPerDay = 24 * 60 * 60 * 1000;

    let newExpiryTimestamp;

    if (action === 'add') {
      newExpiryTimestamp = currentExpiry + daysToChange * msPerDay;
    } else {
      const minTimestamp = Date.now() + msPerDay;
      newExpiryTimestamp = Math.max(minTimestamp, currentExpiry - daysToChange * msPerDay);
    }

    try {
      await updateUserCourse(user.uid, courseId, newExpiryTimestamp, auth.currentUser.uid);
      await loadUserCourses();
      setEditingCourseId(null);
    } catch {}
  };

  const handleRemoveCourse = async (courseId) => {
    if (!confirm(t('course.confirmDelete'))) return;

    try {
      await removeUserCourse(user.uid, courseId, auth.currentUser.uid);
      await loadUserCourses();
    } catch {
      alert(i18n.t('courses.deleteError'));
    }
  };

  const togglePushNotifications = async () => {
    try {
      const currentEnabled = pushStatus?.enabled || false;
      await toggleUserPushNotifications(user.uid, !currentEnabled, auth.currentUser.uid);
      await loadPushStatus();
    } catch {
      alert(i18n.t('ui.couldNotChangeNotifications'));
    }
  };

  const getSecurityBadge = () => {
    if (user.role === 'admin') return null;

    const status = user.securityStatus;
    if (!status || status === 'low') return null;

    const colors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colors[status]}`}
      >
        <AlertTriangle className="w-3 h-3" />
        {i18n.t('ui.riskLevel')}
        {status.toUpperCase()}
      </span>
    );
  };

  const getPushStatusStyles = () => {
    if (!pushStatus) return '';

    if (pushStatus.enabled) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    } else if (pushStatus.status === 'declined') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { role, ...profile } = formData;
      if (role !== user.role) {
        await httpsCallable(
          getFunctions(undefined, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION),
          'setUserRole',
        )({ uid: user.uid, role });
      }
      await updateUserProfile(user.uid, profile);
      alert(i18n.t('ui.profileUpdated'));
      onClose();
    } catch {
      alert(i18n.t('ui.couldNotUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  const loadPushStatus = useCallback(async () => {
    if (user?.uid) {
      try {
        const status = await getUserPushStatus(user.uid);
        setPushStatus(status);
      } catch {}
    }
  }, [user]);

  const loadUserCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const courses = await getUserCourses(user.uid);
      setUserCourses(courses);
    } catch {
    } finally {
      setLoadingCourses(false);
    }
  }, [user]);

  const loadAuthLogs = useCallback(async () => {
    try {
      const userSessions = await getUserSessions(user.uid);
      setSessions(userSessions || {});
    } catch {}
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'student',
      });
      loadAuthLogs();
      loadUserCourses();
      loadPushStatus();
    }
  }, [loadAuthLogs, loadPushStatus, loadUserCourses, user]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>

      <div className="fixed right-0 top-0 bottom-0 w-full md:max-w-2xl bg-white dark:bg-gray-800 z-50 shadow-2xl overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {i18n.t('ui.userDetails')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {getSecurityBadge()}

              {pushStatus && (
                <button
                  onClick={togglePushNotifications}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${getPushStatusStyles()}`}
                  title={
                    pushStatus.enabled
                      ? i18n.t('ui.disableNotifications')
                      : i18n.t('ui.enableNotifications')
                  }
                >
                  {pushStatus.enabled ? (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      {i18n.t('ui.pushNotifications')}
                    </>
                  ) : (
                    <>
                      <BellOff className="w-3.5 h-3.5" />
                      {pushStatus.status === 'declined' ? (
                        <span className="flex items-center">
                          {i18n.t('ui.pushNotifications')}
                          <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </span>
                      ) : (
                        i18n.t('ui.pushNotifications')
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'info'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {i18n.t('ui.information')}
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
              {i18n.t('ui.sessionsAndIp')}
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
              {i18n.t('courses.title')}
            </button>
          </div>

          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {i18n.t('ui.userId')}
                </label>
                <input
                  type="text"
                  value={user.uid}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {i18n.t('auth.firstName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {i18n.t('auth.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {i18n.t('profile.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {i18n.t('ui.role')}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="student">{i18n.t('ui.student')}</option>
                  <option value="teacher">{i18n.t('ui.teacher')}</option>
                  <option value="admin">{i18n.t('sidebar.admin')}</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? i18n.t('test.saving') : i18n.t('ui.saveChanges')}
              </button>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  {i18n.t('ui.ipHistory')}
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
                              {i18n.t('ui.lastSignin')}
                              {new Date(data.lastSeen).toLocaleString(i18n.resolvedLanguage)}
                            </p>
                            {data.device && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <Monitor className="w-3 h-3 inline mr-1" />
                                {data.device.browser}
                                {i18n.t('ui.on')}
                                {data.device.os}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {i18n.t('ui.noIpData')}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  {i18n.t('ui.allSessions')}
                  {Object.keys(sessions).length})
                </h3>
                {Object.keys(sessions).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(sessions)
                      .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
                      .map(([sessionId, session]) => (
                        <div
                          key={sessionId}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {session.device?.browser || i18n.t('common.unknown')}
                                {i18n.t('ui.on')}
                                {session.device?.os || i18n.t('common.unknown')}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(session.timestamp).toLocaleString(i18n.resolvedLanguage)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {i18n.t('ui.ip')}
                                </span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {session.ip}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {i18n.t('ui.device')}
                                </span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {session.device?.deviceType || i18n.t('common.unknown')}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {i18n.t('ui.timeZone')}
                                </span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {session.device?.timezone || i18n.t('common.unknown')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {i18n.t('ui.noActiveSessions')}
                  </p>
                )}
              </div>

              {user.securityAlerts && Object.keys(user.securityAlerts).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    {i18n.t('ui.securityAlerts')}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(user.securityAlerts).map(([alertId, alert]) => (
                      <div
                        key={alertId}
                        className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-l-4 border-orange-500"
                      >
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
                          {alert.type === 'suspicious_login' && i18n.t('ui.unusualSignin')}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                          {i18n.t('ui.riskLevel')}
                          {alert.riskLevel}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {new Date(alert.timestamp).toLocaleString(i18n.resolvedLanguage)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {i18n.t('ui.assignedCourses')}
                </h3>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {i18n.t('ui.assignCourse')}
                </button>
              </div>

              {loadingCourses ? (
                <div className="text-center py-8 text-gray-500">{i18n.t('common.loading')}</div>
              ) : userCourses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {i18n.t('ui.noCoursesAssignedYet')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userCourses.map((course) => {
                    const isExpired =
                      course.enrollment?.expiryDate && course.enrollment.expiryDate < Date.now();
                    const expiryDateStr = course.enrollment?.expiryDate
                      ? new Date(course.enrollment.expiryDate).toLocaleDateString(
                          i18n.resolvedLanguage,
                        )
                      : i18n.t('ui.permanent');

                    return (
                      <div
                        key={course.id}
                        className={`p-4 rounded-xl border-2 ${
                          isExpired
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {course.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {expiryDateStr}
                              </span>
                              {course.enrollment?.progress > 0 && (
                                <span className="text-primary-600 dark:text-primary-400">
                                  {course.enrollment.progress}%
                                </span>
                              )}
                            </div>

                            {editingCourseId === course.id ? (
                              <div className="mt-2 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={newExpiryDays}
                                    onChange={(e) => setNewExpiryDays(e.target.value)}
                                    placeholder={t('course.days')}
                                    min="1"
                                    className="w-20 p-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                                  />
                                  <span className="text-xs text-gray-500">{t('course.days')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateCourseExpiry(course.id, course, 'add')
                                    }
                                    className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded flex items-center gap-1"
                                  >
                                    <PlusCircle className="w-3 h-3" /> {t('course.addDays')}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateCourseExpiry(course.id, course, 'remove')
                                    }
                                    className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded flex items-center gap-1"
                                  >
                                    <MinusCircle className="w-3 h-3" /> {t('course.removeDays')}
                                  </button>
                                  <button
                                    onClick={() => setEditingCourseId(null)}
                                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                  >
                                    {t('course.cancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCourseId(course.id);
                                    setNewExpiryDays('');
                                  }}
                                  className="p-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
                                  title={t('course.editExpiry')}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveCourse(course.id)}
                                  className="p-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded"
                                  title={t('course.delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          {isExpired && (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                              {t('course.expired')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <AssignCourseModal
            user={user}
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onSuccess={() => {
              loadUserCourses();
              setShowAssignModal(false);
            }}
          />

          {activeTab === 'purchasedCourses' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {i18n.t('ui.enrolledCourses')}
              </h3>
              {user.purchasedCourses && Object.keys(user.purchasedCourses).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(user.purchasedCourses).map(([courseId, data]) => (
                    <div key={courseId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {i18n.t('ui.courseId')}
                        {courseId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {i18n.t('ui.progress')}
                        {Math.round((data.progress || 0) * 100)}%
                      </p>
                      {data.expiresAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {i18n.t('ui.expires')}
                          {new Date(data.expiresAt).toLocaleDateString(i18n.resolvedLanguage)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {i18n.t('ui.noEnrolledCourses')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
