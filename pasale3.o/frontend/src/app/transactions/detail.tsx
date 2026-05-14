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
          <h1 className="text-3xl font-bold #3D2B1A dark:text-[#E0E0E0]">
            Transaction Details
          </h1>
          <p className="#8A7060 dark:text-[#555555]">
            {formatDate(transaction.date, language)}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="#8A7060 dark:text-[#555555]">Type</p>
            <p className="font-semibold #3D2B1A dark:text-[#E0E0E0] capitalize">{transaction.type}</p>
          </div>
          <div>
            <p className="#8A7060 dark:text-[#555555]">Amount</p>
            <p className="font-semibold #3D2B1A dark:text-[#E0E0E0]">
              {formatCurrency(transaction.amount, language)}
            </p>
          </div>
          <div>
            <p className="#8A7060 dark:text-[#555555]">Description</p>
            <p className="font-semibold #3D2B1A dark:text-[#E0E0E0]">{transaction.description}</p>
          </div>
          <div>
            <p className="#8A7060 dark:text-[#555555]">Party</p>
            <p className="font-semibold #3D2B1A dark:text-[#E0E0E0]">
              {transaction.partyName || 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {transaction.items && transaction.items.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold #3D2B1A dark:text-[#E0E0E0] mb-4">
            Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b #E5D8CC dark:border-[#222222]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#CCCCCC]">
                    Item
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#CCCCCC]">
                    Qty
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#CCCCCC]">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#CCCCCC]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item) => (
                  <tr key={item.id} className="border-b #E5D8CC dark:border-[#222222]">
                    <td className="py-3 px-4 text-sm #3D2B1A dark:text-[#E0E0E0]">{item.name}</td>
                    <td className="py-3 px-4 text-sm #3D2B1A dark:text-[#E0E0E0]">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm #3D2B1A dark:text-[#E0E0E0]">
                      {formatCurrency(item.price, language)}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold #3D2B1A dark:text-[#E0E0E0]">
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

