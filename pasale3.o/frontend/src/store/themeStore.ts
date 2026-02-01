import { create } from 'zustand';

// Only Dark and Light modes supported - Dark is the default
export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('pasale-theme');
  // Only allow 'light' or 'dark', default to 'dark'
  if (stored === 'light') return 'light';
  return 'dark';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pasale-theme', theme);
      // Update document class for theme
      document.documentElement.classList.remove('light', 'dark');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      // Simple toggle between dark and light
      const newTheme: Theme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-theme', newTheme);
        document.documentElement.classList.remove('light', 'dark');
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      return { theme: newTheme };
    });
  },
}));

