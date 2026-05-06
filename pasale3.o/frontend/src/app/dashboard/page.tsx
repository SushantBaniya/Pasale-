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
  FiActivity,
  FiShoppingCart,
  FiRefreshCw,
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

// ─── Inventra-style Badge ────────────────────────────────────────────────────
interface BadgeProps {
  value: number;
  suffix?: string;
}

const TrendBadge: React.FC<BadgeProps> = ({ value }) => {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        positive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {positive ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
};

// ─── Inventra KPI Card ────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  onClick: () => void;
  trend?: number;
  valueColor?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label, value, sub, icon, iconColor, iconBg, onClick, trend, valueColor,
}) => (
  <button
    onClick={onClick}
    className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-150 cursor-pointer w-full group"
  >
    <div className="flex items-start justify-between mb-3.5">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}
      >
        {icon}
      </div>
      {trend !== undefined && <TrendBadge value={trend} />}
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-widest">
      {label}
    </p>
    <p className={`text-[22px] font-bold ${valueColor ?? 'text-gray-900 dark:text-white'} mb-1 leading-snug`}>
      {value}
    </p>
    <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
  </button>
);

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onClick: () => void };
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-3.5">
    <h2 className="text-[15px] font-bold text-gray-900 dark:text-white m-0">{title}</h2>
    {action && (
      <button
        onClick={action.onClick}
        className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-500 bg-transparent border-none cursor-pointer p-0 hover:text-green-700 dark:hover:text-green-400 transition-colors"
      >
        {action.label}
        <FiChevronRight size={13} />
      </button>
    )}
  </div>
);

// ─── Transaction Row ──────────────────────────────────────────────────────────
interface TxRowProps {
  type: string;
  description: string;
  date: string;
  partyName?: string;
  amount: number;
  currency: (n: number) => string;
  onClick: () => void;
}

