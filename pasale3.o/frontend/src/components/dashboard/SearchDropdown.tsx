import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { FiUsers, FiFileText, FiTrendingDown } from 'react-icons/fi';
import { NepaliRupeeIcon } from '../ui/NepaliRupeeIcon';

interface SearchDropdownProps {
  query: string;
  onClose: () => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({ query, onClose }) => {
  const navigate = useNavigate();
  const { transactions, parties, expenses } = useDataStore();

  const lowerQuery = query.toLowerCase();

  // Search transactions
  const matchingTransactions = transactions.filter((t) =>
    t.description.toLowerCase().includes(lowerQuery) ||
    t.partyName?.toLowerCase().includes(lowerQuery) ||
    t.amount.toString().includes(query)
  ).slice(0, 5);

  // Search parties
  const matchingParties = parties.filter((p) =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.phone?.includes(query) ||
    p.email?.toLowerCase().includes(lowerQuery)
  ).slice(0, 5);

  // Search expenses
  const matchingExpenses = expenses.filter((e) =>
    e.category.toLowerCase().includes(lowerQuery) ||
    e.description.toLowerCase().includes(lowerQuery) ||
    e.amount.toString().includes(query)
  ).slice(0, 5);

  const totalResults = matchingTransactions.length + matchingParties.length + matchingExpenses.length;

  const handleClick = (path: string) => {
    navigate(path);
    onClose();
  };

  if (totalResults === 0) {
    return (
      <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          No results found for "{query}"
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      {matchingTransactions.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Transactions
          </div>
          {matchingTransactions.map((transaction) => (
            <button
              key={transaction.id}
              onClick={() => handleClick('/transactions')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <NepaliRupeeIcon className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {transaction.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Rs. {transaction.amount} • {transaction.partyName}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {matchingParties.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Parties
          </div>
          {matchingParties.map((party) => (
            <button
              key={party.id}
              onClick={() => handleClick('/parties')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <FiUsers className="w-4 h-4 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {party.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {party.type} • {party.phone}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {matchingExpenses.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Expenses
          </div>
          {matchingExpenses.map((expense) => (
            <button
              key={expense.id}
              onClick={() => handleClick('/expense-monitoring')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <FiTrendingDown className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {expense.category}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Rs. {expense.amount} • {expense.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

