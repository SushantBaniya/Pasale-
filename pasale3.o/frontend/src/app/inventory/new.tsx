import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../../utils/api';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AddNewItemPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form fields
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [unit, setUnit] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [openingStock, setOpeningStock] = useState('');

  const categories = [
    'Electronics', 'Clothing', 'Food & Beverages', 'Stationery',
    'Home & Living', 'Sports', 'Health & Beauty', 'Automotive', 'Other'
  ];

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      toast.error('Item name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        product_name: itemName.trim(),
        category: category || 'Other',
        product_code: itemCode || null,
        unit: unit || 'pcs',
        cost_price: parseFloat(purchasePrice) || 0,
        unit_price: parseFloat(sellingPrice) || 0,
        quantity: parseInt(openingStock) || 0,
        low_stock_threshold: 5,
        business_id: parseInt(localStorage.getItem('business_id') || '0'),
      };

      await productApi.create(payload);
      toast.success('Item added successfully!');
      navigate('/inventory');
    } catch (err: any) {
      console.error('Error adding item:', err);
      toast.error(err?.error || err?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="p-2 hover:#EDE5DA dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 #8A7060" />
        </button>
        <h1 className="text-xl font-bold #3D2B1A dark:text-[#E0E0E0]">Add New Item</h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border #E5D8CC dark:border-[#222222] rounded-xl overflow-hidden">
        <div className="p-6 space-y-5">
          
          {/* Item Name */}
          <div>
            <label className="block text-sm font-semibold #3D2B1A dark:text-[#CCCCCC] mb-1.5">
              Item Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. iPhone 15 Pro"
              className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold #3D2B1A dark:text-[#CCCCCC] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Item Code / SKU + Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold #3D2B1A dark:text-[#CCCCCC] mb-1.5">
                Item Code / SKU
              </label>
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g. IPH15P"
                className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold #3D2B1A dark:text-[#CCCCCC] mb-1.5">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. pcs, kg, box"
                className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Purchase Price + Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold #3D2B1A dark:text-[#CCCCCC] mb-1.5">
                Purchase Price
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold #3D2B1A dark:text-[#CCCCCC] mb-1.5">
                Selling Price
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Opening Stock */}
          <div>
            <label className="block text-sm font-semibold #3D2B1A dark:text-[#CCCCCC] mb-1.5">
              Opening Stock
            </label>
            <input
              type="number"
              value={openingStock}
              onChange={(e) => setOpeningStock(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2.5 border #E5D8CC dark:border-[#222222] rounded-lg bg-white dark:bg-[#111111] text-sm #3D2B1A dark:text-[#E0E0E0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4623A] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t #E5D8CC dark:border-[#222222] flex items-center justify-end gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="px-5 py-2.5 text-sm font-semibold #8A7060 dark:text-[#CCCCCC] hover:#EDE5DA dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4623A] text-white text-sm font-semibold rounded-lg hover:bg-[#B8502E] disabled:opacity-60 transition-colors shadow-sm"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
