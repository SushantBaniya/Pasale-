import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F4F0EA] dark:bg-[#0D0E12] z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-[#A3876A] flex items-center justify-center shadow-lg transform animate-pulse">
            <span className="text-2xl font-bold text-white tracking-wide">P</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-semibold text-[#1A1C20] dark:text-[#EAE5DF] tracking-wide">
            Pasale
          </p>
          <p className="text-sm text-[#6B7280] dark:text-[#44454F]">
            Loading your business workspace...
          </p>
        </div>
        <div className="w-10 h-10 border-4 border-[#E3DDD2] dark:border-[#1C1D24] border-t-[#A3876A] dark:border-t-[#A3876A] rounded-full animate-spin" />
      </div>
    </div>
  );
};
