import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi } from '../../utils/api';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiMoreHorizontal } from 'react-icons/fi';

export default function SalesPage() {
  const navigate = useNavigate();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await billingApi.getAll();
      const records = res.results || res || [];
      // Filter only Sales type
      const salesRecords = records
        .filter((b: any) => b.transaction_type === 'Sales')
        .sort((a: any, b: any) => {
          const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
          const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
          return dateB - dateA;
        });
      setBillings(salesRecords);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = billings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.party?.name?.toLowerCase().includes(q) ||
      b.invoice_number?.toLowerCase().includes(q) ||
      String(b.id).includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMoney = (n: any) => {
    const val = Number(n || 0);
    return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
  };

  return (
    <div className="max-w-[1300px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold #3D2B1A dark:text-[#E0E0E0]">Sales Invoices</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 border #E5D8CC dark:border-[#222222] #8A7060 dark:text-[#CCCCCC] text-xs font-semibold rounded-lg hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors">
            <FiDownload className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => navigate('/sales/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#D4623A] text-white text-xs font-semibold rounded-lg hover:bg-[#B8502E] transition-colors shadow-sm"
          >
            <FiPlus className="w-3.5 h-3.5" /> Create Sales Invoice
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer name or invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#1A1A1A] text-sm #3D2B1A dark:text-[#E0E0E0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
          />
        </div>
        <button className="p-2 border #E5D8CC dark:border-[#222222] rounded-lg text-gray-400 hover:#8A7060 dark:hover:text-gray-300 hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors">
          <FiFilter className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1A1A1A] border #E5D8CC dark:border-[#222222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b #E5D8CC dark:border-[#222222] #FAF7F3/50 dark:bg-[#111111]/30">
                <th className="py-3 px-5 text-[11px] font-bold #8A7060 dark:text-[#555555] uppercase tracking-wider">DATE</th>
                <th className="py-3 px-5 text-[11px] font-bold #8A7060 dark:text-[#555555] uppercase tracking-wider">INVOICE NO</th>
                <th className="py-3 px-5 text-[11px] font-bold #8A7060 dark:text-[#555555] uppercase tracking-wider">PARTY NAME</th>
                <th className="py-3 px-5 text-[11px] font-bold #8A7060 dark:text-[#555555] uppercase tracking-wider">STATUS</th>
                <th className="py-3 px-5 text-[11px] font-bold #8A7060 dark:text-[#555555] uppercase tracking-wider text-right">AMOUNT</th>
                <th className="py-3 px-5 text-[11px] font-bold #8A7060 dark:text-[#555555] uppercase tracking-wider text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-8 h-8 border-4 border-[#D4623A]/30 border-t-[#D4623A] rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Loading sales...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-sm text-gray-400 dark:#8A7060 mb-2">No sales invoices found</p>
                    <button
                      onClick={() => navigate('/sales/new')}
                      className="text-[#D4623A] dark:text-[#D4623A] text-sm font-semibold hover:underline"
                    >
                      Create your first sale
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((billing) => (
                  <tr
                    key={billing.id}
                    className="border-b border-gray-50 dark:border-[#222222]/50 hover:#FAF7F3/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-5 text-sm text-gray-700 dark:text-[#CCCCCC]">
                      {formatDate(billing.invoice_date)}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-[#D4623A] dark:text-[#D4623A]">
                      #{billing.id}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-[#D4623A] dark:text-[#D4623A]">
                      {billing.party?.name || 'Cash Sale'}
                    </td>
                    <td className="py-3.5 px-5">
                      {billing.invoice_status?.toLowerCase() === 'paid' ? (
                        <span className="inline-flex px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] font-bold rounded-full uppercase">
                          PAID
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px] font-bold rounded-full uppercase">
                          UNPAID
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-[#D4623A] dark:text-[#D4623A] text-right">
                      {formatMoney(billing.total_amount)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button className="p-1.5 hover:#EDE5DA dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <FiMoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
