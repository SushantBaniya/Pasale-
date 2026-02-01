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

  // Calculate stock percentage for progress bar
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
      <Card className="h-full flex flex-col bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/30">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-800/50 flex items-center justify-center mb-4">
            <FiPackage className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">All Stocked Up!</h3>
          <p className="text-sm text-green-600 dark:text-green-400">No low stock items at the moment</p>
        </div>
      </Card>
    );
  }

  const criticalCount = items.filter(item => item.current === 0).length;
  const warningCount = items.filter(item => item.current > 0).length;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-linear-to-r from-orange-500 to-red-500 p-4 text-white">
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
        
        {/* Quick stats */}
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
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 hover:border-red-300' 
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50 hover:border-orange-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isCritical 
                        ? 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300' 
                        : 'bg-orange-100 dark:bg-orange-800/50 text-orange-700 dark:text-orange-300'
                    }`}>
                      {isCritical ? <FiTrendingDown className="w-2.5 h-2.5" /> : <FiAlertTriangle className="w-2.5 h-2.5" />}
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-lg font-bold ${
                    isCritical 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {item.current}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">/{item.minStock}</span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isCritical 
                      ? 'bg-red-500' 
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer action */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => navigate('/inventory')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-500 to-indigo-500 text-white font-medium text-sm rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm hover:shadow-md"
        >
          <FiPackage className="w-4 h-4" />
          Manage Inventory
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};

