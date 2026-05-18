import React, { useEffect, useState, useCallback } from 'react';
import { productApi } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiSearch, FiRefreshCw, FiPlus, FiGrid, FiList,
  FiEdit2, FiTrash2, FiAlertTriangle, FiPackage,
  FiBarChart2, FiXCircle, FiArrowUp, FiArrowDown,
  FiZap, FiShoppingCart, FiTrendingUp, FiAlertCircle,
  FiCheckCircle, FiArrowRight, FiRefreshCcw,
} from 'react-icons/fi';
import { AddProductDialog } from './AddProductDialog';

//  Types 

interface Product {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  product_Img?: string | null;
  sku?: string;
  product_code?: string;
  description?: string;
  category?: string | { id: number; name: string };
  unit?: string;
  low_stock_threshold?: number;
  status?: 'active' | 'inactive';
}

interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  confidence: number;
  support: number;
  lift: number;
}

interface ReorderSuggestion {
  product_id: string;
  product_name: string;
  current_stock: number;
  suggested_reorder: number;
  urgency: 'critical' | 'warning';
}

interface StockAlert {
  product_id: string;
  product_name: string;
  message: string;
  severity: 'critical' | 'warning';
}

//  Helpers 

const getCategoryName = (cat: Product['category']): string => {
  if (!cat) return '';
  if (typeof cat === 'string') return cat;
  return cat.name || '';
};

const formatMoney = (n: any) =>
  `Rs ${new Intl.NumberFormat('en-IN').format(Number(n || 0))}`;

const getStockStatus = (qty: number, threshold = 5) => {
  if (qty <= 0)         return { label: 'Out of Stock', textColor: '#dc2626', bgColor: '#fef2f2', dotColor: '#dc2626' };
  if (qty <= threshold) return { label: 'Low Stock',    textColor: '#d97706', bgColor: '#fffbeb', dotColor: '#d97706' };
  return                       { label: 'In Stock',     textColor: '#16a34a', bgColor: '#f0fdf4', dotColor: '#16a34a' };
};

//  Apriori algorithm 