const TxRow: React.FC<TxRowProps> = ({ type, description, date, partyName, amount, currency, onClick }) => {
  const isSale = type === 'selling';
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-[11px] bg-transparent border-none border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors px-2 -mx-2 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 ${
            isSale 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {isSale ? <FiArrowDownRight size={15} /> : <FiArrowUpRight size={15} />}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-900 dark:text-white m-0">
            {description || (isSale ? 'Sale' : 'Purchase')}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 m-0 mt-0.5">
            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {partyName && ` · ${partyName}`}
          </p>
        </div>
      </div>
      <span
        className={`text-[13px] font-bold ${
          isSale ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {isSale ? '+' : '−'}{currency(amount)}
      </span>
    </button>
  );
};

// ─── Stat Row (health panel) ──────────────────────────────────────────────────
interface StatRowProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  warn?: boolean;
  onClick: () => void;
}

const StatRow: React.FC<StatRowProps> = ({ icon, iconBg, iconColor, label, value, warn, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full py-2.5 bg-transparent border-none border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors px-2 -mx-2 rounded-lg"
  >
    <div className="flex items-center gap-2.5">
      <div
        className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 m-0 font-medium">{label}</p>
    </div>
    <div className="flex items-center gap-1.5">
      <span className={`text-[13px] font-bold ${warn ? 'text-amber-600 dark:text-amber-500' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
      <FiChevronRight size={13} className="text-gray-300 dark:text-gray-600" />
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

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    return {
      salesChange: previousMonthSales > 0
        ? calculatePercentageChange(currentMonthSales, previousMonthSales)
        : 0,
      todaySalesTotal,
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

  const healthStatusMap = {
    healthy: { label: 'Healthy', bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
    warning: { label: 'Warning', bg: '#fef9c3', color: '#854d0e', dot: '#ca8a04' },
    critical: { label: 'Critical', bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
  };
  const healthUI = healthStatusMap[businessHealth.status];

  // Chart tooltip custom style
  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 pt-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white m-0">
            {getGreeting()}, {getUserName()}
          </h1>
          <p className="text-[13px] text-gray-400 dark:text-gray-500 m-0 mt-1 flex items-center gap-1.5">
            <FiCalendar size={13} />
            {today.toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
        {/* Today summary pill — mirrors Inventra's top-right stats */}
        <div className="flex items-center gap-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-[18px] py-2.5">
          <div className="text-right">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 m-0 font-medium">Today's Sales</p>
            <p className="text-base font-bold text-gray-900 dark:text-white m-0">{c(todaySalesTotal)}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <div className="text-right">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 m-0 font-medium">Transactions</p>
            <p className="text-base font-bold text-gray-900 dark:text-white m-0">{todayTransactionsCount}</p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards — 5-column grid mimicking Inventra's metric row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-[14px] mb-6">
        <KpiCard
          label={t('dashboard.totalSales')}
          value={c(totalSales)}
          sub="All time revenue"
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          icon={<FiTrendingUp size={16} />}
          onClick={() => navigate('/reports')}
          trend={salesChange !== 0 ? salesChange : undefined}
        />
        <KpiCard
          label={t('dashboard.totalReceivable')}
          value={c(totalReceivable)}
          sub={`${parties.filter((p) => p.type === 'customer').length} customers`}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-700 dark:text-blue-400"
          icon={<FiArrowDownRight size={16} />}
          onClick={() => navigate('/dashboard/kpi/receivable')}
        />
        <KpiCard
          label={t('dashboard.totalPayable')}
          value={c(totalPayable)}
          sub={`${parties.filter((p) => p.type === 'supplier').length} suppliers`}
          iconBg="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          icon={<FiArrowUpRight size={16} />}
          onClick={() => navigate('/dashboard/kpi/payable')}
          valueColor="text-red-600 dark:text-red-500"
        />
        <KpiCard
          label={t('dashboard.cashInHand')}
          value={c(cashInHand)}
          sub="Available balance"
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          icon={<FiDollarSign size={16} />}
          onClick={() => navigate('/dashboard/kpi/cash')}
        />
        <KpiCard
          label={t('dashboard.netBalance')}
          value={c(netBalance)}
          sub="Receivable − Payable"
          iconBg={netBalance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}
          iconColor={netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          icon={<FiPieChart size={16} />}
          onClick={() => navigate('/dashboard/kpi/balance')}
          valueColor={netBalance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}
        />
      </div>

      {/* ── Chart + Quick Insights side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-4">

        {/* Revenue Chart Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
            <div>
              <p className="text-[14px] font-bold text-gray-900 dark:text-white m-0">Revenue Overview</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 m-0 mt-0.5">Sales vs Expenses</p>
            </div>
            {/* Period toggle — styled exactly like Inventra's All Category / All Payment Modes pills */}
            <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-md border-none cursor-pointer transition-all duration-150 ${
                    chartPeriod === p
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                      : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="px-5 py-4 h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} className="dark:opacity-10" />
                <XAxis
                  dataKey="name"
                  stroke="transparent"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="transparent"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip contentStyle={{
                  backgroundColor: 'var(--tw-colors-white, #fff)',
                  border: '1px solid var(--tw-colors-gray-200, #e5e7eb)',
                  borderRadius: 8,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }} formatter={(value: number) => [c(value), '']} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  name="Sales"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                  name="Expenses"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart footer */}
          <div className="px-5 pb-[14px] flex items-center justify-between">
            <div className="flex gap-4">
              {[
                { color: 'bg-green-600', label: 'Sales' },
                { color: 'bg-red-600', label: 'Expenses' },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                  <span className={`w-2 h-2 rounded-full inline-block ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-[3px] text-[12px] font-semibold text-green-600 dark:text-green-500 bg-transparent border-none cursor-pointer p-0 hover:text-green-700 dark:hover:text-green-400 transition-colors"
            >
              Full Report <FiChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Quick Insights Card — mirrors Inventra's right-column summary */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
            <p className="text-[14px] font-bold text-gray-900 dark:text-white m-0">Quick Insights</p>
          </div>
          <div className="px-5 pt-2 pb-3">
            {[
              {
                icon: <FiTrendingUp size={14} />,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                label: "Today's Sales",
                value: c(todaySalesTotal),
                onClick: () => navigate('/dashboard/todays-sales'),
              },
              {
                icon: <FiUsers size={14} />,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-700 dark:text-blue-400',
                label: 'Pending Receivables',
                value: c(businessHealth.overdueReceivables),
                onClick: () => navigate('/dashboard/kpi/receivable'),
              },
              {
                icon: <FiPackage size={14} />,
                iconBg: lowStockItems.length > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800',
                iconColor: lowStockItems.length > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-500 dark:text-gray-400',
                label: 'Low Stock Items',
                value: `${lowStockItems.length} items`,
                warn: lowStockItems.length > 0,
                onClick: () => navigate('/inventory?filter=low-stock'),
              },
              {
                icon: <FiBarChart2 size={14} />,
                iconBg: 'bg-green-50 dark:bg-green-900/20',
                iconColor: 'text-green-600 dark:text-green-400',
                label: 'Top Customer',
                value: insights.topParty,
                onClick: () => navigate('/parties?type=customer'),
              },
              {
                icon: <FiActivity size={14} />,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                label: 'Profit Margin',
                value: `${insights.profitMargin}%`,
                onClick: () => navigate('/reports'),
              },
            ].map((item, i) => (
              <StatRow key={i} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions + Business Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-4">

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            <p className="text-[14px] font-bold text-gray-900 dark:text-white m-0">Recent Transactions</p>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-[3px] text-[12px] font-semibold text-green-600 dark:text-green-500 bg-transparent border-none cursor-pointer p-0 hover:text-green-700 dark:hover:text-green-400 transition-colors"
            >
              View All <FiArrowUpRight size={13} />
            </button>
          </div>

          <div className="px-5 pt-1 pb-2">
            {recentTransactions.length === 0 ? (
              <div className="py-10 text-center">
                <FiClock size={28} className="text-gray-200 dark:text-gray-700 mb-2 mx-auto block" />
                <p className="text-[13px] text-gray-400 dark:text-gray-500 m-0">No transactions yet</p>
                <p className="text-[12px] text-gray-300 dark:text-gray-600 m-0 mt-1">
                  Add a sale or purchase to get started
                </p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <TxRow
                  key={tx.id}
                  type={tx.type}
                  description={tx.description}
                  date={tx.date}
                  partyName={tx.partyName}
                  amount={tx.amount}
                  currency={c}
                  onClick={() => navigate(`/transactions/${tx.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Business Health — styled like Inventra's status cards */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
            <p className="text-[14px] font-bold text-gray-900 dark:text-white m-0">Business Health</p>
          </div>
          <div className="p-5">

            {/* Cash Flow Status — Inventra-style status banner */}
            <div
              style={{ background: healthUI.bg }}
              className="rounded-xl p-4 mb-4"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontSize: 12, fontWeight: 600, color: healthUI.color }}>Cash Flow Ratio</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: healthUI.dot,
                  }}
                  className="text-white"
                >
                  {healthUI.label}
                </span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: healthUI.color, margin: 0, lineHeight: 1.2 }}>
                {businessHealth.cashFlowRatio >= 999 ? '∞' : businessHealth.cashFlowRatio.toFixed(1)}x
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 m-0 mt-1">Cash coverage of liabilities</p>
            </div>

            {/* Health stats */}
            {[
              {
                icon: <FiUsers size={13} />,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-700 dark:text-blue-400',
                label: 'Outstanding Receivables',
                value: c(businessHealth.overdueReceivables),
                onClick: () => navigate('/dashboard/kpi/receivable'),
              },
              {
                icon: <FiPackage size={13} />,
                iconBg: lowStockItems.length > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800',
                iconColor: lowStockItems.length > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-500 dark:text-gray-400',
                label: 'Low Stock Items',
                value: `${lowStockItems.length} items`,
                warn: lowStockItems.length > 0,
                onClick: () => navigate('/inventory?filter=low-stock'),
              },
              {
                icon: <FiShoppingCart size={13} />,
                iconBg: 'bg-gray-100 dark:bg-gray-800',
                iconColor: 'text-gray-500 dark:text-gray-400',
                label: 'Pending to Suppliers',
                value: c(businessHealth.pendingPayments),
                onClick: () => navigate('/dashboard/kpi/payable'),
              },
            ].map((item, i) => (
              <StatRow key={i} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Low Stock Banner — Inventra-style alert row ── */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
              <FiAlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-800 dark:text-amber-500 m-0">Low Stock Alert</p>
              <p className="text-[12px] text-amber-700 dark:text-amber-600/70 m-0 mt-0.5">
                {lowStockItems.filter((i) => i.current === 0).length} out of stock
                &nbsp;·&nbsp;
                {lowStockItems.filter((i) => i.current > 0).length} running low
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/inventory?filter=low-stock')}
            className="text-[12px] font-bold text-amber-800 dark:text-amber-500 bg-white dark:bg-gray-800 border border-amber-400 dark:border-amber-700 rounded-lg px-3.5 py-1.5 cursor-pointer shrink-0 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors"
          >
            View Inventory
          </button>
        </div>
      )}

    </div>
  );
}