import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useTranslation } from '../../utils/i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/dashboard/KPICard';
import {
  SalesPurchaseDialog,
  PaymentDialog,
  ExpenseIncomeDialog,
  ReturnDialog,
  QuotationDialog,
  TransactionViewDialog,
  DeleteConfirmDialog,
  TransactionTable,
  TransactionType,
  TRANSACTION_TYPE_CONFIG,
} from '../../components/transactions';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiFileText,
  FiFilter,
  FiPlus,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiRotateCcw,
  FiRotateCw,
  FiDollarSign,
  FiX,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../../components/ui/NepaliRupeeIcon';

type Tab = 'all' | 'sales' | 'purchase' | 'payments' | 'returns' | 'expense';
type QuickFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function TransactionsPage() {
  const { t, c, n, language } = useTranslation();
  const { transactions, parties, deleteTransaction } = useDataStore();
  const navigate = useNavigate();

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewTransactionMenu, setShowNewTransactionMenu] = useState(false);

  // Dialog States
  const [salesDialog, setSalesDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [purchaseDialog, setPurchaseDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [paymentInDialog, setPaymentInDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [paymentOutDialog, setPaymentOutDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [expenseDialog, setExpenseDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [incomeDialog, setIncomeDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [salesReturnDialog, setSalesReturnDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [purchaseReturnDialog, setPurchaseReturnDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [quotationDialog, setQuotationDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [viewDialog, setViewDialog] = useState<{ open: boolean; transaction?: any }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction?: any }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);

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
      case 'year':
        start.setMonth(0, 1);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        break;
    }
  }, [quickFilter]);

  // Filter transactions by tab and date
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by date
    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter((t) => new Date(t.date) <= end);
    }

    // Filter by tab - 'selling' is the dataStore type for sales
    switch (activeTab) {
      case 'sales':
        filtered = filtered.filter((t) => t.type === 'selling');
        break;
      case 'purchase':
        filtered = filtered.filter((t) => t.type === 'purchase');
        break;
      case 'payments':
        filtered = filtered.filter((t) => t.type === 'payment_in' || t.type === 'payment_out');
        break;
      case 'returns':
        filtered = filtered.filter((t) => t.type === 'sales_return' || t.type === 'purchase_return');
        break;
      case 'expense':
        filtered = filtered.filter((t) => t.type === 'expense' || t.type === 'income');
        break;
    }

    return filtered;
  }, [transactions, activeTab, startDate, endDate]);

  // Calculate stats
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => ['selling', 'payment_in', 'income', 'purchase_return'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => ['purchase', 'payment_out', 'expense', 'sales_return'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    return { income, expenses, balance, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Handle export
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement actual export functionality
    alert(`Exporting ${filteredTransactions.length} transactions as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  // Handle view transaction
  const handleViewTransaction = useCallback((transaction: any) => {
    setViewDialog({ open: true, transaction });
  }, []);

  // Handle edit transaction
  const handleEditTransaction = useCallback((transaction: any) => {
    const type = transaction.type;
    switch (type) {
      case 'selling':
      case 'sales':
        setSalesDialog({ open: true, editData: transaction });
        break;
      case 'purchase':
        setPurchaseDialog({ open: true, editData: transaction });
        break;
      case 'payment_in':
        setPaymentInDialog({ open: true, editData: transaction });
        break;
      case 'payment_out':
        setPaymentOutDialog({ open: true, editData: transaction });
        break;
      case 'expense':
        setExpenseDialog({ open: true, editData: transaction });
        break;
      case 'income':
        setIncomeDialog({ open: true, editData: transaction });
        break;
      case 'sales_return':
        setSalesReturnDialog({ open: true, editData: transaction });
        break;
      case 'purchase_return':
        setPurchaseReturnDialog({ open: true, editData: transaction });
        break;
      case 'quotation':
        setQuotationDialog({ open: true, editData: transaction });
        break;
    }
  }, []);

  // Handle delete transaction
  const handleDeleteTransaction = useCallback((transaction: any) => {
    setDeleteDialog({ open: true, transaction });
  }, []);

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteDialog.transaction) return;
    setIsDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      deleteTransaction(deleteDialog.transaction.id);
      setDeleteDialog({ open: false });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle print / create bill
  const handlePrintTransaction = useCallback((transaction: any) => {
    if (transaction.partyId) {
      navigate(`/billing?partyId=${transaction.partyId}&transactionId=${transaction.id}`);
    } else {
      navigate(`/billing?transactionId=${transaction.id}`);
    }
  }, [navigate]);

  // Tabs configuration - 'selling' is the dataStore type for sales
  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { id: 'all', label: 'All Transactions', icon: FiFileText, count: transactions.length, color: 'text-gray-600' },
    { id: 'sales', label: 'Sales', icon: FiShoppingCart, count: transactions.filter((t) => t.type === 'selling').length, color: 'text-emerald-600' },
    { id: 'purchase', label: 'Purchases', icon: FiPackage, count: transactions.filter((t) => t.type === 'purchase').length, color: 'text-blue-600' },
    { id: 'payments', label: 'Payments', icon: FiCreditCard, count: transactions.filter((t) => t.type === 'payment_in' || t.type === 'payment_out').length, color: 'text-purple-600' },
    { id: 'returns', label: 'Returns', icon: FiRotateCcw, count: transactions.filter((t) => t.type === 'sales_return' || t.type === 'purchase_return').length, color: 'text-orange-600' },
    { id: 'expense', label: 'Expense/Income', icon: FiTrendingDown, count: transactions.filter((t) => t.type === 'expense' || t.type === 'income').length, color: 'text-rose-600' },
  ];

  // Full transaction menu - all 9 transaction types
  const transactionMenuItems = [
    {
      id: 'sales',
      label: 'Add Sales',
      desc: 'Create sales invoice',
      icon: FiShoppingCart,
      color: 'bg-emerald-500',
      onClick: () => setSalesDialog({ open: true })
    },
    {
      id: 'purchase',
      label: 'Add Purchase',
      desc: 'Record a purchase',
      icon: FiPackage,
      color: 'bg-blue-500',
      onClick: () => setPurchaseDialog({ open: true })
    },
    {
      id: 'payment_in',
      label: 'Payment In',
      desc: 'Receive payment from customer',
      icon: FiArrowDownLeft,
      color: 'bg-green-500',
      onClick: () => setPaymentInDialog({ open: true })
    },
    {
      id: 'payment_out',
      label: 'Payment Out',
      desc: 'Make payment to supplier',
      icon: FiArrowUpRight,
      color: 'bg-red-500',
      onClick: () => setPaymentOutDialog({ open: true })
    },
    {
      id: 'quotation',
      label: 'Create Quotation',
      desc: 'Generate a quotation/estimate',
      icon: FiFileText,
      color: 'bg-purple-500',
      onClick: () => setQuotationDialog({ open: true })
    },
    {
      id: 'sales_return',
      label: 'Sales Return',
      desc: 'Process customer return',
      icon: FiRotateCcw,
      color: 'bg-orange-500',
      onClick: () => setSalesReturnDialog({ open: true })
    },
    {
      id: 'purchase_return',
      label: 'Purchase Return',
      desc: 'Return goods to supplier',
      icon: FiRotateCw,
      color: 'bg-amber-500',
      onClick: () => setPurchaseReturnDialog({ open: true })
    },
    {
      id: 'expense',
      label: 'Add Expense',
      desc: 'Record business expense',
      icon: FiTrendingDown,
      color: 'bg-rose-500',
      onClick: () => setExpenseDialog({ open: true })
    },
    {
      id: 'income',
      label: 'Add Income',
      desc: 'Record other income',
      icon: FiTrendingUp,
      color: 'bg-teal-500',
      onClick: () => setIncomeDialog({ open: true })
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="relative mb-8 rounded-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
          </div>

          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                  <FiCreditCard className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
                    Transactions
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/10">
                      {n(transactions.length)}
                    </span>
                  </h1>
                  <p className="text-white/80 text-sm mt-1 max-w-md">
                    Manage all your business transactions in one place
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all"
                >
                  <FiFilter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </button>

                {/* Export Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                    <FiChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                        {['pdf', 'excel', 'csv'].map((format) => (
                          <button
                            key={format}
                            onClick={() => handleExport(format as any)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <FiFileText className={`w-4 h-4 ${format === 'pdf' ? 'text-red-500' : format === 'excel' ? 'text-green-500' : 'text-blue-500'}`} />
                            Export as {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Add Transaction Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowNewTransactionMenu(!showNewTransactionMenu)}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all"
                  >
                    <FiPlus className="w-5 h-5 mr-2" />
                    <span>New Transaction</span>
                    <FiChevronDown className="w-4 h-4 ml-2" />
                  </button>

                  {showNewTransactionMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNewTransactionMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[70vh] overflow-y-auto">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Create Transaction</p>
                        </div>
                        {transactionMenuItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              item.onClick();
                              setShowNewTransactionMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center shrink-0 shadow-sm`}>
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Income"
            value={stats.income}
            borderColor="emerald"
            icon={<FiTrendingUp className="w-5 h-5" />}
            subtitle={`${n(filteredTransactions.filter((t) => ['selling', 'payment_in', 'income'].includes(t.type)).length)} transactions`}
          />
          <KPICard
            title="Total Expenses"
            value={stats.expenses}
            borderColor="red"
            icon={<FiTrendingDown className="w-5 h-5" />}
            subtitle={`${n(filteredTransactions.filter((t) => ['purchase', 'payment_out', 'expense'].includes(t.type)).length)} transactions`}
          />
          <KPICard
            title="Net Balance"
            value={stats.balance}
            borderColor="blue"
            icon={<NepaliRupeeIcon className="w-5 h-5" />}
            subtitle={stats.balance >= 0 ? 'Profit' : 'Loss'}
          />
          <KPICard
            title="Transactions"
            value={stats.count}
            borderColor="purple"
            icon={<FiFileText className="w-5 h-5" />}
            subtitle={quickFilter === 'today' ? 'Today' : quickFilter === 'week' ? 'This Week' : quickFilter === 'month' ? 'This Month' : 'This Year'}
          />
        </div>

        {/* Filters Panel */}
        <Card className="p-4 sm:p-6 mb-6">
          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mr-2">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Period:</span>
            </div>
            {(['today', 'week', 'month', 'year', 'custom'] as QuickFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setQuickFilter(filter);
                  if (filter === 'custom') setShowFilters(true);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${quickFilter === filter
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Navigation */}
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
                  <span className="hidden sm:inline">{tab.label}</span>
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
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Custom Date Range</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Transactions Table */}
        <TransactionTable
          transactions={filteredTransactions}
          onView={handleViewTransaction}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onPrint={handlePrintTransaction}
          language={language}
        />

        {/* Dialogs */}
        <SalesPurchaseDialog
          isOpen={salesDialog.open}
          onClose={() => setSalesDialog({ open: false })}
          type="sales"
          editData={salesDialog.editData}
          onSuccess={() => setSalesDialog({ open: false })}
        />

        <SalesPurchaseDialog
          isOpen={purchaseDialog.open}
          onClose={() => setPurchaseDialog({ open: false })}
          type="purchase"
          editData={purchaseDialog.editData}
          onSuccess={() => setPurchaseDialog({ open: false })}
        />

        <PaymentDialog
          isOpen={paymentInDialog.open}
          onClose={() => setPaymentInDialog({ open: false })}
          type="payment_in"
          editData={paymentInDialog.editData}
          onSuccess={() => setPaymentInDialog({ open: false })}
        />

        <PaymentDialog
          isOpen={paymentOutDialog.open}
          onClose={() => setPaymentOutDialog({ open: false })}
          type="payment_out"
          editData={paymentOutDialog.editData}
          onSuccess={() => setPaymentOutDialog({ open: false })}
        />

        <ExpenseIncomeDialog
          isOpen={expenseDialog.open}
          onClose={() => setExpenseDialog({ open: false })}
          type="expense"
          editData={expenseDialog.editData}
          onSuccess={() => setExpenseDialog({ open: false })}
        />

        <ExpenseIncomeDialog
          isOpen={incomeDialog.open}
          onClose={() => setIncomeDialog({ open: false })}
          type="income"
          editData={incomeDialog.editData}
          onSuccess={() => setIncomeDialog({ open: false })}
        />

        <ReturnDialog
          isOpen={salesReturnDialog.open}
          onClose={() => setSalesReturnDialog({ open: false })}
          type="sales_return"
          editData={salesReturnDialog.editData}
          onSuccess={() => setSalesReturnDialog({ open: false })}
        />

        <ReturnDialog
          isOpen={purchaseReturnDialog.open}
          onClose={() => setPurchaseReturnDialog({ open: false })}
          type="purchase_return"
          editData={purchaseReturnDialog.editData}
          onSuccess={() => setPurchaseReturnDialog({ open: false })}
        />

        <QuotationDialog
          isOpen={quotationDialog.open}
          onClose={() => setQuotationDialog({ open: false })}
          editData={quotationDialog.editData}
          onSuccess={() => setQuotationDialog({ open: false })}
        />

        <TransactionViewDialog
          isOpen={viewDialog.open}
          onClose={() => setViewDialog({ open: false })}
          transaction={viewDialog.transaction}
          onEdit={() => {
            setViewDialog({ open: false });
            if (viewDialog.transaction) {
              handleEditTransaction(viewDialog.transaction);
            }
          }}
          onPrint={() => {
            if (viewDialog.transaction) {
              handlePrintTransaction(viewDialog.transaction);
            }
          }}
        />

        <DeleteConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false })}
          onConfirm={confirmDelete}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          itemName={deleteDialog.transaction?.transactionNumber || deleteDialog.transaction?.description}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
