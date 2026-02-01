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
        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg
          bg-white dark:bg-gray-800
          text-sm sm:text-base
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder-gray-400 dark:placeholder-gray-500
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

