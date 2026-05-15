import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { FiX, FiChevronDown, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from '../../utils/i18n';

interface AddNewDialogProps {
  onClose: () => void;
}

export const AddNewDialog: React.FC<AddNewDialogProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    type: 'customer' as 'customer' | 'counter',
    counterNumber: '1',
    description: '',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) { setError('Name is required'); return; }
    const queryParams = new URLSearchParams({
      name: formData.name.trim(), type: formData.type,
      counter: formData.type === 'counter' ? formData.counterNumber : '',
      description: formData.description,
    }).toString();
    setSuccess(true);
    setTimeout(() => { onClose(); navigate(`/order-cart?${queryParams}`); }, 1200);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
  };

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 8,
    border: '0.5px solid #DDD7CC', background: '#F4F0EA', color: '#1A1C20',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
  };

  const typeBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 8,
    border: active ? '1.5px solid #A3876A' : '0.5px solid #DDD7CC',
    background: active ? '#F5F0E6' : '#F4F0EA',
    color: active ? '#A3876A' : '#6B7280',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'inherit',
  });

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: 16, backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420,
        border: '0.5px solid #DDD7CC', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '0.5px solid #DDD7CC',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1C20' }}>Add new</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Fill in the details below</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, borderRadius: 6, lineHeight: 0 }}>
            <FiX size={16} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#3A7A5A15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiCheckCircle size={22} color="#3A7A5A" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1C20', marginBottom: 6 }}>Entry added</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>Your entry has been saved successfully.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name" autoFocus style={inputBase}
                onFocus={(e) => e.target.style.borderColor = '#A3876A'} onBlur={(e) => e.target.style.borderColor = '#DDD7CC'} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'customer' })} style={typeBtn(formData.type === 'customer')}>Customer</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'counter' })} style={typeBtn(formData.type === 'counter')}>Counter</button>
              </div>
            </div>
            {formData.type === 'counter' && (
              <div>
                <label style={labelStyle}>Counter number</label>
                <div style={{ position: 'relative' }}>
                  <select value={formData.counterNumber} onChange={(e) => setFormData({ ...formData, counterNumber: e.target.value })}
                    style={{ ...inputBase, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                    onFocus={(e) => e.target.style.borderColor = '#A3876A'} onBlur={(e) => e.target.style.borderColor = '#DDD7CC'}>
                    {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>Counter {n}</option>))}
                  </select>
                  <FiChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
                </div>
              </div>
            )}
            <div>
              <label style={labelStyle}>Description{' '}<span style={{ textTransform: 'none', fontWeight: 400, fontSize: 11, letterSpacing: 0 }}>(optional)</span></label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add a short description…" rows={3}
                style={{ ...inputBase, resize: 'none', lineHeight: 1.6 }}
                onFocus={(e) => e.target.style.borderColor = '#A3876A'} onBlur={(e) => e.target.style.borderColor = '#DDD7CC'} />
            </div>
            {error && (
              <div style={{ padding: '10px 13px', borderRadius: 8, border: '0.5px solid #A3876A80', background: '#F5F0E6', color: '#A3876A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAlertCircle size={14} style={{ flexShrink: 0 }} />{error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: '0.5px solid #DDD7CC', background: '#fff', color: '#6B7280', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button type="submit" style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: '#A3876A', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Submit</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};