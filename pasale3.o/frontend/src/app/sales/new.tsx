import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi, productApi, partyApi } from '../../utils/api';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface InvoiceItem {
  product_id: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  stock: number;
}

export default function CreateSalesInvoicePage() {
  const navigate = useNavigate();
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceStatus, setInvoiceStatus] = useState('Paid');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash
  const [remarks, setRemarks] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(13);
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_id: '', product_name: '', quantity: 1, rate: 0, amount: 0, stock: 0 },
  ]);

  // Fetch parties and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesRes, productsRes] = await Promise.all([
          partyApi.getAll(),
          productApi.getAll(),
        ]);
        setParties(partiesRes.results || partiesRes || []);
        setProducts(productsRes.results || productsRes || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'product_id') {
        const product = products.find((p: any) => String(p.id) === String(value));
        if (product) {
          updated[index] = {
            ...updated[index],
            product_id: String(product.id),
            product_name: product.product_name,
            rate: product.unit_price || 0,
            stock: product.quantity || 0,
            amount: (updated[index].quantity || 1) * (product.unit_price || 0),
          };
        }
      } else if (field === 'quantity') {
        const qty = Math.max(1, parseInt(value) || 1);
        updated[index] = { ...updated[index], quantity: qty, amount: qty * updated[index].rate };
      } else if (field === 'rate') {
        const rate = parseFloat(value) || 0;
        updated[index] = { ...updated[index], rate, amount: updated[index].quantity * rate };
      }
      return updated;
    });
  };

  const addRow = () => {
    setItems(prev => [...prev, { product_id: '', product_name: '', quantity: 1, rate: 0, amount: 0, stock: 0 }]);
  };

  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = discount || 0;
  const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const handleSubmit = async () => {
    if (items.every(i => !i.product_id)) {
      toast.error('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        transaction_type: 'Sales',
        invoice_number: `INV-${Date.now()}`,
        invoice_date: date,
        invoice_status: invoiceStatus,
        party: partyId ? parseInt(partyId) : null,
        notes: remarks,
        discount: discountAmount,
        tax: taxAmount,
        sub_total: subtotal,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        business_id: localStorage.getItem('business_id'),
        items: items
          .filter(i => i.product_id)
          .map(i => ({
            item: parseInt(i.product_id),
            quantity: i.quantity,
            rate: i.rate,
            total_price: i.amount,
          })),
      };

      await billingApi.create(payload);

      // Deduct stock for each item
      for (const item of items.filter(i => i.product_id)) {
        const product = products.find((p: any) => String(p.id) === item.product_id);
        if (product) {
          const newQty = Math.max(0, product.quantity - item.quantity);
          await productApi.update(item.product_id, { quantity: newQty });
        }
      }

      toast.success('Sales invoice created successfully!');
      navigate('/sales');
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/sales')}
          className="p-2 hover:#EDE5DA dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 #8A7060" />
        </button>
        <h1 className="text-xl font-bold #3D2B1A dark:text-[#E0E0E0]">Create Sales Invoice</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#1A1A1A] border #E5D8CC dark:border-[#222222] rounded-xl overflow-hidden">
        {/* Customer, Date, Status */}
        <div className="p-5 border-b #E5D8CC dark:border-[#222222]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#D4623A] dark:text-[#D4623A] mb-1.5">
                Customer / Party (Optional)
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              >
                <option value="">Cash Sale</option>
                {parties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium #8A7060 dark:text-[#555555] mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium #8A7060 dark:text-[#555555] mb-1.5">Status</label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value)}
                className="w-full px-3 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-5 border-b #E5D8CC dark:border-[#222222]">
          <h3 className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0] mb-3">Items</h3>
          
          {/* Items Header */}
          <div className="grid grid-cols-[2fr_80px_100px_100px_40px] gap-3 mb-2">
            <span className="text-[11px] font-bold #8A7060 uppercase">ITEM</span>
            <span className="text-[11px] font-bold #8A7060 uppercase text-center">QTY</span>
            <span className="text-[11px] font-bold #8A7060 uppercase text-center">RATE</span>
            <span className="text-[11px] font-bold #8A7060 uppercase text-right">AMOUNT</span>
            <span></span>
          </div>

          {/* Item Rows */}
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[2fr_80px_100px_100px_40px] gap-3 mb-2 items-center">
              <select
                value={item.product_id}
                onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                className="w-full px-3 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              >
                <option value="">Select item</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name} (Stock: {p.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                className="w-full px-2 py-2 border #E5D8CC dark:border-[#222222] rounded-lg #FAF7F3 dark:bg-[#111111] text-sm text-center #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              />
              <input
                type="number"
                value={item.rate}
                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                className="w-full px-2 py-2 border #E5D8CC dark:border-[#222222] rounded-lg #FAF7F3 dark:bg-[#111111] text-sm text-center #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              />
              <div className="text-sm font-semibold #3D2B1A dark:text-[#E0E0E0] text-right py-2">
                {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <button
                onClick={() => removeRow(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-[#D4623A] dark:text-[#D4623A] text-sm font-semibold hover:text-[#B8502E] dark:hover:text-[#D4623A] mt-2 transition-colors"
          >
            <FiPlus className="w-4 h-4" /> Add Row
          </button>
        </div>

        {/* Payment & Summary */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left — Payment */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-[#CCCCCC] mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-[#CCCCCC] mb-1.5">Remarks / Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add notes..."
                className="w-full px-3 py-2 border border-blue-400 dark:border-blue-600 rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]"
              />
            </div>
          </div>

          {/* Right — Summary */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="#8A7060 dark:text-[#555555]">Subtotal</span>
              <span className="font-semibold #3D2B1A dark:text-[#E0E0E0]">
                {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="#8A7060 dark:text-[#555555]">Discount (Rs.)</span>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border #E5D8CC dark:border-[#222222] rounded-md #FAF7F3 dark:bg-[#111111] text-sm text-right #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-1 focus:ring-[#D4623A]"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="#8A7060 dark:text-[#555555]">Tax (%)</span>
              <input
                type="number"
                min={0}
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border #E5D8CC dark:border-[#222222] rounded-md #FAF7F3 dark:bg-[#111111] text-sm text-right #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-1 focus:ring-[#D4623A]"
              />
            </div>
            <div className="pt-3 border-t #E5D8CC dark:border-[#222222] flex items-center justify-between">
              <span className="font-bold #3D2B1A dark:text-[#E0E0E0]">Grand Total</span>
              <span className="text-xl font-bold text-[#D4623A] dark:text-[#D4623A]">
                {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t #E5D8CC dark:border-[#222222] flex items-center justify-end gap-3">
          <button
            onClick={() => navigate('/sales')}
            className="px-5 py-2 text-sm font-semibold #8A7060 dark:text-[#CCCCCC] hover:#EDE5DA dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#D4623A] text-white text-sm font-semibold rounded-lg hover:bg-[#B8502E] disabled:opacity-60 transition-colors shadow-sm"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
