import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, noPadding = false, id }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      id={id}
      className={`
        bg-white/80 dark:bg-gray-800/80
        backdrop-blur-sm
        rounded-2xl sm:rounded-3xl
        shadow-sm hover:shadow-2xl hover:shadow-blue-500/10
        border border-gray-100 dark:border-gray-700/50
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${onClick ? 'cursor-pointer active:scale-[0.98] hover:-translate-y-1' : ''}
        ${noPadding ? '' : 'p-4 sm:p-6 lg:p-8'}
        ${className}
      `}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};

