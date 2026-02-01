import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useAuthStore } from '../../store/authStore';
import {
  FiGrid,
  FiUsers,
  FiBell,
  FiFileText,
  FiTrendingDown,
  FiSettings,
  FiLogOut,
  FiX,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../ui/NepaliRupeeIcon';

// Wrapper component to make NepaliRupeeIcon work like react-icons
const RupeeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <NepaliRupeeIcon className={className} />
);

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    onClose?.();
    window.location.href = '/welcome';
  };

  const menuItems = [
    { path: '/dashboard', icon: FiGrid, labelKey: 'sidebar.dashboard' },
    { path: '/transactions', icon: RupeeIcon, labelKey: 'sidebar.transactions' },
    { path: '/parties', icon: FiUsers, labelKey: 'sidebar.parties' },
    { path: '/inventory', icon: FiGrid, labelKey: 'sidebar.inventory' },
    { path: '/billing', icon: RupeeIcon, labelKey: 'sidebar.billing' },
    { path: '/reports', icon: FiFileText, labelKey: 'sidebar.businessReports' },
    { path: '/expense-monitoring', icon: FiTrendingDown, labelKey: 'sidebar.expenseMonitoring' },
    { path: '/settings', icon: FiSettings, labelKey: 'sidebar.settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        h-screen fixed left-0 top-0 flex flex-col z-50 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        {/* Header with close button on mobile and toggle on desktop */}
        <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
              Pasale
            </h1>
          )}

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiMenu className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/dashboard' && location.pathname === '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={`
                  flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200
                  ${isCollapsed ? 'justify-center px-2' : ''}
                  ${isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-md shadow-blue-500/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm sm:text-base truncate">{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout button - fixed at bottom with safe area padding */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 pb-safe mb-4 sm:mb-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? t('common.logout') : undefined}
          >
            <FiLogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm sm:text-base">{t('common.logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