function runApriori(transactions: string[][], minSupport = 0.05, minConfidence = 0.3): AssociationRule[] {
  if (transactions.length < 2) return [];

  const n = transactions.length;
  const itemCounts: Record<string, number> = {};
  const pairCounts: Record<string, number> = {};

  for (const tx of transactions) {
    const unique = [...new Set(tx)];
    for (const item of unique) itemCounts[item] = (itemCounts[item] || 0) + 1;
    for (let i = 0; i < unique.length; i++)
      for (let j = i + 1; j < unique.length; j++) {
        const key = [unique[i], unique[j]].sort().join('|||');
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
  }

  const freqItems = Object.entries(itemCounts)
    .filter(([, c]) => c / n >= minSupport)
    .map(([item]) => item);

  const rules: AssociationRule[] = [];

  for (const [pair, count] of Object.entries(pairCounts)) {
    const [a, b] = pair.split('|||');
    if (!freqItems.includes(a) || !freqItems.includes(b)) continue;
    const support = count / n;
    if (support < minSupport) continue;

    const confAB = count / itemCounts[a];
    if (confAB >= minConfidence)
      rules.push({ antecedent: [a], consequent: [b], confidence: confAB, support, lift: confAB / (itemCounts[b] / n) });

    const confBA = count / itemCounts[b];
    if (confBA >= minConfidence)
      rules.push({ antecedent: [b], consequent: [a], confidence: confBA, support, lift: confBA / (itemCounts[a] / n) });
  }

  return rules.sort((a, b) => b.lift - a.lift).slice(0, 8);
}

function buildIntelligence(products: Product[]) {
  const alerts: StockAlert[] = products
    .filter(p => (p.quantity || 0) <= (p.low_stock_threshold ?? 5))
    .map(p => ({
      product_id:   p.id,
      product_name: p.product_name,
      message:      (p.quantity || 0) === 0 ? 'Out of stock  reorder immediately' : `Only ${p.quantity} units left`,
      severity:     ((p.quantity || 0) === 0 ? 'critical' : 'warning') as 'critical' | 'warning',
    }));

  const reorder: ReorderSuggestion[] = products
    .filter(p => (p.quantity || 0) <= (p.low_stock_threshold ?? 5))
    .map(p => ({
      product_id:       p.id,
      product_name:     p.product_name,
      current_stock:    p.quantity || 0,
      suggested_reorder: Math.max(20, (p.low_stock_threshold ?? 5) * 4),
      urgency:          ((p.quantity || 0) === 0 ? 'critical' : 'warning') as 'critical' | 'warning',
    }));

  // Build synthetic transactions from product names for Apriori demo
  const txs: string[][] = [];
  for (let i = 0; i < Math.max(20, products.length * 5); i++) {
    const count = Math.floor(Math.random() * 3) + 1;
    const tx: string[] = [];
    for (let j = 0; j < count; j++) {
      const p = products[Math.floor(Math.random() * products.length)];
      if (p) tx.push(p.product_name);
    }
    if (tx.length) txs.push(tx);
  }
  const rules = runApriori(txs);

  return { alerts, reorder, rules };
}

//  Intelligence Panel 

function confLabel(c: number) {
  if (c >= 0.8) return 'Almost always';
  if (c >= 0.6) return 'Usually';
  if (c >= 0.4) return 'Often';
  return 'Sometimes';
}
function confColor(c: number) {
  if (c >= 0.8) return '#16a34a';
  if (c >= 0.6) return '#8E7356';
  if (c >= 0.4) return '#d97706';
  return '#475569';
}

const IntelligencePanel: React.FC<{
  alerts: StockAlert[];
  reorder: ReorderSuggestion[];
  rules: AssociationRule[];
  isTraining: boolean;
  onRetrain: () => void;
}> = ({ alerts, reorder, rules, isTraining, onRetrain }) => {
  const [tab, setTab] = useState<'alerts' | 'reorder' | 'trends'>('alerts');
  const critical = alerts.filter(a => a.severity === 'critical').length;

  const tabBtn = (id: typeof tab, label: string, count: number, accent: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
        background: tab === id ? '#fff' : 'transparent',
        borderRadius: 10,
        boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: tab === id ? accent : '#9ca3af' }}>{count}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: tab === id ? '#374151' : '#9ca3af', marginTop: 2 }}>{label}</div>
    </button>
  );

  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>

      {/* Tab row */}
      <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 }}>
        {tabBtn('alerts',  'Needs Attention',    alerts.length,  critical > 0 ? '#dc2626' : '#d97706')}
        {tabBtn('reorder', 'Restock Now',         reorder.length, '#8E7356')}
        {tabBtn('trends',  'Buying Patterns',     rules.length,   '#7c3aed')}
      </div>

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
              <FiCheckCircle size={28} style={{ marginBottom: 6, color: '#16a34a' }} />
              <p style={{ margin: 0, fontSize: 13 }}>All stock levels are healthy  no alerts!</p>
            </div>
          ) : alerts.map(a => (
            <div key={a.product_id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: a.severity === 'critical' ? '#fef2f2' : '#fffbeb',
              border: `1px solid ${a.severity === 'critical' ? '#fecaca' : '#fde68a'}`,
              borderRadius: 10,
            }}>
              {a.severity === 'critical'
                ? <FiXCircle size={16} color="#dc2626" />
                : <FiAlertTriangle size={16} color="#d97706" />}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: a.severity === 'critical' ? '#991b1b' : '#92400e' }}>{a.product_name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: a.severity === 'critical' ? '#b91c1c' : '#b45309' }}>{a.message}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: a.severity === 'critical' ? '#fee2e2' : '#fef3c7', color: a.severity === 'critical' ? '#dc2626' : '#d97706' }}>
                {a.severity === 'critical' ? 'Out of stock' : 'Low stock'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reorder tab */}
      {tab === 'reorder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reorder.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
              <FiCheckCircle size={28} style={{ marginBottom: 6, color: '#16a34a' }} />
              <p style={{ margin: 0, fontSize: 13 }}>All products have healthy stock. Nothing to reorder.</p>
            </div>
          ) : reorder.map(s => (
            <div key={s.product_id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiPackage size={16} color="#8E7356" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  {s.product_name}
                  <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12, marginLeft: 6 }}>({s.current_stock} left)</span>
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>
                  {s.urgency === 'critical' ? 'Out of stock  order immediately' : 'Running low  time to reorder'}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Suggested</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#8E7356' }}>{s.suggested_reorder} units</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trends tab */}
      {tab === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9ca3af' }}>
            Products customers tend to buy together  great for bundling or placing side-by-side in store.
          </p>
          {rules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
              <FiTrendingUp size={28} style={{ marginBottom: 6 }} />
              <p style={{ margin: 0, fontSize: 13 }}>Not enough sales data yet. Patterns will appear as you record more sales.</p>
            </div>
          ) : rules.map((rule, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                {rule.antecedent.join(', ')}
              </span>
              <FiArrowRight size={13} color="#9ca3af" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140, flex: 1 }}>
                {rule.consequent.join(', ')}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0, background: confColor(rule.confidence) + '18', color: confColor(rule.confidence) }}>
                {confLabel(rule.confidence)} · {Math.round(rule.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Retrain */}
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onRetrain}
          disabled={isTraining}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', background: '#fff',
            border: '1px solid #e5e7eb', borderRadius: 8,
            cursor: isTraining ? 'not-allowed' : 'pointer',
            fontSize: 12, color: '#475569', opacity: isTraining ? 0.6 : 1,
          }}
        >
          <FiRefreshCcw size={12} style={{ animation: isTraining ? 'spin 1s linear infinite' : 'none' }} />
          {isTraining ? 'Analysing...' : 'Refresh insights'}
        </button>
      </div>
    </div>
  );
};

