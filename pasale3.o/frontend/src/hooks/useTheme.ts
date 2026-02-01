import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    // Apply theme immediately
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Initialize theme on mount
  useEffect(() => {
    const root = window.document.documentElement;
    const storedTheme = localStorage.getItem('pasale-theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      if (storedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  return { theme, setTheme, toggleTheme };
};

