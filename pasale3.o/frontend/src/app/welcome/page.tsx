import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { FiBarChart2, FiPackage, FiCreditCard, FiTrendingUp, FiShield, FiUsers, FiArrowRight, FiLogIn } from 'react-icons/fi';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, resetOnboarding } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center #FAF7F3 dark:bg-[#111111] p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-40 sm:w-56 lg:w-72 h-40 sm:h-56 lg:h-72 bg-[#FDF1EC]/50 dark:bg-[#D4623A]/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-52 sm:w-72 lg:w-96 h-52 sm:h-72 lg:h-96 bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-3xl delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-40 sm:w-52 lg:w-64 h-40 sm:h-52 lg:h-64 bg-pink-100/30 dark:bg-pink-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className={`relative z-10 text-center max-w-5xl w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Logo/Brand */}
        <div className="mb-3 sm:mb-4">
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-[#FDF1EC] dark:bg-[#D4623A]/20 text-[#D4623A] dark:text-[#D4623A] rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            Made for Nepali Businesses
          </span>
        </div>

        {/* Main heading */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-block transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-3 sm:mb-4 #3D2B1A dark:text-[#E0E0E0] drop-shadow-sm">
              {t('welcome.title')}
            </h1>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl #8A7060 dark:text-[#CCCCCC] mt-4 sm:mt-6 font-medium max-w-2xl mx-auto px-2">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-8 sm:mt-12 mb-10 sm:mb-16 px-4 sm:px-0">
          <Button
            size="sm"
            onClick={handleGetStarted}
            className="w-full sm:w-auto min-w-0 sm:min-w-56 h-12 sm:h-14 text-base sm:text-lg shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all bg-[#D4623A] hover:bg-[#B8502E] text-white flex items-center justify-center gap-2"
          >
            {t('welcome.signup')}
            <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLogin}
            className="w-full sm:w-auto min-w-0 sm:min-w-56 h-12 sm:h-14 text-base sm:text-lg border-2 border-gray-300 dark:border-[#333333] hover:border-[#D4623A] dark:hover:border-[#D4623A] transform hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <FiLogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('welcome.login')}
          </Button>
        </div>

        {/* Feature cards */}
        <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
          <div className="group relative p-5 sm:p-6 lg:p-8 bg-white dark:bg-[#1A1A1A] rounded-xl sm:rounded-2xl border #E5D8CC dark:border-[#222222] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-linear-to-br from-[#D4623A] to-[#B8502E] rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                <FiBarChart2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 #3D2B1A dark:text-[#E0E0E0]">Real-time Analytics</h3>
              <p className="text-sm sm:text-base #8A7060 dark:text-[#555555] leading-relaxed">Track sales, expenses, and performance metrics with advanced analytics</p>
            </div>
          </div>

          <div className="group relative p-5 sm:p-6 lg:p-8 bg-white dark:bg-[#1A1A1A] rounded-xl sm:rounded-2xl border #E5D8CC dark:border-[#222222] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <FiPackage className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 #3D2B1A dark:text-[#E0E0E0]">Smart Inventory</h3>
              <p className="text-sm sm:text-base #8A7060 dark:text-[#555555] leading-relaxed">Manage products, track stock levels, and get automated alerts</p>
            </div>
          </div>

          <div className="group relative p-5 sm:p-6 lg:p-8 bg-white dark:bg-[#1A1A1A] rounded-xl sm:rounded-2xl border #E5D8CC dark:border-[#222222] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-linear-to-br from-pink-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-pink-500/30">
                <FiCreditCard className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 #3D2B1A dark:text-[#E0E0E0]">Professional Billing</h3>
              <p className="text-sm sm:text-base #8A7060 dark:text-[#555555] leading-relaxed">Create invoices, manage payments, and handle billing seamlessly</p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-10 sm:mt-16 flex flex-wrap justify-center gap-3 sm:gap-6 #8A7060 dark:text-[#555555] px-2">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-[#1A1A1A] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border #E5D8CC dark:border-[#222222]">
            <FiShield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <span className="font-medium text-xs sm:text-sm">Secure & Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-[#1A1A1A] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border #E5D8CC dark:border-[#222222]">
            <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4623A]" />
            <span className="font-medium text-xs sm:text-sm">Grow Your Business</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-[#1A1A1A] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border #E5D8CC dark:border-[#222222]">
            <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            <span className="font-medium text-xs sm:text-sm">10,000+ Users</span>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-8 sm:mt-12 text-xs sm:text-sm text-gray-400 dark:#8A7060 px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
