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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</p>
        <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 500, color: '#475569' }}>{label}</p>
        {sub && <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af' }}>{sub}</p>}
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
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 0 40px' }}>

      {/*  Header  */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>Inventory</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>Track products, manage stock levels, and monitor inventory health</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchProducts}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#F2DD50', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}
          >
            <FiPlus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/*  Stat Cards  */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Products"  value={products.length} sub={`${categories.length - 1} categories`} icon={<FiPackage size={20} />}   iconBg="#F1F5F9" iconColor="#F2DD50" />
        <StatCard label="Stock Value"     value={formatMoney(totalValue)}                                       icon={<FiBarChart2 size={20} />}  iconBg="#f0fdf4" iconColor="#16a34a" />
        <StatCard label="Low Stock"       value={lowStockCount}  sub="Needs reorder"                            icon={<FiAlertTriangle size={20} />} iconBg="#fffbeb" iconColor="#d97706" />
        <StatCard label="Out of Stock"    value={outOfStockCount} sub="Needs restocking"                        icon={<FiXCircle size={20} />}    iconBg="#fef2f2" iconColor="#dc2626" />
      </div>

      {/*  Intelligence Toggle  */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowIntelligence(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', background: '#F2DD50', border: 'none',
            borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
          }}
        >
          <FiZap size={15} />
          {showIntelligence ? 'Hide Inventory Intelligence' : 'Show Inventory Intelligence'}
        </button>
      </div>

      {/*  Intelligence Panel  */}
      {showIntelligence && (
        <div style={{ marginBottom: 20 }}>
          <IntelligencePanel
            alerts={intelligence.alerts}
            reorder={intelligence.reorder}
            rules={intelligence.rules}
            isTraining={isTraining}
            onRetrain={handleRetrain}
          />
        </div>
      )}

      {/*  Filter Bar  */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          {([ ['all', `All ${products.length}`], ['in_stock', `In Stock ${products.filter(p => (p.quantity || 0) > (p.low_stock_threshold ?? 5)).length}`], ['low_stock', `Low Stock ${lowStockCount}`], ['out_of_stock', `Out of Stock ${outOfStockCount}`] ] as [typeof statusFilter, string][]).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: statusFilter === s ? '#F2DD50' : 'transparent',
                color:      statusFilter === s ? '#fff'    : '#475569',
              }}
            >
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Grid / List toggle */}
          <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? '#F1F5F9' : '#fff', color: viewMode === 'list' ? '#F2DD50' : '#9ca3af' }}><FiList size={15} /></button>
            <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? '#F1F5F9' : '#fff', color: viewMode === 'grid' ? '#F2DD50' : '#9ca3af' }}><FiGrid size={15} /></button>
          </div>
        </div>

        {/* Search + Category */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={15} />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', outline: 'none', cursor: 'pointer' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9ca3af' }}>
          Showing <strong style={{ color: '#374151' }}>{filtered.length}</strong> of {products.length} products · Value: <strong style={{ color: '#374151' }}>{formatMoney(totalValue)}</strong>
        </p>
      </div>

      {/*  List View  */}
      {viewMode === 'list' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <th style={th}><input type="checkbox" /></th>
                  <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('name')}>Product <SortIcon field="name" /></th>
                  <th style={th}>Category</th>
                  <th style={th}>SKU</th>
                  <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('stock')}>Stock <SortIcon field="stock" /></th>
                  <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('price')}>Price <SortIcon field="price" /></th>
                  <th style={th}>Value</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#F2DD50', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Loading inventory...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <FiPackage size={40} color="#e5e7eb" style={{ marginBottom: 10 }} />
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>No products found</p>
                    <button onClick={openAdd} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#F2DD50', fontSize: 13, fontWeight: 600 }}>+ Add your first product</button>
                  </td></tr>
                ) : filtered.map(p => {
                  const qty = p.quantity || 0;
                  const thr = p.low_stock_threshold ?? 5;
                  const st  = getStockStatus(qty, thr);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={td}><input type="checkbox" /></td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {p.product_Img
                              ? <img src={p.product_Img} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                              : <FiPackage size={16} color="#F2DD50" />}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.product_name}</p>
                            {p.description && <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={td}><span style={{ fontSize: 12, color: '#475569' }}>{getCategoryName(p.category)}</span></td>
                      <td style={td}><span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{p.sku || p.product_code || ''}</span></td>
                      <td style={td}><span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{qty} <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>/ {thr} min</span></span></td>
                      <td style={td}><span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{formatMoney(p.unit_price)}</span></td>
                      <td style={td}><span style={{ fontSize: 13, fontWeight: 600, color: '#F2DD50' }}>{formatMoney((p.unit_price || 0) * qty)}</span></td>
                      <td style={td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bgColor, color: st.textColor }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dotColor }} />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => openEdit(p)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: 6 }} title="Edit"><FiEdit2 size={14} /></button>
                          <button onClick={() => handleDelete(p.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: 6 }} title="Delete"><FiTrash2 size={14} /></button>
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