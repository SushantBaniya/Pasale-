import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { reportApi, productApi, partyApi, billingApi } from '../../utils/api';
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiCalendar,
  FiPackage,
  FiShoppingCart,
  FiZap,
  FiPlus,
  FiBell,
  FiChevronDown,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Format helpers ────────────────────────────────────────────────────────
const formatRupees = (n: number) => {
  if (n >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}k`;
  return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
};

const formatFull = (n: number) => {
  return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
};

// ─── KPI Card Component ─────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  valueColor?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, bgColor, valueColor }) => (
  <div className={`${bgColor} rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md cursor-pointer min-w-0`}>
    <div className="mb-3">
      <div className="w-10 h-10 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className={`text-lg sm:text-xl font-bold ${valueColor || 'text-gray-900 dark:text-white'} leading-snug break-words`}>
      {value}
    </p>
  </div>
);

// ─── Chart Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500 dark:text-gray-400">{entry.name}:</span>
          <span className="font-bold text-gray-900 dark:text-white">{formatFull(entry.value)}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();
  const { businessName } = useBusinessStore();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getUserName = (): string => {
    if (userProfile?.name && userProfile.name !== 'Demo User Admin') return userProfile.name;
    if (businessName) return businessName;
    if (userProfile?.businessName) return userProfile.businessName;
    if (userProfile?.email) return userProfile.email.split('@')[0];
    return 'User';
  };

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const data = await reportApi.getSummary();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        // Set defaults
        setDashboardData({
          dashboard: {
            to_receive: 0,
            to_give: 0,
            monthly_sales: 0,
            monthly_purchase: 0,
            inventory_value: 0,
            current_month_short: new Date().toLocaleString('en', { month: 'short' }).toUpperCase(),
          },
          cashflow: { daily: [], weekly: [], monthly: [] },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const db = dashboardData?.dashboard || {};
  const cashflow = dashboardData?.cashflow || {};

  const chartData = useMemo(() => {
    if (chartPeriod === 'daily') return cashflow.daily || [];
    if (chartPeriod === 'weekly') return cashflow.weekly || [];
    return cashflow.monthly || [];
  }, [chartPeriod, cashflow]);

  const totalInflow = chartData.reduce((s: number, d: any) => s + (d.inflow || 0), 0);
  const totalOutflow = chartData.reduce((s: number, d: any) => s + (d.outflow || 0), 0);

  const formatYAxis = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto">

      {/* ── Welcome Header with Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Welcome {getUserName()}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/quick-pos')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <FiZap className="w-3.5 h-3.5" /> Quick POS
          </button>
          <button
            onClick={() => navigate('/sales/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Sales
          </button>
          <button
            onClick={() => navigate('/purchase/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Purchase
          </button>
          <button
            className="inline-flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Add More
          </button>
        </div>
      </div>

      {/* ── 5 KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <KpiCard
          label="TO RECEIVE"
          value={formatFull(db.to_receive || 0)}
          icon={<FiArrowDownLeft className="w-5 h-5 text-green-600" />}
          bgColor="bg-green-50 dark:bg-green-900/10"
          valueColor="text-green-700 dark:text-green-400"
        />
        <KpiCard
          label="TO GIVE"
          value={formatFull(db.to_give || 0)}
          icon={<FiArrowUpRight className="w-5 h-5 text-red-500" />}
          bgColor="bg-red-50 dark:bg-red-900/10"
          valueColor="text-red-600 dark:text-red-400"
        />
        <KpiCard
          label={`SALES (${db.current_month_short || 'MTH'})`}
          value={formatFull(db.monthly_sales || 0)}
          icon={<FiCalendar className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50 dark:bg-blue-900/10"
        />
        <KpiCard
          label={`PURCHASE (${db.current_month_short || 'MTH'})`}
          value={formatFull(db.monthly_purchase || 0)}
          icon={<FiShoppingCart className="w-5 h-5 text-gray-600" />}
          bgColor="bg-gray-50 dark:bg-gray-800"
        />
        <KpiCard
          label="INVENTORY VALUE"
          value={formatFull(db.inventory_value || 0)}
          icon={<FiPackage className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50 dark:bg-purple-900/10"
        />
      </div>

      {/* ── Cashflow Chart + Right Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
        
        {/* Cashflow Trends */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Cashflow Trends</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Last 7 Days overview</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg mt-2 sm:mt-0">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md border-none cursor-pointer transition-all duration-150 uppercase ${
                    chartPeriod === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
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
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="outflow" name="Outflow" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="px-5 pb-4 flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              TOTAL INFLOW
              <span className="text-green-600 dark:text-green-400 font-bold ml-1">{formatRupees(totalInflow)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              TOTAL OUTFLOW
              <span className="text-red-600 dark:text-red-400 font-bold ml-1">{formatRupees(totalOutflow)}</span>
            </span>
          </div>
        </div>

        {/* Right Panel — Total Balance + Reminders */}
        <div className="space-y-4">
          {/* Total Balance */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Total Balance (Cash & Bank)</h3>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatFull(0)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Cash + Bank accounts</p>
          </div>

          {/* Upcoming Reminders */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Upcoming Reminders (0)</h3>
            <div className="flex flex-col items-center py-6 text-center">
              <FiBell className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Reminder Not Created Yet!
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Looks like you haven't created any reminders yet.
              </p>
              <button className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                <FiPlus className="w-4 h-4" /> Add New Reminder
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}