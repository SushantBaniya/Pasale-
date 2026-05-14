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
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <FiCheckCircle className="w-5 h-5 text-[#3A7A5A]" />;
      case 'warning': return <FiAlertCircle className="w-5 h-5 text-[#D4623A]" />;
      case 'error': return <FiXCircle className="w-5 h-5 text-red-500" />;
      default: return <FiInfo className="w-5 h-5 text-[#D4623A]" />;
    }
  };

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) markNotificationAsRead(id);
    navigate('/notifications');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-[#1A1A1A] border-2 border-[#E5D8CC] dark:border-[#222222] rounded-xl shadow-2xl z-50 max-h-[32rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="p-5 border-b border-[#E5D8CC] dark:border-[#222222] flex items-center justify-between bg-[#FDF1EC]/50 dark:bg-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4623A]/10 dark:bg-[#D4623A]/20 rounded-lg">
            <FiBell className="w-5 h-5 text-[#D4623A] dark:text-[#D4623A]" />
          </div>
          <div>
            <h3 className="font-bold text-[#3D2B1A] dark:text-[#E0E0E0] text-base">Notifications</h3>
            <p className="text-xs text-[#8A7060] dark:text-[#555555] mt-0.5">Stay updated</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-[#D4623A] text-white text-xs px-2.5 py-1 rounded-full font-bold ml-auto">
              {unreadCount} New
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-[#8A7060] hover:text-[#3D2B1A] dark:hover:text-gray-300 p-2 hover:bg-[#EDE5DA] dark:hover:bg-gray-700 rounded-lg transition-all duration-200">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-16 px-6 text-center text-[#8A7060] dark:text-[#555555] flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-[#EDE5DA] dark:bg-[#222222] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <FiBell className="w-10 h-10 text-[#E5D8CC] dark:#8A7060" />
            </div>
            <p className="text-sm font-semibold text-[#3D2B1A] dark:text-[#CCCCCC]">All caught up!</p>
            <p className="text-xs text-[#8A7060] dark:text-[#555555] mt-1.5">No new notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5D8CC] dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.read)}
                className={`p-4 hover:bg-[#FAF7F3] dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group ${!notification.read ? 'bg-[#FDF1EC]/30 dark:bg-[#D4623A]/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg shrink-0 transition-all duration-200 ${!notification.read ? 'bg-white dark:bg-[#222222] shadow-md' : 'bg-[#FAF7F3] dark:bg-[#222222]/50'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={`text-sm font-semibold leading-tight ${!notification.read ? 'text-[#3D2B1A] dark:text-[#E0E0E0]' : 'text-[#3D2B1A]/70 dark:text-[#CCCCCC]'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-[#8A7060] dark:#8A7060 whitespace-nowrap ml-2">
                        {formatDate(notification.date, language).split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-[#8A7060] dark:text-[#555555] line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4623A] shrink-0 mt-1.5 shadow-sm"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="p-4 border-t border-[#E5D8CC] dark:border-[#222222] bg-[#FAF7F3]/50 dark:bg-[#1A1A1A]">
        <button
          onClick={() => { navigate('/notifications'); onClose(); }}
          className="w-full py-2.5 px-4 text-sm text-center font-semibold text-white bg-[#D4623A] hover:bg-[#B8502E] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};
