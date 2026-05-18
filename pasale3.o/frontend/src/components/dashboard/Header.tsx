import React, { useState, useEffect, useRef } from 'react';
import { ThemeSwitcher } from '../layout/ThemeSwitcher';
import { NotificationsDropdown } from './NotificationsDropdown';
import { AddNewDialog } from './AddNewDialog';
import { FiBell, FiPlus, FiUser, FiMenu } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const { t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications } = useDataStore();
  const { userProfile, logout } = useAuthStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/welcome';
  };

  return (
    <>
      <header className={`h-14 sm:h-16 bg-white dark:bg-[#15161C] border-b border-[#E2E8F0] dark:border-[#1C1D24] flex items-center justify-between px-3 sm:px-4 lg:px-6 fixed top-0 right-0 left-0 ${isSidebarCollapsed ? 'lg:left-20' : 'lg:left-64'} z-30 transition-[left] duration-300 ease-in-out shadow-sm`}>
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-1 text-[#1E293B] dark:text-[#64748B] hover:bg-[#FFFFFF] dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <FiMenu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          
          {/* Theme Switcher */}
          <div className="hidden md:flex">
            <ThemeSwitcher />
          </div>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
              }}
              className="relative p-1.5 sm:p-2 text-[#475569] dark:text-[#44454F] hover:text-[#F2DD50] dark:hover:text-[#F2DD50] hover:bg-[#F1F5F9] dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <FiBell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-4 sm:min-w-5 h-4 sm:h-5 bg-[#F2DD50] text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center px-1 sm:px-1.5 shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationsDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>
          
          {/* Add Order Button */}
          <button
            className="flex items-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm px-4 py-2 bg-[#001f54] hover:bg-[#00153a] text-white rounded-md font-medium transition-colors"
            onClick={() => setShowAddNew(true)}
          >
            <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Add Order</span>
          </button>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-[#E5E7EB] dark:bg-[#2A2B36]"></div>

          {/* User Profile Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-[#0b132b] text-white rounded-full hover:ring-2 hover:ring-offset-2 hover:ring-[#0b132b] dark:hover:ring-offset-[#15161C] transition-all"
            >
              {userProfile.photo ? (
                <img
                  src={userProfile.photo}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs sm:text-sm font-semibold tracking-wider">
                  {userProfile.name ? userProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'FO'}
                </span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#1C1D24] rounded-xl shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Mobile Theme & Language */}
                <div className="sm:hidden px-4 py-3 border-b border-[#E2E8F0] dark:border-[#1C1D24]">
                  <p className="text-xs font-semibold text-[#475569] dark:text-[#44454F] mb-2">{t('sidebar.settings')}</p>
                  <div className="flex gap-2 justify-start">
                    <ThemeSwitcher />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#1C1D24]">
                  <p className="text-sm font-bold text-[#1E293B] dark:text-[#EAE5DF]">{userProfile.name}</p>
                  <p className="text-xs text-[#475569] dark:text-[#44454F] mt-0.5">{userProfile.email || userProfile.phone}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-[#1E293B] dark:text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-gray-700 hover:text-[#F2DD50] dark:hover:text-[#F2DD50] transition-colors"
                  >
                    <FiUser className="w-4 h-4" />
                    <span className="font-medium">{t('settings.myProfile')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-[#1E293B] dark:text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-gray-700 hover:text-[#F2DD50] dark:hover:text-[#F2DD50] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{t('sidebar.settings')}</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-[#E2E8F0] dark:border-[#1C1D24] mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showAddNew && <AddNewDialog onClose={() => setShowAddNew(false)} />}
    </>
  );
};
