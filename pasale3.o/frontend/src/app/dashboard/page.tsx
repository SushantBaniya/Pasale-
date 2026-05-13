import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { reportApi, productApi, partyApi, billingApi, inventoryApi, reminderApi } from '../../utils/api';
import { ReminderModal } from '../../components/dashboard/ReminderModal';
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
  FiAlertTriangle,
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
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showAddMore, setShowAddMore] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const handleAddReminder = async (data: any) => {
    try {
      const res = await reminderApi.addReminder(data);
      if (res.data) {
        setReminders([...reminders, res.data]);
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

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
        const [data, alertsResponse, allProducts, remindersResponse] = await Promise.all([
          reportApi.getSummary(),
          inventoryApi.getAlerts().catch(() => ({})),
          productApi.getAll().catch(() => []), // Fetch products to calculate real-time alerts if needed
          reminderApi.getReminders().catch(() => ({ data: [] }))
        ]);
        
        setDashboardData(data);
        if (remindersResponse?.data) {
          setReminders(remindersResponse.data);
        }
        // Use backend alerts
        let alertsArray: any[] = [];
        if (Array.isArray(alertsResponse)) alertsArray = alertsResponse;
        else if (alertsResponse && Array.isArray(alertsResponse.alerts)) alertsArray = alertsResponse.alerts;
        else if (alertsResponse && alertsResponse.data && Array.isArray(alertsResponse.data.alerts)) alertsArray = alertsResponse.data.alerts;

        // If no alerts from endpoint but products exist, dynamically generate them real-time
        const items = allProducts?.results || allProducts || [];
        if (alertsArray.length === 0 && Array.isArray(items) && items.length > 0) {
          alertsArray = items
            .filter((p: any) => {
              const qty = p.quantity || 0;
              const threshold = p.reorder_level || p.low_stock_threshold || 5;
              return qty <= threshold;
            })
            .map((p: any) => ({
              id: p.id,
              product_name: p.product_name,
              product_quantity: p.quantity || 0,
              message: (p.quantity || 0) === 0 ? `Out of Stock: ${p.product_name}` : `Low Stock: ${p.product_name} (${p.quantity} left)`
            }));
        }

        setStockAlerts(alertsArray);
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

          {/* Add More Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMore(!showAddMore)}
              className="inline-flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
            >
              Add More
              <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${showAddMore ? 'rotate-180' : ''}`} />
            </button>

            {showAddMore && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-20">
                <button
                  onClick={() => {
                    setShowAddMore(false);
                    navigate('/transactions?type=payment-in');
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Payment In</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMore(false);
                    navigate('/transactions?type=payment-out');
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Payment Out</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMore(false);
                    navigate('/quotation');
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Quotation</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMore(false);
                    navigate('/sales-return');
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3" />
                  </svg>
                  <span className="font-medium">Sales Return</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMore(false);
                    navigate('/purchase-return');
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">Purchase Return</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMore(false);
                    navigate('/expense');
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Expense</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMore(false);
                    navigate('/income');
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Income</span>
                </button>
              </div>
            )}
          </div>
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

        {/* Right Panel — Reminders & Alerts */}
        <div className="space-y-4">
          {/* Stock Alerts */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-orange-500" />
                Stock Alerts
              </h3>
              {stockAlerts.length > 0 && (
                <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stockAlerts.length}
                </span>
              )}
            </div>
            
            {stockAlerts.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <FiPackage className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  All Good!
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No items are running out of stock.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-1">
                {stockAlerts.map((alert: any, idx: number) => (
                  <div key={alert.id || idx} className="flex justify-between items-center bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                        {alert.product_name || alert.message || 'Unknown Product'}
                      </p>
                      <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5 font-medium line-clamp-1">
                        {alert.message || (alert.product_quantity === 0 ? 'Out of Stock' : 'Low Stock')}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap pl-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{alert.product_quantity ?? 0}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Qty left</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Reminders */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Upcoming Reminders ({reminders.length})</h3>
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <FiBell className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Reminder Not Created Yet!
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Looks like you haven't created any reminders yet.
                </p>
                <button
                  onClick={() => setIsReminderModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <FiPlus className="w-4 h-4" /> Add New Reminder
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{reminder.title}</h4>
                      {reminder.description && <p className="text-xs text-gray-500 dark:text-gray-400">{reminder.description}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {new Date(reminder.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => setIsReminderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" /> Add New Reminder
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onAdd={handleAddReminder}
      />
    </div>
  );
}
