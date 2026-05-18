import React, { useState, useRef } from 'react';
import { FiX, FiSave, FiAlertCircle, FiCheck, FiImage } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getAuthToken = () =>
  localStorage.getItem('auth_token') || localStorage.getItem('access_token');

interface Product {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  product_Img?: string | null;
  sku?: string;
  description?: string;
  category?: string | { id: number; name: string };
  unit?: string;
  low_stock_threshold?: number;
}

interface AddProductDialogProps {
  onClose: () => void;
  onSave: (productData: any) => void;
  initialData?: Product;
  isEdit?: boolean;
}

const CATEGORIES = [
  { id: 1,  value: 'electronics', label: 'Electronics' },
  { id: 2,  value: 'clothing',    label: 'Clothing & Apparel' },
  { id: 3,  value: 'food',        label: 'Food & Beverages' },
  { id: 4,  value: 'grocery',     label: 'Grocery' },
  { id: 5,  value: 'household',   label: 'Household Items' },
  { id: 6,  value: 'beauty',      label: 'Beauty & Personal Care' },
  { id: 7,  value: 'medicine',    label: 'Medicine & Health' },
  { id: 8,  value: 'stationery',  label: 'Stationery' },
  { id: 9,  value: 'hardware',    label: 'Hardware & Tools' },
  { id: 10, value: 'other',       label: 'Other' },
];

const getCatValue = (cat: Product['category']) => {
  if (!cat) return '';
  if (typeof cat === 'string') return cat.toLowerCase();
  return (cat.name || '').toLowerCase();
};

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  onClose, onSave, initialData, isEdit = false,
}) => {
  const [name,         setName]         = useState(initialData?.product_name || '');
  const [category,     setCategory]     = useState(getCatValue(initialData?.category));
  const [sku,          setSku]          = useState(initialData?.sku || '');
  const [unit,         setUnit]         = useState(initialData?.unit || '');
  const [costPrice,    setCostPrice]    = useState(initialData?.cost_price?.toString() || '');
  const [sellingPrice, setSellingPrice] = useState(initialData?.unit_price?.toString() || '');
  const [quantity,     setQuantity]     = useState(initialData?.quantity?.toString() || '0');
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim())                                     return setError('Item name is required.');
    if (!sellingPrice || parseFloat(sellingPrice) <= 0)   return setError('Selling price must be greater than 0.');

    setSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Please login to continue.');

      const businessId =
        localStorage.getItem('business_id') || sessionStorage.getItem('business_id');
      if (!businessId) throw new Error('Business ID not found. Please login again.');

      const selectedCat = CATEGORIES.find(c => c.value === category);

      const payload: any = {
        product_name: name.trim(),
        category:     selectedCat?.id || 1,
        sku:          sku || `SKU-${Date.now()}`,
        unit:         unit || 'piece',
        unit_price:   parseFloat(sellingPrice),
        cost_price:   parseFloat(costPrice) || 0,
        quantity:     parseInt(quantity) || 0,
        description:  '',
      };

      const endpoint = isEdit && initialData?.id
        ? `${API_BASE_URL}/products/b${businessId}/p${initialData.id}/`
        : `${API_BASE_URL}/products/b${businessId}/`;

      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data: any = {};
      try { data = JSON.parse(raw); } catch { data = { message: raw }; }

      if (!res.ok) throw new Error(data.error || data.message || 'Failed to save product.');

      onSave(payload);
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Overlay */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '1rem',
      }}
    >
      {/* Dialog card */}
      <div style={{
        width: '100%', maxWidth: 600,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        maxHeight: '95vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/*  Header  */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 16px' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            {isEdit ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/*  Body  */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Item Name */}
            <div>
              <label style={labelStyle}>
                Item Name <span style={{ color: '#F2DD50' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. iPhone 15 Pro"
                style={inputStyle}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <svg
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Item Code / SKU  +  Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Item Code / SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. IPH15P"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="e.g. pcs, kg, box"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Purchase Price  +  Selling Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Purchase Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Selling Price <span style={{ color: '#F2DD50' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            {/* Opening Stock */}
            <div>
              <label style={labelStyle}>Opening Stock</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, color: '#dc2626', fontSize: 13,
              }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, color: '#16a34a', fontSize: 13,
              }}>
                <FiCheck size={15} /> {isEdit ? 'Item updated' : 'Item added'} successfully!
              </div>
            )}
          </div>

          {/*  Footer  */}
          <div style={{
            padding: '16px 28px 24px',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              style={{
                ...saveBtnStyle,
                opacity: submitting || success ? 0.75 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <>
                  <FiSave size={15} />
                  {isEdit ? 'Update Item' : 'Save Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { outline: none; border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.12); }
        input::placeholder { color: #d1d5db; }
      `}</style>
    </div>
  );
};

/*  Shared styles  */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #e5e7eb',
  borderRadius: 10,
  background: '#fff',
  color: '#111827',
  fontSize: 14,
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#fff',
  border: '1.5px solid #e5e7eb',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
};

const saveBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 22px',
  background: '#16a34a',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
};