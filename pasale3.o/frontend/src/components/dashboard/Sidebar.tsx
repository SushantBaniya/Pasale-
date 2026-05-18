import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import {
  FiGrid,
  FiUsers,
  FiPackage,
  FiFileText,
  FiTrendingDown,
  FiSettings,
  FiLogOut,
  FiX,
  FiMenu,
  FiChevronLeft,
  FiBarChart2,
  FiShoppingCart,
  FiDollarSign,
  FiHelpCircle,
  FiBookOpen,
  FiStar,
  FiTool,
  FiChevronDown,
  FiChevronRight,
  FiZap,
  FiCreditCard,
  FiBook,
  FiUser,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { userProfile } = useAuthStore();
  const { businessName } = useBusinessStore();

  const handleLogout = () => {
    logout();
    onClose?.();
    window.location.href = '/welcome';
  };

  const businessMenuItems = [
    { path: '/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/quick-pos', icon: FiZap, label: 'Quick POS' },
    { path: '/parties', icon: FiUsers, label: 'Parties' },
    { path: '/inventory', icon: FiPackage, label: 'Inventory' },
    { path: '/sales', icon: FiDollarSign, label: 'Sales' },
    { path: '/purchase', icon: FiShoppingCart, label: 'Purchase' },
    { path: '/expense-monitoring', icon: FiTrendingDown, label: 'Expense' },
    { path: '/billing', icon: FiCreditCard, label: 'Billing' },
    { path: '/reports', icon: FiBarChart2, label: 'Reports' },
    { path: '/employees', icon: FiUser, label: 'Employees' },
    { path: '/counters', icon: FiGrid, label: 'Counters' },
  ];

  const othersMenuItems = [
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  const getUserDisplayName = () => {
    if (businessName) return businessName;
    if (userProfile?.businessName) return userProfile.businessName;
    if (userProfile?.name) return userProfile.name;
    return 'User';
  };

  const getInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

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
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-[#101B55] dark:bg-[#0D0E12] border-r border-[#1E293B] dark:border-[#1C1D24] 
        h-screen fixed left-0 top-0 flex flex-col z-50 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full w-64'} 
        lg:translate-x-0
      `}>
        {/* Logo & Toggle */}
        <div className={`px-4 py-4 border-b border-[#1E293B] dark:border-[#1C1D24] flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2DD50] flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">P</span>
              </div>
              <h1 className="text-lg font-medium text-white dark:text-[#EAE5DF] tracking-tight">
                Pasale
              </h1>
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-[#94A3B8] hover:text-white dark:#475569 dark:hover:text-gray-300 hover:bg-[#1E293B] dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiMenu className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-[#94A3B8] hover:text-white dark:#475569 dark:hover:text-gray-300 hover:bg-[#1E293B] dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-none py-3">
          {/* BUSINESS Section */}
          {!isCollapsed && (
            <div className="px-4 pt-2 pb-2">
              <span className="text-[11px] font-medium text-[#94A3B8] dark:#475569 uppercase tracking-wider">
                Business
              </span>
            </div>
          )}
          
          <div className="px-2 space-y-1">
            {businessMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path === '/dashboard' && location.pathname === '/') ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose?.()}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative
                    ${isCollapsed ? 'justify-center px-2' : ''}
                    ${isActive
                      ? 'bg-[#F2DD5022] dark:bg-[#F2DD50]/20 text-[#F2DD50] dark:text-[#F2DD50]'
                      : 'text-[#94A3B8] dark:text-[#44454F] hover:bg-[#1E293B] dark:hover:bg-gray-800/50 hover:text-white dark:hover:text-gray-200'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#F2DD50] dark:bg-[#F2DD50] rounded-r-full" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#F2DD50] dark:text-[#F2DD50]' : ''}`} />
                  {!isCollapsed && (
                    <span className="text-[14px] truncate flex-1">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* OTHERS Section */}
          {!isCollapsed && (
            <div className="px-4 pt-6 pb-2">
              <span className="text-[11px] font-medium text-[#94A3B8] dark:#475569 uppercase tracking-wider">
                Others
              </span>
            </div>
          )}

          <div className="px-2 space-y-1">
            {/* Settings */}
            {othersMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose?.()}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative
                    ${isCollapsed ? 'justify-center px-2' : ''}
                    ${isActive
                      ? 'bg-[#F2DD5022] dark:bg-[#F2DD50]/20 text-[#F2DD50] dark:text-[#F2DD50]'
                      : 'text-[#94A3B8] dark:text-[#44454F] hover:bg-[#1E293B] dark:hover:bg-gray-800/50 hover:text-white dark:hover:text-gray-200'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#F2DD50] dark:bg-[#F2DD50] rounded-r-full" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#F2DD50] dark:text-[#F2DD50]' : ''}`} />
                  {!isCollapsed && (
                    <span className="text-[14px] truncate flex-1">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout button */}
        <div className="px-2 py-3 border-t border-[#1E293B] dark:border-[#1C1D24] shrink-0">
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#94A3B8] dark:text-[#44454F] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <FiLogOut className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {!isCollapsed && <span className="text-[13px] font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
