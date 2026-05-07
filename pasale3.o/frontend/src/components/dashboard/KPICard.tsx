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
    green: 'border-l-blue-500 hover:border-l-blue-600',
    emerald: 'border-l-blue-500 hover:border-l-blue-600',
    blue: 'border-l-blue-500 hover:border-l-blue-600',
    sky: 'border-l-sky-500 hover:border-l-sky-600',
    red: 'border-l-red-500 hover:border-l-red-600',
    rose: 'border-l-rose-500 hover:border-l-rose-600',
    purple: 'border-l-purple-500 hover:border-l-purple-600',
    orange: 'border-l-orange-500 hover:border-l-orange-600',
    amber: 'border-l-amber-500 hover:border-l-amber-600',
    teal: 'border-l-blue-500 hover:border-l-blue-600',
    indigo: 'border-l-indigo-500 hover:border-l-indigo-600',
  };

  const iconBgColors = {
    green: 'bg-blue-50 dark:bg-blue-900/30',
    emerald: 'bg-blue-50 dark:bg-blue-900/30',
    blue: 'bg-blue-50 dark:bg-blue-900/30',
    sky: 'bg-sky-50 dark:bg-sky-900/30',
    red: 'bg-red-50 dark:bg-red-900/30',
    rose: 'bg-rose-50 dark:bg-rose-900/30',
    purple: 'bg-purple-50 dark:bg-purple-900/30',
    orange: 'bg-orange-50 dark:bg-orange-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/30',
    teal: 'bg-blue-50 dark:bg-blue-900/30',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30',
  };

  const iconColors = {
    green: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-blue-600 dark:text-blue-400',
    blue: 'text-blue-600 dark:text-blue-400',
    sky: 'text-sky-600 dark:text-sky-400',
    red: 'text-red-600 dark:text-red-400',
    rose: 'text-rose-600 dark:text-rose-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    amber: 'text-amber-600 dark:text-amber-400',
    teal: 'text-blue-600 dark:text-blue-400',
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
      className={`group relative p-4 sm:p-5 lg:p-6 border border-gray-100 dark:border-gray-700/50 
        bg-white dark:bg-gray-800 
        rounded-2xl shadow-xs hover:shadow-lg
        transform hover:-translate-y-1 hover:scale-[1.01]
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Decorative left accent edge */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${iconBgColors[borderColor].split(' ')[0].replace('50', '400')} dark:${iconBgColors[borderColor].split(' ')[1]?.replace('30', '50').replace('900/', '500/')} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Decorative top right glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${iconBgColors[borderColor].split(' ')[0].replace('bg-', 'bg-').replace('50', '400')}`} />

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex flex-col h-full justify-between">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide mt-1">
            {title}
          </p>
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${iconBgColors[borderColor]} flex items-center justify-center ${iconColors[borderColor]} ring-4 ring-white dark:ring-gray-800 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
            {icon || getDefaultIcon()}
          </div>
        </div>

        {/* Value and Arrow */}
        <div className="flex items-end justify-between mb-1">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-transform duration-300 group-hover:translate-x-1">
            {formatValue(value)}
          </h3>
          {onClick && (
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-3 group-hover:translate-x-0 shrink-0 pb-1">
              <FiArrowRight className={`w-5 h-5 ${iconColors[borderColor]}`} />
            </div>
          )}
        </div>

        {/* Change indicator & Subtitle */}
        <div className="mt-3 flex items-center justify-between">
          {change !== undefined ? (
            <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium ${changeType === 'positive' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <span className={`inline-flex items-center justify-center p-1 rounded-full ${changeType === 'positive' ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-rose-100/50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                {changeType === 'positive' ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
              </span>
              <span>{n(Math.abs(change))}% {changeType === 'positive' ? 'increase' : 'decrease'}</span>
            </div>
          ) : (
            <div className="h-5"></div>
          )}

          {subtitle && (
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium truncate ml-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
