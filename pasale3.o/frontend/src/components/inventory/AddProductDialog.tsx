import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  FiX, 
  FiPackage, 
  FiHash, 
  FiTag, 
  FiImage, 
  FiList,
  FiTruck,
  FiAlertCircle,
  FiCalendar,
  FiBox,
  FiPercent,
  FiLayers,
  FiCheck,
  FiBarChart2,
  FiShoppingBag,
  FiLoader
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../ui/NepaliRupeeIcon';
import { useTranslation } from '../../utils/i18n';

// API Configuration - Use environment variable or fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
}

const getAuthToken = () => {
  // Check for auth_token (set by login page)
  return localStorage.getItem('auth_token');
};

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
  sku?: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive';
}

interface AddProductDialogProps {
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'status'>) => void;
  initialData?: Product;
  isEdit?: boolean;
}

// Category icon mapping
const getCategoryIcon = (categoryName: string): string => {
  const iconMap: Record<string, string> = {
    'electronics': '📱',
    'clothing': '👕',
    'food': '🍎',
    'grocery': '🛒',
    'household': '🏠',
    'beauty': '💄',
    'medicine': '💊',
    'stationery': '📝',
    'hardware': '🔧',
  };
  const key = categoryName.toLowerCase();
  for (const [name, icon] of Object.entries(iconMap)) {
    if (key.includes(name)) return icon;
  }
  return '📦';
};

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  onClose,
  onSave,
  initialData,
  isEdit = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    quantity: initialData?.quantity?.toString() || '',
    price: initialData?.price?.toString() || '',
    costPrice: '',
    image: initialData?.image || null,
    category: initialData?.category || '',
    sku: initialData?.sku || '',
    barcode: '',
    description: initialData?.description || '',
    unit: 'piece',
    reorderLevel: '10',
    supplier: '',
    brand: '',
    expiryDate: '',
    weight: '',
    dimensions: '',
    taxRate: '13',
    discount: '0',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory' | 'additional'>('basic');
  const [categories, setCategories] = useState<Array<{ value: string; label: string; icon: string; id: number }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        // For now, use default categories since backend might not have category endpoint
        // When backend has category API, replace with actual fetch
        const defaultCategories = [
          { id: 1, value: 'electronics', label: 'Electronics', icon: '📱' },
          { id: 2, value: 'clothing', label: 'Clothing & Apparel', icon: '👕' },
          { id: 3, value: 'food', label: 'Food & Beverages', icon: '🍎' },
          { id: 4, value: 'grocery', label: 'Grocery', icon: '🛒' },
          { id: 5, value: 'household', label: 'Household Items', icon: '🏠' },
          { id: 6, value: 'beauty', label: 'Beauty & Personal Care', icon: '💄' },
          { id: 7, value: 'medicine', label: 'Medicine & Health', icon: '💊' },
          { id: 8, value: 'stationery', label: 'Stationery', icon: '📝' },
          { id: 9, value: 'hardware', label: 'Hardware & Tools', icon: '🔧' },
          { id: 10, value: 'other', label: 'Other', icon: '📦' },
        ];
        setCategories(defaultCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const units = [
    { value: 'piece', label: 'Piece (pcs)' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'gram', label: 'Gram (g)' },
    { value: 'liter', label: 'Liter (L)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'meter', label: 'Meter (m)' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'dozen', label: 'Dozen' },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSKU = () => {
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'PRD';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, sku: `${prefix}-${random}` });
  };

  const generateBarcode = () => {
    const barcode = Math.random().toString().substring(2, 15);
    setFormData({ ...formData, barcode });
  };

  const calculateProfit = () => {
    const cost = parseFloat(formData.costPrice) || 0;
    const sell = parseFloat(formData.price) || 0;
    if (cost > 0 && sell > 0) {
      const profit = sell - cost;
      const margin = ((profit / sell) * 100).toFixed(1);
      return { profit, margin };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('validation.required'));
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      setError(t('validation.minValue').replace('{0}', '0'));
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError(t('validation.minValue').replace('{0}', '0'));
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Please login to add products');
      }
      
      // Find category ID from selected category value
      const selectedCategory = categories.find(cat => cat.value === formData.category);
      
      // Prepare API payload matching backend serializer
      const apiPayload = {
        product_name: formData.name.trim(),
        category: selectedCategory?.id || 1, // Backend expects category ID
        sku: formData.sku || `SKU-${Date.now()}`,
        product_Img: formData.image || '',
        unit_price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        description: formData.description || '',
      };

      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(apiPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to save product');
      }

      // Transform form data to frontend format for onSave callback
      const productData = {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        image: formData.image,
        sku: formData.sku || `SKU-${Date.now()}`,
        description: formData.description || undefined,
        category: formData.category || undefined,
      };

      onSave(productData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profitInfo = calculateProfit();

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FiPackage },
    { id: 'pricing', label: 'Pricing', icon: () => <NepaliRupeeIcon className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory', icon: FiBox },
    { id: 'additional', label: 'Additional', icon: FiList },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <FiPackage className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEdit ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-white/80 text-sm">
                  {isEdit ? 'Update product information' : 'Add a new product to your inventory'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 font-medium flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <FiCheck className="w-5 h-5" />
            </div>
            {t('dialog.productSuccess').replace('{action}', isEdit ? t('dialog.updated') : t('dialog.added'))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-250px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Product Name & Image Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiPackage className="w-4 h-4" />
                        {t('dialog.productName')} *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('dialog.enterProductName')}
                        className="w-full px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500 text-lg font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <FiHash className="w-4 h-4" />
                          {t('dialog.skuBarcode')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="SKU-001"
                            className="flex-1 px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={generateSKU}
                            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                          >
                            Auto
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <FiBarChart2 className="w-4 h-4" />
                          Barcode
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder="Enter or generate"
                            className="flex-1 px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={generateBarcode}
                            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                          >
                            Auto
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiShoppingBag className="w-4 h-4" />
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="e.g., Samsung, Nike, Local Brand"
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Product Image */}
                  <div>
                    <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiImage className="w-4 h-4" />
                      {t('dialog.productImage')}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors h-50 flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="product-image"
                      />
                      <label
                        htmlFor="product-image"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {formData.image ? (
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <FiImage className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {formData.image ? t('dialog.changeImage') : t('dialog.uploadImage')}
                        </span>
                        <span className="text-xs text-gray-500">{t('dialog.imageUploadHint')}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiTag className="w-4 h-4" />
                    Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2 ${
                          formData.category === cat.value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    📝 {t('dialog.descriptionOptional')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('dialog.addDescription')}
                    rows={3}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <NepaliRupeeIcon className="w-5 h-5" />
                    Pricing Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Cost Price (Purchase Price)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.costPrice}
                          onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-14 pr-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-green-500 text-lg"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">The price you paid to purchase this product</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        {t('dialog.unitPrice')} (Selling Price) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-14 pr-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-green-500 text-lg"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t('dialog.pricePerUnit')}</p>
                    </div>
                  </div>

                  {/* Profit Margin Display */}
                  {profitInfo && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-300 dark:border-green-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Profit per Unit</p>
                          <p className="text-2xl font-bold text-green-600">Rs. {profitInfo.profit.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Profit Margin</p>
                          <p className="text-2xl font-bold text-green-600">{profitInfo.margin}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiPercent className="w-4 h-4" />
                      Tax Rate (%)
                    </label>
                    <select
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="0">No Tax</option>
                      <option value="13">13% VAT</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Default Discount (%)
                    </label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <FiBox className="w-5 h-5" />
                    Stock Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        {t('dialog.quantityInStock')} *
                      </label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-lg font-bold"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('dialog.currentStock')}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiLayers className="w-4 h-4" />
                        Unit of Measure
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                      >
                        {units.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiAlertCircle className="w-4 h-4" />
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        value={formData.reorderLevel}
                        onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                        placeholder="10"
                        className="w-full px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <FiTruck className="w-5 h-5" />
                    Supplier Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Supplier Name
                      </label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Enter supplier name"
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiCalendar className="w-4 h-4" />
                        Expiry Date (if applicable)
                      </label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Tab */}
            {activeTab === 'additional' && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <FiBox className="w-5 h-5" />
                    Physical Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Weight (kg)
                      </label>
                      <input
                        type="text"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="e.g., 0.5"
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Dimensions (L × W × H cm)
                      </label>
                      <input
                        type="text"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                        placeholder="e.g., 10 × 5 × 3"
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">📋 Product Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500">Name</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formData.name || '-'}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500">Category</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formData.category || '-'}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500">Stock</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formData.quantity || '0'} {formData.unit}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Rs. {formData.price || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-medium flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-5 h-5 mr-2" />
                  {isEdit ? t('dialog.updateProduct') : t('inventory.addProduct')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
