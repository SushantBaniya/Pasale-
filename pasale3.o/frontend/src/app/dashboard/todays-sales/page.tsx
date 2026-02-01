import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../../store/dataStore';
import { useLanguageStore } from '../../../store/languageStore';
import { formatCurrency, formatDate } from '../../../utils/nepaliDate';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FiArrowLeft } from 'react-icons/fi';

export default function TodaysSalesPage() {
  const navigate = useNavigate();
  const { transactions } = useDataStore();
  const { language } = useLanguageStore();

  const today = new Date();
  const isSameDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };

  const sales = transactions.filter((t) => t.type === 'selling' && isSameDay(t.date));
  const total = sales.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Today's Sales</h1>
          <p className="text-gray-600 dark:text-gray-400">Detailed view of all sales recorded today.</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(total, language)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Orders</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sales.length}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        {sales.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sales recorded yet today.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sales.map((sale) => (
              <div key={sale.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{sale.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {sale.partyName || 'Walk-in'} • {formatDate(sale.date, language)}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(sale.amount, language)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

