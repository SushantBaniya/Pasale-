import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { useTranslation } from '../../utils/i18n';
import { useThemeStore } from '../../store/themeStore';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiClock,
  FiActivity,
  FiAlertTriangle,
  FiArrowUpRight,
  FiArrowDownRight,
  FiTarget,
  FiBarChart2,
  FiExternalLink,
  FiChevronRight,
} from 'react-icons/fi';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const getAuthToken = () => localStorage.getItem('auth_token');

interface LowStockItem {
  id: string;
  name: string;
  minStock: number;
  current: number;
}

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

// Mini sparkline component
const MiniSparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ 
  data, color, height = 32 
}) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, c, n } = useTranslation();
  const { theme } = useThemeStore();
  const { getTotalSales, getTotalReceivable, getTotalPayable, getCashInHand, transactions, expenses, parties } = useDataStore();
  const { userProfile } = useAuthStore();
  const { businessName } = useBusinessStore();
  
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const isDark = theme === 'dark';
  const today = new Date();

  // Fetch products for low stock
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/products/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          const products = data.results || data || [];
          const lowStock = products
            .filter((product: any) => product.quantity <= 10)
            .map((product: any) => ({
              id: String(product.id),
              name: product.product_name,
              minStock: 10,
              current: product.quantity,
            }));
          setLowStockItems(lowStock);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  // Dashboard calculations
  const totalSales = getTotalSales();
  const totalReceivable = getTotalReceivable();
  const totalPayable = getTotalPayable();
  const cashInHand = getCashInHand();
  const netBalance = totalReceivable - totalPayable;

  const isSameDay = (dateStr: string, base: Date) => {
    const d = new Date(dateStr);
    return d.getFullYear() === base.getFullYear() && d.getMonth() === base.getMonth() && d.getDate() === base.getDate();
  };

  // Calculate real trends
  const { salesChange, todaySalesTotal, last7DaysSales, recentTransactions, todayTransactionsCount } = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthSales = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'selling' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonthSales = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'selling' && d.getMonth() === previousMonth && d.getFullYear() === previousYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const todayTransactions = transactions.filter((t) => isSameDay(t.date, today));
    const todaySalesTotal = todayTransactions
      .filter((t) => t.type === 'selling')
      .reduce((sum, t) => sum + t.amount, 0);

    // Last 7 days sales for sparkline
    const last7DaysSales = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - idx));
      return transactions
        .filter((t) => t.type === 'selling' && isSameDay(t.date, date))
        .reduce((s, t) => s + t.amount, 0);
    });

    // Recent transactions for activity feed
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      salesChange: previousMonthSales > 0 ? calculatePercentageChange(currentMonthSales, previousMonthSales) : 0,
      todaySalesTotal,
      last7DaysSales,
      recentTransactions,
      todayTransactionsCount: todayTransactions.length,
    };
  }, [transactions, today]);

  // Chart data
  const chartData = useMemo(() => {
    if (chartPeriod === 'weekly') {
      return Array.from({ length: 7 }).map((_, idx) => {
        const date = new Date();
        date.setDate(today.getDate() - (6 - idx));
        const label = date.toLocaleDateString('en-US', { weekday: 'short' });
        const salesSum = transactions
          .filter((t) => t.type === 'selling' && isSameDay(t.date, date))
          .reduce((s, t) => s + t.amount, 0);
        const expenseSum =
          transactions.filter((t) => t.type === 'purchase' && isSameDay(t.date, date)).reduce((s, t) => s + t.amount, 0) +
          expenses.filter((e) => isSameDay(e.date, date)).reduce((s, e) => s + e.amount, 0);
        return { name: label, sales: salesSum, expenses: expenseSum };
      });
    } else if (chartPeriod === 'monthly') {
      return Array.from({ length: 12 }).map((_, idx) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - idx));
        const m = date.getMonth();
        const y = date.getFullYear();
        const label = date.toLocaleDateString('en-US', { month: 'short' });
        const salesSum = transactions
          .filter((t) => {
            const d = new Date(t.date);
            return t.type === 'selling' && d.getMonth() === m && d.getFullYear() === y;
          })
          .reduce((s, t) => s + t.amount, 0);
        const expenseSum =
          transactions.filter((t) => {
            const d = new Date(t.date);
            return t.type === 'purchase' && d.getMonth() === m && d.getFullYear() === y;
          }).reduce((s, t) => s + t.amount, 0) +
          expenses.filter((e) => {
            const d = new Date(e.date);
            return d.getMonth() === m && d.getFullYear() === y;
          }).reduce((s, e) => s + e.amount, 0);
        return { name: label, sales: salesSum, expenses: expenseSum };
      });
    } else {
      return Array.from({ length: 5 }).map((_, idx) => {
        const year = today.getFullYear() - (4 - idx);
        const salesSum = transactions
          .filter((t) => new Date(t.date).getFullYear() === year && t.type === 'selling')
          .reduce((s, t) => s + t.amount, 0);
        const expenseSum =
          transactions.filter((t) => new Date(t.date).getFullYear() === year && t.type === 'purchase').reduce((s, t) => s + t.amount, 0) +
          expenses.filter((e) => new Date(e.date).getFullYear() === year).reduce((s, e) => s + e.amount, 0);
        return { name: `${year}`, sales: salesSum, expenses: expenseSum };
      });
    }
  }, [transactions, expenses, chartPeriod, today]);

  // Insights calculation
  const insights = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) +
      transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0);
    
    const profitMargin = totalSales > 0 ? ((totalSales - totalExpenses) / totalSales * 100) : 0;
    const avgDailyRevenue = totalSales / 30;
    
    // Best selling day calculation
    const salesByDay = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - idx));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const sales = transactions
        .filter((t) => t.type === 'selling' && isSameDay(t.date, date))
        .reduce((s, t) => s + t.amount, 0);
      return { day: dayName, sales };
    });
    const bestDay = salesByDay.reduce((best, curr) => curr.sales > best.sales ? curr : best, salesByDay[0]);
    
    // Expense categories
    const expenseCategories = expenses.reduce((acc, e) => {
      const cat = e.category || 'Other';
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
    const topExpenseCategory = Object.entries(expenseCategories)
      .sort(([,a], [,b]) => b - a)[0] || ['None', 0];

    // Best selling product/party
    const salesByParty = transactions
      .filter(t => t.type === 'selling' && t.partyName)
      .reduce((acc, t) => {
        const name = t.partyName || 'Unknown';
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    const topParty = Object.entries(salesByParty)
      .sort(([,a], [,b]) => b - a)[0] || ['No data', 0];

    return {
      profitMargin: profitMargin.toFixed(1),
      avgDailyRevenue,
      bestSalesDay: bestDay?.day || 'N/A',
      bestSalesAmount: bestDay?.sales || 0,
      topExpenseCategory: topExpenseCategory[0],
      topExpenseAmount: topExpenseCategory[1] as number,
      topParty: topParty[0],
      topPartyAmount: topParty[1] as number,
    };
  }, [totalSales, expenses, transactions, today]);

  // Business health
  const businessHealth = useMemo(() => {
    const cashFlowRatio = totalPayable > 0 ? cashInHand / totalPayable : 999;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (cashFlowRatio < 1) status = 'critical';
    else if (cashFlowRatio < 2) status = 'warning';
    
    const overdueReceivables = parties
      .filter(p => p.type === 'customer' && (p.balance || 0) > 0)
      .reduce((sum, p) => sum + (p.balance || 0), 0);
    
    const pendingPayments = parties
      .filter(p => p.type === 'supplier' && (p.balance || 0) < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance || 0), 0);

    return { status, cashFlowRatio, overdueReceivables, pendingPayments };
  }, [cashInHand, totalPayable, parties]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserName = (): string => {
    if (businessName) return businessName;
    if (userProfile?.businessName) return userProfile.businessName;
    if (userProfile?.name) return userProfile.name;
    if (userProfile?.email) return userProfile.email.split('@')[0];
    return 'User';
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-6">
      {/* Page Header - Greeting with Modern Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-white">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {getGreeting()}, {getUserName()} 👋
            </h1>
            <div className="flex items-center gap-2 text-white/80 mt-2">
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white">
              <p className="text-xs opacity-80">Today's Sales</p>
              <p className="text-lg font-bold">{c(todaySalesTotal)}</p>
            </div>
            <div className="px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white">
              <p className="text-xs opacity-80">Transactions</p>
              <p className="text-lg font-bold">{todayTransactionsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row - Enhanced with Glass Effect */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
        {/* Total Sales - Featured Card */}
        <button
          onClick={() => navigate('/reports')}
          className="col-span-2 lg:col-span-1 group text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        >
          <div className="relative h-full bg-blue-600 rounded-xl p-3 lg:p-4 text-white overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group-hover:scale-[1.01]">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiTrendingUp className="w-4 h-4" />
                </div>
                {salesChange !== 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${salesChange >= 0 ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}>
                    {salesChange >= 0 ? '↑' : '↓'} {Math.abs(salesChange)}%
                  </span>
                )}
              </div>
              <p className="text-white/70 text-[10px] font-medium mb-0.5 uppercase tracking-wider">{t('dashboard.totalSales')}</p>
              <p className="text-xl lg:text-2xl font-bold tracking-tight">{c(totalSales)}</p>
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="h-8 opacity-80">
                  <MiniSparkline data={last7DaysSales} color="#ffffff" height={32} />
                </div>
                <p className="text-[9px] text-white/60 mt-1">Last 7 days trend</p>
              </div>
            </div>
          </div>
        </button>

        {/* Receivable Card */}
        <button
          onClick={() => navigate('/dashboard/kpi/receivable')}
          className="group text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg p-2.5 lg:p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                  <FiArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mb-0.5 uppercase tracking-wider">{t('dashboard.totalReceivable')}</p>
              <p className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">{c(totalReceivable)}</p>
              <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  From {parties.filter(p => p.type === 'customer').length} customers
                </p>
              </div>
            </div>
          </div>
        </button>

        {/* Payable Card */}
        <button
          onClick={() => navigate('/dashboard/kpi/payable')}
          className="group text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg p-2.5 lg:p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300">
                  <FiArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mb-0.5 uppercase tracking-wider">{t('dashboard.totalPayable')}</p>
              <p className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">{c(totalPayable)}</p>
              <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  To {parties.filter(p => p.type === 'supplier').length} suppliers
                </p>
              </div>
            </div>
          </div>
        </button>

        {/* Cash in Hand Card */}
        <button
          onClick={() => navigate('/dashboard/kpi/cash')}
          className="group text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg p-2.5 lg:p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  <FiDollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mb-0.5 uppercase tracking-wider">{t('dashboard.cashInHand')}</p>
              <p className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">{c(cashInHand)}</p>
              <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400">Available balance</p>
              </div>
            </div>
          </div>
        </button>

        {/* Net Balance Card */}
        <button
          onClick={() => navigate('/dashboard/kpi/balance')}
          className="group text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg p-2.5 lg:p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300">
                  <FiPieChart className="w-4 h-4" />
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${netBalance >= 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {netBalance >= 0 ? '↑ Positive' : '↓ Negative'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mb-0.5 uppercase tracking-wider">{t('dashboard.netBalance')}</p>
              <p className={`text-base lg:text-lg font-bold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{c(netBalance)}</p>
              <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400">Receivable - Payable</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Analytics Section - Enhanced Glass Effect */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Chart - 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 overflow-hidden">
          <div className="p-5 lg:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FiBarChart2 className="w-4 h-4 text-white" />
                </div>
                Revenue Analytics
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track your sales and expenses over time</p>
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl shadow-inner">
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${chartPeriod === p ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 lg:p-6 h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
                    padding: '12px 16px',
                  }}
                  formatter={(value: number) => [c(value), '']}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fill="url(#salesGradient)" name="Sales" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fill="url(#expenseGradient)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Chart Legend & Summary */}
          <div className="px-5 lg:px-6 pb-5 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm shadow-blue-500/50"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-sm shadow-red-500/50"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Expenses</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              View Reports <FiChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Insights Panel - Enhanced */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FiTarget className="w-4 h-4 text-white" />
              </div>
              Quick Insights
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {/* Today's Sales - Clickable */}
            <button
              onClick={() => navigate('/dashboard/todays-sales')}
              className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 text-left group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <FiTrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">Today's Sales</p>
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{c(todaySalesTotal)}</p>
                  </div>
                </div>
                <FiChevronRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Pending Receivables - Clickable */}
            <button
              onClick={() => navigate('/dashboard/kpi/receivable')}
              className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-300 text-left group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <FiUsers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">Pending Receivables</p>
                    <p className="text-lg font-bold text-indigo-800 dark:text-indigo-300">{c(businessHealth.overdueReceivables)}</p>
                  </div>
                </div>
                <FiChevronRight className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Low Inventory - Clickable */}
            <button
              onClick={() => navigate('/inventory?filter=low-stock')}
              className="w-full p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all duration-300 text-left group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <FiPackage className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">Low Stock Items</p>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-300">{lowStockItems.length} items</p>
                  </div>
                </div>
                <FiChevronRight className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Top Customer - Clickable */}
            <button
              onClick={() => navigate('/parties?type=customer')}
              className="w-full p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-xl hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-900/30 dark:hover:to-gray-900/30 transition-all duration-300 text-left group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-500/30">
                    <FiBarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">Top Customer</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-300 truncate max-w-[120px]">{insights.topParty}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{c(insights.topPartyAmount)}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Row - Activity + Health - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FiActivity className="w-4 h-4 text-white" />
              </div>
              Recent Activity
            </h3>
            <button onClick={() => navigate('/transactions')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              View All <FiArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <FiClock className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm font-medium">No recent transactions</p>
                <p className="text-xs text-gray-400 mt-1">Start by adding a sale or purchase</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-slate-300 dark:to-slate-700 rounded-full" />
                
                <div className="space-y-4">
                  {recentTransactions.map((tx, index) => (
                    <button
                      key={tx.id}
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                      className="relative flex items-start gap-4 pl-12 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-3 rounded-xl transition-all duration-200 hover:shadow-md group"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-3 w-4 h-4 rounded-full ring-4 ring-white dark:ring-gray-800 shadow-lg ${tx.type === 'selling' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tx.description || (tx.type === 'selling' ? 'Sale' : 'Purchase')}
                          </p>
                          <span className={`text-sm font-bold ${tx.type === 'selling' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {tx.type === 'selling' ? '+' : '-'}{c(tx.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {tx.partyName && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <FiUsers className="w-3 h-3" />
                                {tx.partyName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <FiChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Health Panel - Enhanced */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FiActivity className="w-4 h-4 text-white" />
              </div>
              Business Health
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {/* Cash Flow Status */}
            <div className={`p-5 rounded-xl ${businessHealth.status === 'healthy' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' : businessHealth.status === 'warning' ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cash Flow Ratio</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${businessHealth.status === 'healthy' ? 'bg-blue-500 text-white' : businessHealth.status === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                  {businessHealth.status === 'healthy' ? '✓ Healthy' : businessHealth.status === 'warning' ? '⚠ Warning' : '✗ Critical'}
                </span>
              </div>
              <p className={`text-4xl font-extrabold ${businessHealth.status === 'healthy' ? 'text-blue-700 dark:text-blue-400' : businessHealth.status === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                {businessHealth.cashFlowRatio >= 999 ? '∞' : businessHealth.cashFlowRatio.toFixed(1)}x
              </p>
              <p className="text-xs text-gray-500 mt-2">Cash coverage of liabilities</p>
            </div>

            {/* Outstanding Receivables */}
            <button
              onClick={() => navigate('/dashboard/kpi/receivable')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center shadow-sm">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">Outstanding Receivables</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{c(businessHealth.overdueReceivables)}</p>
                </div>
              </div>
              <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Low Stock Alert */}
            <button
              onClick={() => navigate('/inventory?filter=low-stock')}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group ${lowStockItems.length > 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100' : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${lowStockItems.length > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <FiPackage className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">Low Stock Items</p>
                  <p className={`text-base font-bold ${lowStockItems.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                    {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Pending Payments */}
            <button
              onClick={() => navigate('/dashboard/kpi/payable')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900/30 dark:to-slate-800/20 flex items-center justify-center shadow-sm">
                  <FiClock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">Pending to Suppliers</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{c(businessHealth.pendingPayments)}</p>
                </div>
              </div>
              <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner - Enhanced */}
      {lowStockItems.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-5 sm:p-6 text-white shadow-2xl shadow-amber-500/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E')]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Low Stock Alert</h3>
                <p className="text-white/80 text-sm mt-1">
                  <span className="font-semibold">{lowStockItems.filter(i => i.current === 0).length}</span> out of stock, <span className="font-semibold">{lowStockItems.filter(i => i.current > 0).length}</span> running low
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/inventory?filter=low-stock')}
              className="px-5 py-2.5 bg-white text-amber-600 rounded-xl font-bold text-sm hover:bg-white/90 transition-all duration-200 shrink-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              View Inventory →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
