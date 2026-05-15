import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Card } from '../../components/ui/Card';
import { formatDate } from '../../utils/nepaliDate';
import { useLanguageStore } from '../../store/languageStore';
import { useTranslation } from '../../utils/i18n';
import { FiInfo, FiAlertCircle, FiCheckCircle, FiXCircle, FiX, FiFilter, FiClock, FiChevronRight, FiBell } from 'react-icons/fi';
import { Button } from '../../components/ui/Button';

export default function NotificationsPage() {
  const { t, n } = useTranslation();
  const { notifications, markNotificationAsRead, dismissNotification } = useDataStore();
  const { language } = useLanguageStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts' | 'payments'>('all');

  const getIcon = (type: string) => {
    const iconClass = "w-5 h-5 sm:w-6 sm:h-6";
    switch (type) {
      case 'success':
        return <FiCheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning':
        return <FiAlertCircle className={`${iconClass} text-yellow-500`} />;
      case 'error':
        return <FiXCircle className={`${iconClass} text-red-500`} />;
      default:
        return <FiInfo className={`${iconClass} text-[#A3876A]`} />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'payments') return n.title.toLowerCase().includes('payment') || n.message.toLowerCase().includes('payment');
    if (filter === 'alerts') return n.type === 'warning' || n.type === 'error';
    return true;
  });

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread (${notifications.filter(n => !n.read).length})` },
    { id: 'payments', label: 'Payments' },
    { id: 'alerts', label: 'Alerts' },
  ];

  return (
    <div className="min-h-screen #F4F0EA dark:bg-[#0D0E12] pt-4 pb-6 sm:pb-8">
      <div className="max-w-1600px mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pb-4 mb-4 sm:mb-6">
          <div className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#15161C] border #DDD7CC dark:border-[#1C1D24] shadow-sm hover:shadow-md transition-all duration-300 cursor-default flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shadow-sm border border-amber-100 dark:border-amber-800/30 group-hover:scale-110 transition-transform duration-300">
              <FiBell className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold #1A1C20 dark:text-[#EAE5DF] flex items-center gap-2">
                {t('notifications.title')}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  {n(notifications.filter(n => !n.read).length)} {t('notifications.unread') || 'Unread'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm #6B7280 dark:text-[#44454F] mt-0.5">
                {t('notifications.description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => notifications.forEach(n => !n.read && markNotificationAsRead(n.id))}>
              <span className="hidden sm:inline">Mark all as read</span>
              <span className="sm:hidden">Mark read</span>
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`
                whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shrink-0
                ${filter === tab.id
                  ? 'bg-[#A3876A] text-white shadow-md'
                  : 'bg-white dark:bg-[#15161C] #6B7280 dark:text-[#C8C3BC] hover:#F4F0EA dark:hover:bg-gray-700 border #DDD7CC dark:border-[#1C1D24]'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <Card className="py-12 sm:py-20 text-center flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-[#1C1D24]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 #F4F0EA dark:bg-[#1C1D24]/50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <FiFilter className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:#6B7280" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold #1A1C20 dark:text-[#EAE5DF] mb-1">No notifications found</h3>
            <p className="text-sm #6B7280 dark:text-[#44454F] mb-3 sm:mb-4 px-4">We couldn't find any notifications matching your current filter.</p>
            {filter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                className={`
                  group relative overflow-hidden p-3 sm:p-5 transition-all duration-200 cursor-pointer
                  ${!notification.read
                    ? 'border-[#A3876A]/30 dark:border-blue-900 shadow-sm'
                    : '#F4F0EA/50 dark:bg-[#15161C]/30 #DDD7CC dark:border-[#1C1D24]/50 opacity-90'}
                   hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/50
                `}
              >
                {!notification.read && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#A3876A] rounded-bl-lg"></div>
                )}

                <div className="flex gap-3 sm:gap-5">
                  <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0
                      ${!notification.read ? 'bg-[#F5F0E6] dark:bg-[#A3876A]/15' : '#E3DDD2 dark:bg-[#1C1D24]/30'}
                  `}>
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`text-sm sm:text-base font-semibold mb-0.5 sm:mb-1 truncate ${!notification.read ? '#1A1C20 dark:text-[#EAE5DF]' : 'text-gray-700 dark:text-[#C8C3BC]'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs #6B7280 dark:text-[#44454F] mb-1.5 sm:mb-2">
                          <FiClock className="w-3 h-3" />
                          <span>{formatDate(notification.date, language)}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0"
                      >
                        <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    <p className="#6B7280 dark:text-[#44454F] text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
