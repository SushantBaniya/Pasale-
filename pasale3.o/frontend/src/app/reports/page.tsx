import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../utils/i18n';
import { reportApi } from '../../utils/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import {
  FiSearch,
  FiBell,
  FiRefreshCw,
  FiDownload,
  FiPrinter,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiPercent,
  FiSliders,
  FiActivity,
  FiFileText,
  FiBarChart2,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../../components/ui/NepaliRupeeIcon';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRange { startDate: string; endDate: string }
type QuickRange = 'week' | 'month' | 'quarter' | 'year';

interface ReportSummary {
  total_sales: number;
  total_expenses: number;
  net_profit: number;
  order_count: number;
  low_stock_count: number;
}
interface DailyPoint   { label: string; inflow: number; outflow: number }
interface CategoryItem { name: string; value: number }
interface TopProduct   { name: string; quantity: number }
interface TopCustomer  { name: string; orders: number; spent: number }

interface ReportData {
  summary: ReportSummary;
  cashflow: { daily: DailyPoint[] };
  category_distribution: CategoryItem[];
  top_products: TopProduct[];
  top_customers: TopCustomer[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date) { return d.toISOString().split('T')[0]; }

function getStartDate(range: QuickRange): Date {
  const today = new Date();
  switch (range) {
    case 'week':    { const d = new Date(today); d.setDate(today.getDate() - 7); return d; }
    case 'month':   return new Date(today.getFullYear(), today.getMonth(), 1);
    case 'quarter': return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    case 'year':    return new Date(today.getFullYear(), 0, 1);
  }
}

const PIE_COLORS = ['#B8502E', '#3A7A5A', '#f59e0b', '#8A3A1E', '#f43f5e', '#06b6d4'];

// ─── Reusable primitives ──────────────────────────────────────────────────────

/** White card with light border — the base surface for every section */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-[#1A1A1A] rounded-2xl border #E5D8CC dark:border-[#222222] ${className}`}
    >
      {children}
    </div>
  );
}

/** Section title + optional right slot (legend / icon) */
function ChartHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[13px] font-medium #3D2B1A dark:text-[#CCCCCC]">{title}</h3>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

