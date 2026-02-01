import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useLanguageStore } from '../../store/languageStore';
import { formatCurrency, formatDate } from '../../utils/nepaliDate';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FiArrowLeft } from 'react-icons/fi';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { transactions } = useDataStore();

  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/transactions')}>
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
        </Button>
        <Card className="p-6">Transaction not found.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/transactions')}>
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Transaction Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {formatDate(transaction.date, language)}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Type</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{transaction.type}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Amount</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(transaction.amount, language)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Description</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{transaction.description}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Party</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {transaction.partyName || 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {transaction.items && transaction.items.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Item
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Qty
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.price, language)}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.total, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

