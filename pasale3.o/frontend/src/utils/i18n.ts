import { useLanguageStore } from '../store/languageStore';
import enTranslations from '../locales/en.json';
import npTranslations from '../locales/np.json';
import { toNepaliNumerals, formatCurrency as formatCurrencyUtil, formatNumber as formatNumberUtil, formatPercentage as formatPercentageUtil, formatShortDate as formatShortDateUtil } from './nepaliDate';

const translations = {
  en: enTranslations,
  np: npTranslations,
};

export const useTranslation = () => {
  const { language } = useLanguageStore();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    
    return value || key;
  };
  
  // Format number based on current language
  const n = (num: number | string): string => {
    const formatted = typeof num === 'number' ? num.toLocaleString('en-US') : num;
    return language === 'np' ? toNepaliNumerals(formatted) : formatted;
  };
  
  // Format currency based on current language
  const c = (amount: number): string => {
    return formatCurrencyUtil(amount, language);
  };
  
  // Format percentage based on current language
  const p = (num: number): string => {
    return formatPercentageUtil(num, language);
  };
  
  // Format date based on current language  
  const d = (dateString: string): string => {
    return formatShortDateUtil(dateString, language);
  };
  
  return { t, n, c, p, d, language };
};

