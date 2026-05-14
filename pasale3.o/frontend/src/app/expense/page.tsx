import React, { useState, useEffect, useRef, useMemo } from 'react';
import { expenseApi, ApiExpenseData } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX,
  FiCalendar, FiCamera, FiChevronDown, FiLoader,
  FiArrowUp, FiArrowDown,
} from 'react-icons/fi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpenseRecord {
  id: number;
  expense_number?: number | string;
  category: string;
  date: string;
  payment_method: string;
  amount: number;
  description: string;
  is_necessary?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Rent', 'Utilities', 'Salary', 'Inventory', 'Transport',
  'Food', 'Office Supplies', 'Marketing', 'Phone', 'Other',
];

const PAYMENT_METHODS = ['Cash', 'Card', 'QR / Online', 'Cheque', 'Bank Transfer'];

const fmt = (n: number) =>
  `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)}`;

const fmtDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-[#111111] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b #E5D8CC dark:border-[#222222]">
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

// ─── Expense Form (shared Add / Edit) ─────────────────────────────────────────

interface ExpenseFormProps {
  initial?: Partial<ExpenseRecord>;
  onSave: (data: Omit<ApiExpenseData, never>) => Promise<void>;
  onClose: () => void;
  mode: 'add' | 'edit';
}

function ExpenseForm({ initial, onSave, onClose, mode }: ExpenseFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [expenseNo, setExpenseNo] = useState(initial?.expense_number?.toString() || '');
  const [date, setDate] = useState(initial?.date || today);
  const [category, setCategory] = useState(initial?.category || '');
  const [catSearch, setCatSearch] = useState(initial?.category || '');
  const [catOpen, setCatOpen] = useState(false);
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(initial?.payment_method || 'Cash');
  const [remarks, setRemarks] = useState(initial?.description || '');
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const filteredCats = CATEGORIES.filter(c =>
    c.toLowerCase().includes(catSearch.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = async () => {
    if (!category) { setError('Please select an expense category.'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        category: category as ApiExpenseData['category'],
        amount: parseFloat(amount),
        description: remarks,
        date,
        is_necessary: true,
        payment_method: paymentMethod,
        expense_number: expenseNo,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Expense No. + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-[#CCCCCC]">Expense No.</label>
            <button className="text-xs font-bold text-[#D4623A] hover:text-[#D4623A]">Manual</button>
          </div>
          <input
            type="text"
            value={expenseNo}
            onChange={e => setExpenseNo(e.target.value)}
            placeholder="Auto"
            className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] focus:ring-1 focus:ring-[#D4623A]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-[#CCCCCC] mb-1.5">Date</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 pr-9 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A]"
            />
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Expense Category */}
      <div ref={catRef} className="relative">
        <label className="block text-sm font-semibold text-gray-700 dark:text-[#CCCCCC] mb-1.5">Expense Category</label>
        <div
          className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus-within:border-[#D4623A] cursor-pointer flex items-center justify-between"
          onClick={() => setCatOpen(v => !v)}
        >
          <input
            type="text"
            value={catSearch}
            onChange={e => { setCatSearch(e.target.value); setCatOpen(true); setCategory(''); }}
            placeholder="Search for category"
            className="flex-1 bg-transparent outline-none text-sm"
            onClick={e => e.stopPropagation()}
          />
          <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
        </div>
        {catOpen && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1A1A1A] border #E5D8CC dark:border-[#222222] rounded-xl shadow-xl overflow-hidden">
            {filteredCats.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">No categories found</div>
            ) : (
              filteredCats.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setCatSearch(cat); setCatOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#FDF1EC] dark:hover:bg-[#D4623A]/15 ${category === cat ? 'bg-[#FDF1EC] dark:bg-[#D4623A]/15 text-[#D4623A] font-semibold' : 'text-gray-700 dark:text-[#CCCCCC]'}`}
                >
                  {cat}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Expense Item (decorative link like Karobar) */}
      <button className="flex items-center gap-1.5 text-sm font-semibold text-[#D4623A] hover:text-[#D4623A] transition-colors">
        <FiPlus className="w-4 h-4" /> Add Expense Item
      </button>

      {/* Total Amount + Payment Method */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-[#CCCCCC] mb-1.5">Total Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rs.</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm #FAF7F3 dark:bg-[#1A1A1A]/50 #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] focus:bg-white dark:focus:bg-gray-800"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-[#CCCCCC] mb-1.5">Payment Method</label>
          <div className="relative">
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2.5 pr-8 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] appearance-none"
            >
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-[#CCCCCC] mb-1.5">Remarks</label>
        <textarea
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          rows={3}
          placeholder="Enter remarks here..."
          className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-xl text-sm bg-white dark:bg-[#1A1A1A] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] resize-none"
        />
      </div>

      {/* Attach Images */}
      <div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => setImages(Array.from(e.target.files || []))} />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 border-2 border-dashed #E5D8CC dark:border-[#222222] rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-[#D4623A] transition-colors"
          >
            <FiCamera className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Photo</span>
          </button>
          {images.map((f, i) => (
            <div key={i} className="w-16 h-16 rounded-xl bg-[#FDF1EC] dark:bg-[#D4623A]/15 flex items-center justify-center text-[9px] text-[#D4623A] font-medium text-center px-1 break-all">
              {f.name.slice(0, 10)}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-2.5 bg-[#D4623A] text-white text-sm font-bold rounded-xl hover:bg-[#B8502E] disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          {saving && <FiLoader className="w-4 h-4 animate-spin" />}
          {mode === 'add' ? 'Save Expense' : 'Update Expense'}
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteModal({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Expense">
      <div className="space-y-5">
        <p className="text-sm #8A7060 dark:text-[#555555]">
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border #E5D8CC dark:border-[#222222] text-sm font-semibold #8A7060 dark:text-[#CCCCCC] rounded-xl hover:#FAF7F3 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <FiLoader className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ExpenseMonitoringPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'expense_number'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadExpenses = async () => {
    try {
      const res = await expenseApi.getAll();
      const data: ExpenseRecord[] = (res.results || res || []).map((e: any, i: number) => ({
        id: e.id,
        expense_number: e.expense_number ?? e.id ?? i + 1,
        category: e.category,
        date: e.date,
        payment_method: e.payment_method || 'Cash',
        amount: parseFloat(e.amount || e.total_amount || 0),
        description: e.description || e.remarks || '',
        is_necessary: e.is_necessary,
      }));
      setExpenses(data);
    } catch (e) {
      console.error('Failed to load expenses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  // ── Filter + Sort ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        String(e.expense_number).includes(q)
      );
    }
    if (filterCategory) list = list.filter(e => e.category === filterCategory);
    if (filterPayment) list = list.filter(e => e.payment_method === filterPayment);
    if (filterDate) list = list.filter(e => e.date === filterDate);

    list.sort((a, b) => {
      let av: any = a[sortField];
      let bv: any = b[sortField];
      if (sortField === 'date') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (sortField === 'amount') { av = +av; bv = +bv; }
      if (sortField === 'expense_number') { av = +av; bv = +bv; }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return list;
  }, [expenses, search, filterCategory, filterPayment, filterDate, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleAdd = async (data: ApiExpenseData) => {
    const res = await expenseApi.create(data);
    toast.success('Expense Added Successfully');
    setShowAdd(false);
    await loadExpenses();
  };

  const handleEdit = async (data: ApiExpenseData) => {
    if (!editTarget) return;
    await expenseApi.update(editTarget.id, data);
    toast.success('Expense Updated Successfully');
    setEditTarget(null);
    await loadExpenses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseApi.delete(deleteTarget.id);
      toast.success('Expense Deleted');
      setDeleteTarget(null);
      await loadExpenses();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 inline-flex flex-col">
      <FiArrowUp className={`w-2.5 h-2.5 -mb-0.5 ${sortField === field && sortDir === 'asc' ? 'text-[#D4623A]' : 'text-gray-300'}`} />
      <FiArrowDown className={`w-2.5 h-2.5 ${sortField === field && sortDir === 'desc' ? 'text-[#D4623A]' : 'text-gray-300'}`} />
    </span>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen #FAF7F3 dark:bg-gray-950 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Empty State ── */}
        {!loading && expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            {/* Illustration */}
            <div className="w-40 h-40 mb-8 relative">
              <div className="absolute inset-0 #EDE5DA dark:bg-[#1A1A1A] rounded-full opacity-50" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-20 bg-white dark:bg-[#222222] rounded-xl shadow-md flex flex-col justify-center px-4 gap-2">
                <div className="h-2.5 w-16 bg-gray-200 dark:bg-[#2A2A2A] rounded-full" />
                <div className="h-2 w-12 #EDE5DA dark:#FAF7F30 rounded-full" />
                <div className="h-2 w-14 #EDE5DA dark:#FAF7F30 rounded-full" />
                <div className="h-2 w-10 #EDE5DA dark:#FAF7F30 rounded-full" />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-300 dark:bg-[#2A2A2A] rounded-lg" />
            </div>
            <h2 className="text-2xl font-bold #3D2B1A dark:text-[#E0E0E0] mb-2">Create Your First Expense</h2>
            <p className="text-sm #8A7060 dark:text-[#555555] text-center mb-8 max-w-xs">
              Click on the create expense button and start managing your expense
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4623A] text-white font-bold text-sm rounded-xl hover:bg-[#B8502E] transition-colors shadow-lg shadow-blue-500/20"
            >
              <FiPlus className="w-4 h-4" /> Add New Expense
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold #3D2B1A dark:text-[#E0E0E0]">
                Expenses {!loading && `(${expenses.length})`}
              </h1>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#D4623A] text-white text-sm font-bold rounded-xl hover:bg-[#B8502E] transition-colors shadow-lg shadow-blue-500/20"
              >
                <FiPlus className="w-4 h-4" /> Add New Expense
              </button>
            </div>

            {/* ── Filters Bar ── */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Expense..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A]/30 focus:border-[#D4623A]"
                />
              </div>

              {/* Category filter */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm text-gray-700 dark:text-[#CCCCCC] focus:outline-none focus:border-[#D4623A] cursor-pointer"
                >
                  <option value="">All Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Payment filter */}
              <div className="relative">
                <select
                  value={filterPayment}
                  onChange={e => setFilterPayment(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm text-gray-700 dark:text-[#CCCCCC] focus:outline-none focus:border-[#D4623A] cursor-pointer"
                >
                  <option value="">All Payment Modes</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Date filter */}
              <div className="relative">
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="pl-3 pr-3 py-2 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm text-gray-700 dark:text-[#CCCCCC] focus:outline-none focus:border-[#D4623A]"
                />
              </div>

              {/* Clear filters */}
              {(search || filterCategory || filterPayment || filterDate) && (
                <button
                  onClick={() => { setSearch(''); setFilterCategory(''); setFilterPayment(''); setFilterDate(''); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" /> Clear
                </button>
              )}

              {/* Sort By */}
              <div className="ml-auto flex items-center gap-1.5 text-sm #8A7060 dark:text-[#555555]">
                <span className="font-medium">Sort By</span>
                <FiArrowUp className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-[#D4623A]/30 border-t-[#D4623A] rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FiSearch className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No expenses match your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b #E5D8CC dark:border-[#222222]">
                        {[
                          { label: 'Exp No.', field: 'expense_number' as const, w: 'w-24' },
                          { label: 'Category', field: null, w: 'w-36' },
                          { label: 'Date', field: 'date' as const, w: 'w-40' },
                          { label: 'Payment Mode', field: null, w: 'w-36' },
                          { label: 'Total Amount', field: 'amount' as const, w: 'w-36' },
                          { label: 'Remarks', field: null, w: '' },
                          { label: 'Action', field: null, w: 'w-24' },
                        ].map(({ label, field, w }) => (
                          <th
                            key={label}
                            onClick={() => field && toggleSort(field)}
                            className={`px-5 py-4 text-left text-xs font-bold #8A7060 dark:text-[#555555] uppercase tracking-wider ${w} ${field ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''}`}
                          >
                            <span className="flex items-center gap-0.5">
                              {label}
                              {field && <SortIcon field={field} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {filtered.map((expense) => (
                        <tr
                          key={expense.id}
                          className="hover:#FAF7F3 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-[#CCCCCC] font-medium">
                            {expense.expense_number}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF1EC] dark:bg-[#D4623A]/15 text-[#B8502E] dark:text-blue-300">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm #8A7060 dark:text-[#555555]">
                            {fmtDate(expense.date)}
                          </td>
                          <td className="px-5 py-4 text-sm #8A7060 dark:text-[#555555]">
                            {expense.payment_method}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">
                            {fmt(expense.amount)}
                          </td>
                          <td className="px-5 py-4 text-sm #8A7060 dark:text-[#555555] max-w-[180px] truncate">
                            {expense.description || '—'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditTarget(expense)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#D4623A] hover:bg-[#FDF1EC] dark:hover:bg-[#D4623A]/15 transition-colors"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(expense)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Row count */}
            {!loading && filtered.length > 0 && (
              <p className="text-xs text-gray-400 mt-3 px-1">
                Showing {filtered.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Add Modal ── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        <ExpenseForm mode="add" onSave={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Expense">
        {editTarget && (
          <ExpenseForm
            mode="edit"
            initial={editTarget}
            onSave={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}