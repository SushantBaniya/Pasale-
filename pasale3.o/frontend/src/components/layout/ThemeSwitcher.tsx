import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import { FiSun, FiMoon } from 'react-icons/fi';
import { Button } from '../ui/Button';

export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2 relative overflow-hidden group"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4">
        {/* Sun icon for dark mode (click to switch to light) */}
        <FiSun 
          className={`w-4 h-4 absolute inset-0 transition-all duration-300 ease-out ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
        {/* Moon icon for light mode (click to switch to dark) */}
        <FiMoon 
          className={`w-4 h-4 absolute inset-0 transition-all duration-300 ease-out ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-0'
          }`}
        />
      </div>
    </Button>
  );
};

