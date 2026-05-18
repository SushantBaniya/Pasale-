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
      <Card className="h-full flex flex-col bg-linear-to-br from-[#10B981]/5 to-[#10B981]/10 dark:from-green-900/20 dark:to-blue-900/20 border border-[#10B981]/20 dark:border-green-800/30">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 dark:bg-green-800/50 flex items-center justify-center mb-4">
            <FiPackage className="w-7 h-7 text-[#10B981] dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-[#10B981] dark:text-green-300 mb-2">All Stocked Up!</h3>
          <p className="text-sm text-[#10B981]/80 dark:text-green-400">No low stock items at the moment</p>
        </div>
      </Card>
    );
  }

  const criticalCount = items.filter(item => item.current === 0).length;
  const warningCount = items.filter(item => item.current > 0).length;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#F2DD50] to-[#6B5340] p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-base">Low Stock Alert</h3>
              <p className="text-white/80 text-xs">Requires attention</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
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
                  ? 'bg-[#F1F5F9] dark:bg-red-900/20 border-[#F2DD50]/30 dark:border-red-800/50 hover:border-[#F2DD50]/50' 
                  : 'bg-[#F1F5F9] dark:bg-orange-900/20 border-[#F2DD50]/20 dark:border-orange-800/50 hover:border-[#F2DD50]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-[#1E293B] dark:text-[#EAE5DF] truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isCritical 
                        ? 'bg-[#F2DD50]/15 dark:bg-red-800/50 text-[#F2DD50] dark:text-red-300' 
                        : 'bg-[#F2DD50]/10 dark:bg-orange-800/50 text-[#F2DD50] dark:text-orange-300'
                    }`}>
                      {isCritical ? <FiTrendingDown className="w-2.5 h-2.5" /> : <FiAlertTriangle className="w-2.5 h-2.5" />}
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-lg font-medium ${
                    isCritical 
                      ? 'text-[#F2DD50] dark:text-red-400' 
                      : 'text-[#F2DD50] dark:text-orange-400'
                  }`}>
                    {item.current}
                  </span>
                  <span className="text-xs text-[#475569] dark:text-[#44454F]">/{item.minStock}</span>
                </div>
              </div>
              
              <div className="h-1.5 bg-[#FFFFFF] dark:bg-[#1C1D24] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isCritical ? 'bg-[#F2DD50]' : 'bg-[#F2DD50]/70'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer action */}
      <div className="p-3 border-t border-[#E2E8F0] dark:border-[#1C1D24] bg-[#F7FAFC] dark:bg-[#15161C]/50">
        <button
          onClick={() => navigate('/inventory')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F2DD50] hover:bg-[#8E7356] text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <FiPackage className="w-4 h-4" />
          Manage Inventory
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};
