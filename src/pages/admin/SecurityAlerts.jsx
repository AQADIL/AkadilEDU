import i18n from '../../i18n';
import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Activity, MapPin, Smartphone, Wifi } from 'lucide-react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '../../firebase/realtimeDb';
import AppLoader from '../../components/AppLoader';

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [userCache, setUserCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return !alert.resolved;
    return alert.riskLevel === filter && !alert.resolved;
  });

  const markAsResolved = async (alertId) => {
    try {
      await update(ref(database, `adminSecurityAlerts/${alertId}`), {
        resolved: true,
        resolvedAt: new Date().toISOString(),
      });
    } catch (error) {}
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const fetchUserData = useCallback(async (uid) => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const userInfo = {
          email: userData.email || 'Unknown',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          fullName:
            `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
            i18n.t('common.unknownUser'),
        };
        setUserCache((previous) => ({ ...previous, [uid]: userInfo }));
        return userInfo;
      }
    } catch (error) {}

    return { email: 'Unknown', fullName: i18n.t('ui.unnamedUser') };
  }, []);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    const alertsRef = ref(database, 'adminSecurityAlerts');
    const unsubscribe = onValue(alertsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const alertsArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        for (const alert of alertsArray) {
          if (alert.uid) {
            await fetchUserData(alert.uid);
          }
        }

        setAlerts(alertsArray);
      } else {
        setAlerts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  if (loading) {
    return <AppLoader text={i18n.t('ui.loadingSecurityAlerts')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-600" />
            {i18n.t('ui.securityAlerts4')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {i18n.t('ui.activityRequiringReview')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{i18n.t('test.total')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alerts.filter((a) => !a.resolved).length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">{i18n.t('ui.critical')}</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                {alerts.filter((a) => a.riskLevel === 'critical' && !a.resolved).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">{i18n.t('ui.high')}</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                {alerts.filter((a) => a.riskLevel === 'high' && !a.resolved).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">{i18n.t('ui.medium')}</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                {alerts.filter((a) => a.riskLevel === 'medium' && !a.resolved).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {i18n.t('ui.all')}
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {i18n.t('ui.critical')}
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'high'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {i18n.t('ui.high')}
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {i18n.t('ui.medium')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {i18n.t('ui.noAlertsRecorded')}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {i18n.t('ui.noAlertsMatchTheSelectedFilter')}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4"
              style={{
                borderLeftColor:
                  alert.riskLevel === 'critical'
                    ? '#EF4444'
                    : alert.riskLevel === 'high'
                      ? '#F97316'
                      : alert.riskLevel === 'medium'
                        ? '#EAB308'
                        : '#6B7280',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle
                      className={`w-6 h-6 ${
                        alert.riskLevel === 'critical'
                          ? 'text-red-500'
                          : alert.riskLevel === 'high'
                            ? 'text-orange-500'
                            : 'text-yellow-500'
                      }`}
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {i18n.t('ui.activityFlaggedForReview')}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(alert.riskLevel)}`}
                    >
                      {alert.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {i18n.t('ui.user')}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {userCache[alert.uid]?.fullName || 'Loading...'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {i18n.t('ui.email')}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {userCache[alert.uid]?.email || 'Loading...'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {i18n.t('ui.time')}
                      {new Date(alert.timestamp).toLocaleString('ru-RU')}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {alert.flags?.map((flag, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          {flag.type === 'multiple_ips' && (
                            <Wifi className="w-4 h-4 text-orange-500 mt-0.5" />
                          )}
                          {flag.type === 'multiple_devices' && (
                            <Smartphone className="w-4 h-4 text-orange-500 mt-0.5" />
                          )}
                          {flag.type === 'rapid_ip_change' && (
                            <MapPin className="w-4 h-4 text-yellow-500 mt-0.5" />
                          )}
                          {flag.type === 'simultaneous_sessions' && (
                            <Activity className="w-4 h-4 text-red-500 mt-0.5" />
                          )}

                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {flag.message}
                            </p>
                            {flag.ips && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {i18n.t('ui.ipAddresses')}
                                {flag.ips.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {alert.session && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                        {i18n.t('ui.sessionInformation')}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">
                            {i18n.t('ui.ip')}
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {alert.session.ip}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">
                            {i18n.t('ui.browser')}
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {alert.session.device?.browser}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">
                            {i18n.t('ui.os')}
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {alert.session.device?.os}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">
                            {i18n.t('ui.device')}
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {alert.session.device?.deviceType}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => markAsResolved(alert.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    {i18n.t('ui.resolved')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
