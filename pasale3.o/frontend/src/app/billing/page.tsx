import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { billingApi } from '../../utils/api';
import { FiSearch, FiRefreshCcw, FiEye, FiShoppingBag, FiMapPin, FiTag, FiCalendar, FiPrinter, FiX } from 'react-icons/fi';

export default function BillingPage() {
  const [searchParams] = useSearchParams();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const billingsRes = await billingApi.getAll();
      const records = billingsRes.results || billingsRes || [];

      const sortedBillings = [...records].sort((a: any, b: any) => {
        const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
        const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setBillings(sortedBillings);
    } catch (err: any) {
      console.error('Failed to fetch billings:', err);
      setError(err.message || 'Failed to load billings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const billingId = searchParams.get('billingId');
    const orderId = searchParams.get('orderId');

    if (billingId) {
      billingApi.getById(billingId)
        .then((billing) => {
          setSelectedBilling(billing);
          setIsModalOpen(true);
        })
        .catch((err) => {
          console.error('Failed to load billing by id:', err);
        });
      return;
    }

    if (!orderId || billings.length === 0) return;

    const matchingBilling = billings.find((billing) => {
      const billingOrderId = typeof billing.order === 'object' ? billing.order?.id : billing.order;
      return String(billingOrderId) === String(orderId);
    });

    if (matchingBilling) {
      setSelectedBilling(matchingBilling);
      setIsModalOpen(true);
    }
  }, [billings, searchParams]);

  const handlePayNow = async () => {
    if (!selectedBilling) return;

    try {
      setProcessing(true);
      await billingApi.update(selectedBilling.id, { invoice_status: 'Paid' });
      setSelectedBilling({ ...selectedBilling, invoice_status: 'Paid' });
      fetchData();
    } catch (err) {
      console.error('Failed to process billing payment', err);
      alert('Failed to update billing status. Please check the backend configuration.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredBillings = billings.filter((billing) => {
    const formattedId = `#${String(billing.id).padStart(6, '0')}`;
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      formattedId.includes(searchQuery) ||
      billing.invoice_number?.toLowerCase().includes(search) ||
      billing.party?.name?.toLowerCase().includes(search) ||
      billing.notes?.toLowerCase().includes(search);

    const billingStatus = billing.invoice_status?.toLowerCase() || '';
    const isPending = billingStatus === 'pending' || billingStatus === 'unpaid' || billingStatus === 'draft';
    const isPaid = billingStatus === 'paid';

    let matchesStatus = true;
    if (statusFilter === 'Pending') {
      matchesStatus = isPending;
    } else if (statusFilter === 'Paid') {
      matchesStatus = isPaid;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusName: string) => {
    const status = statusName?.toLowerCase() || '';
    if (status === 'paid') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">PAID</span>;
    }

    return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">PENDING</span>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date
      .toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      .toUpperCase();
  };

  const formatMoney = (value: any) => Number(value || 0).toLocaleString();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search billings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCcw className={loading ? 'animate-spin' : ''} />
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white font-medium text-gray-700"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">INVOICE</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">CUSTOMER</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">SUMMARY</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">FINANCIALS</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">STATUS</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">TIMELINE</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-sm">Loading billings...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-red-500 font-medium mb-3">{error}</p>
                    <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    No billings found
                  </td>
                </tr>
              ) : (
                filteredBillings.map((billing) => {
                  const itemsCount = billing.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                  const firstItemName = billing.items?.[0]?.product_name || 'Items';

                  return (
                    <tr
                      key={billing.id}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedBilling(billing);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-sm">
                        #{String(billing.id).padStart(6, '0')}
                        <div className="text-xs font-medium text-slate-400 mt-1">{billing.invoice_number || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-sm">
                        {billing.party?.name || 'Walk-in Customer'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 dark:text-white text-sm">{itemsCount} items</div>
                        <div className="text-xs text-slate-400 truncate max-w-37.5">
                          {firstItemName}
                          {billing.items?.length > 1 ? ' ...' : ''}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-black text-green-500 text-sm">
                        Rs. {formatMoney(billing.total_amount)}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(billing.invoice_status)}</td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-xs">
                        {formatDate(billing.invoice_date)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                          <FiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
          TOTAL BILLINGS: {filteredBillings.length}
        </div>
      </div>

      {isModalOpen && selectedBilling && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Invoice #{String(selectedBilling.id).padStart(6, '0')}
                  </h2>
                  <p className="text-sm font-medium text-slate-500">{selectedBilling.party?.name || 'Walk-in Customer'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-gray-900/50">
              <div className="mb-6">{getStatusBadge(selectedBilling.invoice_status)}</div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <FiMapPin className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Customer:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBilling.party?.name || 'Walk-in Customer'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Invoice:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedBilling.invoice_date ? new Date(selectedBilling.invoice_date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiTag className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Due:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedBilling.due_date ? new Date(selectedBilling.due_date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Invoice Items</h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mb-8">
                {selectedBilling.items?.length ? (
                  selectedBilling.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white mb-1">{item.product_name || 'Item'}</p>
                        <p className="text-xs font-medium text-slate-500">
                          Qty: {item.quantity} @ Rs. {formatMoney(item.rate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Rs. {formatMoney(item.total_price || item.quantity * item.rate)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-500">No billing items available.</div>
                )}
              </div>

              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Price Breakdown</h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Subtotal:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Rs. {formatMoney(selectedBilling.sub_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Discount:</span>
                  <span className="font-bold text-emerald-500">- Rs. {formatMoney(selectedBilling.discount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Paid:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Rs. {formatMoney(selectedBilling.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Due:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Rs. {formatMoney(selectedBilling.due_amount)}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className="font-black text-slate-900 dark:text-white">Total Amount:</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">Rs. {formatMoney(selectedBilling.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-lg font-bold text-slate-600 border border-gray-200 hover:bg-slate-50 dark:text-slate-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2.5 rounded-lg font-bold text-slate-600 border border-gray-200 hover:bg-slate-50 dark:text-slate-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                <FiPrinter className="w-4 h-4" /> Print Bill
              </button>

              {selectedBilling.invoice_status?.toLowerCase() !== 'paid' ? (
                <button
                  onClick={handlePayNow}
                  disabled={processing}
                  className="px-8 py-2.5 rounded-lg font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-70 transition-colors shadow-lg"
                >
                  {processing ? 'Processing...' : 'Pay Now'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
