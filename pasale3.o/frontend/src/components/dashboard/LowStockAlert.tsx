import React from 'react';
import { Card } from '../ui/Card';
import { FiAlertTriangle, FiArrowRight, FiPackage, FiTrendingDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';

interface LowStockItem {
  id: string;
  name: string;
  minStock: number;
  current: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ items }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getStockPercentage = (current: number, min: number) => {
    if (current === 0) return 0;
    const percentage = (current / min) * 100;
    return Math.min(percentage, 100);
  };

  const getStockStatus = (current: number) => {
    if (current === 0) return { label: 'Out of Stock', color: 'red' };
    return { label: 'Low Stock', color: 'orange' };
  };

  if (items.length === 0) {
    return (
      <Card className="h-full flex flex-col bg-linear-to-br from-[#3A7A5A]/5 to-[#3A7A5A]/10 dark:from-green-900/20 dark:to-blue-900/20 border border-[#3A7A5A]/20 dark:border-green-800/30">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#3A7A5A]/10 dark:bg-green-800/50 flex items-center justify-center mb-4">
            <FiPackage className="w-7 h-7 text-[#3A7A5A] dark:text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-[#3A7A5A] dark:text-green-300 mb-2">All Stocked Up!</h3>
          <p className="text-sm text-[#3A7A5A]/80 dark:text-green-400">No low stock items at the moment</p>
        </div>
      </Card>
    );
  }

  const criticalCount = items.filter(item => item.current === 0).length;
  const warningCount = items.filter(item => item.current > 0).length;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#D4623A] to-[#8A3A1E] p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Low Stock Alert</h3>
              <p className="text-white/80 text-xs">Requires attention</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
              {items.length} Items
            </span>
          </div>
        </div>
        
        <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse"></span>
              <span className="text-xs font-medium">{criticalCount} Critical</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
              <span className="text-xs font-medium">{warningCount} Warning</span>
            </div>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((item) => {
          const isCritical = item.current === 0;
          const percentage = getStockPercentage(item.current, item.minStock);
          const status = getStockStatus(item.current);
          
          return (
            <div
              key={item.id}
              onClick={() => navigate('/inventory')}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                isCritical 
                  ? 'bg-[#FDF1EC] dark:bg-red-900/20 border-[#D4623A]/30 dark:border-red-800/50 hover:border-[#D4623A]/50' 
                  : 'bg-[#FDF1EC] dark:bg-orange-900/20 border-[#D4623A]/20 dark:border-orange-800/50 hover:border-[#D4623A]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[#3D2B1A] dark:text-[#E0E0E0] truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isCritical 
                        ? 'bg-[#D4623A]/15 dark:bg-red-800/50 text-[#D4623A] dark:text-red-300' 
                        : 'bg-[#D4623A]/10 dark:bg-orange-800/50 text-[#D4623A] dark:text-orange-300'
                    }`}>
                      {isCritical ? <FiTrendingDown className="w-2.5 h-2.5" /> : <FiAlertTriangle className="w-2.5 h-2.5" />}
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-lg font-bold ${
                    isCritical 
                      ? 'text-[#D4623A] dark:text-red-400' 
                      : 'text-[#D4623A] dark:text-orange-400'
                  }`}>
                    {item.current}
                  </span>
                  <span className="text-xs text-[#8A7060] dark:text-[#555555]">/{item.minStock}</span>
                </div>
              </div>
              
              <div className="h-1.5 bg-[#EDE5DA] dark:bg-[#222222] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isCritical ? 'bg-[#D4623A]' : 'bg-[#D4623A]/70'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer action */}
      <div className="p-3 border-t border-[#E5D8CC] dark:border-[#222222] bg-[#FAF7F3] dark:bg-[#1A1A1A]/50">
        <button
          onClick={() => navigate('/inventory')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D4623A] hover:bg-[#B8502E] text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <FiPackage className="w-4 h-4" />
          Manage Inventory
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};
