import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { useTranslation } from '../../utils/i18n';
import { productApi } from '../../utils/api';
import { useThemeStore } from '../../store/themeStore';
import {
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiClock,
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
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  onClick: () => void;
  badge?: React.ReactNode;
  valueColor?: string;
  sparklineData?: number[];
  accent?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label, value, sub, icon, iconBg, onClick, badge, valueColor, sparklineData, accent,
}) => (
  <button
    onClick={onClick}
    className={[
      'text-left rounded-xl p-4 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      accent
        ? 'bg-blue-600 hover:bg-blue-700'
        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm',
    ].join(' ')}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      {badge}
    </div>
    <p className={`text-[10px] uppercase tracking-widest mb-1 ${accent ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
      {label}
    </p>
    <p className={`text-xl font-bold ${accent ? 'text-white' : (valueColor ?? 'text-gray-900 dark:text-white')}`}>
      {value}
    </p>
    {sparklineData && (
      <div className="mt-3 h-7">
        <MiniSparkline data={sparklineData} color="rgba(255,255,255,0.75)" height={28} />
      </div>
    )}
    <p className={`text-[11px] mt-1.5 ${accent ? 'text-white/45' : 'text-gray-400 dark:text-gray-500'}`}>
      {sub}
    </p>
  </button>
);

// ─── Row Button (insights / transactions / health metrics) ───────────────────

interface RowButtonProps {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  onClick: () => void;
  valueColor?: string;
}

const RowButton: React.FC<RowButtonProps> = ({
  iconBg, icon, label, value, sub, onClick, valueColor,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group border-b border-gray-100 dark:border-gray-800 last:border-b-0"
  >
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`text-sm font-semibold truncate max-w-[140px] ${valueColor ?? 'text-gray-900 dark:text-white'}`}>
          {value}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
      <FiChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
    </div>
  </button>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, c } = useTranslation();
  const { theme } = useThemeStore();
  const {
    getTotalSales, getTotalReceivable, getTotalPayable,
    getCashInHand, transactions, expenses, parties,
  } = useDataStore();
  const { userProfile } = useAuthStore();
  const { businessName } = useBusinessStore();

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const isDark = theme === 'dark';
  const today = new Date();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAll();
        const products = data.results || data || [];
        setLowStockItems(
          products
            .filter((p: any) => p.quantity <= 10)
            .map((p: any) => ({
              id: String(p.id),
              name: p.product_name,
              minStock: 10,
              current: p.quantity,
            }))
        );
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
    return (
      d.getFullYear() === base.getFullYear() &&
      d.getMonth() === base.getMonth() &&
      d.getDate() === base.getDate()
    );
  };

  const {
    salesChange,
    todaySalesTotal,
    last7DaysSales,
    recentTransactions,
    todayTransactionsCount,
  } = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthSales = transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        return tx.type === 'selling' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const previousMonthSales = transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        return tx.type === 'selling' && d.getMonth() === previousMonth && d.getFullYear() === previousYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const todayTxs = transactions.filter((tx) => isSameDay(tx.date, today));
    const todaySalesTotal = todayTxs
      .filter((tx) => tx.type === 'selling')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const last7DaysSales = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - idx));
      return transactions
        .filter((tx) => tx.type === 'selling' && isSameDay(tx.date, date))
        .reduce((s, tx) => s + tx.amount, 0);
    });

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    return {
      salesChange: previousMonthSales > 0
        ? calculatePercentageChange(currentMonthSales, previousMonthSales)
        : 0,
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
        const salesSum = transactions
          .filter((tx) => tx.type === 'selling' && isSameDay(tx.date, date))
          .reduce((s, tx) => s + tx.amount, 0);
        const expenseSum =
          transactions
            .filter((tx) => tx.type === 'purchase' && isSameDay(tx.date, date))
            .reduce((s, tx) => s + tx.amount, 0) +
          expenses
            .filter((e) => isSameDay(e.date, date))
            .reduce((s, e) => s + e.amount, 0);
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
          .filter((tx) => {
            const d = new Date(tx.date);
            return tx.type === 'selling' && d.getMonth() === m && d.getFullYear() === y;
          })
          .reduce((s, tx) => s + tx.amount, 0);
        const expenseSum =
          transactions
            .filter((tx) => {
              const d = new Date(tx.date);
              return tx.type === 'purchase' && d.getMonth() === m && d.getFullYear() === y;
            })
            .reduce((s, tx) => s + tx.amount, 0) +
          expenses
            .filter((e) => {
              const d = new Date(e.date);
              return d.getMonth() === m && d.getFullYear() === y;
            })
            .reduce((s, e) => s + e.amount, 0);
        return { name: label, sales: salesSum, expenses: expenseSum };
      });
    } else {
      return Array.from({ length: 5 }).map((_, idx) => {
        const year = today.getFullYear() - (4 - idx);
        const salesSum = transactions
          .filter((tx) => new Date(tx.date).getFullYear() === year && tx.type === 'selling')
          .reduce((s, tx) => s + tx.amount, 0);
        const expenseSum =
          transactions
            .filter((tx) => new Date(tx.date).getFullYear() === year && tx.type === 'purchase')
            .reduce((s, tx) => s + tx.amount, 0) +
          expenses
            .filter((e) => new Date(e.date).getFullYear() === year)
            .reduce((s, e) => s + e.amount, 0);
        return { name: `${year}`, sales: salesSum, expenses: expenseSum };
      });
    }
  }, [transactions, expenses, chartPeriod, today]);

  const insights = useMemo(() => {
    const totalExpenses =
      expenses.reduce((sum, e) => sum + e.amount, 0) +
      transactions.filter((tx) => tx.type === 'purchase').reduce((sum, tx) => sum + tx.amount, 0);
    const profitMargin =
      totalSales > 0 ? ((totalSales - totalExpenses) / totalSales) * 100 : 0;

    const salesByParty = transactions
      .filter((tx) => tx.type === 'selling' && tx.partyName)
      .reduce((acc, tx) => {
        const name = tx.partyName || 'Unknown';
        acc[name] = (acc[name] || 0) + tx.amount;
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
    const overdueReceivables = parties
      .filter((p) => p.type === 'customer' && (p.balance || 0) > 0)
      .reduce((sum, p) => sum + (p.balance || 0), 0);
    const pendingPayments = parties
      .filter((p) => p.type === 'supplier' && (p.balance || 0) < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance || 0), 0);
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

  const healthColors = {
    healthy: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      label: 'text-green-700 dark:text-green-400',
      value: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-600',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      label: 'text-amber-700 dark:text-amber-400',
      value: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-500',
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      label: 'text-red-700 dark:text-red-400',
      value: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-500',
    },
  };
  const hc = healthColors[businessHealth.status];

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {getUserName()}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
            <FiCalendar className="w-3.5 h-3.5" />
            {today.toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
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
        <KpiCard
          accent
          label={t('dashboard.totalSales')}
          value={c(totalSales)}
          sub="Last 7 days trend"
          iconBg="bg-white/20"
          icon={<FiTrendingUp className="w-4 h-4 text-white" />}
          onClick={() => navigate('/reports')}
          sparklineData={last7DaysSales}
          badge={
            salesChange !== 0 ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${salesChange >= 0 ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'
                }`}>
                {salesChange >= 0 ? '↑' : '↓'}{Math.abs(salesChange)}%
              </span>
            ) : undefined
          }
        />

        {/* Receivable */}
        <KpiCard
          label={t('dashboard.totalReceivable')}
          value={c(totalReceivable)}
          sub={`${parties.filter((p) => p.type === 'customer').length} customers`}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          icon={<FiArrowDownRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          onClick={() => navigate('/dashboard/kpi/receivable')}
        />

        {/* Payable */}
        <KpiCard
          label={t('dashboard.totalPayable')}
          value={c(totalPayable)}
          sub={`${parties.filter((p) => p.type === 'supplier').length} suppliers`}
          iconBg="bg-red-50 dark:bg-red-900/30"
          icon={<FiArrowUpRight className="w-4 h-4 text-red-500 dark:text-red-400" />}
          onClick={() => navigate('/dashboard/kpi/payable')}
        />

        {/* Cash in Hand */}
        <KpiCard
          label={t('dashboard.cashInHand')}
          value={c(cashInHand)}
          sub="Available balance"
          iconBg="bg-green-50 dark:bg-green-900/30"
          icon={<FiDollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />}
          onClick={() => navigate('/dashboard/kpi/cash')}
        />

        {/* Net Balance */}
        <KpiCard
          label={t('dashboard.netBalance')}
          value={c(netBalance)}
          sub="Receivable − Payable"
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          icon={<FiPieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          onClick={() => navigate('/dashboard/kpi/balance')}
          valueColor={netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          badge={
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${netBalance >= 0
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
              {netBalance >= 0 ? '↑ +ve' : '↓ -ve'}
            </span>
          }
        />
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1f2937' : '#f3f4f6'}
                  vertical={false}
                />
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
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
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
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  name="Sales"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f87171"
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                  name="Expenses"
                  dot={false}
                />
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
          <RowButton
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            icon={<FiTrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            label="Today's Sales"
            value={c(todaySalesTotal)}
            onClick={() => navigate('/dashboard/todays-sales')}
          />
          <RowButton
            iconBg="bg-purple-50 dark:bg-purple-900/30"
            icon={<FiUsers className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            label="Pending Receivables"
            value={c(businessHealth.overdueReceivables)}
            onClick={() => navigate('/dashboard/kpi/receivable')}
          />
          <RowButton
            iconBg={lowStockItems.length > 0
              ? 'bg-amber-50 dark:bg-amber-900/30'
              : 'bg-gray-50 dark:bg-gray-800'}
            icon={
              <FiPackage className={`w-4 h-4 ${lowStockItems.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-400'
                }`} />
            }
            label="Low Stock Items"
            value={`${lowStockItems.length} items`}
            onClick={() => navigate('/inventory?filter=low-stock')}
          />
          <RowButton
            iconBg="bg-green-50 dark:bg-green-900/30"
            icon={<FiBarChart2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
            label="Top Customer"
            value={insights.topParty}
            sub={c(insights.topPartyAmount)}
            onClick={() => navigate('/parties?type=customer')}
          />
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
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                Add a sale or purchase to get started
              </p>
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
            <div className={`rounded-lg p-4 ${hc.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${hc.label}`}>Cash Flow Ratio</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${hc.badge}`}>
                  {businessHealth.status.charAt(0).toUpperCase() + businessHealth.status.slice(1)}
                </span>
              </div>
              <p className={`text-3xl font-bold mt-1 ${hc.value}`}>
                {businessHealth.cashFlowRatio >= 999 ? '∞' : businessHealth.cashFlowRatio.toFixed(1)}x
              </p>
              <p className="text-xs text-gray-400 mt-1">Cash coverage of liabilities</p>
            </div>

            {/* Health Metrics */}
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
                {lowStockItems.filter((i) => i.current === 0).length} out of stock
                &nbsp;·&nbsp;
                {lowStockItems.filter((i) => i.current > 0).length} running low
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