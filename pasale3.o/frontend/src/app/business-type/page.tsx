import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { FiUser, FiBriefcase } from 'react-icons/fi';

export default function BusinessTypePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUserType, logout } = useAuthStore();
  const [selected, setSelected] = useState<'personal' | 'business' | null>(null);

  const handleSelect = (type: 'personal' | 'business') => {
    setSelected(type);
  };

  const handleContinue = () => {
    if (!selected) return;
    setUserType(selected);
    if (selected === 'personal') {
      navigate('/personal-verification');
    } else {
      navigate('/business-verification');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-3 sm:p-4">
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();
            navigate('/welcome');
          }}
        >
          ← <span className="hidden sm:inline">{t('common.back')}</span>
        </Button>
      </div>

      <div className="w-full max-w-4xl pt-12 sm:pt-0">
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 lg:mb-12 text-gray-900 dark:text-gray-100 px-2">
          {t('userType.title')}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card
            className={`p-4 sm:p-6 lg:p-8 cursor-pointer transition-all ${selected === 'personal'
              ? 'ring-2 sm:ring-4 ring-blue-500 scale-[1.02] sm:scale-105 bg-blue-50 dark:bg-blue-900/20'
              : 'hover:scale-[1.02]'
              }`}
            onClick={() => handleSelect('personal')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 mb-3 sm:mb-4 lg:mb-6">
                <FiUser className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-gray-900 dark:text-gray-100">
                {t('userType.personal')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('userType.personalDesc')}
              </p>
            </div>
          </Card>

          <Card
            className={`p-4 sm:p-6 lg:p-8 cursor-pointer transition-all ${selected === 'business'
              ? 'ring-2 sm:ring-4 ring-blue-500 scale-[1.02] sm:scale-105 bg-blue-50 dark:bg-blue-900/20'
              : 'hover:scale-[1.02]'
              }`}
            onClick={() => handleSelect('business')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-purple-100 dark:bg-purple-900/40 mb-3 sm:mb-4 lg:mb-6">
                <FiBriefcase className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-gray-900 dark:text-gray-100">
                {t('userType.business')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('userType.businessDesc')}
              </p>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selected}
            className="min-w-150px sm:min-w-200px"
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}

