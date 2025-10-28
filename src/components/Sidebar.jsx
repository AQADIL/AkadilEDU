import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Library, 
  ClipboardList, 
  ShoppingBag, 
  Shield,
  X 
} from 'lucide-react';
import { checkAdminClaim } from '../utils/placeholders';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device is touch-enabled
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Check admin status
    checkAdminClaim().then(setIsAdmin);
  }, []);

  const menuItems = [
    { icon: Home, label: t('sidebar.home'), path: '/' },
    { icon: BookOpen, label: t('sidebar.courses'), path: '/courses' },
    { icon: Library, label: t('sidebar.myCourses'), path: '/my-courses' },
    { icon: ClipboardList, label: t('sidebar.testUBT'), path: '/test-ubt' },
    { icon: ShoppingBag, label: t('sidebar.shop'), path: '/shop' },
  ];

  if (isAdmin) {
    menuItems.push({ icon: Shield, label: t('sidebar.admin'), path: '/admin' });
  }

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
        <span className={`whitespace-nowrap transition-opacity duration-200 ${
          isExpanded || isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'
        }`}>
          {item.label}
        </span>
      </NavLink>
    );
  };

  // Mobile drawer
  if (isOpen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Drawer */}
        <aside className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-50 lg:hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="p-4 space-y-2">
            {menuItems.map((item, index) => (
              <NavItem key={index} item={item} />
            ))}
          </nav>
        </aside>
      </>
    );
  }

  // Desktop sidebar
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
      </nav>
    </aside>
  );
}
