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

  const iconBgColors: Record<string, string> = {
    green: 'bg-[#3A7A5A]/10 dark:bg-[#4CAF82]/20',
    emerald: 'bg-[#3A7A5A]/10 dark:bg-[#4CAF82]/20',
    blue: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
    sky: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
    red: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
    rose: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
    purple: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
    orange: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
    amber: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
    teal: 'bg-[#3A7A5A]/10 dark:bg-[#4CAF82]/20',
    indigo: 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20',
  };

  const iconColors: Record<string, string> = {
    green: 'text-[#3A7A5A] dark:text-[#4CAF82]',
    emerald: 'text-[#3A7A5A] dark:text-[#4CAF82]',
    blue: 'text-[#A3876A] dark:text-[#A3876A]',
    sky: 'text-[#A3876A] dark:text-[#A3876A]',
    red: 'text-[#A3876A] dark:text-[#A3876A]',
    rose: 'text-[#A3876A] dark:text-[#A3876A]',
    purple: 'text-[#A3876A] dark:text-[#A3876A]',
    orange: 'text-[#A3876A] dark:text-[#A3876A]',
    amber: 'text-[#A3876A] dark:text-[#A3876A]',
    teal: 'text-[#3A7A5A] dark:text-[#4CAF82]',
    indigo: 'text-[#A3876A] dark:text-[#A3876A]',
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
      className={`group relative p-4 sm:p-5 lg:p-6 border border-[#DDD7CC] dark:border-[#1C1D24]/50 
        bg-[#E3DDD2] dark:bg-[#15161C] 
        rounded-2xl shadow-xs hover:shadow-lg
        transform hover:-translate-y-1 hover:scale-[1.01]
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Decorative left accent edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#A3876A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Decorative top right glow */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-[#A3876A]/30" />

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#E3DDD2]/50 dark:to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex flex-col h-full justify-between">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-[#6B7280] dark:text-[#44454F] tracking-wide mt-1">
            {title}
          </p>
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${iconBgColors[borderColor]} flex items-center justify-center ${iconColors[borderColor]} ring-4 ring-[#E3DDD2] dark:ring-[#1C1D24] shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
            {icon || getDefaultIcon()}
          </div>
        </div>

        {/* Value and Arrow */}
        <div className="flex items-end justify-between mb-1">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1C20] dark:text-[#EAE5DF] tracking-tight transition-transform duration-300 group-hover:translate-x-1">
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
            <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium ${changeType === 'positive' ? 'text-[#3A7A5A] dark:text-[#4CAF82]' : 'text-[#A3876A] dark:text-[#A3876A]'}`}>
              <span className={`inline-flex items-center justify-center p-1 rounded-full ${changeType === 'positive' ? 'bg-[#3A7A5A]/10 dark:bg-[#4CAF82]/20 text-[#3A7A5A]' : 'bg-[#A3876A]/10 dark:bg-[#A3876A]/20 text-[#A3876A]'}`}>
                {changeType === 'positive' ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
              </span>
              <span>{n(Math.abs(change))}% {changeType === 'positive' ? 'increase' : 'decrease'}</span>
            </div>
          ) : (
            <div className="h-5"></div>
          )}

          {subtitle && (
            <p className="text-[11px] sm:text-xs text-[#6B7280] dark:#6B7280 font-medium truncate ml-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
