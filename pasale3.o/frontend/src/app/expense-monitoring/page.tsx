import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore, Expense } from '../../store/dataStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../utils/i18n';
import { useThemeStore } from '../../store/themeStore';
import { expenseApi, ApiExpenseData } from '../../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiCoffee,
  FiShoppingBag,
  FiHome,
  FiTruck,
  FiZap,
  FiPhone,
  FiUsers,
  FiPackage,
  FiMoreHorizontal,
  FiTarget,
  FiEdit2,
  FiMinus,
  FiLoader,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../../components/ui/NepaliRupeeIcon';

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  'Rent': { icon: FiHome, color: '#8b5cf6', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  'Utilities': { icon: FiZap, color: '#f59e0b', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  'Salary': { icon: FiUsers, color: '#3b82f6', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  'Inventory': { icon: FiPackage, color: '#10b981', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  'Transport': { icon: FiTruck, color: '#ec4899', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  'Food': { icon: FiCoffee, color: '#f97316', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  'Office Supplies': { icon: FiShoppingBag, color: '#06b6d4', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  'Phone/Internet': { icon: FiPhone, color: '#6366f1', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  'Marketing': { icon: FiTrendingUp, color: '#84cc16', bgColor: 'bg-lime-100 dark:bg-lime-900/30' },
  'Other': { icon: FiMoreHorizontal, color: '#64748b', bgColor: 'bg-slate-100 dark:bg-slate-900/30' },
};

const EXPENSE_CATEGORIES = Object.keys(CATEGORY_CONFIG);
const PIE_COLORS = ['#8b5cf6', '#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#f97316', '#06b6d4', '#6366f1', '#84cc16', '#64748b'];

// Get stored budget from localStorage
const getStoredBudget = () => {
  try {
    const stored = localStorage.getItem('pasale-monthly-budget');
    return stored ? parseFloat(stored) : 100000;
  } catch {
    return 100000;
  }
};

export default function ExpenseMonitoringPage() {
  const { expenses, addExpense, addTransaction, transactions } = useDataStore();
  const { t, n, c, language } = useTranslation();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'necessary' | 'unnecessary'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const [newExpense, setNewExpense] = useState({
    category: 'Other',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isNecessary: true,
  });

  const [monthlyBudget, setMonthlyBudget] = useState(getStoredBudget());
  const [tempBudget, setTempBudget] = useState(monthlyBudget.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setIsDark(theme === 'dark');
  }, [theme]);

  // Save budget to localStorage when changed
  const saveBudget = () => {
    const newBudget = parseFloat(tempBudget) || 100000;
    setMonthlyBudget(newBudget);
    localStorage.setItem('pasale-monthly-budget', newBudget.toString());
    setShowBudgetModal(false);
  };

  // Filter expenses by date range
  const getFilteredByDate = useMemo(() => {
    return (expenseList: Expense[]) => {
      const now = new Date();
      return expenseList.filter((e) => {
        const expenseDate = new Date(e.date);
        switch (dateRange) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return expenseDate >= weekAgo;
          case 'month':
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
          case 'year':
            return expenseDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    };
  }, [dateRange]);

  // Filtered expenses - all filters combined
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    
    // Apply date filter
    result = getFilteredByDate(result);
    
    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter((e) => e.category === filterCategory);
    }
    
    // Apply type filter
    if (filterType === 'necessary') {
      result = result.filter((e) => e.isNecessary);
    } else if (filterType === 'unnecessary') {
      result = result.filter((e) => !e.isNecessary);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) => 
          e.description.toLowerCase().includes(query) || 
          e.category.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return result;
  }, [expenses, filterCategory, filterType, searchQuery, getFilteredByDate]);

  // Calculate stats from filtered expenses
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const necessaryExpenses = filteredExpenses.filter((e) => e.isNecessary).reduce((sum, e) => sum + e.amount, 0);
  const unnecessaryExpenses = totalExpenses - necessaryExpenses;
  
  // Budget calculations (always use current month for budget)
  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);
  
  const budgetUsedPercent = Math.min((thisMonthExpenses / monthlyBudget) * 100, 100);
  const budgetRemaining = monthlyBudget - thisMonthExpenses;

  // Category breakdown for pie chart - uses filtered expenses
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredExpenses.forEach((e) => { 
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount; 
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Daily/Period trend - responds to dateRange filter
  const dailyTrend = useMemo(() => {
    const now = new Date();
    
    if (dateRange === 'week') {
      // Last 7 days
      const last7Days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last7Days[date.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
      }
      expenses.forEach((e) => {
        const expenseDate = new Date(e.date);
        const daysDiff = Math.floor((now.getTime() - expenseDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysDiff >= 0 && daysDiff < 7) {
          const key = expenseDate.toLocaleDateString('en-US', { weekday: 'short' });
          if (last7Days[key] !== undefined) {
            last7Days[key] += e.amount;
          }
        }
      });
      return Object.entries(last7Days).map(([day, amount]) => ({ day, amount }));
    } else if (dateRange === 'month') {
      // This month - group by week
      const weeks: Record<string, number> = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0, 'Week 5': 0 };
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      expenses.forEach((e) => {
        const expenseDate = new Date(e.date);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
          const weekNum = Math.min(Math.ceil(expenseDate.getDate() / 7), 5);
          weeks[`Week ${weekNum}`] += e.amount;
        }
      });
      return Object.entries(weeks).map(([day, amount]) => ({ day, amount }));
    } else if (dateRange === 'year') {
      // This year - group by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = now.getFullYear();
      const monthlyData: Record<string, number> = {};
      months.forEach(m => monthlyData[m] = 0);
      expenses.forEach((e) => {
        const expenseDate = new Date(e.date);
        if (expenseDate.getFullYear() === currentYear) {
          const monthKey = months[expenseDate.getMonth()];
          monthlyData[monthKey] += e.amount;
        }
      });
      return Object.entries(monthlyData).map(([day, amount]) => ({ day, amount }));
    } else {
      // All time - group by last 12 months
      const last12Months: { day: string; amount: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const monthExpenses = expenses.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
        }).reduce((sum, e) => sum + e.amount, 0);
        last12Months.push({ day: monthKey, amount: monthExpenses });
      }
      return last12Months;
    }
  }, [expenses, dateRange]);

  // Monthly data for bar chart - responds to dateRange filter
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    if (dateRange === 'week') {
      // Last 7 days - group by day
      const dailyData: { month: string; income: number; expense: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayExpense = expenses.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate.toDateString() === date.toDateString();
        }).reduce((sum, e) => sum + e.amount, 0);
        const dayIncome = transactions.filter((t) => {
          const transDate = new Date(t.date);
          return transDate.toDateString() === date.toDateString() && t.type === 'selling';
        }).reduce((sum, t) => sum + t.amount, 0);
        dailyData.push({ month: dayKey, income: dayIncome, expense: dayExpense });
      }
      return dailyData;
    } else if (dateRange === 'month') {
      // This month - group by week
      const weeklyData: { month: string; income: number; expense: number }[] = [];
      for (let week = 1; week <= 5; week++) {
        const weekExpense = expenses.filter((e) => {
          const expenseDate = new Date(e.date);
          const weekNum = Math.min(Math.ceil(expenseDate.getDate() / 7), 5);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear && weekNum === week;
        }).reduce((sum, e) => sum + e.amount, 0);
        const weekIncome = transactions.filter((t) => {
          const transDate = new Date(t.date);
          const weekNum = Math.min(Math.ceil(transDate.getDate() / 7), 5);
          return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear && weekNum === week && t.type === 'selling';
        }).reduce((sum, t) => sum + t.amount, 0);
        weeklyData.push({ month: `Week ${week}`, income: weekIncome, expense: weekExpense });
      }
      return weeklyData;
    } else {
      // Year or All - show by months
      const monthsToShow = dateRange === 'year' ? currentMonth + 1 : 12;
      return months.slice(0, monthsToShow).map((month, index) => {
        const monthExpenses = expenses.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate.getMonth() === index && expenseDate.getFullYear() === currentYear;
        });
        const monthIncome = transactions
          .filter((t) => {
            const transDate = new Date(t.date);
            return transDate.getMonth() === index && transDate.getFullYear() === currentYear && t.type === 'selling';
          })
          .reduce((sum, t) => sum + t.amount, 0);
        const monthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        return { month, income: monthIncome, expense: monthExpense };
      });
    }
  }, [expenses, transactions, dateRange]);

  // Handle add expense - also adds to transactions
  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    
    const expenseId = `exp-${Date.now()}`;
    const expenseAmount = parseFloat(newExpense.amount);
    
    try {
      // Map frontend category to API category
      const categoryMap: Record<string, ApiExpenseData['category']> = {
        'Rent': 'Rent',
        'Utilities': 'Utilities',
        'Salary': 'Salary',
        'Inventory': 'Inventory',
        'Transport': 'Transport',
        'Food': 'Food',
        'Office Supplies': 'Office Supplies',
        'Phone/Internet': 'Phone',
        'Marketing': 'Marketing',
        'Other': 'Other',
      };

      // Create expense via API
      const apiData: ApiExpenseData = {
        category: categoryMap[newExpense.category] || 'Other',
        amount: expenseAmount,
        description: newExpense.description,
        date: newExpense.date,
        is_necessary: newExpense.isNecessary,
      };

      const response = await expenseApi.create(apiData);
      
      // Add to local expenses store with API-returned ID
      addExpense({
        id: response.expense.id.toString(),
        category: newExpense.category,
        amount: expenseAmount,
        description: newExpense.description,
        date: newExpense.date,
        isNecessary: newExpense.isNecessary,
      });
      
      // Also add to transactions so it shows in transaction page
      addTransaction({
        id: `trans-${Date.now()}`,
        type: 'expense',
        amount: expenseAmount,
        date: newExpense.date,
        description: `${newExpense.category}: ${newExpense.description}`,
        partyName: 'Business Expense',
      });
      
      setNewExpense({ 
        category: 'Other', 
        amount: '', 
        description: '', 
        date: new Date().toISOString().split('T')[0], 
        isNecessary: true 
      });
      setShowAddModal(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterType('all');
    setDateRange('all');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-6 sm:pb-8">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Header - Interactive Style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-linear-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-100 dark:border-red-800/30 hover:shadow-lg transition-all duration-300 cursor-default flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-linear-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <NepaliRupeeIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {t('expenseMonitoring.title')}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                  {t('expenseMonitoring.tracker') || 'Tracker'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('expenseMonitoring.pageDescription')}</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shrink-0" size="sm">
            <FiPlus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" /> <span className="hidden sm:inline">{t('expenseMonitoring.addExpense')}</span><span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card 
            className="p-3 sm:p-6 bg-linear-to-br from-red-500 to-pink-600 border-0 text-white col-span-2 lg:col-span-1 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
            onClick={() => navigate('/reports')}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-red-100 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{t('expenseMonitoring.totalExpenses')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{c(totalExpenses)}</p>
                <p className="text-red-200 text-[10px] sm:text-xs mt-1 sm:mt-2">{n(filteredExpenses.length)} {t('expenseMonitoring.transactions')}</p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <FiTrendingDown className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-3 sm:p-6 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
            onClick={() => setFilterType('necessary')}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{t('expenseMonitoring.necessary')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700 dark:text-green-300 truncate">{c(necessaryExpenses)}</p>
                <p className="text-green-500 text-[10px] sm:text-xs mt-1 sm:mt-2 flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3" />
                  {n(filteredExpenses.filter(e => e.isNecessary).length)} {t('expenseMonitoring.items')}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <FiCheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-3 sm:p-6 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
            onClick={() => setFilterType('unnecessary')}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{t('expenseMonitoring.unnecessary')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-700 dark:text-orange-300 truncate">{c(unnecessaryExpenses)}</p>
                <p className="text-orange-500 text-[10px] sm:text-xs mt-1 sm:mt-2 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />
                  {n(filteredExpenses.filter(e => !e.isNecessary).length)} {t('expenseMonitoring.items')}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <FiAlertCircle className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-6 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="min-w-0">
                <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{t('expenseMonitoring.monthlyBudget')}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-300 truncate">{c(budgetRemaining)}</p>
                <p className="text-blue-500 text-[10px] sm:text-xs">{t('expenseMonitoring.remaining')} {t('expenseMonitoring.of')} {c(monthlyBudget)}</p>
              </div>
              <button 
                onClick={() => { setTempBudget(monthlyBudget.toString()); setShowBudgetModal(true); }}
                className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors shrink-0"
                title={t('expenseMonitoring.editBudget')}
              >
                <FiEdit2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 sm:h-2.5">
              <div className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${budgetUsedPercent > 90 ? 'bg-red-500' : budgetUsedPercent > 70 ? 'bg-orange-500' : 'bg-blue-600'}`} style={{ width: `${budgetUsedPercent}%` }} />
            </div>
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mt-1.5 sm:mt-2 text-right">{n(budgetUsedPercent.toFixed(0))}% {t('expenseMonitoring.used')}</p>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input 
                type="text" 
                placeholder={t('expenseMonitoring.search')} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500" 
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['week', 'month', 'year', 'all'] as const).map((range) => (
                <button key={range} onClick={() => setDateRange(range)} className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${dateRange === range ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {t(`expenseMonitoring.${range}`)}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="all">{t('expenseMonitoring.categories.all')}</option>
                {EXPENSE_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'necessary' | 'unnecessary')} className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="all">{t('expenseMonitoring.allTypes')}</option>
                <option value="necessary">{t('expenseMonitoring.necessary')}</option>
                <option value="unnecessary">{t('expenseMonitoring.unnecessary')}</option>
              </select>
              {(searchQuery || filterCategory !== 'all' || filterType !== 'all' || dateRange !== 'all') && (
                <button onClick={clearFilters} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <FiX className="w-4 h-4" /> {t('common.clear')}
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-6 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center gap-2">
              <FiPieChart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> {t('expenseMonitoring.breakdown')}
            </h3>
            {categoryBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={5} dataKey="value">
                      {categoryBreakdown.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => c(value)} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 sm:space-y-2 mt-3 sm:mt-4">
                  {categoryBreakdown.slice(0, 5).map((cat, index) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{cat.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{c(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-400">
                <FiPieChart className="w-10 h-10 sm:w-12 sm:h-12 mb-2" />
                <p className="text-sm">{t('expenseMonitoring.noExpenses')}</p>
              </div>
            )}
          </Card>

          <Card className="p-3 sm:p-6 lg:col-span-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> {t('expenseMonitoring.sevenDayTrend')}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="day" stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [c(value), t('expenseMonitoring.spent')]} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Income vs Expenses Chart */}
        <Card className="p-3 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center gap-2">
            <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" /> {t('expenseMonitoring.monthlyIncomeVsExpense')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => c(value)} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', borderRadius: '8px', color: isDark ? '#f3f4f6' : '#111827' }} />
              <Legend wrapperStyle={{ color: isDark ? '#f3f4f6' : '#111827', fontSize: 12 }} />
              <Bar dataKey="income" fill="#10b981" name={t('expenseMonitoring.income')} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name={t('expenseMonitoring.expense')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expenses List */}
        <Card className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{t('expenseMonitoring.recentExpenses')} ({n(filteredExpenses.length)})</h3>
          </div>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <NepaliRupeeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">{t('expenseMonitoring.noExpenses')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">{t('expenseMonitoring.startTracking')}</p>
              <Button onClick={() => setShowAddModal(true)} size="sm"><FiPlus className="w-4 h-4 mr-2" />{t('expenseMonitoring.addFirstExpense')}</Button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredExpenses.map((expense) => {
                const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG['Other'];
                const Icon = config.icon;
                return (
                  <div key={expense.id} className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{expense.description}</h4>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium shrink-0 ${expense.isNecessary ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {expense.isNecessary ? t('expenseMonitoring.necessary') : t('expenseMonitoring.unnecessary')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{expense.category}</span>
                        <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">{new Date(expense.date).toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400">-{c(expense.amount)}</p>
                      <p className="text-[10px] sm:hidden text-gray-500">{new Date(expense.date).toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <FiPlus className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="truncate">{t('expenseMonitoring.addExpense')}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t('expenseMonitoring.category')}</label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const config = CATEGORY_CONFIG[cat];
                    const Icon = config.icon;
                    return (
                      <button key={cat} onClick={() => setNewExpense({ ...newExpense, category: cat })} className={`p-2 sm:p-3 rounded-lg flex flex-col items-center gap-0.5 sm:gap-1 transition-all ${newExpense.category === cat ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`} title={cat}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: config.color }} />
                        <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">{cat.split('/')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t('expenseMonitoring.amount')} ({t('common.currencySymbol')})</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">{t('common.currencySymbol')}</span>
                  <input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="0" className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-lg sm:text-xl font-bold border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t('expenseMonitoring.description')}</label>
                <input type="text" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder={t('expenseMonitoring.whatWasExpenseFor')} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t('expenseMonitoring.date')}</label>
                <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{t('expenseMonitoring.isThisNecessary')}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{t('expenseMonitoring.markAsUnnecessary')}</p>
                </div>
                <button onClick={() => setNewExpense({ ...newExpense, isNecessary: !newExpense.isNecessary })} className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors shrink-0 ${newExpense.isNecessary ? 'bg-green-500' : 'bg-orange-500'}`}>
                  <div className={`absolute top-0.5 sm:top-1 w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full shadow-md transition-all ${newExpense.isNecessary ? 'left-6 sm:left-7' : 'left-1'}`} />
                </button>
              </div>
              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2 text-sm">
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}
              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <Button variant="outline" onClick={() => { setShowAddModal(false); setSubmitError(''); }} className="flex-1" size="sm" disabled={isSubmitting}>{t('common.cancel')}</Button>
                <Button onClick={handleAddExpense} disabled={!newExpense.amount || !newExpense.description || isSubmitting} className="flex-1 bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:opacity-50" size="sm">
                  {isSubmitting ? (
                    <>
                      <FiLoader className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />Saving...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4 mr-1 sm:mr-2" />{t('expenseMonitoring.addExpense')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Budget Edit Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <FiTarget className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                {t('expenseMonitoring.setBudget')}
              </h3>
              <button onClick={() => setShowBudgetModal(false)} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t('expenseMonitoring.monthlyBudget')} ({t('common.currencySymbol')})</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">{t('common.currencySymbol')}</span>
                  <input 
                    type="number" 
                    value={tempBudget} 
                    onChange={(e) => setTempBudget(e.target.value)} 
                    placeholder="100000" 
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-lg sm:text-xl font-bold border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTempBudget((prev) => Math.max(0, parseFloat(prev || '0') - 10000).toString())}
                  className="flex-1 py-2.5 sm:py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-1 sm:gap-2"
                >
                  <FiMinus className="w-4 h-4" /> -{n(10000)}
                </button>
                <button 
                  onClick={() => setTempBudget((prev) => (parseFloat(prev || '0') + 10000).toString())}
                  className="flex-1 py-2.5 sm:py-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-1 sm:gap-2"
                >
                  <FiPlus className="w-4 h-4" /> +{n(10000)}
                </button>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t('expenseMonitoring.currentMonthSpending')} <span className="font-bold text-red-600 dark:text-red-400">{c(thisMonthExpenses)}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('expenseMonitoring.newRemaining')} <span className="font-bold text-blue-600 dark:text-blue-400">{c(Math.max(0, (parseFloat(tempBudget) || 0) - thisMonthExpenses))}</span>
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <Button variant="outline" onClick={() => setShowBudgetModal(false)} className="flex-1" size="sm">{t('common.cancel')}</Button>
                <Button onClick={saveBudget} className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm">
                  {t('expenseMonitoring.save')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
