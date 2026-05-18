import React, { useState, useEffect } from 'react';
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
}

export default function CreatePurchaseBillPage() {
  const navigate = useNavigate();
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceStatus, setInvoiceStatus] = useState('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(13);
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_id: '', product_name: '', quantity: 1, rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesRes, productsRes] = await Promise.all([
          partyApi.getAll('Supplier'),
          productApi.getAll(),
        ]);
        setParties(partiesRes.results || partiesRes || []);
        setProducts(productsRes.results || productsRes || []);
      } catch (err) {
        console.error('Error:', err);
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
            rate: product.cost_price || product.unit_price || 0,
            amount: (updated[index].quantity || 1) * (product.cost_price || product.unit_price || 0),
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
    setItems(prev => [...prev, { product_id: '', product_name: '', quantity: 1, rate: 0, amount: 0 }]);
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
        transaction_type: 'Purchase',
        invoice_number: `PUR-${Date.now()}`,
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

      // Add stock for each purchased item
      for (const item of items.filter(i => i.product_id)) {
        const product = products.find((p: any) => String(p.id) === item.product_id);
        if (product) {
          const newQty = (product.quantity || 0) + item.quantity;
          await productApi.update(item.product_id, { quantity: newQty });
        }
      }

      toast.success('Purchase bill recorded successfully!');
      navigate('/purchase');
    } catch (err: any) {
      console.error('Error creating purchase bill:', err);
      toast.error(err.message || 'Failed to record purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/purchase')}
          className="p-2 hover:#F8FAFC dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 #475569" />
        </button>
        <h1 className="text-xl font-bold #1E293B dark:text-[#EAE5DF]">Record Purchase Bill</h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-[#15161C] border #E2E8F0 dark:border-[#1C1D24] rounded-xl overflow-hidden">
        {/* Supplier, Date, Status */}
        <div className="p-5 border-b #E2E8F0 dark:border-[#1C1D24]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#F2DD50] dark:text-[#F2DD50] mb-1.5">
                Supplier / Party
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2 border #E2E8F0 dark:border-[#1C1D24] rounded-lg bg-white dark:bg-[#0D0E12] text-sm #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              >
                <option value="">Cash Purchase</option>
                {parties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium #475569 dark:text-[#44454F] mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border #E2E8F0 dark:border-[#1C1D24] rounded-lg bg-white dark:bg-[#0D0E12] text-sm #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium #475569 dark:text-[#44454F] mb-1.5">Status</label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value)}
                className="w-full px-3 py-2 border #E2E8F0 dark:border-[#1C1D24] rounded-lg bg-white dark:bg-[#0D0E12] text-sm #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-5 border-b #E2E8F0 dark:border-[#1C1D24]">
          <h3 className="text-sm font-bold #1E293B dark:text-[#EAE5DF] mb-3">Items</h3>
          
          <div className="grid grid-cols-[2fr_80px_100px_100px_40px] gap-3 mb-2">
            <span className="text-[11px] font-bold #475569 uppercase">ITEM</span>
            <span className="text-[11px] font-bold #475569 uppercase text-center">QTY</span>
            <span className="text-[11px] font-bold #475569 uppercase text-center">RATE</span>
            <span className="text-[11px] font-bold #475569 uppercase text-right">AMOUNT</span>
            <span></span>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[2fr_80px_100px_100px_40px] gap-3 mb-2 items-center">
              <select
                value={item.product_id}
                onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                className="w-full px-3 py-2 border #E2E8F0 dark:border-[#1C1D24] rounded-lg bg-white dark:bg-[#0D0E12] text-sm #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              >
                <option value="">Select item</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                className="w-full px-2 py-2 border #E2E8F0 dark:border-[#1C1D24] rounded-lg #FFFFFF dark:bg-[#0D0E12] text-sm text-center #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              />
              <input
                type="number"
                value={item.rate}
                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                className="w-full px-2 py-2 border #E2E8F0 dark:border-[#1C1D24] rounded-lg #FFFFFF dark:bg-[#0D0E12] text-sm text-center #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              />
              <div className="text-sm font-semibold #1E293B dark:text-[#EAE5DF] text-right py-2">
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
            className="inline-flex items-center gap-1.5 text-[#F2DD50] dark:text-[#F2DD50] text-sm font-semibold hover:text-[#8E7356] dark:hover:text-[#F2DD50] mt-2 transition-colors"
          >
            <FiPlus className="w-4 h-4" /> Add Row
          </button>
        </div>

        {/* Payment & Summary */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-[#64748B] mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border #E2E8F0 dark:border-[#1C1D24] rounded-lg bg-white dark:bg-[#0D0E12] text-sm #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-[#64748B] mb-1.5">Remarks / Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add notes..."
                className="w-full px-3 py-2 border border-blue-400 dark:border-blue-600 rounded-lg bg-white dark:bg-[#0D0E12] text-sm #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#F2DD50]"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="#475569 dark:text-[#44454F]">Subtotal</span>
              <span className="font-semibold #1E293B dark:text-[#EAE5DF]">
                {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="#475569 dark:text-[#44454F]">Discount (Rs.)</span>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border #E2E8F0 dark:border-[#1C1D24] rounded-md #FFFFFF dark:bg-[#0D0E12] text-sm text-right #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-1 focus:ring-[#F2DD50]"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="#475569 dark:text-[#44454F]">Tax (%)</span>
              <input
                type="number"
                min={0}
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border #E2E8F0 dark:border-[#1C1D24] rounded-md #FFFFFF dark:bg-[#0D0E12] text-sm text-right #1E293B dark:text-[#EAE5DF] focus:outline-none focus:ring-1 focus:ring-[#F2DD50]"
              />
            </div>
            <div className="pt-3 border-t #E2E8F0 dark:border-[#1C1D24] flex items-center justify-between">
              <span className="font-bold #1E293B dark:text-[#EAE5DF]">Grand Total</span>
              <span className="text-xl font-bold text-[#F2DD50] dark:text-[#F2DD50]">
                {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t #E2E8F0 dark:border-[#1C1D24] flex items-center justify-end gap-3">
          <button
            onClick={() => navigate('/purchase')}
            className="px-5 py-2 text-sm font-semibold #475569 dark:text-[#64748B] hover:#F8FAFC dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#F2DD50] text-white text-sm font-semibold rounded-lg hover:bg-[#8E7356] disabled:opacity-60 transition-colors shadow-sm"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Purchase Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}
