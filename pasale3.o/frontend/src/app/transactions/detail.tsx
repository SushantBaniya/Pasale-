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
          <h1 className="text-3xl font-bold #1E293B dark:text-[#EAE5DF]">
            Transaction Details
          </h1>
          <p className="#475569 dark:text-[#44454F]">
            {formatDate(transaction.date, language)}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="#475569 dark:text-[#44454F]">Type</p>
            <p className="font-semibold #1E293B dark:text-[#EAE5DF] capitalize">{transaction.type}</p>
          </div>
          <div>
            <p className="#475569 dark:text-[#44454F]">Amount</p>
            <p className="font-semibold #1E293B dark:text-[#EAE5DF]">
              {formatCurrency(transaction.amount, language)}
            </p>
          </div>
          <div>
            <p className="#475569 dark:text-[#44454F]">Description</p>
            <p className="font-semibold #1E293B dark:text-[#EAE5DF]">{transaction.description}</p>
          </div>
          <div>
            <p className="#475569 dark:text-[#44454F]">Party</p>
            <p className="font-semibold #1E293B dark:text-[#EAE5DF]">
              {transaction.partyName || 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {transaction.items && transaction.items.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold #1E293B dark:text-[#EAE5DF] mb-4">
            Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b #E2E8F0 dark:border-[#1C1D24]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#64748B]">
                    Item
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#64748B]">
                    Qty
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#64748B]">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#64748B]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item) => (
                  <tr key={item.id} className="border-b #E2E8F0 dark:border-[#1C1D24]">
                    <td className="py-3 px-4 text-sm #1E293B dark:text-[#EAE5DF]">{item.name}</td>
                    <td className="py-3 px-4 text-sm #1E293B dark:text-[#EAE5DF]">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm #1E293B dark:text-[#EAE5DF]">
                      {formatCurrency(item.price, language)}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold #1E293B dark:text-[#EAE5DF]">
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