/** The 6 top-stat cards that mirror the attendance dashboard cards */
function StatCard({
  label,
  value,
  icon: Icon,
  warning = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  warning?: boolean;
}) {
  return (
    <Card
      className={`p-4 flex items-start justify-between ${
        warning ? 'border-amber-200 dark:border-amber-800' : ''
      }`}
    >
      <div>
        <p className="text-[26px] font-medium leading-none #3D2B1A dark:text-[#E0E0E0]">
          {value}
        </p>
        <p className="text-[12px] text-gray-400 dark:#8A7060 mt-1.5">{label}</p>
      </div>
      <Icon
        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
          warning ? 'text-amber-400' : 'text-gray-300 dark:#8A7060'
        }`}
      />
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { t, n, c } = useTranslation();
  const [quickRange, setQuickRange] = useState<QuickRange>('month');
  const [dateRange, setDateRange]   = useState<DateRange>({
    startDate: toISO(getStartDate('month')),
    endDate:   toISO(new Date()),
  });
  const [data, setData]     = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Sync date range whenever quick-range changes
  useEffect(() => {
    setDateRange({
      startDate: toISO(getStartDate(quickRange)),
      endDate:   toISO(new Date()),
    });
  }, [quickRange]);

  // Fetch on every date range change
  useEffect(() => { fetchReport(); }, [dateRange.startDate, dateRange.endDate]);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const response: ReportData = await reportApi.getSummary({
        start_date: dateRange.startDate,
        end_date:   dateRange.endDate,
      });
      setData(response);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  // Derived chart series
  const chartData = useMemo(
    () =>
      (data?.cashflow?.daily ?? []).map((p) => ({
        date:     p.label,
        sales:    p.inflow  ?? 0,
        expenses: p.outflow ?? 0,
        profit:   (p.inflow ?? 0) - (p.outflow ?? 0),
      })),
    [data],
  );

  // Six KPI stat-cards matching the screenshot grid layout
  const statCards = useMemo(() => {
    if (!data?.summary) return [];
    const s   = data.summary;
    const aov = s.order_count > 0 ? s.total_sales / s.order_count : 0;
    return [
      { label: t('reports.totalRevenue'),  value: c(s.total_sales),   icon: FiTrendingUp,   warning: false },
      { label: t('reports.totalExpenses'), value: c(s.total_expenses), icon: FiTrendingDown, warning: false },
      { label: t('reports.grossProfit'),   value: c(s.net_profit),     icon: NepaliRupeeIcon,warning: false },
      { label: 'Avg. order value',         value: c(aov),              icon: FiTarget,       warning: false },
      { label: 'Total orders',             value: n(s.order_count),    icon: FiUsers,        warning: false },
      {
        label:   'Low stock alerts',
        value:   n(s.low_stock_count),
        icon:    FiPackage,
        warning: s.low_stock_count > 0,
      },
    ];
  }, [data, t, c, n]);

  function handleExport(format: 'pdf' | 'excel') {
    if (!data) return;
    const payload = {
      title:       'Business performance report',
      dateRange,
      companyName: 'Pasale',
      stats:       statCards.map((k) => ({ label: k.label, value: k.value })),
    };
    if (format === 'pdf')   exportToPDF(payload);
    if (format === 'excel') exportToExcel(payload);
  }

  const margin = data?.summary?.total_sales
    ? ((data.summary.net_profit / data.summary.total_sales) * 100).toFixed(1)
    : null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#eef0f5] dark:bg-[#111111] p-3 sm:p-4">
      <div className="max-w-[1280px] mx-auto space-y-3">

        {/* ═══════════════════════════════════════════════════════════════════
            TOP BAR  — search · actions · avatar
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className="px-5 py-3 flex items-center justify-between print:hidden">

          {/* search pill */}
          <div className="flex items-center gap-2 #FAF7F3 dark:bg-[#222222] border #E5D8CC dark:border-[#333333] rounded-full px-4 py-2 w-60">
            <FiSearch className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[13px] text-gray-400">Quick search…</span>
          </div>

          {/* right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReport}
              disabled={loading}
              aria-label="Refresh"
              className="text-gray-400 hover:#8A7060 dark:hover:text-gray-200 transition-colors"
            >
              <FiRefreshCw className={`w-[18px] h-[18px] ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              aria-label="Print"
              className="text-gray-400 hover:#8A7060 dark:hover:text-gray-200 transition-colors"
            >
              <FiPrinter className="w-[18px] h-[18px]" />
            </button>

            <FiBell className="w-[18px] h-[18px] text-gray-400" />

            {/* export dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-[13px] #8A7060 dark:text-[#CCCCCC] #FAF7F3 dark:bg-[#222222] border #E5D8CC dark:border-[#333333] rounded-xl px-3 py-1.5 hover:#EDE5DA dark:hover:bg-gray-600 transition-colors">
                <FiDownload className="w-3.5 h-3.5" />
                Export
              </button>
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#1A1A1A] border #E5D8CC dark:border-[#222222] rounded-2xl shadow-xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 dark:text-[#CCCCCC] hover:#FAF7F3 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiFileText className="w-4 h-4 text-rose-400" />
                  PDF document
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 dark:text-[#CCCCCC] hover:#FAF7F3 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiBarChart2 className="w-4 h-4 text-[#D4623A]" />
                  Excel spreadsheet
                </button>
              </div>
            </div>

            {/* avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2A2A2A] flex items-center justify-center text-[11px] font-medium #8A7060 dark:text-[#CCCCCC]">
                BI
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[12px] font-medium text-gray-700 dark:text-[#CCCCCC] leading-tight">Business</p>
                <p className="text-[11px] text-gray-400 leading-tight">Intelligence</p>
              </div>
            </div>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            ERROR BANNER
        ═══════════════════════════════════════════════════════════════════ */}
        {error && (
          <div className="flex items-center justify-between px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-[13px] text-rose-600 dark:text-rose-400 print:hidden">
            <div className="flex items-center gap-2">
              <FiActivity className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
            <button onClick={fetchReport} className="underline hover:no-underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            BODY — content
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">

            {/* ── ROW 1: 6 stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {statCards.length > 0
                ? statCards.map((card, i) => (
                    <StatCard
                      key={i}
                      label={card.label}
                      value={card.value}
                      icon={card.icon}
                      warning={card.warning}
                    />
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-4 animate-pulse">
                      <div className="h-7 w-14 #EDE5DA dark:bg-[#222222] rounded mb-2" />
                      <div className="h-3 w-20 #EDE5DA dark:bg-[#222222] rounded" />
                    </Card>
                  ))}
            </div>

            {/* ── ROW 2: Revenue area chart + Category pie ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-3">

              {/* Area chart — "Attendance comparison chart" equivalent */}
              <Card className="p-5">
                <ChartHeader
                  title="Revenue & profit trajectory"
                  right={
                    <>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#D4623A] inline-block" />
                          Revenue
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full border border-gray-400 inline-block bg-transparent" />
                          Profit
                        </span>
                      </div>
                      <FiSliders className="w-4 h-4 text-gray-300 dark:#8A7060" />
                    </>
                  }
                />
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '0.5px solid #e5e7eb',
                          fontSize: 12,
                          boxShadow: 'none',
                        }}
                        formatter={(v: any) => [c(v), '']}
                      />
                      <defs>
                        <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#B8502E" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#B8502E" stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3A7A5A" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#3A7A5A" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#B8502E"
                        strokeWidth={2}
                        fill="url(#gS)"
                        dot={{ r: 3, fill: '#B8502E', strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#3A7A5A"
                        strokeWidth={2}
                        fill="url(#gP)"
                        dot={false}
                        strokeDasharray="4 3"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Pie — "Weekly attendance" equivalent */}
              <Card className="p-5">
                <ChartHeader
                  title="Sales by category"
                  right={<FiSliders className="w-4 h-4 text-gray-300 dark:#8A7060" />}
                />
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.category_distribution ?? []}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {(data?.category_distribution ?? []).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '0.5px solid #e5e7eb',
                          fontSize: 12,
                          boxShadow: 'none',
                        }}
                        formatter={(v: any) => [c(v), '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* legend rows */}
                <div className="space-y-2 mt-3">
                  {(data?.category_distribution ?? []).slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="#8A7060 dark:text-[#555555] truncate">{item.name}</span>
                      </div>
                      <span className="font-medium #3D2B1A dark:text-[#CCCCCC] ml-3 flex-shrink-0">
                        {c(item.value)}
                      </span>
                    </div>
                  ))}
                  {!data?.category_distribution?.length && (
                    <p className="text-[12px] text-gray-400 text-center py-4">No data</p>
                  )}
                </div>
              </Card>
            </div>

            {/* ── ROW 3: Best sellers progress bars + Top customers table ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">

              {/* Best sellers — horizontal progress bars */}
              <Card className="p-5">
                <ChartHeader
                  title="Best sellers"
                  right={<FiSliders className="w-4 h-4 text-gray-300 dark:#8A7060" />}
                />
                <div className="space-y-4">
                  {(data?.top_products ?? []).map((p, i) => {
                    const maxQty = data?.top_products?.[0]?.quantity ?? 1;
                    const pct    = Math.round((p.quantity / maxQty) * 100);
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[12px] text-gray-700 dark:text-[#CCCCCC] truncate pr-3">
                            {p.name}
                          </span>
                          <span className="text-[12px] font-medium #3D2B1A dark:text-[#E0E0E0] whitespace-nowrap">
                            {n(p.quantity)} units
                          </span>
                        </div>
                        <div className="h-1.5 w-full #EDE5DA dark:bg-[#222222] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width:      `${pct}%`,
                              backgroundColor: i === 0 ? '#1a1a2e' : '#bfdbfe',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!data?.top_products?.length && (
                    <p className="text-[12px] text-gray-400 text-center py-6">
                      No product data available
                    </p>
                  )}
                </div>
              </Card>

              {/* Top customers */}
              <Card className="p-5">
                <ChartHeader
                  title="Top customers"
                  right={<FiSliders className="w-4 h-4 text-gray-300 dark:#8A7060" />}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col />
                      <col style={{ width: '60px' }} />
                      <col style={{ width: '90px' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b #E5D8CC dark:border-[#222222]">
                        <th className="pb-2.5 text-left font-medium text-gray-400 dark:#8A7060">
                          Customer
                        </th>
                        <th className="pb-2.5 text-right font-medium text-gray-400 dark:#8A7060">
                          Orders
                        </th>
                        <th className="pb-2.5 text-right font-medium text-gray-400 dark:#8A7060">
                          Spent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                      {(data?.top_customers ?? []).map((cust, i) => (
                        <tr
                          key={i}
                          className="hover:#FAF7F3/60 dark:hover:bg-gray-700/20 transition-colors"
                        >
                          <td className="py-2.5 text-gray-700 dark:text-[#CCCCCC] truncate">
                            {cust.name}
                          </td>
                          <td className="py-2.5 text-right text-gray-400 dark:#8A7060">
                            {n(cust.orders)}
                          </td>
                          <td className="py-2.5 text-right font-medium #3D2B1A dark:text-[#CCCCCC]">
                            {c(cust.spent)}
                          </td>
                        </tr>
                      ))}
                      {!data?.top_customers?.length && (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-8 text-center text-gray-400"
                          >
                            No customer data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* ── ROW 4: Three health metric cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              {/* Total orders */}
              <Card className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                  <FiTarget className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                    Total orders
                  </p>
                  <p className="text-[20px] font-medium #3D2B1A dark:text-[#E0E0E0] leading-none mt-0.5">
                    {n(data?.summary?.order_count ?? 0)}
                  </p>
                </div>
              </Card>

              {/* Low stock */}
              <Card
                className={`p-4 flex items-center gap-3 ${
                  (data?.summary?.low_stock_count ?? 0) > 0
                    ? 'border-amber-200 dark:border-amber-800'
                    : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    (data?.summary?.low_stock_count ?? 0) > 0
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'bg-[#FDF1EC] dark:bg-[#D4623A]/15'
                  }`}
                >
                  <FiPackage
                    className={`w-4 h-4 ${
                      (data?.summary?.low_stock_count ?? 0) > 0
                        ? 'text-amber-500'
                        : 'text-[#D4623A]'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                    Low stock alerts
                  </p>
                  <p className="text-[20px] font-medium #3D2B1A dark:text-[#E0E0E0] leading-none mt-0.5">
                    {n(data?.summary?.low_stock_count ?? 0)}
                  </p>
                </div>
              </Card>

              {/* Profit margin */}
              <Card className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FDF1EC] dark:bg-[#D4623A]/15 flex items-center justify-center flex-shrink-0">
                  <FiPercent className="w-4 h-4 text-[#D4623A]" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                    Profit margin
                  </p>
                  <p className="text-[20px] font-medium #3D2B1A dark:text-[#E0E0E0] leading-none mt-0.5">
                    {margin !== null ? `${margin}%` : '—'}
                  </p>
                </div>
              </Card>
            </div>

        </div>{/* end body */}
      </div>{/* end max-w container */}
    </div>
  );
}