import { useState, useEffect } from 'react';
import { Users, BookOpen, Activity, TrendingUp } from 'lucide-react';
import { fetchAllUsers, fetchAllCourses, fetchAdminLogs } from '../../firebase/realtimeDb';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeUsers: 0,
    recentActions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, courses, logs] = await Promise.all([
        fetchAllUsers(),
        fetchAllCourses(),
        fetchAdminLogs(10)
      ]);

      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        recentActions: logs.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: 'Всего пользователей',
      value: stats.totalUsers,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: BookOpen,
      label: 'Всего курсов',
      value: stats.totalCourses,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30'
    },
    {
      icon: Activity,
      label: 'Активных пользователей',
      value: stats.activeUsers,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
    },
    {
      icon: TrendingUp,
      label: 'Последних действий',
      value: stats.recentActions,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary py-3">
            Добавить пользователя
          </button>
          <button className="btn-primary py-3">
            Создать курс
          </button>
          <button className="btn-secondary py-3">
            Просмотреть логи
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Используйте боковую панель
        </h3>
        <p className="text-blue-700 dark:text-blue-400">
          Перейдите в "Пользователи" для управления пользователями или "Курсы" для управления курсами.
        </p>
      </div>
    </div>
  );
}
