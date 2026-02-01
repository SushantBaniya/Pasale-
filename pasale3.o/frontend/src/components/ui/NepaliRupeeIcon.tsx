import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface NepaliRupeeIconProps {
  className?: string;
}

/**
 * Nepali Rupee (रु) icon component to replace dollar sign icons
 * This displays the Nepali Rupee symbol as a styled text element
 */
export const NepaliRupeeIcon: React.FC<NepaliRupeeIconProps> = ({ className = '' }) => {
  const { general } = useSettingsStore();
  const currencySymbols: Record<string, string> = {
    'NPR': 'रु',
    'INR': '₹',
    'USD': '$'
  };

  const symbol = currencySymbols[general.currency] || 'रु';

  return (
    <span
      className={`inline-flex items-center justify-center font-bold ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {symbol}
    </span>
  );
};

export default NepaliRupeeIcon;
