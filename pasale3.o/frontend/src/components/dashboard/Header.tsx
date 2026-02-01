import React, { useState, useEffect, useRef } from 'react';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import { ThemeSwitcher } from '../layout/ThemeSwitcher';
import { Button } from '../ui/Button';
import { NotificationsDropdown } from './NotificationsDropdown';
import { AddNewDialog } from './AddNewDialog';
import { SearchDropdown } from './SearchDropdown';
import { FiSearch, FiBell, FiPlus, FiChevronDown, FiUser, FiMenu } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';

const formatDateTime = (language: string) => {
  const now = new Date();
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysNp = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsNp = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'];

  const days = language === 'np' ? daysNp : daysEn;
  const months = language === 'np' ? monthsNp : monthsEn;

  const day = days[now.getDay()];
  const month = months[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? (language === 'np' ? 'अपराह्न' : 'PM') : (language === 'np' ? 'पूर्वाह्न' : 'AM');
  hours = hours % 12;
  hours = hours ? hours : 12;

  if (language === 'np') {
    const toNepaliNum = (num: number) => {
      const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      return num.toString().split('').map(d => nepaliDigits[parseInt(d)]).join('');
    };
    return `${day}, ${month} ${toNepaliNum(date)}, ${toNepaliNum(year)} • ${toNepaliNum(hours)}:${toNepaliNum(parseInt(minutes))} ${ampm}`;
  }

  return `${day}, ${month} ${date}, ${year} • ${hours}:${minutes} ${ampm}`;
};

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const { t, language } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications } = useDataStore();
  const { userProfile, logout } = useAuthStore();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const [currentDateTime, setCurrentDateTime] = useState(formatDateTime(language));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatDateTime(language));
    }, 1000);
    return () => clearInterval(timer);
  }, [language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
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
      <header className={`h-14 sm:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 sm:px-4 lg:px-6 fixed top-0 right-0 left-0 ${isSidebarCollapsed ? 'lg:left-20' : 'lg:left-64'} z-30 transition-[left] duration-300 ease-in-out shadow-sm`}>
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <FiMenu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md" ref={searchRef}>
            <FiSearch className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder={t('common.search') || "Search..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (searchQuery.length > 0) {
                  setShowSearch(true);
                }
              }}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-600 text-xs sm:text-sm transition-colors"
            />
            {showSearch && searchQuery && (
              <SearchDropdown query={searchQuery} onClose={() => setShowSearch(false)} />
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Date/Time Display - Hidden on small screens */}
          <div className="hidden xl:flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg mr-1 sm:mr-2">
            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
              {currentDateTime}
            </span>
          </div>

          {/* Add New Button with Dropdown */}
          <div className="relative group">
            <Button
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md transition-shadow text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2"
              onClick={() => setShowAddNew(true)}
            >
              <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-semibold hidden md:inline">{t('addNew.title')}</span>
            </Button>
            <Button
              size="icon"
              className="flex sm:hidden shadow-sm p-1.5"
              onClick={() => setShowAddNew(true)}
            >
              <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1"></div>

          {/* Theme & Language Switchers */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1"></div>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
              }}
              className="relative p-1.5 sm:p-2.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <FiBell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-4 sm:min-w-5 h-4 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center px-1 sm:px-1.5 shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationsDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* User Profile Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 sm:gap-2.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              {userProfile.photo ? (
                <img
                  src={userProfile.photo}
                  alt="Profile"
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                />
              ) : (
                <div className="w-7 h-7 sm:w-9 sm:h-9 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md">
                  <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
              <div className="text-left hidden xl:block">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate max-w-24 sm:max-w-32">
                  {userProfile.name}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight truncate max-w-24 sm:max-w-32">
                  {userProfile.email || userProfile.phone}
                </p>
              </div>
              <FiChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 hidden lg:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Mobile Theme & Language */}
                <div className="sm:hidden px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('sidebar.settings')}</p>
                  <div className="flex gap-2 justify-start">
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{userProfile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{userProfile.email || userProfile.phone}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <FiUser className="w-4 h-4" />
                    <span className="font-medium">{t('settings.myProfile')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{t('sidebar.settings')}</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
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
