import { create } from 'zustand';

type Language = 'en' | 'np';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem('pasale-language') as Language) || 'en';
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getStoredLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pasale-language', language);
    }
    set({ language });
  },
}));

