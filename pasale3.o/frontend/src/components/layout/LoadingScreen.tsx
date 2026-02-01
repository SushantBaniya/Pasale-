import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-lg transform animate-pulse">
            <span className="text-2xl font-bold text-white tracking-wide">P</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50 tracking-wide">
            Pasale
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your business workspace...
          </p>
        </div>
        <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
      </div>
    </div>
  );
};


