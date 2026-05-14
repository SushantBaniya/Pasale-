import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#FAF7F3] dark:bg-[#111111] z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-[#D4623A] flex items-center justify-center shadow-lg transform animate-pulse">
            <span className="text-2xl font-bold text-white tracking-wide">P</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-semibold text-[#3D2B1A] dark:text-[#E0E0E0] tracking-wide">
            Pasale
          </p>
          <p className="text-sm text-[#8A7060] dark:text-[#555555]">
            Loading your business workspace...
          </p>
        </div>
        <div className="w-10 h-10 border-4 border-[#EDE5DA] dark:border-[#222222] border-t-[#D4623A] dark:border-t-[#D4623A] rounded-full animate-spin" />
      </div>
    </div>
  );
};
