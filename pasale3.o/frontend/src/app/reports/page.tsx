import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { reportApi } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/layout/PageHeader';
import { exportToWord, exportToExcel, exportToPDF, exportToHTML } from '../../utils/exportUtils';
import {
  FiFileText,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiPrinter,
  FiDownload,
  FiUsers,
  FiActivity,
  FiRefreshCw,
  FiShare2,
  FiGlobe,
  FiEdit,
  FiMail,
  FiBarChart2,
  FiCreditCard,
  FiPercent,
  FiTarget,
  FiBox,
  FiShoppingBag,
  FiAward,
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

export default function ReportsPage() {
  const { t, n, c, language } = useTranslation();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [quickDateRange, setQuickDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realData, setRealData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await reportApi.getSummary({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });
      setRealData(response);
    } catch (error: any) {
      setError(error.message || 'Failed to load report data');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    switch (quickDateRange) {
      case 'week': startDate = new Date(today); startDate.setDate(today.getDate() - 7); break;
      case 'month': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case 'quarter': startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); break;
      case 'year': startDate = new Date(today.getFullYear(), 0, 1); break;
      default: startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }, [quickDateRange]);

  const chartData = useMemo(() => {
    if (!realData?.trends?.daily_sales) return [];
    const salesMap = new Map(realData.trends.daily_sales.map((item: any) => [item.date, item.sales]));
    const expenseMap = new Map(realData.trends.daily_expenses.map((item: any) => [item.date, item.expenses]));
    const allDates = Array.from(new Set([...salesMap.keys(), ...expenseMap.keys()])).sort();
    return allDates.map(date => ({
      date: new Date(date as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sales: salesMap.get(date) || 0,
      expenses: expenseMap.get(date) || 0,
      profit: Number(salesMap.get(date) || 0) - Number(expenseMap.get(date) || 0)
    }));
  }, [realData]);

  // Using explicit Tailwind classes to avoid dynamic string purging issues
  const getSummaryCards = () => {
    if (!realData) return [];
    const summary = realData.summary;
    const aov = summary.order_count > 0 ? summary.total_sales / summary.order_count : 0;

    return [
      {
        label: t('reports.totalRevenue'), value: summary.total_sales, icon: FiTrendingUp,
        theme: { bg: 'bg-blue-50', text: 'text-blue-600', glow: 'bg-blue-500/5' }
      },
      {
        label: t('reports.totalExpenses'), value: summary.total_expenses, icon: FiTrendingDown,
        theme: { bg: 'bg-rose-50', text: 'text-rose-600', glow: 'bg-rose-500/5' }
      },
      {
        label: t('reports.grossProfit'), value: summary.net_profit, icon: NepaliRupeeIcon,
        theme: { bg: 'bg-emerald-50', text: 'text-emerald-600', glow: 'bg-emerald-500/5' }
      },
      {
        label: 'Avg. Order Value', value: aov, icon: FiTarget,
        theme: { bg: 'bg-violet-50', text: 'text-violet-600', glow: 'bg-violet-500/5' }
      },
    ];
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#06B6D4'];

  const handleDownload = (format: 'word' | 'excel' | 'pdf' | 'html') => {
    if (!realData) return;
    const reportData = {
      title: 'Detailed Business Performance Report',
      dateRange: dateRange,
      stats: getSummaryCards().map(c => ({ label: c.label, value: n(c.value) })),
      companyName: 'Pasale',
    };
    if (format === 'word') exportToWord(reportData);
    else if (format === 'excel') exportToExcel(reportData);
    else if (format === 'pdf') exportToPDF(reportData);
    else if (format === 'html') exportToHTML(reportData);
  };

  const renderContent = () => (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Date Control Bar */}
      <Card className="p-3 bg-white border border-gray-200/60 shadow-sm rounded-2xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setQuickDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${quickDateRange === range
                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-36 border-none bg-transparent shadow-none text-sm focus:ring-0"
              />
              <span className="text-slate-300 font-medium">to</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-36 border-none bg-transparent shadow-none text-sm focus:ring-0"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchData}
                disabled={isRefreshing}
                className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <FiPrinter />
              </Button>

              <div className="relative group">
                <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 font-medium gap-2 hover:bg-slate-50">
                  <FiDownload className="w-4 h-4" /> Export
                </Button>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 shadow-xl rounded-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100">
                  <button onClick={() => handleDownload('pdf')} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 text-slate-700 flex items-center gap-3 border-b border-slate-50 transition-colors">
                    <div className="p-1.5 bg-rose-50 rounded-md text-rose-500"><FiFileText size={16} /></div>
                    PDF Document
                  </button>
                  <button onClick={() => handleDownload('excel')} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-colors">
                    <div className="p-1.5 bg-emerald-50 rounded-md text-emerald-500"><FiBarChart2 size={16} /></div>
                    Excel Spreadsheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {getSummaryCards().map((card, idx) => (
          <Card key={idx} className="p-6 bg-white border border-gray-200/60 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 ${card.theme.glow} rounded-full transition-transform duration-500 group-hover:scale-150`} />
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl ${card.theme.bg} ${card.theme.text} shadow-sm ring-1 ring-inset ring-white/50`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-900 tracking-tight">{c(card.value)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Primary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-white border border-gray-200/60 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-semibold text-slate-900">Revenue & Profit Trajectory</h3>
            <div className="flex gap-5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" /> Revenue
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> Profit
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + 'k' : v}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                  labelStyle={{ color: '#64748b', marginBottom: '8px' }}
                  formatter={(v: any) => [c(v), '']}
                />
                <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} fill="url(#colorSales)" fillOpacity={1} />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fill="url(#colorProfit)" fillOpacity={1} />
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200/60 shadow-sm rounded-2xl flex flex-col">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Sales by Category</h3>
          <div className="h-64 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={realData?.category_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {(realData?.category_distribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any) => [c(v), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto space-y-3">
            {(realData?.category_distribution || []).slice(0, 4).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{c(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Secondary Insight Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Products */}
        <Card className="p-6 bg-white border border-gray-200/60 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FiAward className="text-amber-500" /> Best Sellers
            </h3>
          </div>
          <div className="space-y-5">
            {(realData?.top_products || []).map((product: any, idx: number) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-slate-700 truncate pr-4">{product.name}</span>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">{product.quantity} units</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(product.quantity / (realData.top_products[0]?.quantity || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card className="p-6 bg-white border border-gray-200/60 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FiUsers className="text-violet-500" /> Top Customers
            </h3>
          </div>
          <div className="space-y-3">
            {(realData?.top_customers || []).map((customer: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                    <p className="text-xs text-slate-500">{customer.orders} Orders</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {c(customer.spent)}
                </p>
              </div>
            ))}
            {(!realData?.top_customers?.length) && (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-400">No customer data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Business Health Indicators */}
        <Card className="p-6 bg-white border border-gray-200/60 shadow-sm rounded-2xl">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Health Metrics</h3>
          <div className="flex flex-col gap-4">

            <div className="flex items-center p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-violet-500 mr-4">
                <FiTarget className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Total Orders</p>
                <p className="text-xl font-semibold text-slate-900">{(realData?.summary?.order_count || 0)}</p>
              </div>
            </div>

            <div className={`flex items-center p-4 rounded-xl border ${realData?.summary?.low_stock_count > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <div className={`p-3 bg-white rounded-xl shadow-sm border ${realData?.summary?.low_stock_count > 0 ? 'border-amber-100 text-amber-500' : 'border-emerald-100 text-emerald-500'} mr-4`}>
                <FiPackage className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Low Stock Alerts</p>
                <p className="text-xl font-semibold text-slate-900">{realData?.summary?.low_stock_count || 0}</p>
              </div>
            </div>

            <div className="flex items-center p-4 rounded-xl border border-blue-100 bg-blue-50/50">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 text-blue-500 mr-4">
                <FiPercent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Avg. Profit Margin</p>
                <p className="text-xl font-semibold text-slate-900">
                  {realData?.summary?.total_sales > 0
                    ? ((realData.summary.net_profit / realData.summary.total_sales) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Business Intelligence" subtitle="Live performance tracking and analytical insights" />

        {error && (
          <Card className="p-4 bg-rose-50 border-rose-200 text-rose-700 mb-6 flex items-center justify-between rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg"><FiActivity className="w-5 h-5 text-rose-600" /></div>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="border-rose-200 text-rose-700 hover:bg-rose-100 font-medium bg-white">
              Retry Sync
            </Button>
          </Card>
        )}

        {renderContent()}
      </div>
    </div>
  );
}