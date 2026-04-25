import React, { useState, useEffect } from 'react';
import { orderApi } from '../../utils/api';
import { FiSearch, FiRefreshCcw, FiEye, FiShoppingBag, FiMapPin, FiTag, FiCalendar, FiPrinter, FiX } from 'react-icons/fi';

export default function BillingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersRes = await orderApi.getAll();
      console.log('Orders response:', ordersRes);
      const sortedOrders = (ordersRes.results || ordersRes || []).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(sortedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePayNow = async () => {
    if (!selectedOrder) return;
    try {
      setProcessing(true);
      // Fetch statuses and find the paid/completed one
      const statusesData = await orderApi.getStatuses();
      const allStatuses = statusesData.results || statusesData || [];
      const paidStatus = allStatuses.find((s: any) => 
        s.name.toLowerCase() === 'paid' || 
        s.name.toLowerCase() === 'completed' || 
        s.name.toLowerCase() === 'complete'
      );
      if (!paidStatus) {
        alert('Paid/Completed status not found. Please configure it in admin.');
        return;
      }
      await orderApi.update(selectedOrder.id, { status_id: paidStatus.id });
      setSelectedOrder({ ...selectedOrder, status: paidStatus.name });
      fetchData();
    } catch (err) {
      console.error('Failed to process payment', err);
      alert('Failed to process payment. Please check the backend configuration.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const formattedId = `#${String(order.id).padStart(6, '0')}`;
    const matchesSearch = formattedId.includes(searchQuery) || 
                          order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Normalize status names for filtering
    const orderStatus = order.status?.toLowerCase() || '';
    const isOrderPending = orderStatus === 'pending' || orderStatus === 'new' || orderStatus === 'processing';
    const isOrderPaid = orderStatus === 'paid' || orderStatus === 'completed' || orderStatus === 'complete';
    
    let matchesStatus = true;
    if (statusFilter === 'Pending') {
      matchesStatus = isOrderPending;
    } else if (statusFilter === 'Paid') {
      matchesStatus = isOrderPaid;
    }
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusName: string) => {
    const s = statusName?.toLowerCase() || '';
    if (s === 'paid' || s === 'completed' || s === 'complete') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">PAID</span>;
    }
    return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">PENDING</span>;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
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
            <FiRefreshCcw className={loading ? "animate-spin" : ""} />
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

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">ORDER DETAILS</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">LOCATION</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">SUMMARY</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">FINANCIALS</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">STATUS</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">TIMELINE</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-sm">Loading orders...</p>
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
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemsCount = order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
                  const firstItemName = order.items?.[0]?.product_name || 'Items';
                  
                  return (
                    <tr 
                      key={order.id} 
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-sm">
                        #{String(order.id).padStart(6, '0')}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-sm">
                        {order.counter_number ? `Table ${order.counter_number}` : 'Takeaway'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 dark:text-white text-sm">{itemsCount} items</div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{firstItemName} {order.items?.length > 1 ? '...' : ''}</div>
                      </td>
                      <td className="py-4 px-6 font-black text-green-500 text-sm">
                        Rs. {parseFloat(order.total_amount).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-xs">
                        {formatDate(order.created_at)}
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
          TOTAL ORDERS: {filteredOrders.length}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Order #{String(selectedOrder.id).padStart(6, '0')}
                  </h2>
                  <p className="text-sm font-medium text-slate-500">{selectedOrder.customer_name || 'Walk-in Customer'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-gray-900/50">
              <div className="mb-6">
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Order Meta Info */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <FiMapPin className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Location:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedOrder.counter_number ? `Table ${selectedOrder.counter_number}` : 'Takeaway'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiTag className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Type:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedOrder.counter_number ? 'Dining' : 'Takeaway'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Created:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(selectedOrder.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Order Items</h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mb-8">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white mb-1">{item.product_name}</p>
                      <p className="text-xs font-medium text-slate-500">Qty: {item.quantity}  @ Rs. {parseFloat(item.unit_price).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      {item.status && (
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded mb-1">
                          {item.status.name || 'Cooked'}
                        </span>
                      )}
                      <p className="font-bold text-slate-900 dark:text-white">Rs. {parseFloat(item.total_price || (item.quantity * item.unit_price)).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Price Breakdown</h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Subtotal:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Rs. {parseFloat(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Discount:</span>
                  <span className="font-bold text-emerald-500">- Rs. 0.00</span>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className="font-black text-slate-900 dark:text-white">Total Amount:</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">Rs. {parseFloat(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-lg font-bold text-slate-600 border border-gray-200 hover:bg-slate-50 dark:text-slate-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button 
                className="px-6 py-2.5 rounded-lg font-bold text-slate-600 border border-gray-200 hover:bg-slate-50 dark:text-slate-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FiPrinter className="w-4 h-4" /> Print Bill
              </button>
              
              {/* Show Pay Now if it's pending */}
              {(() => {
                const s = selectedOrder.status?.toLowerCase() || '';
                const isPaid = s === 'paid' || s === 'completed' || s === 'complete';
                if (!isPaid) {
                  return (
                    <button 
                      onClick={handlePayNow}
                      disabled={processing}
                      className="px-8 py-2.5 rounded-lg font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-70 transition-colors shadow-lg"
                    >
                      {processing ? 'Processing...' : 'Pay Now'}
                    </button>
                  );
                }
                return null;
              })()}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
