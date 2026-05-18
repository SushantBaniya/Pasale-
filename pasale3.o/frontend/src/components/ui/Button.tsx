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
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#0D0E12] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]';

  const variantClasses = {
    primary: 'bg-[#F2DD50] text-white hover:bg-[#8E7356] focus:ring-[#F2DD50] shadow-sm hover:shadow-md',
    secondary: 'bg-[#1E293B] text-[#101B55] hover:bg-[#2A1D12] dark:bg-[#15161C] dark:text-[#999999] dark:border dark:border-[#2A2B36] dark:hover:bg-[#1C1D24] dark:hover:text-[#EAE5DF] focus:ring-[#1E293B] dark:focus:ring-[#2A2B36] shadow-sm hover:shadow-md',
    outline: 'border-2 border-[#F2DD50] text-[#F2DD50] dark:text-[#F2DD50] hover:bg-[#F1F5F9] dark:hover:bg-[#F2DD50]/10 focus:ring-[#F2DD50]',
    ghost: 'text-[#1E293B] dark:text-[#64748B] hover:bg-[#FFFFFF] dark:hover:bg-[#15161C] focus:ring-[#F2DD50]',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm hover:shadow-md',
    white: 'bg-white text-[#1E293B] dark:bg-[#15161C] dark:text-[#EAE5DF] dark:border dark:border-[#2A2B36] hover:bg-[#F7FAFC] dark:hover:bg-[#1C1D24] focus:ring-white dark:focus:ring-[#2A2B36] shadow-lg hover:shadow-xl border-0',
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
