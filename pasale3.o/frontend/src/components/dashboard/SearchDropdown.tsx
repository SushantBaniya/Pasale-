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

  const matchingTransactions = transactions.filter((t) =>
    t.description.toLowerCase().includes(lowerQuery) || t.partyName?.toLowerCase().includes(lowerQuery) || t.amount.toString().includes(query)
  ).slice(0, 5);

  const matchingParties = parties.filter((p) =>
    p.name.toLowerCase().includes(lowerQuery) || p.phone?.includes(query) || p.email?.toLowerCase().includes(lowerQuery)
  ).slice(0, 5);

  const matchingExpenses = expenses.filter((e) =>
    e.category.toLowerCase().includes(lowerQuery) || e.description.toLowerCase().includes(lowerQuery) || e.amount.toString().includes(query)
  ).slice(0, 5);

  const totalResults = matchingTransactions.length + matchingParties.length + matchingExpenses.length;

  const handleClick = (path: string) => { navigate(path); onClose(); };

  if (totalResults === 0) {
    return (
      <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#1C1D24] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
        <div className="p-4 text-center text-[#475569] dark:text-[#44454F]">No results found for "{query}"</div>
      </div>
    );
  }

  return (
    <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#1C1D24] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      {matchingTransactions.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-medium text-[#475569] dark:text-[#44454F] uppercase">Transactions</div>
          {matchingTransactions.map((transaction) => (
            <button key={transaction.id} onClick={() => handleClick('/transactions')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#FFFFFF] dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
              <NepaliRupeeIcon className="w-4 h-4 text-[#F2DD50] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B] dark:text-[#EAE5DF] truncate">{transaction.description}</p>
                <p className="text-xs text-[#475569] dark:text-[#44454F]">Rs. {transaction.amount}  {transaction.partyName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {matchingParties.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-medium text-[#475569] dark:text-[#44454F] uppercase">Parties</div>
          {matchingParties.map((party) => (
            <button key={party.id} onClick={() => handleClick('/parties')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#FFFFFF] dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
              <FiUsers className="w-4 h-4 text-[#10B981] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B] dark:text-[#EAE5DF] truncate">{party.name}</p>
                <p className="text-xs text-[#475569] dark:text-[#44454F]">{party.type}  {party.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {matchingExpenses.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-medium text-[#475569] dark:text-[#44454F] uppercase">Expenses</div>
          {matchingExpenses.map((expense) => (
            <button key={expense.id} onClick={() => handleClick('/expense-monitoring')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#FFFFFF] dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
              <FiTrendingDown className="w-4 h-4 text-[#F2DD50] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B] dark:text-[#EAE5DF] truncate">{expense.category}</p>
                <p className="text-xs text-[#475569] dark:text-[#44454F]">Rs. {expense.amount}  {expense.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
