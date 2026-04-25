import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { useTranslation } from '../../utils/i18n';
import { useThemeStore } from '../../store/themeStore';
import {
  FiTrendingUp,
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
  FiBarChart2,
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

const MiniSparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({
  data, color, height = 28,
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
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, c } = useTranslation();
  const { theme } = useThemeStore();
  const { getTotalSales, getTotalReceivable, getTotalPayable, getCashInHand, transactions, expenses, parties } = useDataStore();
  const { userProfile } = useAuthStore();
  const { businessName } = useBusinessStore();

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const isDark = theme === 'dark';
  const today = new Date();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = getAuthToken();
        const businessId = localStorage.getItem('business_id');
        if (!token || !businessId) return;
        
        const response = await fetch(`${API_BASE_URL}/products/b${businessId}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const products = data.results || data || [];
          setLowStockItems(
            products
              .filter((p: any) => p.quantity <= 10)
              .map((p: any) => ({ id: String(p.id), name: p.product_name, minStock: 10, current: p.quantity }))
          );
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  const totalSales = getTotalSales();
  const totalReceivable = getTotalReceivable();
  const totalPayable = getTotalPayable();
  const cashInHand = getCashInHand();
  const netBalance = totalReceivable - totalPayable;

  const isSameDay = (dateStr: string, base: Date) => {
    const d = new Date(dateStr);
    return d.getFullYear() === base.getFullYear() && d.getMonth() === base.getMonth() && d.getDate() === base.getDate();
  };

  const { salesChange, todaySalesTotal, last7DaysSales, recentTransactions, todayTransactionsCount } = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthSales = transactions
      .filter((t) => { const d = new Date(t.date); return t.type === 'selling' && d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonthSales = transactions
      .filter((t) => { const d = new Date(t.date); return t.type === 'selling' && d.getMonth() === previousMonth && d.getFullYear() === previousYear; })
      .reduce((sum, t) => sum + t.amount, 0);

    const todayTxs = transactions.filter((t) => isSameDay(t.date, today));
    const todaySalesTotal = todayTxs.filter((t) => t.type === 'selling').reduce((sum, t) => sum + t.amount, 0);

    const last7DaysSales = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - idx));
      return transactions.filter((t) => t.type === 'selling' && isSameDay(t.date, date)).reduce((s, t) => s + t.amount, 0);
    });

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    return {
      salesChange: previousMonthSales > 0 ? calculatePercentageChange(currentMonthSales, previousMonthSales) : 0,
      todaySalesTotal,
      last7DaysSales,
      recentTransactions,
      todayTransactionsCount: todayTxs.length,
    };
  }, [transactions, today]);

  const chartData = useMemo(() => {
    if (chartPeriod === 'weekly') {
      return Array.from({ length: 7 }).map((_, idx) => {
        const date = new Date();
        date.setDate(today.getDate() - (6 - idx));
        const label = date.toLocaleDateString('en-US', { weekday: 'short' });
        const salesSum = transactions.filter((t) => t.type === 'selling' && isSameDay(t.date, date)).reduce((s, t) => s + t.amount, 0);
        const expenseSum = transactions.filter((t) => t.type === 'purchase' && isSameDay(t.date, date)).reduce((s, t) => s + t.amount, 0)
          + expenses.filter((e) => isSameDay(e.date, date)).reduce((s, e) => s + e.amount, 0);
        return { name: label, sales: salesSum, expenses: expenseSum };
      });
    } else if (chartPeriod === 'monthly') {
      return Array.from({ length: 12 }).map((_, idx) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - idx));
        const m = date.getMonth();
        const y = date.getFullYear();
        const label = date.toLocaleDateString('en-US', { month: 'short' });
        const salesSum = transactions.filter((t) => { const d = new Date(t.date); return t.type === 'selling' && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, t) => s + t.amount, 0);
        const expenseSum = transactions.filter((t) => { const d = new Date(t.date); return t.type === 'purchase' && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, t) => s + t.amount, 0)
          + expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; }).reduce((s, e) => s + e.amount, 0);
        return { name: label, sales: salesSum, expenses: expenseSum };
      });
    } else {
      return Array.from({ length: 5 }).map((_, idx) => {
        const year = today.getFullYear() - (4 - idx);
        const salesSum = transactions.filter((t) => new Date(t.date).getFullYear() === year && t.type === 'selling').reduce((s, t) => s + t.amount, 0);
        const expenseSum = transactions.filter((t) => new Date(t.date).getFullYear() === year && t.type === 'purchase').reduce((s, t) => s + t.amount, 0)
          + expenses.filter((e) => new Date(e.date).getFullYear() === year).reduce((s, e) => s + e.amount, 0);
        return { name: `${year}`, sales: salesSum, expenses: expenseSum };
      });
    }
  }, [transactions, expenses, chartPeriod, today]);

  const insights = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      + transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0);
    const profitMargin = totalSales > 0 ? ((totalSales - totalExpenses) / totalSales * 100) : 0;

    const salesByParty = transactions
      .filter(t => t.type === 'selling' && t.partyName)
      .reduce((acc, t) => {
        const name = t.partyName || 'Unknown';
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    const topParty = Object.entries(salesByParty).sort(([, a], [, b]) => b - a)[0] || ['No data', 0];

    return {
      profitMargin: profitMargin.toFixed(1),
      topParty: topParty[0],
      topPartyAmount: topParty[1] as number,
    };
  }, [totalSales, expenses, transactions]);

  const businessHealth = useMemo(() => {
    const cashFlowRatio = totalPayable > 0 ? cashInHand / totalPayable : 999;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (cashFlowRatio < 1) status = 'critical';
    else if (cashFlowRatio < 2) status = 'warning';
    const overdueReceivables = parties.filter(p => p.type === 'customer' && (p.balance || 0) > 0).reduce((sum, p) => sum + (p.balance || 0), 0);
    const pendingPayments = parties.filter(p => p.type === 'supplier' && (p.balance || 0) < 0).reduce((sum, p) => sum + Math.abs(p.balance || 0), 0);
    return { status, cashFlowRatio, overdueReceivables, pendingPayments };
  }, [cashInHand, totalPayable, parties]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
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
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {getUserName()} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
            <FiCalendar className="w-3.5 h-3.5" />
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Today's Sales</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{c(todaySalesTotal)}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Transactions</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{todayTransactionsCount}</p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

        {/* Total Sales */}
        <button
          onClick={() => navigate('/reports')}
          className="col-span-2 lg:col-span-1 text-left bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4" />
            </div>
            {salesChange !== 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${salesChange >= 0 ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'}`}>
                {salesChange >= 0 ? '↑' : '↓'}{Math.abs(salesChange)}%
              </span>
            )}
          </div>
          <p className="text-xs text-white/70 uppercase tracking-wider mb-1">{t('dashboard.totalSales')}</p>
          <p className="text-xl font-bold">{c(totalSales)}</p>
          <div className="mt-3 h-7">
            <MiniSparkline data={last7DaysSales} color="rgba(255,255,255,0.8)" height={28} />
          </div>
          <p className="text-[10px] text-white/50 mt-1">Last 7 days</p>
        </button>

        {/* Receivable */}
        <button
          onClick={() => navigate('/dashboard/kpi/receivable')}
          className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
            <FiArrowDownRight className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('dashboard.totalReceivable')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{c(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-2">{parties.filter(p => p.type === 'customer').length} customers</p>
        </button>

        {/* Payable */}
        <button
          onClick={() => navigate('/dashboard/kpi/payable')}
          className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 mb-3">
            <FiArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('dashboard.totalPayable')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{c(totalPayable)}</p>
          <p className="text-xs text-gray-400 mt-2">{parties.filter(p => p.type === 'supplier').length} suppliers</p>
        </button>

        {/* Cash in Hand */}
        <button
          onClick={() => navigate('/dashboard/kpi/cash')}
          className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-3">
            <FiDollarSign className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('dashboard.cashInHand')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{c(cashInHand)}</p>
          <p className="text-xs text-gray-400 mt-2">Available balance</p>
        </button>

        {/* Net Balance */}
        <button
          onClick={() => navigate('/dashboard/kpi/balance')}
          className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FiPieChart className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${netBalance >= 0 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              {netBalance >= 0 ? '↑ +ve' : '↓ -ve'}
            </span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('dashboard.netBalance')}</p>
          <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{c(netBalance)}</p>
          <p className="text-xs text-gray-400 mt-2">Receivable − Payable</p>
        </button>
      </div>

      {/* ── Chart + Quick Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Sales vs Expenses</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartPeriod === p
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f3f4f6'} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="transparent"
                  tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="transparent"
                  tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#fff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [c(value), '']}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGradient)" name="Sales" dot={false} />
                <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} fill="url(#expenseGradient)" name="Expenses" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Sales
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Expenses
              </span>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
            >
              Full Report <FiChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Insights</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              {
                label: "Today's Sales",
                value: c(todaySalesTotal),
                icon: <FiTrendingUp className="w-4 h-4" />,
                iconCls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                onClick: () => navigate('/dashboard/todays-sales'),
              },
              {
                label: 'Pending Receivables',
                value: c(businessHealth.overdueReceivables),
                icon: <FiUsers className="w-4 h-4" />,
                iconCls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                onClick: () => navigate('/dashboard/kpi/receivable'),
              },
              {
                label: 'Low Stock Items',
                value: `${lowStockItems.length} items`,
                icon: <FiPackage className="w-4 h-4" />,
                iconCls: lowStockItems.length > 0
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-400',
                onClick: () => navigate('/inventory?filter=low-stock'),
              },
              {
                label: 'Top Customer',
                value: insights.topParty,
                sub: c(insights.topPartyAmount),
                icon: <FiBarChart2 className="w-4 h-4" />,
                iconCls: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                onClick: () => navigate('/parties?type=customer'),
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconCls}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[130px]">{item.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.sub && <span className="text-xs text-gray-400">{item.sub}</span>}
                  <FiChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions + Business Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
            >
              View All <FiArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <FiClock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No transactions yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Add a sale or purchase to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
              {recentTransactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => navigate(`/transactions/${tx.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${tx.type === 'selling'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                      {tx.type === 'selling' ? '↑' : '↓'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                        {tx.description || (tx.type === 'selling' ? 'Sale' : 'Purchase')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <FiClock className="w-3 h-3" />
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {tx.partyName && (
                          <>
                            <span className="text-gray-200 dark:text-gray-700">·</span>
                            {tx.partyName}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'selling'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    {tx.type === 'selling' ? '+' : '−'}{c(tx.amount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Business Health */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Business Health</h3>
          </div>
          <div className="p-5 space-y-4">

            {/* Cash Flow Ratio */}
            <div className={`rounded-lg p-4 ${businessHealth.status === 'healthy'
              ? 'bg-green-50 dark:bg-green-900/20'
              : businessHealth.status === 'warning'
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cash Flow Ratio</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${businessHealth.status === 'healthy'
                  ? 'bg-green-500 text-white'
                  : businessHealth.status === 'warning'
                    ? 'bg-amber-500 text-white'
                    : 'bg-red-500 text-white'
                  }`}>
                  {businessHealth.status === 'healthy' ? 'Healthy' : businessHealth.status === 'warning' ? 'Warning' : 'Critical'}
                </span>
              </div>
              <p className={`text-3xl font-bold mt-1 ${businessHealth.status === 'healthy'
                ? 'text-green-700 dark:text-green-400'
                : businessHealth.status === 'warning'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-red-700 dark:text-red-400'
                }`}>
                {businessHealth.cashFlowRatio >= 999 ? '∞' : businessHealth.cashFlowRatio.toFixed(1)}x
              </p>
              <p className="text-xs text-gray-400 mt-1">Cash coverage of liabilities</p>
            </div>

            {/* Metrics */}
            {[
              {
                label: 'Outstanding Receivables',
                value: c(businessHealth.overdueReceivables),
                icon: <FiUsers className="w-4 h-4" />,
                warn: false,
                onClick: () => navigate('/dashboard/kpi/receivable'),
              },
              {
                label: 'Low Stock Items',
                value: `${lowStockItems.length} items`,
                icon: <FiPackage className="w-4 h-4" />,
                warn: lowStockItems.length > 0,
                onClick: () => navigate('/inventory?filter=low-stock'),
              },
              {
                label: 'Pending to Suppliers',
                value: c(businessHealth.pendingPayments),
                icon: <FiClock className="w-4 h-4" />,
                warn: false,
                onClick: () => navigate('/dashboard/kpi/payable'),
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className="w-full flex items-center justify-between py-2.5 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${item.warn
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }`}>
                    {item.icon}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-semibold ${item.warn
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-900 dark:text-white'
                    }`}>
                    {item.value}
                  </span>
                  <FiChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Low Stock Banner ── */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Low Stock Alert</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {lowStockItems.filter(i => i.current === 0).length} out of stock
                &nbsp;·&nbsp;
                {lowStockItems.filter(i => i.current > 0).length} running low
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/inventory?filter=low-stock')}
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0"
          >
            View Inventory
          </button>
        </div>
      )}
    </div>
  );
}