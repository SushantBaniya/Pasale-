import React from 'react';
import * as Fi from 'react-icons/fi';
import { IconType } from 'react-icons';

interface DynamicIconProps {
  name: string;
  className?: string;
}

const iconMap: Record<string, IconType> = {
  'home': Fi.FiHome,
  'zap': Fi.FiZap,
  'users': Fi.FiUsers,
  'package': Fi.FiPackage,
  'truck': Fi.FiTruck,
  'coffee': Fi.FiCoffee,
  'paperclip': Fi.FiPaperclip,
  'smartphone': Fi.FiSmartphone,
  'megaphone': Fi.FiSpeaker,
  'tool': Fi.FiTool,
  'shield': Fi.FiShield,
  'clipboard': Fi.FiClipboard,
  'edit': Fi.FiEdit,
  'dollar-sign': Fi.FiDollarSign,
  'settings': Fi.FiSettings,
  'trending-up': Fi.FiTrendingUp,
  'trending-down': Fi.FiTrendingDown,
  'bar-chart': Fi.FiBarChart,
  'credit-card': Fi.FiCreditCard,
  'activity': Fi.FiActivity,
  'repeat': Fi.FiRepeat,
  'rotate-ccw': Fi.FiRotateCcw,
  'rotate-cw': Fi.FiRotateCw,
  'check-circle': Fi.FiCheckCircle,
  'x-circle': Fi.FiXCircle,
  'clock': Fi.FiClock,
  'file': Fi.FiFile,
  'alert-circle': Fi.FiAlertCircle,
  'shopping-cart': Fi.FiShoppingCart,
  'landmark': Fi.FiBriefcase, // Mapping bank to briefcase or similar
  'credit': Fi.FiCreditCard,
  'file-text': Fi.FiFileText,
  'briefcase': Fi.FiBriefcase,
  'archive': Fi.FiArchive,
  'layers': Fi.FiLayers,
  'tag': Fi.FiTag,
  'smile': Fi.FiSmile,
  'pie-chart': Fi.FiPieChart,
};

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className }) => {
  const IconComponent = iconMap[name] || Fi.FiHelpCircle;
  return <IconComponent className={className} />;
};
