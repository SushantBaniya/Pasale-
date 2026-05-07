import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, partyApi, billingApi } from '../../utils/api';
import { FiSearch, FiMinus, FiPlus, FiClock, FiPackage, FiTrash2, FiCreditCard, FiSmartphone } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function QuickPOSPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [processing, setProcessing] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [partyId, setPartyId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'CREDIT'>('PAID');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(13);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, partiesRes] = await Promise.all([
          productApi.getAll(),
          partyApi.getAll(),
        ]);
        setProducts(productsRes.results || productsRes || []);
        setParties(partiesRes.results || partiesRes || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= existing.stock) {
          toast.error(`Only ${existing.stock} in stock`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: product.id,
        name: product.product_name,
        price: product.unit_price || 0,
        quantity: 1,
        stock: product.quantity || 0,
      }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return i;
        if (newQty > i.stock) {
          toast.error(`Only ${i.stock} in stock`);
          return i;
        }
        return { ...i, quantity: newQty };
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.product_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCheckout = async (method: 'cash' | 'qr') => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        transaction_type: 'Sales',
        invoice_number: `POS-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_status: paymentStatus === 'PAID' ? 'Paid' : 'Unpaid',
        party: partyId ? parseInt(partyId) : null,
        notes: `Quick POS Sale - ${method.toUpperCase()}`,
        discount: discountAmount,
        tax: taxAmount,
        sub_total: subtotal,
        total_amount: grandTotal,
        business_id: localStorage.getItem('business_id'),
        items: cart.map(i => ({
          item: i.id,
          quantity: i.quantity,
          rate: i.price,
          total_price: i.price * i.quantity,
        })),
      };

      await billingApi.create(payload);

      // Deduct stock
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await productApi.update(item.id, {
            quantity: Math.max(0, product.quantity - item.quantity)
          });
        }
      }

      toast.success('Sale completed!');
      setCart([]);
      setPartyId('');
      setDiscountPercent(0);

      // Refresh products
      const res = await productApi.getAll();
      setProducts(res.results || res || []);
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatMoney = (n: number) =>
    `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;

  const now = new Date();
  const sessionTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-80px)] -mt-2">
      
      {/* ── Left: Product Grid ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* POS Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Quick POS Terminal</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                ACTIVE SESSION: {sessionTime}
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FiClock className="w-3.5 h-3.5" /> HISTORY
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products or scan (F1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === 'All'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.quantity <= 0}
                  className={`flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md transition-all duration-200 text-left group ${
                    product.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-3">
                    <FiPackage className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-1 truncate w-full">
                    {product.product_name}
                  </p>
                  <div className="flex items-center gap-1.5 w-full justify-center">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {formatMoney(product.unit_price || 0)}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiPlus className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart & Checkout ── */}
      <div className="w-full lg:w-[340px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col shrink-0">
        
        {/* Customer */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            CUSTOMER / PARTY
          </label>
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="w-full px-3 py-2 border-2 border-teal-500 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="">Walk-in Customer</option>
            {parties.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Payment Status Toggle */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            PAYMENT STATUS
          </label>
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setPaymentStatus('PAID')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                paymentStatus === 'PAID' ? 'bg-teal-600 text-white' : 'text-gray-500'
              }`}
            >
              PAID
            </button>
            <button
              onClick={() => setPaymentStatus('CREDIT')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                paymentStatus === 'CREDIT' ? 'bg-gray-700 text-white' : 'text-gray-500'
              }`}
            >
              CREDIT
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FiPackage className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No items in cart</p>
              <p className="text-xs text-gray-300 dark:text-gray-600">Click products to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="border-b border-gray-50 dark:border-gray-700/50 pb-3 last:border-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-400">{formatMoney(item.price)}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatMoney(item.price * item.quantity).replace('Rs. ', 'RS. ')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiPlus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-300">SUBTOTAL</span>
            <span className="font-bold text-gray-900 dark:text-white">{formatMoney(subtotal).replace('Rs.', 'RS.')}</span>
          </div>
          
          {/* Discount & Tax inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Discount %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                className="w-full mt-0.5 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Tax %</label>
              <input
                type="number"
                min={0}
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-full mt-0.5 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-teal-600">DISCOUNT APPLIED</span>
              <span className="text-teal-600 font-bold">-{formatMoney(discountAmount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-teal-600">TAX APPLIED</span>
              <span className="text-teal-600 font-bold">+{formatMoney(taxAmount)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center mt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
              TOTAL PAYABLE AMOUNT
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatMoney(grandTotal)}
            </p>
          </div>

          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => handleCheckout('cash')}
              disabled={processing || cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <FiCreditCard className="w-4 h-4" />
              PAY IN CASH
            </button>
            <button
              onClick={() => handleCheckout('qr')}
              disabled={processing || cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <FiSmartphone className="w-4 h-4" />
              QR PAYMENT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
