import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { reportApi, inventoryApi, reminderApi, billingApi } from '../../utils/api';
import { ReminderModal } from '../../components/dashboard/ReminderModal';
import {
  FiArrowDownLeft, FiArrowUpRight, FiCalendar, FiPackage, FiShoppingCart,
  FiPlus, FiBell, FiAlertTriangle, FiSearch
} from 'react-icons/fi';

//  Format helpers 
const formatRupees = (n: number) => {
  if (n >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}k`;
  return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
};

const formatFull = (n: number) => {
  return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
};

//  KPI Card Component 
interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  valueColor?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, bgColor, valueColor }) => (
  <div className={`${bgColor} border border-[#CBD5E1] dark:border-[#2A2B36] shadow-sm rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md cursor-pointer min-w-0`}>
    <div className="mb-3">
      <div className="w-10 h-10 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <p className="text-[11px] font-semibold text-black dark:text-[#64748B] uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className={`text-lg sm:text-xl font-bold ${valueColor || 'text-black dark:text-[#EAE5DF]'} leading-snug break-words`}>
      {value}
    </p>
  </div>
);

//  Main Dashboard 
export default function DashboardPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();
  const { businessName } = useBusinessStore();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reminders, setReminders] = useState<any[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [billings, setBillings] = useState<any[]>([]);
  const [billingsLoading, setBillingsLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Fetch core summary data (critical for first paint)
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const data = await reportApi.getSummary({ scope: 'dashboard' });
        if (!isMounted) return;
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err);
        if (!isMounted) return;
        setDashboardData({
          dashboard: {
            to_receive: 0, to_give: 0, monthly_sales: 0, monthly_purchase: 0,
            inventory_value: 0, current_month_short: new Date().toLocaleString('en', { month: 'short' }).toUpperCase(),
          }
        });
      } finally {
        if (isMounted) setSummaryLoading(false);
      }
    };

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch reminders/alerts in the background so they don't block initial load
  useEffect(() => {
    let isMounted = true;
    const fetchSideData = async () => {
      try {
        const [alertsResponse, remindersResponse] = await Promise.all([
          inventoryApi.getAlerts().catch(() => ({})),
          reminderApi.getReminders().catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        if (remindersResponse?.data) {
          setReminders(remindersResponse.data);
        }

        let alertsArray: any[] = [];
        if (Array.isArray(alertsResponse)) alertsArray = alertsResponse;
        else if (alertsResponse && Array.isArray(alertsResponse.alerts)) alertsArray = alertsResponse.alerts;
        else if (alertsResponse && alertsResponse.data && Array.isArray(alertsResponse.data.alerts)) alertsArray = alertsResponse.data.alerts;

        setStockAlerts(alertsArray);
      } catch (err) {
        console.error('Failed to fetch dashboard side data:', err);
      }
    };

    fetchSideData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Billings for Orders Table
  useEffect(() => {
    let isMounted = true;
    const fetchBillings = async () => {
      setBillingsLoading(true);
      try {
        const billingsRes = await billingApi.getAll();
        if (!isMounted) return;
        const records = billingsRes.results || billingsRes || [];
        const sorted = [...records].sort((a: any, b: any) => {
          const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
          const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setBillings(sorted);
      } catch (err) {
        console.error('Failed to fetch billings for dashboard:', err);
      } finally {
        if (isMounted) setBillingsLoading(false);
      }
    };

    fetchBillings();
    return () => {
      isMounted = false;
    };
  }, []);

  const db = dashboardData?.dashboard || {};

  const filteredBillings = billings.filter((b) => {
    if (!ordersSearch) return true;
    const search = ordersSearch.toLowerCase();
    const formattedId = `#${String(b.id).padStart(6, '0')}`;
    return (
      formattedId.includes(search) ||
      b.invoice_number?.toLowerCase().includes(search) ||
      b.party?.name?.toLowerCase().includes(search) ||
      b.invoice_status?.toLowerCase().includes(search)
    );
  }).slice(0, 10);

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F8FAFC] border-t-[#F2DD50] rounded-full animate-spin" />
          <p className="text-sm text-black dark:text-[#44454F] font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto">
      
      {/*  Banner  */}
      <div className="w-full h-32 sm:h-48 rounded-xl bg-gradient-to-r from-[#001f54] to-[#0b132b] text-white flex flex-col justify-center px-6 sm:px-10 relative overflow-hidden mb-6 shadow-sm border border-[#E2E8F0] dark:border-[#1C1D24]">
        {/* Placeholder for the user's banner image, applying a subtle overlay for text readability */}
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="relative z-10 flex justify-between items-center w-full">
           <div>
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-white/90 uppercase mb-2">Admin Panel</p>
              <h1 className="text-2xl sm:text-4xl font-normal tracking-wide">Welcome back, {getUserName()}</h1>
           </div>
           <div className="text-right hidden sm:block">
              <p className="text-4xl sm:text-5xl font-light tracking-wider">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <p className="text-xs sm:text-sm font-medium text-white/80 uppercase mt-2 tracking-widest">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
           </div>
        </div>
      </div>

      {/*  KPI Cards  */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <KpiCard
          label="TO RECEIVE"
          value={formatFull(db.to_receive || 0)}
          icon={<FiArrowDownLeft className="w-5 h-5 text-[#10B981]" />}
          bgColor="bg-[#FFFFFF] dark:bg-[#15161C]"
          valueColor="text-black dark:text-[#EAE5DF]"
        />
        <KpiCard
          label="TO GIVE"
          value={formatFull(db.to_give || 0)}
          icon={<FiArrowUpRight className="w-5 h-5 text-[#EF4444]" />}
          bgColor="bg-[#FFFFFF] dark:bg-[#15161C]"
          valueColor="text-black dark:text-[#EAE5DF]"
        />
        <KpiCard
          label={`SALES (${db.current_month_short || 'MTH'})`}
          value={formatFull(db.monthly_sales || 0)}
          icon={<FiCalendar className="w-5 h-5 text-[#3B82F6]" />}
          bgColor="bg-[#FFFFFF] dark:bg-[#15161C]"
          valueColor="text-black dark:text-[#EAE5DF]"
        />
        <KpiCard
          label={`PURCHASE (${db.current_month_short || 'MTH'})`}
          value={formatFull(db.monthly_purchase || 0)}
          icon={<FiShoppingCart className="w-5 h-5 text-[#F97316]" />}
          bgColor="bg-[#FFFFFF] dark:bg-[#15161C]"
          valueColor="text-black dark:text-[#EAE5DF]"
        />
        <KpiCard
          label="INVENTORY VALUE"
          value={formatFull(db.inventory_value || 0)}
          icon={<FiPackage className="w-5 h-5 text-[#8B5CF6]" />}
          bgColor="bg-[#FFFFFF] dark:bg-[#15161C]"
          valueColor="text-black dark:text-[#EAE5DF]"
        />
      </div>

      {/*  Main Layout: Orders Table + Right Panel  */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
        
        {/* Orders Table */}
        <div className="bg-white dark:bg-[#15161C] border border-[#CBD5E1] dark:border-[#2A2B36] rounded-xl overflow-hidden flex flex-col shadow-sm">
           <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1C1D24]/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-[16px] font-bold text-black dark:text-[#EAE5DF]">Orders</h2>
              <div className="relative w-full sm:w-72">
                 <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
                 <input 
                   type="text" 
                   placeholder="Search by order, table, status" 
                   value={ordersSearch}
                   onChange={(e) => setOrdersSearch(e.target.value)}
                   className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#1C1D24] text-sm focus:outline-none focus:ring-1 focus:ring-[#F2DD50] placeholder:text-black transition-shadow" 
                 />
              </div>
           </div>
           
           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                 <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-[#1C1D24]/50 bg-[#F7FAFC]/50 dark:bg-[#1C1D24]/30">
                       <th className="px-5 py-3 text-xs font-semibold text-black dark:text-[#44454F] uppercase tracking-wider w-[20%]">Order</th>
                       <th className="px-5 py-3 text-xs font-semibold text-black dark:text-[#44454F] uppercase tracking-wider w-[20%]">Location</th>
                       <th className="px-5 py-3 text-xs font-semibold text-black dark:text-[#44454F] uppercase tracking-wider w-[20%]">Status</th>
                       <th className="px-5 py-3 text-xs font-semibold text-black dark:text-[#44454F] uppercase tracking-wider w-[20%]">Created At</th>
                       <th className="px-5 py-3 text-xs font-semibold text-black dark:text-[#44454F] uppercase tracking-wider text-right w-[20%]">Amount</th>
                    </tr>
                 </thead>
                 <tbody>
                    {billingsLoading ? (
                      <tr>
                         <td colSpan={5} className="py-16 text-center text-sm text-black dark:text-[#44454F] bg-white dark:bg-[#15161C]">
                            Loading orders...
                         </td>
                      </tr>
                    ) : filteredBillings.length === 0 ? (
                      <tr>
                         <td colSpan={5} className="py-16 text-center text-sm text-black dark:text-[#44454F] bg-white dark:bg-[#15161C]">
                            No orders found.
                         </td>
                      </tr>
                    ) : (
                      filteredBillings.map((billing) => (
                        <tr 
                          key={billing.id} 
                          className="border-b border-gray-50 dark:border-[#1C1D24] hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors" 
                          onClick={() => navigate(`/billing?billingId=${billing.id}`)}
                        >
                           <td className="px-5 py-4 font-bold text-black dark:text-[#EAE5DF] text-sm">
                             #{String(billing.id).padStart(6, '0')}
                             <div className="text-[11px] font-medium text-slate-400 mt-0.5">{billing.invoice_number || '-'}</div>
                           </td>
                           <td className="px-5 py-4 font-bold text-black dark:text-[#EAE5DF] text-sm">
                             {billing.party?.name || 'Walk-in Customer'}
                           </td>
                           <td className="px-5 py-4">
                             <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${
                               billing.invoice_status?.toLowerCase() === 'paid' 
                                 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                 : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                             }`}>
                               {billing.invoice_status || 'PENDING'}
                             </span>
                           </td>
                           <td className="px-5 py-4 font-bold text-black dark:text-[#EAE5DF] text-xs">
                             {new Date(billing.invoice_date || billing.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                           </td>
                           <td className="px-5 py-4 font-black text-[#10B981] text-sm text-right">
                             Rs. {Number(billing.total_amount || 0).toLocaleString()}
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Right Panel  Reminders & Alerts */}
        <div className="space-y-4">
          {/* Stock Alerts */}
          <div className="bg-white dark:bg-[#15161C] border border-[#CBD5E1] dark:border-[#2A2B36] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-black dark:text-[#EAE5DF]">
                Stock Alerts
              </h3>
            </div>
            
            {stockAlerts.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <FiPackage className="w-8 h-8 text-[#E2E8F0] dark:text-gray-700 mb-2" />
                <p className="text-sm font-semibold text-black dark:text-[#44454F] mb-1">All Good!</p>
                <p className="text-xs text-black dark:#475569">No items are running out of stock.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-1">
                {stockAlerts.map((alert: any, idx: number) => (
                  <div key={alert.id || idx} className="flex justify-between items-center bg-white dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-black dark:text-[#64748B] line-clamp-1">
                        {alert.product_name || alert.message || 'Unknown Product'}
                      </p>
                      <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5 font-medium line-clamp-1">
                        {alert.message || (alert.product_quantity === 0 ? 'Out of Stock' : 'Low Stock')}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap pl-2">
                      <p className="text-sm font-bold text-black dark:text-[#EAE5DF]">{alert.product_quantity ?? 0}</p>
                      <p className="text-[10px] text-black dark:text-[#44454F]">Qty left</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Reminders */}
          <div className="bg-white dark:bg-[#15161C] border border-[#CBD5E1] dark:border-[#2A2B36] rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-black dark:text-[#EAE5DF] mb-4">Upcoming Reminders ({reminders.length})</h3>
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <FiBell className="w-10 h-10 text-[#E2E8F0] dark:text-gray-700 mb-3" />
                <p className="text-sm font-semibold text-black dark:text-[#44454F] mb-1">
                  Reminder Not Created Yet!
                </p>
                <p className="text-xs text-black dark:text-[#44454F] mb-4">
                  Looks like you haven't created any reminders yet.
                </p>
                <button
                  onClick={() => setIsReminderModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[#F2DD50] dark:text-[#F2DD50] text-sm font-semibold hover:text-[#8E7356] dark:hover:text-[#8E7356] transition-colors"
                >
                  <FiPlus className="w-4 h-4" /> Add New Reminder
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="p-3 bg-[#F7FAFC] dark:bg-[#1C1D24] rounded-lg flex items-center justify-between border border-[#E2E8F0] dark:border-[#2A2B36]">
                    <div>
                      <h4 className="text-sm font-semibold text-black dark:text-[#EAE5DF]">{reminder.title}</h4>
                      {reminder.description && <p className="text-xs text-black dark:text-[#64748B]">{reminder.description}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-[#F2DD50] dark:text-[#F2DD50]">
                        {new Date(reminder.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => setIsReminderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[#F2DD50] dark:text-[#F2DD50] text-sm font-semibold hover:text-[#8E7356] dark:hover:text-[#8E7356] transition-colors"
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
