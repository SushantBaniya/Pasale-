import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  fullWidth = true,
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 text-[#3D2B1A] dark:text-[#CCCCCC]">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg
          bg-white dark:bg-[#1A1A1A]
          text-sm sm:text-base
          text-[#3D2B1A] dark:text-[#E0E0E0]
          border-[#E5D8CC] dark:border-[#333333]
          focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent
          placeholder-[#8A7060] dark:placeholder-gray-500
          transition-colors duration-200
          ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
