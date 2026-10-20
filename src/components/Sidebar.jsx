import i18n from '../i18n';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Library,
  ClipboardList,
  Shield,
  Users,
  AlertTriangle,
  FileText,
  X,
} from 'lucide-react';
import { auth } from '../firebase/config';
import { isUserAdmin } from '../firebase/realtimeDb';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const checkAdmin = async () => {
      const user = auth.currentUser;

      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminStatus = await isUserAdmin(user.uid);

        setIsAdmin(adminStatus);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdmin();
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const menuItems = [
    { icon: Home, label: t('sidebar.home'), path: '/' },
    { icon: BookOpen, label: t('sidebar.courses'), path: '/courses' },
    { icon: Library, label: t('sidebar.myCourses'), path: '/my-courses' },
    { icon: ClipboardList, label: t('sidebar.testUBT'), path: '/test-ubt' },
  ];

  const adminMenuItems = [
    { icon: Shield, label: i18n.t('ui.adminPanel'), path: '/admin' },
    { icon: Users, label: i18n.t('ui.users'), path: '/admin/users' },
    { icon: FileText, label: i18n.t('ui.testManagement'), path: '/admin/tests' },
    { icon: AlertTriangle, label: i18n.t('ui.security'), path: '/admin/security' },
  ];

  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice) {
      setIsExpanded(false);
    }
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;

    return (
      <NavLink
        to={item.path}
        onClick={() => onClose?.()}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span
          className={`whitespace-nowrap transition-opacity duration-200 ${
            isExpanded || isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'
          }`}
        >
          {item.label}
        </span>
      </NavLink>
    );
  };

  if (isOpen) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />

        <aside className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-50 lg:hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {i18n.t('ui.menu')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={i18n.t('ui.closeMenu')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item, index) => (
              <NavItem key={index} item={item} />
            ))}

            {isAdmin && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 mb-2 uppercase">
                    {i18n.t('ui.administrator')}
                  </p>
                  {adminMenuItems.map((item, index) => (
                    <NavItem key={`admin-${index}`} item={item} />
                  ))}
                </div>
              </>
            )}
          </nav>
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <nav className="p-2 space-y-2">
        {menuItems.map((item, index) => (
          <NavItem key={index} item={item} />
        ))}

        {isAdmin && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-4 mx-2"></div>
            {adminMenuItems.map((item, index) => (
              <NavItem key={`admin-${index}`} item={item} />
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
