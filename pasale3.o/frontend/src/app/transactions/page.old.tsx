import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useTranslation } from '../../utils/i18n';
import { formatDate } from '../../utils/nepaliDate';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/dashboard/KPICard';
import { AddTransactionDialog } from '../../components/transactions/AddTransactionDialog';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiSearch,
  FiDownload,
  FiFileText,
  FiFilter,
  FiPlus,
  FiCalendar,
  FiChevronDown,
  FiMoreVertical,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPrinter,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiShoppingCart,
  FiUser,
  FiPackage,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../../components/ui/NepaliRupeeIcon';

type Tab = 'all' | 'selling' | 'purchase' | 'expense';
type SortBy = 'date' | 'amount' | 'party';
type QuickFilter = 'today' | 'week' | 'month' | 'custom';
type Status = 'paid' | 'pending' | 'overdue';
type TransactionType = 'sales_in' | 'sales_out' | 'purchase_in' | 'purchase_out';

export default function TransactionsPage() {
  const { t, c, n, d, language } = useTranslation();
  const { transactions, parties } = useDataStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [showNewTransactionMenu, setShowNewTransactionMenu] = useState(false);
  /* Add Mode state */
  const [addMode, setAddMode] = useState<'general' | 'payment_in' | 'payment_out' | 'purchase' | 'sales_return' | 'purchase_return' | 'quotation' | 'expense' | 'income'>('general');

  // Handle three-dot menu click
  const handleMenuClick = (e: React.MouseEvent, transactionId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right - 192 + window.scrollX, // 192px = dropdown width (w-48)
    });
    setSelectedTransactionId(transactionId);
  };

  // Close dropdown when clicking outside
  const closeDropdown = () => {
    setSelectedTransactionId(null);
    setDropdownPosition(null);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quick filter date ranges
  useEffect(() => {
    const today = new Date();
    const start = new Date();

    switch (quickFilter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'month':
        start.setDate(1);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        break;
    }
  }, [quickFilter]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      if (activeTab !== 'all' && transaction.type !== activeTab) return false;
      if (selectedPartyId && transaction.partyId !== selectedPartyId) return false;
      if (startDate) {
        const txDate = new Date(transaction.date);
        if (txDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const txDate = new Date(transaction.date);
        const txEnd = new Date(endDate);
        txEnd.setHours(23, 59, 59);
        if (txDate > txEnd) return false;
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (
          !transaction.description.toLowerCase().includes(q) &&
          !(transaction.partyName || '').toLowerCase().includes(q) &&
          !transaction.amount.toString().includes(debouncedSearch)
        ) {
          return false;
        }
      }
      return true;
    });

    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'party':
          comparison = (a.partyName || '').localeCompare(b.partyName || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, activeTab, selectedPartyId, startDate, endDate, debouncedSearch, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'selling')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === 'purchase' || t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    return { income, expenses, balance, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const data = filteredTransactions.map((t) => ({
      Date: formatDate(t.date, language),
      Type: t.type,
      Party: t.partyName || '—',
      Description: t.description,
      Amount: t.amount,
    }));
    console.log(`Exporting as ${format}:`, data);
    alert(`${t('transactions.exporting')} ${filteredTransactions.length} ${t('transactions.transactionsAs')} ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  const handleCreateBill = (transaction: typeof transactions[0]) => {
    if (transaction.partyId) {
      navigate(`/billing?partyId=${transaction.partyId}&transactionId=${transaction.id}`);
    } else {
      navigate(`/billing?transactionId=${transaction.id}`);
    }
  };

  const getStatus = (transaction: typeof transactions[0]): Status => {
    const daysDiff = Math.floor((Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) return 'overdue';
    if (daysDiff > 0) return 'pending';
    return 'paid';
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'paid':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'pending':
        return <FiClock className="w-4 h-4" />;
      case 'overdue':
        return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const tabs = [
    { id: 'all' as Tab, label: t('transactions.all'), icon: FiFileText, count: transactions.length },
    { id: 'selling' as Tab, label: t('transactions.sales'), icon: FiArrowUpRight, count: transactions.filter(t => t.type === 'selling').length, color: 'text-green-600' },
    { id: 'purchase' as Tab, label: t('transactions.purchases'), icon: FiArrowDownLeft, count: transactions.filter(t => t.type === 'purchase').length, color: 'text-blue-600' },
    { id: 'expense' as Tab, label: t('transactions.expenses'), icon: FiCreditCard, count: transactions.filter(t => t.type === 'expense').length, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      <div className="w-full max-w-1600px mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        {/* Header - Modern Gradient Style */}
        {/* Header - Modern Gradient Style */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl shadow-xl shadow-emerald-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
          </div>

          <div className="relative p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <FiCreditCard className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  {t('transactions.title')}
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm">
                    {n(transactions.length)}
                  </span>
                </h1>
                <p className="text-white/80 text-sm mt-1">{t('transactions.description')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 transition-all text-xs sm:text-sm backdrop-blur-sm"
              >
                <FiFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span>{t('transactions.filter')}</span>
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 transition-all text-xs sm:text-sm backdrop-blur-sm"
                >
                  <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('common.export')}</span>
                  <FiChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiFileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                      {t('transactions.exportAsPdf')}
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiFileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                      {t('transactions.exportAsExcel')}
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiFileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                      {t('transactions.exportAsCsv')}
                    </button>
                  </div>
                )}
              </div>

              {/* Single Add Transaction Button with Consolidated Dropdown */}
              <div className="relative">
                <Button
                  onClick={() => setShowNewTransactionMenu(!showNewTransactionMenu)}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all font-bold px-6 border-0"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  {t('transactions.addTransaction')}
                  <FiChevronDown className="w-4 h-4 ml-2" />
                </Button>

                {showNewTransactionMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-100 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shortcuts</p>
                    </div>

                    {/* Add Sales */}
                    <button
                      onClick={() => { navigate('/billing'); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                        <FiShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Add Sales</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Create new invoice</p>
                      </div>
                    </button>

                    {/* Add Purchase */}
                    <button
                      onClick={() => { setAddMode('purchase'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <FiArrowDownLeft className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Add Purchase</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Record purchase</p>
                      </div>
                    </button>

                    {/* Add Party */}
                    <button
                      onClick={() => { navigate('/parties'); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                        <FiUser className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Add Party</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">New customer/supplier</p>
                      </div>
                    </button>

                    {/* Add Inventory (Product) */}
                    <button
                      onClick={() => { navigate('/inventory'); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                        <FiPackage className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Add Product</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage inventory</p>
                      </div>
                    </button>

                    <div className="px-4 py-2 border-t border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Transactions</p>
                    </div>

                    {/* Payment In */}
                    <button
                      onClick={() => { setAddMode('payment_in'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      <FiArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      Payment In
                    </button>

                    {/* Payment Out */}
                    <button
                      onClick={() => { setAddMode('payment_out'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      <FiArrowUpRight className="w-4 h-4 text-red-500" />
                      Payment Out
                    </button>

                    {/* Quotation */}
                    <button
                      onClick={() => { setAddMode('quotation'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      <FiFileText className="w-4 h-4 text-blue-500" />
                      Quotation
                    </button>

                    {/* Sales Return */}
                    <button
                      onClick={() => { setAddMode('sales_return'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      <FiCheckCircle className="w-4 h-4 text-orange-500" />
                      Sales Return
                    </button>

                    {/* Purchase Return */}
                    <button
                      onClick={() => { setAddMode('purchase_return'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      <FiShoppingCart className="w-4 h-4 text-purple-500" />
                      Purchase Return
                    </button>

                    {/* Expense */}
                    <button
                      onClick={() => { setAddMode('expense'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      <FiCreditCard className="w-4 h-4 text-red-600" />
                      Expense
                    </button>

                    {/* Income */}
                    <button
                      onClick={() => { setAddMode('income'); setShowAddDialog(true); setShowNewTransactionMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                      <FiTrendingUp className="w-4 h-4 text-green-600" />
                      Income
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <KPICard
            title={t('transactions.totalIncome')}
            value={stats.income}
            borderColor="emerald"
            onClick={() => navigate('/dashboard/kpi/sales')}
            icon={<FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={`${n(transactions.filter((t) => t.type === 'selling').length)} ${t('transactions.sales')}`}
          />

          <KPICard
            title={t('transactions.totalExpenses')}
            value={stats.expenses}
            borderColor="red"
            onClick={() => navigate('/dashboard/kpi/payable')}
            icon={<FiTrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={`${n(transactions.filter((t) => t.type === 'purchase' || t.type === 'expense').length)} txns`}
          />

          <KPICard
            title={t('transactions.netBalance')}
            value={stats.balance}
            borderColor="blue"
            onClick={() => navigate('/dashboard/kpi/balance')}
            icon={<NepaliRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={stats.balance >= 0 ? t('transactions.profit') : t('transactions.loss')}
            change={undefined} // Not using the growth % here
          />

          <KPICard
            title={t('transactions.totalTransactions')}
            value={stats.count}
            borderColor="purple"
            icon={<FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={quickFilter === 'today' ? t('common.today') : quickFilter === 'week' ? t('common.thisWeek') : t('common.thisMonth')}
          />
        </div>

        {/* Tabs and Filters */}
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mr-1 sm:mr-2">{t('transactions.quickFilter')}:</span>
            {(['today', 'week', 'month', 'custom'] as QuickFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setQuickFilter(filter);
                  if (filter === 'custom') setShowFilters(true);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${quickFilter === filter
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {filter === 'today' ? t('common.today') : filter === 'week' ? t('common.thisWeek') : filter === 'month' ? t('common.thisMonth') : t('transactions.custom')}
              </button>
            ))}
          </div>

          {/* Transaction Type Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${activeTab !== tab.id ? tab.color : ''}`} />
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                    ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                    {n(tab.count)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    {t('transactions.party')}
                  </label>
                  <select
                    value={selectedPartyId}
                    onChange={(e) => setSelectedPartyId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">{t('transactions.allParties')}</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    {t('transactions.from')}
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    {t('transactions.to')}
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search and Sort */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-50">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('transactions.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="date">{t('transactions.sortByDate')}</option>
              <option value="amount">{t('transactions.sortByAmount')}</option>
              <option value="party">{t('transactions.sortByParty')}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
            </button>
          </div>
        </Card>

        {/* Transactions List */}
        <Card className="overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiFileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('transactions.noTransactions')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t('transactions.noTransactionsDesc')}
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <FiPlus className="w-5 h-5 mr-2" />
                {t('transactions.addFirst')}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTransactions.map((transaction) => {
                const status = getStatus(transaction);
                return (
                  <div
                    key={transaction.id}
                    className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${transaction.type === 'selling'
                        ? 'bg-linear-to-br from-emerald-400 to-emerald-600 text-white'
                        : transaction.type === 'purchase'
                          ? 'bg-linear-to-br from-blue-400 to-blue-600 text-white'
                          : 'bg-linear-to-br from-red-400 to-red-600 text-white'
                        }`}>
                        {transaction.type === 'selling' ? (
                          <FiArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : transaction.type === 'purchase' ? (
                          <FiArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <FiCreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                            {transaction.partyName || transaction.description}
                          </h3>
                          <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            <span className="capitalize">{status}</span>
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {transaction.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                            <FiCalendar className="w-3 h-3" />
                            {d(transaction.date)}
                          </span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${transaction.type === 'selling'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : transaction.type === 'purchase'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {transaction.type === 'selling' ? t('transactions.sales') : transaction.type === 'purchase' ? t('transactions.purchases') : t('transactions.expenses')}
                          </span>
                          {/* Mobile status badge */}
                          <span className={`sm:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <p className={`text-base sm:text-lg font-bold ${transaction.type === 'selling'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-gray-100'
                          }`}>
                          {transaction.type === 'selling' ? '+' : '-'}{c(transaction.amount)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/transactions/${transaction.id}`)}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          title={t('common.view')}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCreateBill(transaction)}
                          className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                          title={t('billing.createBill')}
                        >
                          <FiPrinter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleMenuClick(e, transaction.id)}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          title={t('common.more')}
                        >
                          <FiMoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mobile menu button */}
                      <button
                        onClick={(e) => handleMenuClick(e, transaction.id)}
                        className="sm:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                      >
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Results Summary */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('common.showing')} <span className="font-semibold">{n(filteredTransactions.length)}</span> {t('transactions.transactions')}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ↑ {c(stats.income)}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    ↓ {c(stats.expenses)}
                  </span>
                  <span className={`font-bold ${stats.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    = {c(stats.balance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {showAddDialog && (
          <AddTransactionDialog onClose={() => setShowAddDialog(false)} />
        )}

        {/* Transaction Actions Dropdown */}
        {selectedTransactionId && dropdownPosition && (
          <div className="fixed inset-0 z-50" onClick={closeDropdown}>
            <div
              className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 w-48 z-50"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  navigate(`/transactions/${selectedTransactionId}`);
                  closeDropdown();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <FiEye className="w-4 h-4" />
                {t('transactions.viewDetails')}
              </button>
              <button
                onClick={() => {
                  const tx = transactions.find(t => t.id === selectedTransactionId);
                  if (tx) {
                    handleCreateBill(tx);
                  }
                  closeDropdown();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <FiPrinter className="w-4 h-4" />
                {t('billing.createBill')}
              </button>
              <button
                onClick={() => {
                  alert(t('common.featureComingSoon'));
                  closeDropdown();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <FiEdit2 className="w-4 h-4" />
                {t('transactions.editTransaction')}
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={() => {
                  if (confirm(t('common.confirmDelete'))) {
                    alert(t('common.featureComingSoon'));
                  }
                  closeDropdown();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
              >
                <FiTrash2 className="w-4 h-4" />
                {t('transactions.deleteTransaction')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
