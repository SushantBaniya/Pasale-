import React from 'react';
import { useLanguageStore } from '../../store/languageStore';
import { FiGlobe } from 'react-icons/fi';
import { Button } from '../ui/Button';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'np' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      aria-label="Switch language"
    >
      <FiGlobe className="w-4 h-4" />
      <span className="uppercase">{language}</span>
    </Button>
  );
};

