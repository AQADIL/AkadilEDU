import i18n from '../../i18n';
import { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Shield,
  Settings,
  Bell,
  Send,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { database } from '../../firebase/realtimeDb';
import { Link } from 'react-router-dom';

import AppLoader from '../../components/AppLoader';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeUsers: 0,
    recentActions: 0,
    activeSessions: 0,
    securityAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState('healthy');

  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushImageUrl, setPushImageUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const functions = getFunctions(undefined, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const usersRef = ref(database, 'users');
      const sessionsRef = ref(database, 'courses');
      const alertsRef = ref(database, 'adminSecurityAlerts');

      const [usersSnap, sessionsSnap, alertsSnap] = await Promise.all([
        get(usersRef),
        get(sessionsRef),
        get(alertsRef),
      ]);

      const users = usersSnap.val() || {};
      const courses = sessionsSnap.val() || {};
      const sessions = Object.values(users).flatMap((user) => Object.values(user.sessions || {}));
      const alerts = alertsSnap.val() || {};

      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      const activeSessions = Object.values(sessions).filter(
        (s) => s.active !== false && now - new Date(s.timestamp).getTime() < thirtyMinutes,
      ).length;

      const unresolvedAlerts = Object.values(alerts).filter((a) => !a.resolved).length;

      setStats({
        totalUsers: Object.keys(users).length,
        totalCourses: Object.keys(courses).length,
        activeUsers: Object.values(users).filter((u) => u.status === 'active' && !u.isDeleted)
          .length,
        recentActions: Object.keys(sessions).length,
        activeSessions,
        securityAlerts: unresolvedAlerts,
      });

      if (unresolvedAlerts > 20) {
        setSystemHealth('critical');
      } else if (unresolvedAlerts > 10) {
        setSystemHealth('warning');
      } else {
        setSystemHealth('healthy');
      }
    } catch {
      setSystemHealth('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPushNotification = async () => {
    if (!pushTitle || !pushMessage) return;

    setSending(true);
    setSendResult(null);

    try {
      const sendPushToAll = httpsCallable(functions, 'sendPushToAll');
      const { data: result } = await sendPushToAll({
        title: pushTitle,
        message: pushMessage,
        imageUrl: pushImageUrl || undefined,
      });

      setSendResult({
        success: result.success,
        message: i18n.t('admin.pushResult', {
          success: result.successCount,
          total: result.totalUsers,
          failed: result.failureCount,
        }),
      });

      if (result.success) {
        setPushTitle('');
        setPushMessage('');
        setPushImageUrl('');
      }
    } catch {
      let errorMessage = i18n.t('ui.couldNotSendNotification');

      setSendResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setSending(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: i18n.t('ui.totalUsers'),
      value: stats.totalUsers,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      link: '/admin/users',
    },
    {
      icon: BookOpen,
      label: i18n.t('ui.totalCourses'),
      value: stats.totalCourses,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      link: '/courses',
    },
    {
      icon: Shield,
      label: i18n.t('ui.securityAlerts2'),
      value: stats.securityAlerts,
      color:
        stats.securityAlerts > 0
          ? 'text-red-600 bg-red-100 dark:bg-red-900/30'
          : 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
      link: '/admin/security',
      badge: stats.securityAlerts > 0 ? 'alert' : null,
    },
  ];

  if (loading) {
    return <AppLoader text={i18n.t('ui.loadingAdminPanel')} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {i18n.t('ui.adminPanel2')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {i18n.t('ui.manageCoursesUsersAndNotifications')}
        </p>
      </div>

      {systemHealth !== 'healthy' && (
        <div
          className={`rounded-xl p-4 border-l-4 ${
            systemHealth === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
              : systemHealth === 'critical'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                : 'bg-gray-50 dark:bg-gray-900/20 border-gray-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`w-5 h-5 ${
                systemHealth === 'warning'
                  ? 'text-yellow-600'
                  : systemHealth === 'critical'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            />
            <div>
              <p className="font-semibold">
                {systemHealth === 'warning'
                  ? i18n.t('ui.needsReview')
                  : i18n.t('ui.highAlertVolume')}
              </p>
              <p className="text-sm opacity-80">
                {stats.securityAlerts > 0 &&
                  i18n.t('security.pendingCount', { v0: stats.securityAlerts })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const Card = (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    {stat.badge === 'online' && (
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    )}
                    {stat.badge === 'alert' && stat.value > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full animate-pulse">
                        !
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );

          return stat.link ? (
            <Link key={index} to={stat.link}>
              {Card}
            </Link>
          ) : (
            <div key={index}>{Card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {i18n.t('ui.adminTools')}
          </h2>
          <div className="space-y-3">
            <Link to="/admin/users" className="block">
              <button className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                {i18n.t('ui.manageUsers')}
              </button>
            </Link>
            <Link to="/courses" className="block">
              <button className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" />
                {i18n.t('courses.management')}
              </button>
            </Link>
            <Link to="/admin/security" className="block">
              <button className="w-full btn-secondary py-3 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                {i18n.t('ui.securityAlerts3')}
                {stats.securityAlerts > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.securityAlerts}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {i18n.t('ui.sendPushNotification')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {i18n.t('ui.title')}
              </label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder={i18n.t('ui.notificationTitle')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {i18n.t('ui.message')}
              </label>
              <textarea
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder={i18n.t('ui.enterTheNotificationMessage')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {i18n.t('ui.imageUrlOptional')}
              </label>
              <input
                type="url"
                value={pushImageUrl}
                onChange={(e) => setPushImageUrl(e.target.value)}
                placeholder={i18n.t('common.urlPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {i18n.t('ui.addAnImageLinkForTheNotification')}
              </p>
            </div>

            <button
              onClick={handleSendPushNotification}
              disabled={sending || !pushTitle || !pushMessage}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {i18n.t('test.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {i18n.t('ui.sendToAllUsers')}
                </>
              )}
            </button>

            {sendResult && (
              <div
                className={`p-4 rounded-lg ${
                  sendResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}
              >
                <p className="text-sm font-medium">{sendResult.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats.securityAlerts > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                {i18n.t('ui.aboutSecurityAlerts')}
              </h3>
              <p className="text-yellow-800 dark:text-yellow-400 text-sm mb-3">
                {i18n.t('ui.alertsAreSignalsForAdministratorReview')}
              </p>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                <li>
                  • <strong>{i18n.t('ui.newDevice')}</strong>
                  {i18n.t('ui.anUnfamiliarBrowserOrComputer')}
                </li>
                <li>
                  • <strong>{i18n.t('ui.newIpAddress')}</strong>
                  {i18n.t('ui.anIpChangeCanAlsoBeCaused')}
                </li>
                <li>
                  • <strong>{i18n.t('ui.locationChange')}</strong>
                  {i18n.t('ui.locationDataCanBeInaccurate')}
                </li>
                <li>
                  • <strong>{i18n.t('ui.repeatedSigninAttempts')}</strong>
                  {i18n.t('ui.reviewTheActivityBeforeTakingAction')}
                </li>
              </ul>
              <div className="mt-4">
                <Link to="/admin/security">
                  <button className="btn-secondary text-sm py-2 px-4">
                    {i18n.t('ui.view')}
                    {stats.securityAlerts}
                    {i18n.t('ui.alertsAwaitingReview')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
