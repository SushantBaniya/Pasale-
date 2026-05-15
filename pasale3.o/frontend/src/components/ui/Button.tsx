import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  fullWidth = false,
  isLoading = false,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]';

  const variantClasses = {
    primary: 'bg-[#D4623A] text-white hover:bg-[#B8502E] focus:ring-[#D4623A] shadow-sm hover:shadow-md',
    secondary: 'bg-[#3D2B1A] text-[#F5EDE3] hover:bg-[#2A1D12] dark:bg-[#1A1A1A] dark:text-[#999999] dark:border dark:border-[#333333] dark:hover:bg-[#222222] dark:hover:text-[#E0E0E0] focus:ring-[#3D2B1A] dark:focus:ring-[#333333] shadow-sm hover:shadow-md',
    outline: 'border-2 border-[#D4623A] text-[#D4623A] dark:text-[#D4623A] hover:bg-[#FDF1EC] dark:hover:bg-[#D4623A]/10 focus:ring-[#D4623A]',
    ghost: 'text-[#3D2B1A] dark:text-[#CCCCCC] hover:bg-[#EDE5DA] dark:hover:bg-[#1A1A1A] focus:ring-[#D4623A]',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm hover:shadow-md',
    white: 'bg-white text-[#3D2B1A] dark:bg-[#1A1A1A] dark:text-[#E0E0E0] dark:border dark:border-[#333333] hover:bg-[#FAF7F3] dark:hover:bg-[#222222] focus:ring-white dark:focus:ring-[#333333] shadow-lg hover:shadow-xl border-0',
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    icon: 'p-2',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
