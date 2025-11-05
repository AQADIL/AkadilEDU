import { useState, useEffect } from 'react';
import { Users, BookOpen, Shield, Settings, Bell, Send, AlertCircle } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/realtimeDb';
import { Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase/config';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeUsers: 0,
    recentActions: 0,
    activeSessions: 0,
    securityAlerts: 0,
    storageUsed: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState('healthy');
  
  // Push notification state
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch all stats in parallel
      const usersRef = ref(database, 'users');
      const sessionsRef = ref(database, 'sessions');
      const alertsRef = ref(database, 'security_alerts');
      
      const [usersSnap, sessionsSnap, alertsSnap] = await Promise.all([
        get(usersRef),
        get(sessionsRef),
        get(alertsRef)
      ]);

      const users = usersSnap.val() || {};
      const sessions = sessionsSnap.val() || {};
      const alerts = alertsSnap.val() || {};

      // Calculate active sessions (last 30 minutes)
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      const activeSessions = Object.values(sessions).filter(
        s => now - s.timestamp < thirtyMinutes
      ).length;

      // Calculate unresolved security alerts
      const unresolvedAlerts = Object.values(alerts).filter(
        a => !a.resolved
      ).length;

      setStats({
        totalUsers: Object.keys(users).length,
        totalCourses: 12, // Mock for now
        activeUsers: Object.values(users).filter(u => u.isActive).length,
        recentActions: Object.keys(sessions).length,
        activeSessions,
        securityAlerts: unresolvedAlerts,
        storageUsed: 0, // Will implement with Storage API
        revenue: 0 // Will implement with payments
      });

      // Check system health
      if (unresolvedAlerts > 10) {
        setSystemHealth('warning');
      } else if (unresolvedAlerts > 20) {
        setSystemHealth('critical');
      } else {
        setSystemHealth('healthy');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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
      console.log('📱 Sending push notification to all users...');
      
      const functions = getFunctions(app);
      const sendPushToAll = httpsCallable(functions, 'sendPushToAll');
      
      const result = await sendPushToAll({
        title: pushTitle,
        message: pushMessage
      });

      console.log('✅ Push result:', result.data);

      setSendResult({
        success: result.data.success,
        message: result.data.message
      });

      if (result.data.success) {
        // Clear form on success
        setPushTitle('');
        setPushMessage('');
      }

    } catch (error) {
      console.error('❌ Error sending push:', error);
      
      let errorMessage = 'Ошибка отправки';
      
      if (error.code === 'functions/not-found') {
        errorMessage = '⚠️ Cloud Function не найдена. Выполните: firebase deploy --only functions';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = '🔒 Только администраторы могут отправлять уведомления';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSendResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setSending(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: 'Всего пользователей',
      value: stats.totalUsers,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      link: '/admin/users'
    },
    {
      icon: BookOpen,
      label: 'Всего курсов',
      value: stats.totalCourses,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      link: '/admin/courses'
    },
    {
      icon: Shield,
      label: 'Alerts безопасности',
      value: stats.securityAlerts,
      color: stats.securityAlerts > 0 ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
      link: '/admin/security-alerts',
      badge: stats.securityAlerts > 0 ? 'alert' : null
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Панель Администратора
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Добро пожаловать в админ панель AkadilEDU
        </p>
      </div>

      {/* System Health Banner */}
      {systemHealth !== 'healthy' && (
        <div className={`rounded-xl p-4 border-l-4 ${
          systemHealth === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
          systemHealth === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
          'bg-gray-50 dark:bg-gray-900/20 border-gray-500'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${
              systemHealth === 'warning' ? 'text-yellow-600' :
              systemHealth === 'critical' ? 'text-red-600' : 'text-gray-600'
            }`} />
            <div>
              <p className="font-semibold">
                {systemHealth === 'warning' ? '⚠️ Требует внимания' : '🚨 Критическое состояние'}
              </p>
              <p className="text-sm opacity-80">
                {stats.securityAlerts > 0 && `${stats.securityAlerts} непроверенных alerts безопасности`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const Card = (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
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
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Tools */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Инструменты администратора
          </h2>
          <div className="space-y-3">
            <Link to="/admin/users" className="block">
              <button className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Управление пользователями
              </button>
            </Link>
            <Link to="/admin/courses" className="block">
              <button className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" />
                Управление курсами
              </button>
            </Link>
            <Link to="/admin/security-alerts" className="block">
              <button className="w-full btn-secondary py-3 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Security Alerts
                {stats.securityAlerts > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.securityAlerts}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Отправить Push Уведомление
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Заголовок
              </label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Новый курс доступен!"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Сообщение
              </label>
              <textarea
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Математика 102 теперь доступна для изучения!"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <button
              onClick={handleSendPushNotification}
              disabled={sending || !pushTitle || !pushMessage}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Отправить всем пользователям
                </>
              )}
            </button>
            
            {sendResult && (
              <div className={`p-4 rounded-lg ${
                sendResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                <p className="text-sm font-medium">
                  {sendResult.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Alerts Info */}
      {stats.securityAlerts > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                🛡️ Что такое Security Alerts?
              </h3>
              <p className="text-yellow-800 dark:text-yellow-400 text-sm mb-3">
                Система автоматически отслеживает подозрительную активность:
              </p>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                <li>• <strong>Вход с нового устройства</strong> - когда пользователь заходит с незнакомого браузера/компьютера</li>
                <li>• <strong>Вход с нового IP</strong> - резкая смена локации или использование VPN</li>
                <li>• <strong>Вход с нового города</strong> - пользователь вдруг зашел из другой страны</li>
                <li>• <strong>Множественные попытки входа</strong> - подозрение на взлом</li>
              </ul>
              <div className="mt-4">
                <Link to="/admin/security-alerts">
                  <button className="btn-secondary text-sm py-2 px-4">
                    Посмотреть {stats.securityAlerts} непроверенных alerts →
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
