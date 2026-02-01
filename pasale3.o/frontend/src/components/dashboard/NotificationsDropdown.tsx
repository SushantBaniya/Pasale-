import React, { useEffect, useRef } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../utils/nepaliDate';
import { useLanguageStore } from '../../store/languageStore';
import { FiX, FiInfo, FiAlertCircle, FiCheckCircle, FiXCircle, FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, markNotificationAsRead, dismissNotification } = useDataStore();
  const { language } = useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      markNotificationAsRead(id);
    }
    navigate('/notifications');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-[32rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2"
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-blue-50/50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <FiBell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
              Notifications
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stay updated</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold ml-auto">
              {unreadCount} New
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-16 px-6 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <FiBell className="w-10 h-10 text-gray-300 dark:text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">All caught up!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">No new notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.read)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group ${!notification.read
                    ? 'bg-blue-50/30 dark:bg-blue-900/20'
                    : ''
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg shrink-0 transition-all duration-200 ${!notification.read
                      ? 'bg-white dark:bg-gray-700 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={`text-sm font-semibold leading-tight ${!notification.read
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(notification.date, language).split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-sm"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
        <button
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="w-full py-2.5 px-4 text-sm text-center font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};
