import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  dynamic?: boolean; // If true, shows greeting instead of title
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  dynamic = false,
}) => {
  const { userProfile } = useAuthStore();
  const { businessName: storeBizName } = useBusinessStore();
  const [userName, setUserName] = useState<string>('User');

  // Fetch real user name from profile/API on mount
  useEffect(() => {
    const fetchUserName = () => {
      // Check localStorage for user data first
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const profile = parsed?.state?.userProfile;
          if (profile?.businessName) {
            setUserName(profile.businessName);
            return;
          }
          if (profile?.name && profile.name !== 'Demo User Admin') {
            setUserName(profile.name);
            return;
          }
          if (profile?.email) {
            setUserName(profile.email.split('@')[0]);
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }

      // Fallback to store values
      if (storeBizName) {
        setUserName(storeBizName);
      } else if (userProfile.businessName) {
        setUserName(userProfile.businessName);
      } else if (userProfile.name && userProfile.name !== 'Demo User Admin') {
        setUserName(userProfile.name);
      } else if (userProfile.email) {
        setUserName(userProfile.email.split('@')[0]);
      } else {
        setUserName('User');
      }
    };

    fetchUserName();
  }, [userProfile, storeBizName]);

  // Get greeting based on time of day
  const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayTitle = dynamic ? `${getTimeGreeting()}, ${userName} 👋` : title;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {icon && <div className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {displayTitle}
              </h1>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
