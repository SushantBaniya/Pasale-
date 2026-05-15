import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productApi, partyApi, billingApi } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiSearch, FiPlus, FiMinus, FiTrash2, FiEdit2,
  FiX, FiCalendar, FiCamera, FiPrinter, FiSave,
  FiChevronDown, FiInfo, FiLink, FiPackage
} from 'react-icons/fi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  category?: string;
}

interface Party {
  id: number;
  name: string;
  balance?: number;
}

interface BillingItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  unit?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = [
  '#4CAF8C', '#5B8DEF', '#E97B54', '#9B6DE8', '#E8B84B', '#4BB8E8'
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Sub-components ──────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-[#111111] rounded-2xl shadow-2xl w-full mx-4 ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b #E5D8CC dark:border-[#222222]">
          <h2 className="text-base font-bold #3D2B1A dark:text-[#E0E0E0]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:#8A7060 hover:#EDE5DA dark:hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Apply Discount Modal ─────────────────────────────────────────────────────

function DiscountModal({ open, onClose, subtotal, onApply }: {
  open: boolean; onClose: () => void; subtotal: number;
  onApply: (pct: number, amt: number) => void;
}) {
  const [pct, setPct] = useState('');
  const [amt, setAmt] = useState('');
  const [linked, setLinked] = useState(true);

  const handlePctChange = (v: string) => {
    setPct(v);
    if (linked) {
      const p = parseFloat(v) || 0;
      setAmt(((subtotal * p) / 100).toFixed(2));
    }
  };
  const handleAmtChange = (v: string) => {
    setAmt(v);
    if (linked) {
      const a = parseFloat(v) || 0;
      setPct(((a / subtotal) * 100).toFixed(2));
    }
  };

  const handleApply = () => {
    onApply(parseFloat(pct) || 0, parseFloat(amt) || 0);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Apply Discount">
      <div className="space-y-4">
        <div className="#FAF7F3 dark:bg-[#1A1A1A] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium #8A7060 dark:text-[#555555]">Total Amount</span>
          <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">{fmt(subtotal)}</span>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-[#CCCCCC] mb-2">Discount</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="0"
                value={pct}
                onChange={e => handlePctChange(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 border-2 border-[#D4623A] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">%</span>
            </div>
            <button
              onClick={() => setLinked(!linked)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-colors ${linked ? 'border-[#D4623A] bg-[#FDF1EC] dark:bg-[#D4623A]/15 text-[#D4623A]' : '#E5D8CC dark:border-[#222222] text-gray-400'}`}
            >
              <FiLink className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rs.</span>
              <input
                type="number"
                placeholder="0.00"
                value={amt}
                onChange={e => handleAmtChange(e.target.value)}
                className="w-full px-3 py-2.5 pl-10 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border #E5D8CC dark:border-[#222222] text-sm font-semibold #8A7060 dark:text-[#CCCCCC] rounded-xl hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 bg-[#D4623A] text-white text-sm font-bold rounded-xl hover:bg-[#B8502E] transition-colors"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── VAT Modal ────────────────────────────────────────────────────────────────

function VATModal({ open, onClose, taxableAmount, onApply }: {
  open: boolean; onClose: () => void; taxableAmount: number;
  onApply: (pct: number) => void;
}) {
  const [pct, setPct] = useState('13');

  return (
    <Modal open={open} onClose={onClose} title="Apply VAT / Tax">
      <div className="space-y-4">
        <div className="#FAF7F3 dark:bg-[#1A1A1A] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium #8A7060">Taxable Amount</span>
          <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">{fmt(taxableAmount)}</span>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-[#CCCCCC] mb-2">Tax Rate</label>
          <div className="relative">
            <input
              type="number"
              value={pct}
              onChange={e => setPct(e.target.value)}
              className="w-full px-3 py-2.5 pr-8 border-2 border-[#D4623A] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">%</span>
          </div>
          <div className="flex gap-2 mt-2">
            {['0', '5', '13', '15'].map(v => (
              <button
                key={v}
                onClick={() => setPct(v)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${pct === v ? 'bg-[#D4623A] text-white' : '#EDE5DA dark:bg-[#1A1A1A] #8A7060 dark:text-[#555555]'}`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border #E5D8CC dark:border-[#222222] text-sm font-semibold #8A7060 rounded-xl hover:#FAF7F3 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onApply(parseFloat(pct) || 0); onClose(); }}
            className="flex-1 py-2.5 bg-[#D4623A] text-white text-sm font-bold rounded-xl hover:bg-[#B8502E] transition-colors"
          >
            Apply VAT
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add New Item Modal ───────────────────────────────────────────────────────

function AddNewItemModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    product_name: '', category: 'General', item_type: 'Product',
    unit_price: '', purchase_price: '', quantity: '', unit: 'PIECES (PCS)',
    item_code: '', hs_code: '', description: ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.product_name) { toast.error('Item name is required'); return; }
    setSaving(true);
    try {
      await onSave({
        product_name: form.product_name,
        category: form.category,
        unit_price: parseFloat(form.unit_price) || 0,
        purchase_price: parseFloat(form.purchase_price) || 0,
        quantity: parseInt(form.quantity) || 0,
        unit: form.unit,
        item_code: form.item_code,
        hs_code: form.hs_code,
        description: form.description,
      });
      setForm({ product_name: '', category: 'General', item_type: 'Product', unit_price: '', purchase_price: '', quantity: '', unit: 'PIECES (PCS)', item_code: '', hs_code: '', description: '' });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const generateCode = () => set('item_code', `ITEM-${Math.floor(Math.random() * 90000) + 10000}`);

  return (
    <Modal open={open} onClose={onClose} title="Add New Item" wide>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Item Name</label>
          <input
            type="text"
            value={form.product_name}
            onChange={e => set('product_name', e.target.value)}
            placeholder="Enter item name"
            className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] focus:ring-1 focus:ring-[#D4623A]/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Item Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
            >
              <option>General</option>
              <option>Electronics</option>
              <option>Food</option>
              <option>Clothing</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Item Type</label>
            <div className="flex gap-2">
              {['Product', 'Service'].map(t => (
                <button
                  key={t}
                  onClick={() => set('item_type', t)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-colors ${form.item_type === t ? 'border-[#D4623A] bg-[#FDF1EC] dark:bg-[#D4623A]/15 text-[#D4623A]' : '#E5D8CC dark:border-[#222222] #8A7060'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Sales Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rs.</span>
              <input
                type="number"
                value={form.unit_price}
                onChange={e => set('unit_price', e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-12 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">/PCS</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Purchase Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rs.</span>
              <input
                type="number"
                value={form.purchase_price}
                onChange={e => set('purchase_price', e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-12 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">/PCS</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Opening Stock</label>
            <div className="relative">
              <input
                type="number"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="0"
                className="w-full px-3 pr-12 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">PCS</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Primary Unit</label>
            <select
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
            >
              <option>PIECES (PCS)</option>
              <option>KILOGRAMS (KG)</option>
              <option>LITERS (L)</option>
              <option>METERS (M)</option>
              <option>BOXES (BOX)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Item Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.item_code}
                onChange={e => set('item_code', e.target.value)}
                placeholder="Enter item code"
                className="flex-1 px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
              />
              <button
                onClick={generateCode}
                className="px-3 py-2.5 #EDE5DA dark:bg-[#1A1A1A] #8A7060 dark:text-[#CCCCCC] text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Generate
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">HS Code</label>
            <input
              type="text"
              value={form.hs_code}
              onChange={e => set('hs_code', e.target.value)}
              placeholder="Enter HS code"
              className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Write description here..."
            rows={3}
            className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] resize-none"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border #E5D8CC dark:border-[#222222] text-sm font-semibold #8A7060 dark:text-[#CCCCCC] rounded-xl hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#D4623A] text-white text-sm font-bold rounded-xl hover:bg-[#B8502E] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit Item Price Modal ────────────────────────────────────────────────────

function EditItemModal({ open, onClose, item, onSave }: {
  open: boolean; onClose: () => void;
  item: BillingItem | null;
  onSave: (id: number, price: number, qty: number) => void;
}) {
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');

  useEffect(() => {
    if (item) { setPrice(item.price.toString()); setQty(item.quantity.toString()); }
  }, [item]);

  if (!item) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${item.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Rate / Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rs.</span>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border-2 border-[#D4623A] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border #E5D8CC dark:border-[#222222] text-sm font-semibold #8A7060 rounded-xl hover:#FAF7F3 transition-colors">Cancel</button>
          <button
            onClick={() => { onSave(item.id, parseFloat(price) || 0, parseInt(qty) || 1); onClose(); }}
            className="flex-1 py-2.5 bg-[#D4623A] text-white text-sm font-bold rounded-xl hover:bg-[#B8502E] transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Confirm Sale Modal ───────────────────────────────────────────────────────

function ConfirmSaleModal({ open, onClose, total, parties, onConfirm }: {
  open: boolean; onClose: () => void; total: number;
  parties: Party[]; onConfirm: (data: any) => Promise<void>;
}) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today.toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [receivedAmount, setReceivedAmount] = useState(total.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setReceivedAmount(total.toFixed(2));
  }, [total]);

  const handleConfirm = async (print: boolean) => {
    setSaving(true);
    try {
      await onConfirm({ invoiceNo, invoiceDate, partyId, receivedAmount: parseFloat(receivedAmount), paymentMethod, notes, print });
    } finally {
      setSaving(false);
    }
  };

  const selectedParty = parties.find(p => p.id === parseInt(partyId));
  const balance = selectedParty?.balance ?? 0;

  return (
    <Modal open={open} onClose={onClose} title="Confirm Sale" wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">
              Invoice No
              <button className="ml-2 text-[#D4623A] font-bold normal-case">Manual</button>
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              placeholder="Auto"
              className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Invoice Date</label>
            <div className="relative">
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold #8A7060 uppercase tracking-wider">Bill To</label>
            <span className="text-xs font-bold text-gray-400">Rs. {balance.toFixed(2)}</span>
          </div>
          <div className="relative">
            <select
              value={partyId}
              onChange={e => setPartyId(e.target.value)}
              className="w-full px-3 py-2.5 pr-8 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] appearance-none"
            >
              <option value="">Walk-in Customer</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="#FAF7F3 dark:bg-[#1A1A1A] rounded-xl px-4 py-3">
          <span className="text-sm #8A7060">Total Amount: </span>
          <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">{fmt(total)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">
              <input type="checkbox" className="mr-1.5 accent-blue-600" defaultChecked /> Received Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rs.</span>
              <input
                type="number"
                value={receivedAmount}
                onChange={e => setReceivedAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm #FAF7F3 dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Payment Method</label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] appearance-none"
              >
                <option>Cash</option>
                <option>Card</option>
                <option>QR / Online</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-1.5">Notes or Remarks</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border-2 border-blue-400 rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold #8A7060 uppercase tracking-wider mb-2">Attach Images</label>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => setImages(Array.from(e.target.files || []))} />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-[#222222] rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-[#D4623A] transition-colors"
            >
              <FiCamera className="w-5 h-5" />
            </button>
            {images.map((f, i) => (
              <div key={i} className="w-16 h-16 rounded-xl bg-[#FDF1EC] dark:bg-[#D4623A]/15 flex items-center justify-center text-xs text-[#D4623A] font-medium truncate px-1 text-center">
                {f.name.slice(0, 8)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 border #E5D8CC dark:border-[#222222] text-sm font-semibold #8A7060 dark:text-[#CCCCCC] rounded-xl hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => handleConfirm(false)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-[#222222] text-sm font-bold text-gray-700 dark:text-[#CCCCCC] rounded-xl hover:#FAF7F3 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <FiSave className="w-4 h-4" /> Save Only
          </button>
          <button
            onClick={() => handleConfirm(true)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#D4623A] text-white text-sm font-bold rounded-xl hover:bg-[#B8502E] disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
          >
            <FiPrinter className="w-4 h-4" /> Save & Print
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuickPOSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Billing items
  const [items, setItems] = useState<BillingItem[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountAmt, setDiscountAmt] = useState(0);
  const [taxPct, setTaxPct] = useState(13);

  // Modal states
  const [showDiscount, setShowDiscount] = useState(false);
  const [showVAT, setShowVAT] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editItem, setEditItem] = useState<BillingItem | null>(null);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [pr, par] = await Promise.all([productApi.getAll(), partyApi.getAll()]);
        setProducts(pr.results || pr || []);
        setParties(par.results || par || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Categories derived from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General').filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || (p.category || 'General') === activeCategory;
    const matchSearch = !search || p.product_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Cart ops
  const addItem = (p: Product) => {
    setItems(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) {
        if (ex.quantity >= ex.stock) { toast.error(`Only ${ex.stock} in stock`); return prev; }
        return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: p.id, name: p.product_name, price: p.unit_price, quantity: 1, stock: p.quantity }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nq = i.quantity + delta;
      if (nq <= 0) return i;
      if (nq > i.stock) { toast.error(`Only ${i.stock} in stock`); return i; }
      return { ...i, quantity: nq };
    }));
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItemPriceQty = (id: number, price: number, qty: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, price, quantity: qty } : i));
  };

  // Totals
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const finalDiscount = discountAmt || (subtotal * discountPct) / 100;
  const taxable = subtotal - finalDiscount;
  const taxAmount = (taxable * taxPct) / 100;
  const grandTotal = taxable + taxAmount;

  // Add new item to inventory
  const handleAddNewItem = async (data: any) => {
    try {
      await productApi.create(data);
      toast.success('Item Added Successfully');
      const pr = await productApi.getAll();
      setProducts(pr.results || pr || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add item');
      throw e;
    }
  };

  // Confirm sale
  const handleConfirmSale = async (opts: any) => {
    try {
      const payload = {
        transaction_type: 'Sales',
        invoice_number: opts.invoiceNo || `POS-${Date.now()}`,
        invoice_date: opts.invoiceDate,
        invoice_status: 'Paid',
        party: opts.partyId ? parseInt(opts.partyId) : null,
        notes: opts.notes,
        discount: finalDiscount,
        tax: taxAmount,
        sub_total: subtotal,
        total_amount: grandTotal,
        payment_method: opts.paymentMethod,
        business_id: localStorage.getItem('business_id'),
        items: items.map(i => ({
          item: i.id,
          quantity: i.quantity,
          rate: i.price,
          total_price: i.price * i.quantity,
        })),
      };
      await billingApi.create(payload);

      toast.success('Sales Invoice Added Successfully');
      setItems([]);
      setDiscountPct(0);
      setDiscountAmt(0);
      setShowConfirm(false);

      const pr = await productApi.getAll();
      setProducts(pr.results || pr || []);

      if (opts.print) window.print();
    } catch (e: any) {
      toast.error(e.message || 'Checkout failed');
      throw e;
    }
  };

  const clearAll = () => {
    setItems([]);
    setDiscountPct(0);
    setDiscountAmt(0);
    setTaxPct(13);
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-64px)] #FAF7F3 dark:bg-gray-950 overflow-hidden">

      {/* ── LEFT: Product Catalog ── */}
      <div className="flex-1 flex flex-col min-w-0 px-6 py-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold #3D2B1A dark:text-[#E0E0E0]">Quick POS</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#111111] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]/30 focus:border-[#D4623A] w-56 transition-all"
              />
            </div>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111111] border #E5D8CC dark:border-[#222222] text-gray-700 dark:text-[#CCCCCC] text-sm font-semibold rounded-xl hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" /> Add New Item
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeCategory === cat
                ? 'bg-[#D4623A] text-white shadow-sm shadow-blue-500/20'
                : 'bg-white dark:bg-[#111111] #8A7060 dark:text-[#555555] border #E5D8CC dark:border-[#222222] hover:#FAF7F3 dark:hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#D4623A]/30 border-t-[#D4623A] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FiPackage className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(p => {
                const inCart = items.find(i => i.id === p.id);
                const outOfStock = p.quantity <= 0;
                const color = avatarColor(p.product_name);

                return (
                  <div key={p.id} className="relative">
                    {/* Info button */}
                    <button className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center text-gray-300 hover:#8A7060 transition-colors">
                      <FiInfo className="w-3.5 h-3.5" />
                    </button>

                    {inCart ? (
                      /* Selected state with qty controls */
                      <div className="bg-white dark:bg-[#111111] border-2 border-[#D4623A] rounded-2xl p-4 flex flex-col items-center shadow-sm">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white text-sm font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {initials(p.product_name)}
                        </div>
                        <p className="text-xs font-bold #3D2B1A dark:text-[#E0E0E0] text-center mb-0.5 truncate w-full">{p.product_name}</p>
                        <p className="text-xs text-gray-400 mb-2">Qty: {p.quantity} PCS</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-[#CCCCCC] mb-3">{fmt(p.unit_price)}/PCS</p>
                        <div className="flex items-center gap-3 w-full justify-center">
                          <button
                            onClick={() => { if (inCart.quantity <= 1) removeItem(p.id); else updateQty(p.id, -1); }}
                            className="w-7 h-7 flex items-center justify-center border #E5D8CC dark:border-[#222222] rounded-lg #8A7060 hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors"
                          >
                            <FiMinus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0] w-4 text-center">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQty(p.id, 1)}
                            className="w-7 h-7 flex items-center justify-center border #E5D8CC dark:border-[#222222] rounded-lg #8A7060 hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors"
                          >
                            <FiPlus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditItem(inCart)}
                            className="w-7 h-7 flex items-center justify-center border #E5D8CC dark:border-[#222222] rounded-lg text-[#D4623A] hover:bg-[#FDF1EC] dark:hover:bg-[#D4623A]/15 transition-colors"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(p.id)}
                            className="w-7 h-7 flex items-center justify-center border border-red-100 dark:border-red-900/30 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Unselected state */
                      <button
                        onClick={() => !outOfStock && addItem(p)}
                        disabled={outOfStock}
                        className={`w-full bg-white dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-2xl p-4 flex flex-col items-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-150 ${outOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white text-sm font-bold opacity-70"
                          style={{ backgroundColor: color }}
                        >
                          {initials(p.product_name)}
                        </div>
                        <p className="text-xs font-bold #3D2B1A dark:text-[#E0E0E0] text-center mb-0.5 truncate w-full">{p.product_name}</p>
                        <p className="text-xs text-gray-400 mb-2">Qty: {p.quantity} PCS</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-[#CCCCCC] mb-3">{fmt(p.unit_price)}/PCS</p>
                        <span className="w-full py-1.5 #FAF7F3 dark:bg-[#1A1A1A] #8A7060 dark:text-[#555555] text-xs font-semibold rounded-lg text-center">
                          {outOfStock ? 'Out of Stock' : 'Click to Select'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Billing Panel ── */}
      <div className="w-[320px] shrink-0 bg-white dark:bg-[#111111] border-l #E5D8CC dark:border-[#222222] flex flex-col">
        {/* Billing Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b #E5D8CC dark:border-[#222222]">
          <div>
            <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">
              Billing Items {items.length > 0 && `(${items.length})`}
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              Clear Items
            </button>
          )}
        </div>

        {/* Billing Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 mb-4 opacity-20">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="8" width="60" height="64" rx="4" fill="#94a3b8" />
                  <rect x="20" y="20" width="40" height="4" rx="2" fill="white" />
                  <rect x="20" y="30" width="30" height="4" rx="2" fill="white" />
                  <rect x="20" y="40" width="35" height="4" rx="2" fill="white" />
                  <rect x="20" y="50" width="25" height="4" rx="2" fill="white" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-400 dark:#8A7060">No Billing Items</p>
              <p className="text-xs text-gray-300 dark:text-gray-700 mt-0.5">Select items to record a sale</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="border #E5D8CC dark:border-[#222222] rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0] truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.quantity} PCS X {fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setEditItem(item)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#D4623A] transition-colors"
                    >
                      <FiEdit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center border #E5D8CC dark:border-[#222222] rounded-md #8A7060 hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FiMinus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0] w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center border #E5D8CC dark:border-[#222222] rounded-md #8A7060 hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FiPlus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-[#D4623A]">{fmt(item.price * item.quantity)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        <div className="border-t #E5D8CC dark:border-[#222222] px-5 py-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-[#CCCCCC]">Sub Total</span>
            <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">{fmt(subtotal)}</span>
          </div>

          {/* Discount row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm #8A7060">Discount</span>
              <button onClick={() => setShowDiscount(true)} className="text-gray-400 hover:text-[#D4623A] transition-colors">
                <FiEdit2 className="w-3 h-3" />
              </button>
              {finalDiscount > 0 && (
                <button onClick={() => { setDiscountPct(0); setDiscountAmt(0); }} className="text-gray-400 hover:text-red-500 transition-colors">
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {finalDiscount > 0 ? (
              <span className="text-sm font-semibold text-red-500">-{fmt(finalDiscount)}</span>
            ) : (
              <button onClick={() => setShowDiscount(true)} className="text-xs font-semibold text-[#D4623A] hover:text-[#D4623A]">
                + Discount
              </button>
            )}
          </div>

          {/* VAT row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm #8A7060">VAT {taxPct > 0 ? `${taxPct}%` : ''}</span>
              <button onClick={() => setShowVAT(true)} className="text-gray-400 hover:text-[#D4623A] transition-colors">
                <FiEdit2 className="w-3 h-3" />
              </button>
              {taxPct > 0 && (
                <button onClick={() => setTaxPct(0)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {taxAmount > 0 ? (
              <span className="text-sm font-semibold text-gray-700 dark:text-[#CCCCCC]">{fmt(taxAmount)}</span>
            ) : (
              <button onClick={() => setShowVAT(true)} className="text-xs font-semibold text-[#D4623A] hover:text-[#D4623A]">
                + Tax
              </button>
            )}
          </div>

          {/* Additional charges placeholder */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#D4623A] cursor-pointer hover:text-[#D4623A]">+ Additional Charges</span>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center pt-2 border-t #E5D8CC dark:border-[#222222]">
            <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">Total Amount</span>
            <span className="text-base font-bold text-[#D4623A]">{fmt(grandTotal)}</span>
          </div>

          {/* Continue Billing */}
          <button
            onClick={() => { if (items.length === 0) { toast.error('Add items first'); return; } setShowConfirm(true); }}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all mt-1 ${items.length > 0
              ? 'bg-[#D4623A] text-white hover:bg-[#B8502E] shadow-lg shadow-blue-500/20'
              : '#EDE5DA dark:bg-[#1A1A1A] text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue Billing
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <DiscountModal
        open={showDiscount}
        onClose={() => setShowDiscount(false)}
        subtotal={subtotal}
        onApply={(pct, amt) => { setDiscountPct(pct); setDiscountAmt(amt); }}
      />
      <VATModal
        open={showVAT}
        onClose={() => setShowVAT(false)}
        taxableAmount={taxable}
        onApply={pct => setTaxPct(pct)}
      />
      <AddNewItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        onSave={handleAddNewItem}
      />
      <EditItemModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem}
        onSave={updateItemPriceQty}
      />
      <ConfirmSaleModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        total={grandTotal}
        parties={parties}
        onConfirm={handleConfirmSale}
      />
    </div>
  );
}