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
      case 'success': return <FiCheckCircle className="w-5 h-5 text-[#10B981]" />;
      case 'warning': return <FiAlertCircle className="w-5 h-5 text-[#F2DD50]" />;
      case 'error': return <FiXCircle className="w-5 h-5 text-red-500" />;
      default: return <FiInfo className="w-5 h-5 text-[#F2DD50]" />;
    }
  };

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) markNotificationAsRead(id);
    navigate('/notifications');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-[#15161C] border-2 border-[#E2E8F0] dark:border-[#1C1D24] rounded-xl shadow-2xl z-50 max-h-[32rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="p-5 border-b border-[#E2E8F0] dark:border-[#1C1D24] flex items-center justify-between bg-[#F1F5F9]/50 dark:bg-[#15161C]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#F2DD50]/10 dark:bg-[#F2DD50]/20 rounded-lg">
            <FiBell className="w-5 h-5 text-[#F2DD50] dark:text-[#F2DD50]" />
          </div>
          <div>
            <h3 className="font-bold text-[#1E293B] dark:text-[#EAE5DF] text-base">Notifications</h3>
            <p className="text-xs text-[#475569] dark:text-[#44454F] mt-0.5">Stay updated</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-[#F2DD50] text-white text-xs px-2.5 py-1 rounded-full font-bold ml-auto">
              {unreadCount} New
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-[#475569] hover:text-[#1E293B] dark:hover:text-gray-300 p-2 hover:bg-[#FFFFFF] dark:hover:bg-gray-700 rounded-lg transition-all duration-200">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-16 px-6 text-center text-[#475569] dark:text-[#44454F] flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-[#FFFFFF] dark:bg-[#1C1D24] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <FiBell className="w-10 h-10 text-[#E2E8F0] dark:#475569" />
            </div>
            <p className="text-sm font-semibold text-[#1E293B] dark:text-[#64748B]">All caught up!</p>
            <p className="text-xs text-[#475569] dark:text-[#44454F] mt-1.5">No new notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.read)}
                className={`p-4 hover:bg-[#F7FAFC] dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group ${!notification.read ? 'bg-[#F1F5F9]/30 dark:bg-[#F2DD50]/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg shrink-0 transition-all duration-200 ${!notification.read ? 'bg-white dark:bg-[#1C1D24] shadow-md' : 'bg-[#F7FAFC] dark:bg-[#1C1D24]/50'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={`text-sm font-semibold leading-tight ${!notification.read ? 'text-[#1E293B] dark:text-[#EAE5DF]' : 'text-[#1E293B]/70 dark:text-[#64748B]'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-[#475569] dark:#475569 whitespace-nowrap ml-2">
                        {formatDate(notification.date, language).split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] dark:text-[#44454F] line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F2DD50] shrink-0 mt-1.5 shadow-sm"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="p-4 border-t border-[#E2E8F0] dark:border-[#1C1D24] bg-[#F7FAFC]/50 dark:bg-[#15161C]">
        <button
          onClick={() => { navigate('/notifications'); onClose(); }}
          className="w-full py-2.5 px-4 text-sm text-center font-semibold text-white bg-[#F2DD50] hover:bg-[#8E7356] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};