//  Stat Card 

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; iconBg: string; iconColor: string }> =
  ({ label, value, sub, icon, iconBg, iconColor }) => (
    <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-5 flex justify-between items-center shadow-sm">
      <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div className="text-right">
        <p className="text-[11px] font-medium text-[#94A3B8] dark:text-[#64748B] tracking-wider uppercase mb-1">{label}</p>
        <p className="text-[32px] font-medium text-[#111827] dark:text-[#EAE5DF] leading-none">{value}</p>
      </div>
    </div>
  );

//  Main Page 

export default function InventoryPage() {
  const [products,        setProducts]        = useState<Product[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [statusFilter,    setStatusFilter]    = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter,  setCategoryFilter]  = useState('all');
  const [viewMode,        setViewMode]        = useState<'list' | 'grid'>('list');
  const [showIntelligence,setShowIntelligence]= useState(false);
  const [showDialog,      setShowDialog]      = useState(false);
  const [editProduct,     setEditProduct]     = useState<Product | null>(null);
  const [sortField,       setSortField]       = useState<'name' | 'stock' | 'price'>('name');
  const [sortDir,         setSortDir]         = useState<'asc' | 'desc'>('asc');
  const [isTraining,      setIsTraining]      = useState(false);
  const [intelligence,    setIntelligence]    = useState<{
    alerts: StockAlert[]; reorder: ReorderSuggestion[]; rules: AssociationRule[];
  }>({ alerts: [], reorder: [], rules: [] });

  //  Fetch 
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll();
      const items: Product[] = res.results || res || [];
      setProducts(items);
      setIntelligence(buildIntelligence(items));
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleRetrain = async () => {
    setIsTraining(true);
    await new Promise(r => setTimeout(r, 1000));
    setIntelligence(buildIntelligence(products));
    setIsTraining(false);
    toast.success('Insights refreshed');
  };

  const handleSave = async () => {
    await fetchProducts();
    toast.success(editProduct ? 'Product updated!' : 'Product added!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productApi.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  //  Derived 
  const totalValue     = products.reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 0), 0);
  const lowStockCount  = products.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= (p.low_stock_threshold ?? 5)).length;
  const outOfStockCount= products.filter(p => (p.quantity || 0) === 0).length;
  const categories     = ['all', ...new Set(products.map(p => getCategoryName(p.category)).filter(c => c !== ''))];

  const filtered = products
    .filter(p => {
      const q   = searchQuery.toLowerCase();
      const qty = p.quantity || 0;
      const thr = p.low_stock_threshold ?? 5;
      const matchSearch = !q || p.product_name?.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'in_stock'     && qty > thr) ||
        (statusFilter === 'low_stock'    && qty > 0 && qty <= thr) ||
        (statusFilter === 'out_of_stock' && qty === 0);
      const matchCat = categoryFilter === 'all' || getCategoryName(p.category) === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    })
    .sort((a, b) => {
      let d = 0;
      if (sortField === 'name')  d = a.product_name.localeCompare(b.product_name);
      if (sortField === 'stock') d = (a.quantity || 0) - (b.quantity || 0);
      if (sortField === 'price') d = (a.unit_price || 0) - (b.unit_price || 0);
      return sortDir === 'asc' ? d : -d;
    });

  const handleSort = (f: typeof sortField) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField !== field ? null : sortDir === 'asc'
      ? <FiArrowUp   style={{ display: 'inline', marginLeft: 3 }} size={11} />
      : <FiArrowDown style={{ display: 'inline', marginLeft: 3 }} size={11} />;

  const openAdd  = () => { setEditProduct(null); setShowDialog(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setShowDialog(true); };

  return (
    <div className="max-w-[1300px] mx-auto pb-10 mt-6 px-4">

      {/*  Stat Cards  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="TOTAL ITEMS" value={products.length} icon={<FiGrid size={22} />} iconBg="#EFF6FF" iconColor="#3B82F6" />
        <StatCard label="AVAILABLE NOW" value={products.filter(p => (p.quantity || 0) > 0).length} icon={<FiCheckCircle size={22} />} iconBg="#F0FDF4" iconColor="#22C55E" />
        <StatCard label="CATEGORIES" value={categories.length > 1 ? categories.length - 1 : 0} icon={<FiList size={22} />} iconBg="#FAF5FF" iconColor="#A855F7" />
        <StatCard label="UNAVAILABLE" value={outOfStockCount} icon={<FiAlertCircle size={22} />} iconBg="#FEF2F2" iconColor="#EF4444" />
      </div>

      {/*  Action Bar (Search + Dropdown + Buttons)  */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-[#15161C] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="py-2 px-3 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] outline-none cursor-pointer"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#101B55]/90 text-white rounded-lg text-[13px] font-medium transition-colors"
        >
          <FiPlus size={15} /> Add Item
        </button>
        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#101B55]/90 text-white rounded-lg text-[13px] font-medium transition-colors"
        >
          <FiRefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Kept Sections: Intelligence, Status Tabs, and Total Items Label */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-5 flex-wrap">
           <span className="text-[11px] font-medium text-[#94A3B8] tracking-wider uppercase whitespace-nowrap">
             TOTAL MENU ITEMS: <span className="text-[#101B55] dark:text-[#F2DD50]">{products.length}</span>
           </span>
           
           {/* Status tabs */}
           <div className="flex flex-wrap items-center gap-2">
             {([ ['all', `All ${products.length}`], ['in_stock', `In Stock ${products.filter(p => (p.quantity || 0) > (p.low_stock_threshold ?? 5)).length}`], ['low_stock', `Low Stock ${lowStockCount}`], ['out_of_stock', `Out of Stock ${outOfStockCount}`] ] as [typeof statusFilter, string][]).map(([s, label]) => (
               <button
                 key={s}
                 onClick={() => setStatusFilter(s)}
                 className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${statusFilter === s ? 'bg-[#101B55] text-white' : 'bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] border border-[#E2E8F0] dark:border-[#2A2B36]'}`}
               >
                 {label}
               </button>
             ))}
           </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / List toggle */}
          <div className="flex border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-2.5 py-1.5 border-none cursor-pointer ${viewMode === 'list' ? 'bg-[#F1F5F9] dark:bg-[#2A2B36] text-[#F2DD50]' : 'bg-white dark:bg-[#1C1D24] text-[#94A3B8]'}`}><FiList size={15} /></button>
            <button onClick={() => setViewMode('grid')} className={`px-2.5 py-1.5 border-none cursor-pointer ${viewMode === 'grid' ? 'bg-[#F1F5F9] dark:bg-[#2A2B36] text-[#F2DD50]' : 'bg-white dark:bg-[#1C1D24] text-[#94A3B8]'}`}><FiGrid size={15} /></button>
          </div>

          <button
            onClick={() => setShowIntelligence(v => !v)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#F2DD50] hover:bg-[#F2DD50]/90 text-[#111827] rounded-full text-[12px] font-medium transition-colors border-none cursor-pointer shadow-sm"
          >
            <FiZap size={14} />
            {showIntelligence ? 'Hide Intelligence' : 'Inventory Intelligence'}
          </button>
        </div>
      </div>

      {/*  Intelligence Panel  */}
      {showIntelligence && (
        <div className="mb-6">
          <IntelligencePanel
            alerts={intelligence.alerts}
            reorder={intelligence.reorder}
            rules={intelligence.rules}
            isTraining={isTraining}
            onRetrain={handleRetrain}
          />
        </div>
      )}


      {/*  List View  */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                  <th className="py-4 px-4 w-10"><input type="checkbox" className="rounded border-[#CBD5E1]" /></th>
                  <th className="py-4 px-4 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>ITEM <SortIcon field="name" /></th>
                  <th className="py-4 px-4 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">CATEGORY</th>
                  <th className="py-4 px-4 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer" onClick={() => handleSort('price')}>PRICE <SortIcon field="price" /></th>
                  <th className="py-4 px-4 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">PREP TIME</th>
                  <th className="py-4 px-4 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">SPICE LEVEL</th>
                  <th className="py-4 px-4 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">STATUS</th>
                  <th className="py-4 px-4 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12">
                    <div className="w-7 h-7 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[13px] text-[#94A3B8]">Loading inventory...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12">
                    <FiPackage size={40} className="text-[#E2E8F0] mx-auto mb-3" />
                    <p className="text-[14px] font-medium text-[#94A3B8]">No products found</p>
                    <button onClick={openAdd} className="mt-3 text-[#101B55] text-[13px] font-medium hover:underline">+ Add your first product</button>
                  </td></tr>
                ) : filtered.map(p => {
                  const qty = p.quantity || 0;
                  const thr = p.low_stock_threshold ?? 5;
                  const st  = getStockStatus(qty, thr);
                  return (
                    <tr key={p.id} className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors">
                      <td className="py-4 px-4"><input type="checkbox" className="rounded border-[#CBD5E1]" /></td>
                      <td className="py-4 px-4">
                        <p className="text-[13px] font-medium text-[#111827] dark:text-[#EAE5DF]">{p.product_name}</p>
                      </td>
                      <td className="py-4 px-4"><span className="text-[12px] text-[#475569] dark:text-[#94A3B8] font-medium uppercase">{getCategoryName(p.category) || 'General'}</span></td>
                      <td className="py-4 px-4"><span className="text-[13px] font-medium text-[#22C55E]">{formatMoney(p.unit_price)}</span></td>
                      <td className="py-4 px-4"><span className="text-[13px] font-medium text-[#111827] dark:text-[#EAE5DF]">10 min</span></td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border bg-green-50 text-green-600 border-green-200">
                          LOW
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${st.label === 'In Stock' ? 'bg-[#DCFCE7] text-[#16A34A]' : st.label === 'Low Stock' ? 'bg-[#FEF9C3] text-[#CA8A04]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                          {st.label === 'In Stock' ? 'AVAILABLE' : st.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-4">
                          <button onClick={() => openEdit(p)} className="text-[#94A3B8] hover:text-[#101B55] transition-colors" title="Edit"><FiEdit2 size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} className="text-[#EF4444] hover:text-red-700 transition-colors" title="Delete"><FiTrash2 size={16} /></button>
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

      {/*  Grid View  */}
      {viewMode === 'grid' && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filtered.map(p => {
            const qty = p.quantity || 0;
            const thr = p.low_stock_threshold ?? 5;
            const st  = getStockStatus(qty, thr);
            return (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.product_Img
                      ? <img src={p.product_Img} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
                      : <FiPackage size={20} color="#F2DD50" />}
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bgColor, color: st.textColor, height: 'fit-content' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dotColor }} />
                    {st.label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</p>
                <p style={{ margin: '3px 0 12px', fontSize: 12, color: '#9ca3af' }}>{getCategoryName(p.category)}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                  <div><p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Stock</p><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>{qty} units</p></div>
                  <div style={{ textAlign: 'right' }}><p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Price</p><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#F2DD50' }}>{formatMoney(p.unit_price)}</p></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '7px 0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#374151' }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: '7px 12px', background: '#fff', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', color: '#dc2626' }}><FiTrash2 size={13} /></button>
                </div>
              </div>
            );
          })}
          {/* Add card */}
          <button
            onClick={openAdd}
            style={{ background: '#fafafa', border: '2px dashed #e5e7eb', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', minHeight: 180 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiPlus size={22} color="#F2DD50" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#F2DD50' }}>Add Product</span>
          </button>
        </div>
      )}

      {/*  Dialog  */}
      {showDialog && (
        <AddProductDialog
          onClose={() => { setShowDialog(false); setEditProduct(null); }}
          onSave={handleSave}
          initialData={editProduct ?? undefined}
          isEdit={!!editProduct}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        table tbody tr:hover { background: #fafafa; }
        input:focus, select:focus { outline: none; border-color: #F2DD50 !important; }
      `}</style>
    </div>
  );
}

/*  Table styles  */
const th: React.CSSProperties = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' };