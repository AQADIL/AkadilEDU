import { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Edit, Ban, Trash2, BookOpen, AlertTriangle, Mail, Phone, Bell, BellOff, CheckCircle } from 'lucide-react';
import { fetchAllUsers, suspendUser, unsuspendUser, softDeleteUser, toggleUserPushNotifications, getUserPushStatus } from '../../firebase/realtimeDb';
import { auth } from '../../firebase/config';
import UserDetailDrawer from '../../components/admin/UserDetailDrawer';
import AppLoader from '../../components/AppLoader';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pushStatuses, setPushStatuses] = useState({});  // Состояния push-уведомлений пользователей

  useEffect(() => {
    loadUsers();
    
    // Определяем, мобильное ли устройство
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Первоначальная проверка
    checkMobile();
    
    // Слушаем изменение размера экрана
    window.addEventListener('resize', checkMobile);
    
    // Очистка при размонтировании
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      const usersData = await fetchAllUsers();
      setUsers(usersData);
      
      // Загрузим состояния push-уведомлений
      const statuses = {};
      for (const user of usersData) {
        if (user.uid) {
          try {
            const status = await getUserPushStatus(user.uid);
            statuses[user.uid] = status;
          } catch (error) {
            console.error(`Error loading push status for ${user.uid}:`, error);
          }
        }
      }
      setPushStatuses(statuses);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.uid?.includes(searchQuery)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Hide deleted users
    filtered = filtered.filter(user => !user.isDeleted);

    setFilteredUsers(filtered);
  };

  const handleSuspend = async (uid) => {
    if (!confirm('Вы уверены что хотите заблокировать этого пользователя?')) return;
    
    try {
      await suspendUser(uid, auth.currentUser.uid, 'Заблокирован администратором');
      await loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Ошибка при блокировке пользователя');
    }
  };

  const handleUnsuspend = async (uid) => {
    try {
      await unsuspendUser(uid, auth.currentUser.uid);
      await loadUsers();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Ошибка при разблокировке пользователя');
    }
  };
  
  const handleTogglePushNotifications = async (uid) => {
    try {
      const currentStatus = pushStatuses[uid] || { enabled: false };
      const newEnabled = !currentStatus.enabled;
      await toggleUserPushNotifications(uid, newEnabled, auth.currentUser.uid);
      
      // Получаем обновленный статус
      const updatedStatus = await getUserPushStatus(uid);
      
      // Обновляем локальное состояние
      setPushStatuses(prev => ({
        ...prev,
        [uid]: updatedStatus
      }));
      
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      alert('Ошибка при изменении настроек уведомлений');
    }
  };

  const handleSoftDelete = async (uid) => {
    if (!confirm('Вы уверены? Это действие пометит пользователя как удаленного.')) return;
    
    try {
      await softDeleteUser(uid, auth.currentUser.uid);
      await loadUsers();
    } catch (error) {
      console.error('Error soft deleting user:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  const openUserDrawer = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  if (loading) {
    return <AppLoader text="Загрузка пользователей..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Управление Пользователями
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Всего пользователей: {filteredUsers.length}
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Добавить пользователя
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по email, имени или UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="suspended">Заблокированные</option>
            </select>
          </div>

          <button
            onClick={loadUsers}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Условный рендеринг: таблица для десктопа, карточки для мобильных */}
      {!isMobile ? (
        /* Desktop Users Table */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Безопасность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Последний вход
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'Без имени'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {user.role === 'admin' ? 'Админ' : 'Студент'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.securityStatus && user.securityStatus !== 'low' ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${
                          user.securityStatus === 'critical' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : user.securityStatus === 'high'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {user.securityStatus.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ru-RU') : 'Никогда'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openUserDrawer(user)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {/* Кнопка заблокировать/разблокировать */}
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(user.uid)}
                            className="text-orange-600 hover:text-orange-800 dark:text-orange-400"
                            title="Заблокировать"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnsuspend(user.uid)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400"
                            title="Разблокировать"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Кнопка push-уведомлений */}
                        <button
                          onClick={() => handleTogglePushNotifications(user.uid)}
                          className={`${pushStatuses[user.uid]?.enabled 
                              ? 'text-purple-600 hover:text-purple-800 dark:text-purple-400' 
                              : pushStatuses[user.uid]?.status === 'declined'
                                ? 'text-red-600 hover:text-red-800 dark:text-red-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                          }`}
                          title={pushStatuses[user.uid]?.enabled ? 'Отключить уведомления' : 'Включить уведомления'}
                        >
                          {pushStatuses[user.uid]?.enabled ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <div className="relative">
                              <BellOff className="w-4 h-4" />
                              {pushStatuses[user.uid]?.status === 'declined' && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                              )}
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => handleSoftDelete(user.uid)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile User Cards */
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => {
            // Определяем классы и иконки в зависимости от статуса пользователя
            const statusClasses = user.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';

            // Определяем классы для уровня риска безопасности
            const securityClasses = {
              critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200',
              high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200',
              medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200'
            };

            return (
              <div 
                key={user.uid} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Верхняя часть карточки */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {user.name || 'Без имени'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <Phone className="w-3.5 h-3.5" />
                          {user.phone}
                        </div>
                      )}
                    </div>

                    {/* Статус и роль */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {user.role === 'admin' ? 'Админ' : 'Студент'}
                      </span>

                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                      </span>

                      {/* Индикатор безопасности */}
                      {user.securityStatus && user.securityStatus !== 'low' && (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                          securityClasses[user.securityStatus] || ''
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {user.securityStatus.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Дата последнего входа */}
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Последний вход: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ru-RU') : 'Никогда'}
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <button
                      onClick={() => openUserDrawer(user)}
                      className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </button>
                  </div>

                  {/* Кнопка блокировки */}
                  <div>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleSuspend(user.uid)}
                        className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                        title="Заблокировать"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnsuspend(user.uid)}
                        className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                        title="Разблокировать"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Кнопка пуш-уведомлений */}
                  <div>
                    <button
                      onClick={() => handleTogglePushNotifications(user.uid)}
                      className={`p-2 rounded-lg ${pushStatuses[user.uid] 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={pushStatuses[user.uid] ? 'Отключить уведомления' : 'Включить уведомления'}
                    >
                      {pushStatuses[user.uid] ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <BellOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Кнопка удаления */}
                  <div>
                    <button
                      onClick={() => handleSoftDelete(user.uid)}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Пользователи не найдены
          </p>
        </div>
      )}

      {/* User Detail Drawer */}
      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
