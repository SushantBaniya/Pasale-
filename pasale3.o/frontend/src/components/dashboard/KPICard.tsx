import React from 'react';
import { Card } from '../ui/Card';
import { useTranslation } from '../../utils/i18n';
import { FiTrendingUp, FiTrendingDown, FiCreditCard, FiArrowRight } from 'react-icons/fi';
import { NepaliRupeeIcon } from '../ui/NepaliRupeeIcon';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative';
  borderColor?: 'green' | 'emerald' | 'blue' | 'sky' | 'red' | 'rose' | 'purple' | 'orange' | 'amber' | 'teal' | 'indigo';
  onClick?: () => void;
  icon?: React.ReactNode;
  subtitle?: string;
  isCurrency?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType,
  borderColor = 'blue',
  onClick,
  icon,
  subtitle,
  isCurrency = true
}) => {
  const { c, n, language } = useTranslation();

  const borderColors = {
    green: 'border-l-emerald-500 hover:border-l-emerald-600',
    emerald: 'border-l-emerald-500 hover:border-l-emerald-600',
    blue: 'border-l-blue-500 hover:border-l-blue-600',
    sky: 'border-l-sky-500 hover:border-l-sky-600',
    red: 'border-l-red-500 hover:border-l-red-600',
    rose: 'border-l-rose-500 hover:border-l-rose-600',
    purple: 'border-l-purple-500 hover:border-l-purple-600',
    orange: 'border-l-orange-500 hover:border-l-orange-600',
    amber: 'border-l-amber-500 hover:border-l-amber-600',
    teal: 'border-l-teal-500 hover:border-l-teal-600',
    indigo: 'border-l-indigo-500 hover:border-l-indigo-600',
  };

  const iconBgColors = {
    green: 'bg-emerald-50 dark:bg-emerald-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30',
    blue: 'bg-blue-50 dark:bg-blue-900/30',
    sky: 'bg-sky-50 dark:bg-sky-900/30',
    red: 'bg-red-50 dark:bg-red-900/30',
    rose: 'bg-rose-50 dark:bg-rose-900/30',
    purple: 'bg-purple-50 dark:bg-purple-900/30',
    orange: 'bg-orange-50 dark:bg-orange-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/30',
    teal: 'bg-teal-50 dark:bg-teal-900/30',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30',
  };

  const iconColors = {
    green: 'text-emerald-600 dark:text-emerald-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    sky: 'text-sky-600 dark:text-sky-400',
    red: 'text-red-600 dark:text-red-400',
    rose: 'text-rose-600 dark:text-rose-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    amber: 'text-amber-600 dark:text-amber-400',
    teal: 'text-teal-600 dark:text-teal-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return isCurrency ? c(val) : n(val);
    }
    return val;
  };

  const getDefaultIcon = () => {
    switch (borderColor) {
      case 'green': return <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'red': return <FiTrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'blue': return <FiCreditCard className="w-4 h-4 sm:w-5 sm:h-5" />;
      default: return <NepaliRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  return (
    <Card
      onClick={onClick}
      noPadding
      className={`group relative p-3 sm:p-4 lg:p-5 border-l-4 ${borderColors[borderColor]} cursor-pointer
        bg-white dark:bg-gray-800 
        shadow-sm hover:shadow-xl 
        transform hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:scale-[1.01] sm:hover:scale-[1.02]
        transition-all duration-300 ease-out
        border border-gray-100 dark:border-gray-700
        overflow-hidden`}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent to-gray-50/50 dark:to-gray-700/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex flex-col">
        {/* Header with icon and title */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${iconBgColors[borderColor]} flex items-center justify-center ${iconColors[borderColor]} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
              {icon || getDefaultIcon()}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
              {title}
            </p>
          </div>
          {onClick && (
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shrink-0">
              <FiArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Value */}
        <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 transition-transform duration-300 group-hover:scale-105 origin-left truncate">
          {formatValue(value)}
        </p>

        {/* Change indicator */}
        {change !== undefined && (
          <div className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold ${changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
            <span className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs ${changeType === 'positive' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
              {changeType === 'positive' ? '↑' : '↓'}
            </span>
            <span className="truncate">{n(Math.abs(change))}% from last period</span>
          </div>
        )}

        {/* Optional subtitle */}
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Click indicator on hover - hidden on mobile */}
      {onClick && (
        <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
          Click to view
        </div>
      )}
    </Card>
  );
};
