import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Icons (inline SVG to avoid any import issues) ───────────────────────────
const Icons = {
  Package: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" /></svg>,
  Plus: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Search: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" /></svg>,
  Alert: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
  Edit: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Refresh: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  X: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Grid: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  List: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  TrendUp: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  TrendDown: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
  Check: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>,
  Download: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Archive: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>,
  Eye: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  Tag: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 11.5V7a4 4 0 014-4z" /></svg>,
  Camera: (p: any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  product_Img: string | null;
  sku?: string;
  description?: string;
  category?: number;
  reorder_level?: number;
  is_low_stock?: boolean;
  business_id?: number;
}

interface FormState {
  product_name: string;
  quantity: string;
  unit_price: string;
  cost_price: string;
  sku: string;
  description: string;
  category: string;
  reorder_level: string;
}

// Add these interfaces at the top with your other types

interface AprioriRule {
  id: number;
  antecedent: string;
  consequent: string;
  confidence: number;
  confidence_percent: string;
  lift: number;
  support: number;
  updated_at: string;
}

interface ReorderSuggestion {
  low_stock_product: string;
  current_quantity: number;
  reorder_level: number;
  also_reorder: {
    items: string[];
    confidence: number;
    lift: number;
  }[];
}

interface AprioriAlert {
  id: number;
  product_name: string;
  product_quantity: number;
  reorder_level: number;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type ViewMode = 'grid' | 'table';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

function getTokens() {
  const access = localStorage.getItem('access_token') || localStorage.getItem('accessToken') || sessionStorage.getItem('access_token');
  return { access };
}

function getBusinessId(): string | null {
  return localStorage.getItem('business_id') || sessionStorage.getItem('business_id');
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const { access } = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (access) headers['Authorization'] = `Bearer ${access}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

const CATEGORY_MAP: Record<number, string> = {
  1: 'Electronics', 2: 'Clothing', 3: 'Food', 4: 'Grocery',
  5: 'Household', 6: 'Beauty', 7: 'Medicine', 8: 'Stationery',
  9: 'Hardware', 10: 'Other',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('ne-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 2 })
    .format(n).replace('NPR', 'Rs.');

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon, onClick }: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ReactNode; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold text-gray-900 mb-0.5`}>{value}</div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Badge({ children, type }: { children: React.ReactNode; type: 'green' | 'amber' | 'red' | 'gray' }) {
  const cls = {
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
  }[type];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{children}</span>;
}

function stockType(qty: number, reorder: number): 'green' | 'amber' | 'red' {
  if (qty === 0) return 'red';
  if (qty <= reorder) return 'amber';
  return 'green';
}

function stockLabel(qty: number, reorder: number) {
  if (qty === 0) return 'Out of Stock';
  if (qty <= reorder) return 'Low Stock';
  return 'In Stock';
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductFormModal({
  onClose, onSave, initial, businessId,
}: {
  onClose: () => void;
  onSave: () => void;
  initial?: Product;
  businessId: string;
}) {
  const [form, setForm] = useState<FormState>({
    product_name: initial?.product_name || '',
    quantity: String(initial?.quantity ?? ''),
    unit_price: String(initial?.unit_price ?? ''),
    cost_price: String(initial?.cost_price ?? ''),
    sku: initial?.sku || '',
    description: initial?.description || '',
    category: String(initial?.category ?? '1'),
    reorder_level: String(initial?.reorder_level ?? '5'),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name.trim()) return setError('Product name is required');
    setSaving(true); setError('');
    try {
      const payload = {
        product_name: form.product_name.trim(),
        quantity: parseInt(form.quantity) || 0,
        unit_price: parseFloat(form.unit_price) || 0,
        sku: form.sku,
        description: form.description,
        category: parseInt(form.category),
        reorder_level: parseInt(form.reorder_level) || 5,
        business_id: businessId,
      };
      if (initial) {
        await apiFetch(`/products/b${businessId}/p${initial.id}/`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/products/b${businessId}/`, { method: 'POST', body: JSON.stringify(payload) });
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{initial ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Icons.X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
              <input value={form.product_name} onChange={set('product_name')} required
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. Rice 5kg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
                <input value={form.quantity} onChange={set('quantity')} type="number" min="0"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reorder Level</label>
                <input value={form.reorder_level} onChange={set('reorder_level')} type="number" min="0"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price (Rs.)</label>
                <input value={form.unit_price} onChange={set('unit_price')} type="number" min="0" step="0.01"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cost Price (Rs.)</label>
                <input value={form.cost_price} onChange={set('cost_price')} type="number" min="0" step="0.01"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">SKU</label>
                <input value={form.sku} onChange={set('sku')}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="SKU-001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select value={form.category} onChange={set('category')}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white">
                  {Object.entries(CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={2}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Optional description..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2">
              {saving ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {saving ? 'Saving...' : (initial ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Adjust Stock Modal ───────────────────────────────────────────────────────
function AdjustStockModal({ product, businessId, onClose, onSave }: {
  product: Product; businessId: string; onClose: () => void; onSave: () => void;
}) {
  const [type, setType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(amount);
    if (!qty || qty <= 0) return;
    setSaving(true);
    try {
      const newQty = type === 'in'
        ? product.quantity + qty
        : Math.max(0, product.quantity - qty);
      await apiFetch(`/products/b${businessId}/p${product.id}/`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty }),
      });
      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Adjust Stock</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><Icons.X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-0.5">{product.product_name}</p>
            <p className="text-3xl font-bold text-gray-900">{product.quantity} <span className="text-base font-normal text-gray-400">units</span></p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['in', 'out'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${type === t
                  ? t === 'in' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t === 'in' ? <Icons.TrendUp className="w-4 h-4" /> : <Icons.TrendDown className="w-4 h-4" />}
                Stock {t === 'in' ? 'In' : 'Out'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="1" required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" placeholder="Enter quantity" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Received from supplier" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Product Detail Drawer ────────────────────────────────────────────────────
function ProductDrawer({ product, onClose, onEdit, onAdjust, onDelete }: {
  product: Product; onClose: () => void; onEdit: () => void; onAdjust: () => void; onDelete: () => void;
}) {
  const reorder = product.reorder_level ?? 5;
  const sType = stockType(product.quantity, reorder);
  const profit = product.unit_price - (product.cost_price || product.unit_price * 0.7);
  const margin = product.unit_price > 0 ? (profit / product.unit_price) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-900 text-lg truncate pr-4">{product.product_name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl flex-shrink-0"><Icons.X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="w-full h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
            {product.product_Img
              ? <img src={product.product_Img} alt={product.product_name} className="w-full h-full object-cover rounded-2xl" />
              : <div className="text-center"><Icons.Package className="w-12 h-12 text-gray-300 mx-auto mb-1" /><p className="text-xs text-gray-400">No image</p></div>}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge type={sType}>{stockLabel(product.quantity, reorder)}</Badge>
            {product.category && <Badge type="gray">{CATEGORY_MAP[product.category] || 'Other'}</Badge>}
            {product.sku && <Badge type="gray">SKU: {product.sku}</Badge>}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Quantity', value: `${product.quantity} units`, bold: true },
              { label: 'Reorder Level', value: `${reorder} units`, bold: false },
              { label: 'Selling Price', value: fmt(product.unit_price), bold: true },
              { label: 'Cost Price', value: fmt(product.cost_price || product.unit_price * 0.7), bold: false },
              { label: 'Stock Value', value: fmt(product.unit_price * product.quantity), bold: true },
              { label: 'Profit Margin', value: `${margin.toFixed(1)}%`, bold: false },
            ].map(({ label, value, bold }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
              <p className="text-sm text-gray-500">{product.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button onClick={onAdjust} className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2">
              <Icons.Refresh className="w-4 h-4" /> Adjust Stock
            </button>
            <button onClick={onEdit} className="w-full py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2">
              <Icons.Edit className="w-4 h-4" /> Edit Product
            </button>
            <button onClick={onDelete} className="w-full py-2.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2">
              <Icons.Trash className="w-4 h-4" /> Delete Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [businessId, setBusinessId] = useState('');

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Apriori State ──
  const [aprioriRules, setAprioriRules] = useState<AprioriRule[]>([]);
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [aprioriAlerts, setAprioriAlerts] = useState<AprioriAlert[]>([]);
  const [aprioriLoading, setAprioriLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [showApriori, setShowApriori] = useState(false);

  // ── Apriori Fetch Functions ──
  const fetchAprioriData = useCallback(async () => {
    if (!businessId) return;
    setAprioriLoading(true);
    try {
      const [rulesData, suggestionsData, alertsData] = await Promise.all([
        apiFetch(`/inventory/rules/b${businessId}/`),
        apiFetch(`/inventory/suggestions/b${businessId}/`),
        apiFetch(`/inventory/alerts/b${businessId}/`),
      ]);
      setAprioriRules(rulesData.rules || []);
      setSuggestions(suggestionsData.suggestions || []);
      setAprioriAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Apriori fetch failed:', err);
    } finally {
      setAprioriLoading(false);
    }
  }, [businessId]);

  const triggerRetrain = async () => {
    setRetraining(true);
    try {
      await apiFetch(`/inventory/retrain/b${businessId}/`, { method: 'POST' });
      await fetchAprioriData();
    } catch (err) {
      console.error('Retrain failed:', err);
    } finally {
      setRetraining(false);
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      await apiFetch(`/inventory/alerts/b${businessId}/${alertId}/resolve/`, { method: 'PUT' });
      await fetchAprioriData();
    } catch (err) {
      console.error('Resolve failed:', err);
    }
  };

  // Fetch Apriori data when businessId is ready
  useEffect(() => {
    if (businessId) fetchAprioriData();
  }, [businessId, fetchAprioriData]);

  // Get business_id on mount
  useEffect(() => {
    const bid = getBusinessId();
    if (!bid) {
      // Try to fetch from profile
      const { access } = getTokens();
      if (!access) { navigate('/login'); return; }
      fetch(`${API_BASE}/business/profile/`, {
        headers: { Authorization: `Bearer ${access}` },
      })
        .then(r => r.json())
        .then(d => {
          const id = String(d.id || d.business_id || '');
          if (id) { localStorage.setItem('business_id', id); setBusinessId(id); }
          else setError('Could not find your business. Please complete business setup.');
        })
        .catch(() => setError('Could not load business info.'));
    } else {
      setBusinessId(bid);
    }
  }, [navigate]);

  const fetchProducts = useCallback(async () => {
    if (!businessId) return;
    setLoading(true); setError('');
    try {
      const data = await apiFetch(`/products/b${businessId}/`);
      const list: Product[] = (data.results || data || []);
      setProducts(list);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.toLowerCase().includes('token')) {
        navigate('/login');
      } else {
        setError(err.message || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  }, [businessId, navigate]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await apiFetch(`/products/b${businessId}/p${id}/`, { method: 'DELETE' });
      setDetailProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  // Derived
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);
  const reorderOf = (p: Product) => p.reorder_level ?? 5;
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= reorderOf(p));
  const outOfStock = products.filter(p => p.quantity === 0);
  const inStock = products.filter(p => p.quantity > reorderOf(p));

  const filtered = useMemo(() => products.filter(p => {
    if (categoryFilter && String(p.category) !== categoryFilter) return false;
    if (search && !p.product_name.toLowerCase().includes(search.toLowerCase()) && !(p.sku || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (stockFilter === 'in-stock' && (p.quantity === 0 || p.quantity <= reorderOf(p))) return false;
    if (stockFilter === 'low-stock' && (p.quantity === 0 || p.quantity > reorderOf(p))) return false;
    if (stockFilter === 'out-of-stock' && p.quantity > 0) return false;
    return true;
  }), [products, search, stockFilter, categoryFilter]);

  const totalValue = products.reduce((s, p) => s + p.unit_price * p.quantity, 0);

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track products, manage stock levels, and monitor inventory health</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchProducts} disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-white text-sm transition-colors disabled:opacity-50">
              <Icons.Refresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={() => { setEditProduct(undefined); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm transition-colors shadow-sm">
              <Icons.Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Products" value={products.length} sub={`${categories.length} categories`}
            color="bg-blue-50 text-blue-600" icon={<Icons.Package className="w-5 h-5" />}
            onClick={() => setStockFilter('all')} />
          <StatCard label="Stock Value" value={fmt(totalValue)}
            color="bg-green-50 text-green-600" icon={<Icons.Tag className="w-5 h-5" />} />
          <StatCard label="Low Stock" value={lowStock.length} sub={aprioriAlerts.length > 0 ? `${aprioriAlerts.length} AI alerts active` : "Needs reorder"}
            color="bg-amber-50 text-amber-600" icon={<Icons.Alert className="w-5 h-5" />}
            onClick={() => { setStockFilter('low-stock'); setShowApriori(true); }} />
          <StatCard label="Out of Stock" value={outOfStock.length} sub="Needs restocking"
            color="bg-red-50 text-red-600" icon={<Icons.Archive className="w-5 h-5" />}
            onClick={() => setStockFilter('out-of-stock')} />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-5">
            <Icons.Alert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">{error}</p>
              <p className="text-xs text-red-600 mt-0.5">Check your backend is running and business_id is set correctly.</p>
            </div>
            <button onClick={fetchProducts} className="text-xs font-semibold text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1">
              <Icons.Refresh className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ── Apriori Intelligence Toggle ── */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowApriori(!showApriori)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 text-sm transition-colors"
          >
            🤖 {showApriori ? 'Hide' : 'Show'} AI Inventory Intelligence
            {aprioriAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {aprioriAlerts.length}
              </span>
            )}
          </button>
          {showApriori && (
            <button
              onClick={triggerRetrain}
              disabled={retraining}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-indigo-200 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 text-sm disabled:opacity-50"
            >
              <Icons.Refresh className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
              {retraining ? 'Retraining...' : 'Retrain Model'}
            </button>
          )}
        </div>

        {/* ── Apriori Panel ── */}
        {showApriori && (
          <div className="mb-6 space-y-4">
        
            {aprioriLoading ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-gray-200">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
                <span className="text-gray-500 text-sm">Loading AI insights...</span>
              </div>
            ) : (
              <>
                {/* Apriori Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-700">{aprioriRules.length}</div>
                    <div className="text-xs text-indigo-500 font-medium mt-1">Association Rules</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{aprioriAlerts.length}</div>
                    <div className="text-xs text-amber-500 font-medium mt-1">Active Alerts</div>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{suggestions.length}</div>
                    <div className="text-xs text-green-500 font-medium mt-1">Reorder Suggestions</div>
                  </div>
                </div>
        
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
                  {/* Reorder Suggestions */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        💡 Reorder Suggestions
                      </h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {suggestions.length} items
                      </span>
                    </div>
                    <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                      {suggestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          ✅ No low stock items — inventory healthy!
                        </div>
                      ) : suggestions.map((s, i) => (
                        <div key={i} className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-orange-600 font-bold text-sm">⚠️ {s.low_stock_product}</span>
                            <span className="text-xs text-gray-400">({s.current_quantity} left)</span>
                          </div>
                          <div className="space-y-1.5">
                            {s.also_reorder.map((item, j) => (
                              <div key={j} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                                <span className="text-indigo-600 font-semibold">
                                  → {item.items.join(', ')}
                                </span>
                                <span className="text-green-600 font-bold">
                                  {Math.round(item.confidence * 100)}% confident
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
        
                  {/* Active Alerts */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        🔴 Stock Alerts
                      </h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {aprioriAlerts.length} active
                      </span>
                    </div>
                    <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                      {aprioriAlerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          🎉 No active alerts!
                        </div>
                      ) : aprioriAlerts.map((alert) => (
                        <div key={alert.id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-red-700 font-bold text-sm">{alert.product_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{alert.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                  Qty: {alert.product_quantity}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Reorder at: {alert.reorder_level}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex-shrink-0"
                            >
                              Resolve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
        
                {/* Association Rules Table */}
                {aprioriRules.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-4">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm">
                        📋 Association Rules — Buying Patterns Discovered
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['If customer buys', '→ They also buy', 'Confidence', 'Lift', 'Support'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {aprioriRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="px-5 py-3">
                                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                                  {rule.antecedent}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                                  {rule.consequent}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 rounded-full"
                                      style={{ width: `${rule.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-gray-700">
                                    {rule.confidence_percent}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`text-xs font-bold ${rule.lift >= 2 ? 'text-green-600' : rule.lift >= 1.5 ? 'text-amber-600' : 'text-gray-600'}`}>
                                  {rule.lift.toFixed(2)}x
                                </span>
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-500">
                                {(rule.support * 100).toFixed(0)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 shadow-sm">
          {/* Stock tabs */}
          <div className="flex flex-wrap gap-1.5 pb-4 mb-4 border-b border-gray-100">
            {([
              { id: 'all', label: 'All', count: products.length },
              { id: 'in-stock', label: 'In Stock', count: inStock.length },
              { id: 'low-stock', label: 'Low Stock', count: lowStock.length },
              { id: 'out-of-stock', label: 'Out of Stock', count: outOfStock.length },
            ] as { id: StockFilter; label: string; count: number }[]).map(tab => (
              <button key={tab.id} onClick={() => setStockFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${stockFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${stockFilter === tab.id ? 'bg-white/25 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          {/* Search + filters row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white text-gray-700">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={String(c)}>{CATEGORY_MAP[c!] || c}</option>)}
            </select>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {([['grid', Icons.Grid], ['table', Icons.List]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode as ViewMode)}
                  className={`p-2.5 rounded-lg transition-colors ${viewMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of {products.length} products
            {filtered.length > 0 && <span className="ml-2">· Value: <span className="font-semibold text-gray-700">{fmt(filtered.reduce((s, p) => s + p.unit_price * p.quantity, 0))}</span></span>}
          </div>
        </div>

        {/* ── Bulk actions ── */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-200 rounded-2xl mb-4">
            <span className="text-sm font-semibold text-blue-800">{selected.size} items selected</span>
            <button onClick={() => {
              if (confirm(`Delete ${selected.size} products?`)) {
                Promise.all([...selected].map(id => apiFetch(`/products/b${businessId}/p${id}/`, { method: 'DELETE' })))
                  .then(() => { setSelected(new Set()); fetchProducts(); })
                  .catch(err => alert(err.message));
              }
            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
              <Icons.Trash className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Loading inventory...</p>
            <p className="text-sm text-gray-400 mt-1">Fetching products from server</p>
          </div>
        ) : filtered.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Icons.Package className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{search ? 'No products found' : 'No products yet'}</h3>
            <p className="text-sm text-gray-500 mb-5">{search ? 'Try a different search term' : 'Add your first product to get started'}</p>
            <button onClick={() => { setEditProduct(undefined); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm">
              <Icons.Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid View ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => {
              const reorder = reorderOf(p);
              const sType = stockType(p.quantity, reorder);
              return (
                <div key={p.id} onClick={() => setDetailProduct(p)}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group overflow-hidden">
                  <div className="h-36 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {p.product_Img
                      ? <img src={p.product_Img} alt={p.product_name} className="w-full h-full object-cover" />
                      : <Icons.Package className="w-14 h-14 text-gray-200" />}
                    <div className="absolute top-3 right-3">
                      <Badge type={sType}>{stockLabel(p.quantity, reorder)}</Badge>
                    </div>
                    <input type="checkbox" checked={selected.has(p.id)} onClick={e => e.stopPropagation()}
                      onChange={() => toggleSelect(p.id)}
                      className="absolute top-3 left-3 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 truncate mb-0.5">{p.product_name}</p>
                    {p.sku && <p className="text-xs text-gray-400 font-mono mb-2">{p.sku}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">{fmt(p.unit_price)}</span>
                      <span className="text-sm text-gray-500">{p.quantity} units</span>
                    </div>
                    <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); setEditProduct(p); setShowForm(true); }}
                        className="flex-1 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1">
                        <Icons.Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                        className="flex-1 py-1.5 text-xs font-semibold text-red-600 border border-red-100 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1">
                        <Icons.Trash className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Table View ── */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 w-10">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                        onChange={e => setSelected(e.target.checked ? new Set(filtered.map(p => p.id)) : new Set())}
                        checked={filtered.length > 0 && selected.size === filtered.length} />
                    </th>
                    {['Product', 'Category', 'SKU', 'Stock', 'Price', 'Value', 'Status', ''].map(h => (
                      <th key={h} className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const reorder = reorderOf(p);
                    const sType = stockType(p.quantity, reorder);
                    return (
                      <tr key={p.id} onClick={() => setDetailProduct(p)}
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {p.product_Img ? <img src={p.product_Img} alt={p.product_name} className="w-full h-full object-cover" /> : <Icons.Package className="w-5 h-5 text-gray-300" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{p.product_name}</p>
                              {p.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{p.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{p.category ? CATEGORY_MAP[p.category] || '—' : '—'}</td>
                        <td className="p-4 text-sm font-mono text-gray-500">{p.sku || '—'}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${sType === 'red' ? 'text-red-600' : sType === 'amber' ? 'text-amber-600' : 'text-gray-900'}`}>
                              {p.quantity}
                            </span>
                            <span className="text-xs text-gray-400">/ {reorder} min</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-semibold text-gray-900">{fmt(p.unit_price)}</td>
                        <td className="p-4 text-sm font-semibold text-blue-600">{fmt(p.unit_price * p.quantity)}</td>
                        <td className="p-4"><Badge type={sType}>{stockLabel(p.quantity, reorder)}</Badge></td>
                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setDetailProduct(p)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View">
                              <Icons.Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Edit">
                              <Icons.Edit className="w-4 h-4 text-blue-500" />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                              <Icons.Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showForm && businessId && (
        <ProductFormModal
          onClose={() => { setShowForm(false); setEditProduct(undefined); }}
          onSave={() => { setShowForm(false); setEditProduct(undefined); fetchProducts(); }}
          initial={editProduct}
          businessId={businessId}
        />
      )}
      {adjustProduct && businessId && (
        <AdjustStockModal
          product={adjustProduct}
          businessId={businessId}
          onClose={() => setAdjustProduct(null)}
          onSave={() => { setAdjustProduct(null); fetchProducts(); }}
        />
      )}
      {detailProduct && (
        <ProductDrawer
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={() => { setEditProduct(detailProduct); setDetailProduct(null); setShowForm(true); }}
          onAdjust={() => { setAdjustProduct(detailProduct); setDetailProduct(null); }}
          onDelete={() => handleDelete(detailProduct.id)}
        />
      )}
    </div>
  );
}