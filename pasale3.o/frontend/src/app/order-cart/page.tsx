import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productApi, orderApi, counterApi, partyApi } from '../../utils/api';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiArrowLeft, FiShoppingCart } from 'react-icons/fi';

interface Product {
  id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
}

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
}

const MOCK_PRODUCTS = [
  { id: 1, product_name: "Fresh Milk 1L", unit_price: 120, quantity: 45 },
  { id: 2, product_name: "Brown Bread", unit_price: 85, quantity: 20 },
  { id: 3, product_name: "Coca-Cola 500ml", unit_price: 75, quantity: 100 },
  { id: 4, product_name: "Lays Classic Chips", unit_price: 50, quantity: 150 },
  { id: 5, product_name: "Organic Honey 500g", unit_price: 450, quantity: 15 },
  { id: 6, product_name: "Instant Noodles (Pack of 12)", unit_price: 240, quantity: 30 },
  { id: 7, product_name: "Green Tea 25 Bags", unit_price: 190, quantity: 25 },
  { id: 8, product_name: "Peanut Butter 340g", unit_price: 320, quantity: 12 },
];

export default function OrderCartPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const name = searchParams.get('name') || '';
  const type = searchParams.get('type') || 'customer';
  const counterNumber = searchParams.get('counter') || '';
  const description = searchParams.get('description') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      const prods = data.results || data || [];
      if (prods.length) {
        setProducts(prods);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    } catch {
      console.warn("Using mock products — backend unavailable");
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() =>
    products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: product.id, name: product.product_name, quantity: 1, unit_price: product.unit_price }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(i =>
      i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unit_price * i.quantity, 0), [cart]);
  const discount = 0;
  const total = subtotal - discount;

  const cartQty = (productId: number) => cart.find(i => i.product_id === productId)?.quantity ?? 0;

  const handleSave = async () => {
    if (cart.length === 0) { setError('Cart is empty'); return; }
    try {
      setSaving(true);
      setError('');
      let partyId: number | undefined;
      let counterId: number | undefined;

      if (type === 'customer') {
        const party = await partyApi.create({ name, Category_type: 'Customer', address: description });
        partyId = party.party.id;
      } else {
        const counters = await counterApi.getAll();
        const existing = counters.find((c: any) => c.counter_number === parseInt(counterNumber));
        if (existing) {
          counterId = existing.id;
        } else {
          const nc = await counterApi.create({ counter_number: parseInt(counterNumber), description });
          counterId = nc.id;
        }
      }

      await orderApi.create({
        customer_id: partyId,
        counter_id: counterId,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
        total_amount: total,
      });
      navigate('/counters');
    } catch (err: any) {
      setError(err.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  // ─── Styles ───────────────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      background: '#fff',
      borderBottom: '1px solid #f1f5f9',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    backBtn: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 12px', borderRadius: 8,
      border: '1px solid #e5e7eb', background: '#fff',
      cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#475569',
      fontFamily: 'inherit',
    },
    divider: { width: 1, height: 20, background: '#e5e7eb' },
    title: { fontSize: 15, fontWeight: 600, color: '#111827' },
    subtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    saveBtn: (disabled: boolean): React.CSSProperties => ({
      padding: '9px 20px', borderRadius: 8, border: 'none',
      background: disabled ? '#a5b4fc' : '#4f46e5',
      color: '#fff', fontSize: 13, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit',
    }),
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    left: {
      flex: 1, padding: '18px 20px', overflowY: 'auto' as const,
      borderRight: '1px solid #f1f5f9',
    },
    searchWrap: { position: 'relative' as const, marginBottom: 16 },
    searchIcon: {
      position: 'absolute' as const, left: 10, top: '50%',
      transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' as const,
    },
    searchInput: {
      width: '100%', padding: '9px 12px 9px 32px',
      borderRadius: 9, border: '1px solid #e5e7eb',
      background: '#f9fafb', fontSize: 13, outline: 'none',
      fontFamily: 'inherit', color: '#111827', boxSizing: 'border-box' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 12,
    },
    prodCard: (inCart: boolean): React.CSSProperties => ({
      background: '#fff', borderRadius: 10,
      border: `1px solid ${inCart ? '#c7d2fe' : '#f1f5f9'}`,
      overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color .15s, box-shadow .15s',
    }),
    prodImg: {
      width: '100%', height: 80, background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 32,
    },
    prodBody: { padding: '10px 12px' },
    prodName: { fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 2 },
    prodCat: { fontSize: 11, color: '#9ca3af', marginBottom: 8 },
    prodRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    prodPrice: { fontSize: 13, fontWeight: 500, color: '#4f46e5' },
    addBtn: (inCart: boolean): React.CSSProperties => ({
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '5px 9px', borderRadius: 6,
      border: `1px solid ${inCart ? '#4f46e5' : '#e5e7eb'}`,
      background: inCart ? '#eef2ff' : 'none',
      color: inCart ? '#4f46e5' : '#6b7280',
      fontSize: 12, fontWeight: 500, cursor: 'pointer',
      fontFamily: 'inherit', transition: 'all .15s',
    }),
    // cart sidebar
    right: {
      width: 260, display: 'flex', flexDirection: 'column' as const,
      background: '#fff',
    },
    cartHeader: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9' },
    cartTitle: { fontSize: 14, fontWeight: 500, color: '#111827' },
    cartCount: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    cartItems: { flex: 1, overflowY: 'auto' as const, padding: '10px 14px', display: 'flex', flexDirection: 'column' as const, gap: 8 },
    emptyCart: {
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#9ca3af', fontSize: 13, gap: 10,
    },
    cartItem: {
      background: '#f9fafb', borderRadius: 8, padding: '10px 12px',
    },
    ciTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
    ciName: { fontSize: 13, fontWeight: 500, color: '#111827', lineHeight: 1.3, flex: 1 },
    removeBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#d1d5db', padding: '0 0 0 6px', lineHeight: 0, flexShrink: 0,
    },
    ciBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    qtyCtrl: {
      display: 'flex', alignItems: 'center', gap: 2,
      background: '#fff', borderRadius: 6,
      border: '1px solid #e5e7eb', padding: 2,
    },
    qtyBtn: {
      width: 22, height: 22, border: 'none', background: 'none',
      cursor: 'pointer', borderRadius: 4, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: '#6b7280', fontSize: 14, fontFamily: 'inherit',
    },
    qtyVal: { fontSize: 13, fontWeight: 500, minWidth: 20, textAlign: 'center' as const, color: '#111827' },
    ciPrice: { fontSize: 13, fontWeight: 500, color: '#4f46e5' },
    footer: { padding: '12px 16px', borderTop: '1px solid #f1f5f9' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 },
    summaryLabel: { color: '#9ca3af' },
    summaryVal: { fontWeight: 500, color: '#111827' },
    discountVal: { fontWeight: 500, color: '#16a34a' },
    totalRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9',
    },
    totalLabel: { fontSize: 14, fontWeight: 600, color: '#111827' },
    totalVal: { fontSize: 15, fontWeight: 600, color: '#4f46e5' },
    addToCartBtn: (disabled: boolean): React.CSSProperties => ({
      width: '100%', marginTop: 12, padding: '11px 0', borderRadius: 8,
      border: 'none', background: disabled ? '#a5b4fc' : '#4f46e5',
      color: '#fff', fontSize: 14, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', transition: 'background .15s',
    }),
    errorBox: {
      margin: '8px 14px', padding: '9px 12px', borderRadius: 8,
      background: '#fef2f2', border: '1px solid #fecaca',
      color: '#dc2626', fontSize: 12,
    },
    spinner: {
      width: 32, height: 32, border: '3px solid #e0e7ff',
      borderTop: '3px solid #4f46e5', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <FiArrowLeft size={14} /> Back
          </button>
          <div style={s.divider} />
          <div>
            <div style={s.title}>Order cart</div>
            <div style={s.subtitle}>
              {type === 'customer' ? `Customer: ${name}` : `Counter ${counterNumber}: ${name}`}
            </div>
          </div>
        </div>
        <button style={s.saveBtn(saving || cart.length === 0)} onClick={handleSave} disabled={saving || cart.length === 0}>
          {saving ? 'Saving…' : 'Save order'}
        </button>
      </div>

      <div style={s.body}>

        {/* Left — product grid */}
        <div style={s.left}>
          <div style={s.searchWrap}>
            <FiSearch size={14} style={s.searchIcon} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              style={s.searchInput}
              onFocus={e => (e.target.style.borderColor = '#4f46e5')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={s.spinner} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0', fontSize: 14 }}>
              No products found
            </div>
          ) : (
            <div style={s.grid}>
              {filteredProducts.map(product => {
                const qty = cartQty(product.id);
                const inCart = qty > 0;
                return (
                  <div
                    key={product.id}
                    style={s.prodCard(inCart)}
                    onClick={() => addToCart(product)}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#4f46e5';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(79,70,229,.1)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = inCart ? '#c7d2fe' : '#f1f5f9';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={s.prodImg}>
                      <FiShoppingCart size={24} color="#c7d2fe" />
                    </div>
                    <div style={s.prodBody}>
                      <div style={s.prodName}>{product.product_name}</div>
                      <div style={s.prodCat}>Stock: {product.quantity}</div>
                      <div style={s.prodRow}>
                        <span style={s.prodPrice}>Rs. {product.unit_price}</span>
                        <button
                          style={s.addBtn(inCart)}
                          onClick={e => { e.stopPropagation(); addToCart(product); }}
                        >
                          <FiPlus size={11} />
                          {inCart ? qty : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — cart sidebar */}
        <div style={s.right}>
          <div style={s.cartHeader}>
            <div style={s.cartTitle}>Cart</div>
            <div style={s.cartCount}>
              {type === 'customer' ? name : `Counter ${counterNumber}`} · {cart.length} item{cart.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={s.cartItems}>
            {cart.length === 0 ? (
              <div style={s.emptyCart}>
                <FiShoppingCart size={32} style={{ opacity: 0.2 }} />
                <span>No items added yet</span>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} style={s.cartItem}>
                  <div style={s.ciTop}>
                    <div style={s.ciName}>{item.name}</div>
                    <button style={s.removeBtn} onClick={() => removeFromCart(item.product_id)}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                  <div style={s.ciBottom}>
                    <div style={s.qtyCtrl}>
                      <button style={s.qtyBtn} onClick={() => updateQuantity(item.product_id, -1)}>
                        <FiMinus size={11} />
                      </button>
                      <span style={s.qtyVal}>{item.quantity}</span>
                      <button style={s.qtyBtn} onClick={() => updateQuantity(item.product_id, 1)}>
                        <FiPlus size={11} />
                      </button>
                    </div>
                    <span style={s.ciPrice}>
                      Rs. {(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.footer}>
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Subtotal</span>
              <span style={s.summaryVal}>Rs. {subtotal.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Discount</span>
              <span style={s.discountVal}>− Rs. {discount.toFixed(2)}</span>
            </div>
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Total</span>
              <span style={s.totalVal}>Rs. {total.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              style={s.addToCartBtn(cart.length === 0)}
              onClick={handleSave}
              disabled={saving || cart.length === 0}
            >
              {saving ? 'Saving…' : 'Add to cart'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}