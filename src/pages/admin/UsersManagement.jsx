import { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Edit, Ban, Trash2, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { fetchAllUsers, suspendUser, unsuspendUser, softDeleteUser } from '../../firebase/realtimeDb';
import { auth } from '../../firebase/config';
import UserDetailDrawer from '../../components/admin/UserDetailDrawer';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      const usersData = await fetchAllUsers();
      setUsers(usersData);
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
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

      {/* Users Table */}
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
                      <button
                        onClick={() => {/* Assign course */}}
                        className="text-green-600 hover:text-green-800 dark:text-green-400"
                        title="Назначить курс"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
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
                          <BookOpen className="w-4 h-4" />
                        </button>
                      )}
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Пользователи не найдены
            </p>
          </div>
        )}
      </div>

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
