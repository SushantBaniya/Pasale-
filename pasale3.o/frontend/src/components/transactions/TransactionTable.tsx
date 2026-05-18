import React, { useState, useMemo } from 'react';
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiMoreVertical,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPrinter,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiRotateCcw,
  FiRotateCw,
  FiShoppingCart,
  FiPackage,
} from 'react-icons/fi';
import { TRANSACTION_TYPE_CONFIG, STATUS_CONFIG, TransactionType, PaymentStatus } from './types';

interface TransactionTableProps {
  transactions: any[];
  onView: (transaction: any) => void;
  onEdit: (transaction: any) => void;
  onDelete: (transaction: any) => void;
  onPrint: (transaction: any) => void;
  isLoading?: boolean;
  language?: string;
}

type SortField = 'date' | 'amount' | 'partyName' | 'type';
type SortOrder = 'asc' | 'desc';

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onView,
  onEdit,
  onDelete,
  onPrint,
  isLoading = false,
  language = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs. ${(amount || 0).toLocaleString()}`;
  };

  // Get type icon
  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'selling':
        return <FiShoppingCart className="w-4 h-4" />;
      case 'purchase':
        return <FiPackage className="w-4 h-4" />;
      case 'payment_in':
        return <FiArrowDownLeft className="w-4 h-4" />;
      case 'payment_out':
        return <FiArrowUpRight className="w-4 h-4" />;
      case 'expense':
        return <FiCreditCard className="w-4 h-4" />;
      case 'income':
        return <FiTrendingUp className="w-4 h-4" />;
      case 'quotation':
        return <FiFileText className="w-4 h-4" />;
      case 'sales_return':
        return <FiRotateCcw className="w-4 h-4" />;
      case 'purchase_return':
        return <FiRotateCw className="w-4 h-4" />;
      default:
        return <FiFileText className="w-4 h-4" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <FiCheckCircle className="w-3.5 h-3.5" />;
      case 'unpaid':
        return <FiXCircle className="w-3.5 h-3.5" />;
      case 'partial':
        return <FiClock className="w-3.5 h-3.5" />;
      case 'overdue':
        return <FiAlertCircle className="w-3.5 h-3.5" />;
      default:
        return <FiFileText className="w-3.5 h-3.5" />;
    }
  };

  // Map old types to new types - 'selling' is the actual type in dataStore
  const mapTransactionType = (type: string): TransactionType => {
    // Return the type as-is since dataStore uses 'selling'
    return type as TransactionType;
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.map(t => ({
      ...t,
      mappedType: mapTransactionType(t.type),
    }));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.partyName || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query) ||
        (t.transactionNumber || t.id || '').toLowerCase().includes(query) ||
        (t.category || '').toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.mappedType === typeFilter || t.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => (t.paymentStatus || 'paid') === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = (a.totalAmount || a.amount || 0) - (b.totalAmount || b.amount || 0);
          break;
        case 'partyName':
          comparison = (a.partyName || '').localeCompare(b.partyName || '');
          break;
        case 'type':
          comparison = a.mappedType.localeCompare(b.mappedType);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchQuery, typeFilter, statusFilter, sortField, sortOrder]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Sort header component
  const SortHeader: React.FC<{ field: SortField; label: string; className?: string }> = ({ field, label, className }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 hover:#1E293B dark:hover:text-gray-100 transition-colors ${className}`}
    >
      {label}
      {sortField === field && (
        sortOrder === 'asc' ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />
      )}
    </button>
  );

  // Transaction type options for filter
  const typeOptions: { value: TransactionType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'selling', label: 'Sales' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'payment_in', label: 'Payment In' },
    { value: 'payment_out', label: 'Payment Out' },
    { value: 'quotation', label: 'Quotation' },
    { value: 'sales_return', label: 'Sales Return' },
    { value: 'purchase_return', label: 'Purchase Return' },
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
  ];

  // Status options for filter
  const statusOptions: { value: PaymentStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
    { value: 'draft', label: 'Draft' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <div className="bg-white dark:bg-[#15161C] rounded-2xl shadow-lg border #E2E8F0 dark:border-[#1C1D24] overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b #E2E8F0 dark:border-[#1C1D24]">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border #E2E8F0 dark:border-[#2A2B36] #FFFFFF dark:bg-[#0D0E12] #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50] focus:border-transparent transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 font-medium ${
              showFilters || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'bg-[#F1F5F9] dark:bg-[#F2DD50]/20 border-[#F2DD50]/30 dark:border-blue-700 text-[#F2DD50] dark:text-[#F2DD50]'
                : '#FFFFFF dark:bg-[#0D0E12] #E2E8F0 dark:border-[#2A2B36] text-gray-700 dark:text-[#64748B] hover:#F8FAFC dark:hover:bg-gray-800'
            }`}
          >
            <FiFilter className="w-4 h-4" />
            <span>Filters</span>
            {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-[#F2DD50]"></span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t #E2E8F0 dark:border-[#1C1D24] flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
              className="px-4 py-2 rounded-xl border #E2E8F0 dark:border-[#2A2B36] bg-white dark:bg-[#0D0E12] #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
              className="px-4 py-2 rounded-xl border #E2E8F0 dark:border-[#2A2B36] bg-white dark:bg-[#0D0E12] #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="#FFFFFF dark:bg-[#0D0E12]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold #475569 dark:text-[#44454F] uppercase tracking-wider">
                <SortHeader field="date" label="Date" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold #475569 dark:text-[#44454F] uppercase tracking-wider">
                <SortHeader field="type" label="Type" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold #475569 dark:text-[#44454F] uppercase tracking-wider">
                <SortHeader field="partyName" label="Party / Category" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold #475569 dark:text-[#44454F] uppercase tracking-wider">
                Reference
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold #475569 dark:text-[#44454F] uppercase tracking-wider">
                <SortHeader field="amount" label="Amount" className="justify-end" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold #475569 dark:text-[#44454F] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold #475569 dark:text-[#44454F] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-[#1C1D24] rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-[#1C1D24] rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-[#1C1D24] rounded w-32"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-[#1C1D24] rounded w-28"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-[#1C1D24] rounded w-20 ml-auto"></div></td>
                  <td className="px-4 py-4"><div className="h-6 bg-gray-200 dark:bg-[#1C1D24] rounded-full w-16 mx-auto"></div></td>
                  <td className="px-4 py-4"><div className="h-8 bg-gray-200 dark:bg-[#1C1D24] rounded w-8 mx-auto"></div></td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full #F8FAFC dark:bg-[#1C1D24] flex items-center justify-center mb-4">
                      <FiFileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="#475569 dark:text-[#44454F] font-medium mb-1">No transactions found</p>
                    <p className="text-sm text-gray-400 dark:#475569">
                      {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Add your first transaction to get started'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => {
                const type = transaction.mappedType as TransactionType;
                const typeConfig = TRANSACTION_TYPE_CONFIG[type] || TRANSACTION_TYPE_CONFIG.sales;
                const status = (transaction.paymentStatus || 'paid') as PaymentStatus;
                const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.paid;

                return (
                  <tr
                    key={transaction.id}
                    className="hover:#FFFFFF dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium #1E293B dark:text-[#EAE5DF]">
                        {formatDate(transaction.date)}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeConfig.lightBg} ${typeConfig.textColor}`}>
                        {getTypeIcon(type)}
                        {typeConfig.label}
                      </span>
                    </td>

                    {/* Party / Category */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium #1E293B dark:text-[#EAE5DF] truncate max-w-48">
                          {transaction.partyName || transaction.category || '-'}
                        </p>
                        {transaction.description && (
                          <p className="text-xs #475569 dark:text-[#44454F] truncate max-w-48">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm #475569 dark:text-[#44454F] font-mono">
                        {transaction.transactionNumber || transaction.id?.slice(0, 8) || '-'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${
                        type === 'selling' || type === 'payment_in' || type === 'income'
                          ? 'text-[#F2DD50] dark:text-[#F2DD50]'
                          : '#1E293B dark:text-[#EAE5DF]'
                      }`}>
                        {type === 'selling' || type === 'payment_in' || type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.totalAmount || transaction.amount || 0)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {getStatusIcon(status)}
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-center relative">
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick actions on hover */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={() => onView(transaction)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#F2DD50] hover:bg-[#F1F5F9] dark:hover:bg-[#F2DD50]/15 transition-colors"
                            title="View"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrint(transaction)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            title="Print"
                          >
                            <FiPrinter className="w-4 h-4" />
                          </button>
                        </div>

                        {/* More menu */}
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === transaction.id ? null : transaction.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:#475569 hover:#F8FAFC dark:hover:bg-gray-700 transition-colors"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === transaction.id && (
                            <>
                              {/* Backdrop */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveDropdown(null)}
                              />
                              
                              {/* Dropdown */}
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#15161C] rounded-xl shadow-xl border #E2E8F0 dark:border-[#1C1D24] py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                  onClick={() => {
                                    onView(transaction);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#64748B] hover:#FFFFFF dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    onEdit(transaction);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#64748B] hover:#FFFFFF dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    onPrint(transaction);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#64748B] hover:#FFFFFF dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <FiPrinter className="w-4 h-4" />
                                  Print / Invoice
                                </button>
                                <div className="border-t #E2E8F0 dark:border-[#1C1D24] my-1" />
                                <button
                                  onClick={() => {
                                    onDelete(transaction);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Summary */}
      {filteredTransactions.length > 0 && (
        <div className="px-4 py-3 #FFFFFF dark:bg-[#0D0E12] border-t #E2E8F0 dark:border-[#1C1D24]">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <span className="#475569 dark:text-[#44454F]">
              Showing <span className="font-semibold #1E293B dark:text-[#EAE5DF]">{filteredTransactions.length}</span> of{' '}
              <span className="font-semibold #1E293B dark:text-[#EAE5DF]">{transactions.length}</span> transactions
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[#F2DD50] dark:text-[#F2DD50] font-medium flex items-center gap-1">
                <FiTrendingUp className="w-3.5 h-3.5" />
                {formatCurrency(
                  filteredTransactions
                    .filter(t => ['sales', 'selling', 'payment_in', 'income'].includes(t.type))
                    .reduce((sum, t) => sum + (t.totalAmount || t.amount || 0), 0)
                )}
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                <FiTrendingDown className="w-3.5 h-3.5" />
                {formatCurrency(
                  filteredTransactions
                    .filter(t => !['sales', 'selling', 'payment_in', 'income', 'quotation'].includes(t.type))
                    .reduce((sum, t) => sum + (t.totalAmount || t.amount || 0), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
