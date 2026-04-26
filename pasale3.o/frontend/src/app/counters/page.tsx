import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { counterApi, orderApi } from '../../utils/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import {
  FiPlus, FiMonitor, FiTrash2, FiAlertCircle,
  FiCheckCircle, FiChevronRight, FiBox,
  FiShoppingBag, FiArrowLeft, FiClock, FiCheck
} from 'react-icons/fi';

interface Counter {
  id: number;
  counter_number: number;
  description: string;
  is_active: boolean;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function CountersPage() {
  const navigate = useNavigate();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    counter_number: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  // Detail view state
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    // Parallelize initial data fetching
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchCounters(false), // Don't set loading inside, we handle it here
        fetchStatuses()
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedCounter) {
      fetchPendingOrders(selectedCounter.id);
    }
  }, [selectedCounter]);

  const fetchCounters = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await counterApi.getAll();
      const results = data.results || data || [];
      // Ensure we don't trigger unnecessary re-renders if data hasn't changed
      setCounters(results);
    } catch (err: any) {
      setError('Failed to load counters');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const data = await orderApi.getStatuses();
      setStatuses(data.results || data || []);
    } catch (err) {
      console.error('Failed to load statuses', err);
    }
  };

  const fetchPendingOrders = async (counterId: number) => {
    try {
      setLoadingOrders(true);
      const data = await orderApi.getAll({ counterId, status: 'Pending' });
      // Now the backend already filters for Pending orders
      const orders = data.results || data || [];
      setPendingOrders(orders);
    } catch (err: any) {
      setError('Failed to load pending orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    const completedStatus = statuses.find(s =>
      s.name.toLowerCase() === 'completed' || s.name.toLowerCase() === 'complete' || s.name.toLowerCase() === 'paid'
    );

    if (!completedStatus) {
      setError('Completed status ID not found. Please contact administrator.');
      return;
    }

    try {
      setCompletingId(orderId);
      const response = await orderApi.update(orderId, { status_id: completedStatus.id });
      const billingId = response?.billing_id;
      // Redirect to billing page and open the invoice created for this order
      navigate(billingId ? `/billing?billingId=${billingId}` : `/billing?orderId=${orderId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to complete order');
    } finally {
      setCompletingId(null);
    }
  };

  const handleAddCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.counter_number) {
      setError('Counter number is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await counterApi.create({
        counter_number: parseInt(formData.counter_number),
        description: formData.description
      });
      setFormData({ counter_number: '', description: '' });
      setShowAdd(false);
      fetchCounters();
    } catch (err: any) {
      setError(err.message || 'Failed to create counter');
    } finally {
      setSaving(false);
    }
  };

  if (selectedCounter) {
    return (
      <div className="p-6 max-w-5xl mx-auto animate-in slide-in-from-right duration-300">
        <button
          onClick={() => setSelectedCounter(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Counters
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Counter {selectedCounter.counter_number}</h1>
            <p className="text-gray-500">{selectedCounter.description || 'Manage active orders for this counter'}</p>
          </div>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-bold border border-indigo-100">
            {pendingOrders.length} Pending Orders
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : pendingOrders.length === 0 ? (
          <Card className="p-20 text-center flex flex-col items-center border-dashed border-2 bg-gray-50 shadow-none">
            <FiShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No pending orders</h3>
            <p className="text-gray-500 max-w-sm mb-6">There are no active orders on this counter. New orders from the cart will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingOrders.map(order => (
              <Card key={order.id} className="overflow-hidden border-0 shadow-xl bg-white">
                <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                      <FiClock />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order Reference</p>
                      <p className="font-bold text-gray-900">#{order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Amount Due</p>
                    <p className="text-2xl font-black text-indigo-600">Rs. {order.total_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiBox className="text-indigo-600" /> Order Items
                  </h4>
                  <div className="space-y-3">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-gray-700">{item.product_name}</span>
                        </div>
                        <span className="font-medium text-gray-500">Rs. {item.total_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
                  <p className="text-gray-600 text-sm font-medium">Ready to finalize this transaction?</p>
                  <Button
                    onClick={() => handleCompleteOrder(order.id)}
                    disabled={completingId === order.id}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 font-black flex items-center gap-2 border-0 shadow-lg"
                  >
                    {completingId === order.id ? 'Processing...' : (
                      <>
                        <FiCheck className="w-5 h-5" /> Complete Order
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counters</h1>
          <p className="text-sm text-gray-500">Manage your business counters and points of sale</p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <FiPlus /> Add Counter
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <FiAlertCircle className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : counters.length === 0 ? (
        <Card className="p-20 text-center flex flex-col items-center border-dashed border-2 bg-gray-50">
          <FiMonitor className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No counters found</h3>
          <p className="text-gray-500 max-w-sm mb-6">You haven't added any counters yet. Add one to start managing your orders by counter.</p>
          <Button onClick={() => setShowAdd(true)} variant="outline">
            Create First Counter
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.map(counter => (
            <Card
              key={counter.id}
              className="p-6 hover:shadow-xl transition-all border-0 shadow-sm bg-white group cursor-pointer hover:-translate-y-1"
              onClick={() => setSelectedCounter(counter)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FiMonitor className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${counter.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {counter.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                  <FiChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Counter {counter.counter_number}</h3>
              <p className="text-sm text-gray-500 mb-6">{counter.description || 'No description provided'}</p>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">VIEW PENDING ORDERS</span>
                <FiShoppingBag className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Counter Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b bg-indigo-600 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New Counter</h2>
              <button onClick={() => setShowAdd(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                <FiPlus className="rotate-45 w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCounter} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Counter Number</label>
                <Input
                  type="number"
                  value={formData.counter_number}
                  onChange={(e) => setFormData({ ...formData, counter_number: e.target.value })}
                  placeholder="e.g. 1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description (e.g. First Floor Counter)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:border-indigo-600 resize-none h-32"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Counter'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
