import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/dashboard/KPICard';

import {
  FiPlus,
  FiPackage,
  FiAlertTriangle,
  FiCamera,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiDownload,
  FiCheck,
  FiX,
  FiGrid,
  FiList,
  FiTrendingUp,
  FiTrendingDown,
  FiBox,
  FiTag,
  FiBarChart2,
  FiRefreshCw,
  FiEye,
  FiMoreVertical,
  FiShoppingCart,
  FiArchive,
  FiLoader,
} from 'react-icons/fi';
import { AddProductDialog } from '../../components/inventory/AddProductDialog';
import { NepaliRupeeIcon } from '../../components/ui/NepaliRupeeIcon';
import { apiClient, clearTokens, isAuthenticated } from '../../utils/apiClient';

// API Configuration - Use environment variable or fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  costPrice?: number;
  image: string | null;
  sku?: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive';
  minStock?: number;
  unit?: string;
}

interface StockMovement {
  id: string;
  productId: string;
  date: string;
  change: number;
  notes?: string;
  staff?: string;
  type: 'in' | 'out' | 'adjustment';
}

type ViewMode = 'grid' | 'table';

export default function InventoryPage() {
  const { t, n, c, language } = useTranslation(); 
  const navigate = useNavigate(); 
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Check for auth token on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      // No token, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Fetch products from API with automatic token refresh
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isAuthenticated()) {
        setError('Please login to view products');
        setIsLoading(false);
        navigate('/login');
        return;
      }
      
      // Use apiClient which handles token refresh automatically
      const data = await apiClient.get('/products/');
      const apiProducts = data.results || data || [];
      
      // Transform API response to frontend format
      const transformedProducts: Product[] = apiProducts.map((p: any) => ({
        id: String(p.id),
        name: p.product_name,
        quantity: p.quantity,
        price: parseFloat(p.unit_price),
        costPrice: parseFloat(p.unit_price) * 0.7, // Estimate cost price
        image: p.product_Img || null,
        sku: p.sku || `SKU-${p.id}`,
        description: p.description || '',
        category: getCategoryName(p.category),
        status: p.quantity > 0 ? 'active' : 'inactive',
        minStock: 10, // Default reorder level
        unit: 'pcs',
      }));
      
      setProducts(transformedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      
      // If auth error after token refresh failed, redirect to login
      if (err.message?.includes('session') || err.message?.includes('login')) {
        clearTokens();
        navigate('/login');
        return;
      }
      
      setError(err.message || 'Failed to load products. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Map category ID to name
  const getCategoryName = (categoryId: number): string => {
    const categoryMap: Record<number, string> = {
      1: 'Electronics',
      2: 'Clothing',
      3: 'Food',
      4: 'Grocery',
      5: 'Household',
      6: 'Beauty',
      7: 'Medicine',
      8: 'Stationery',
      9: 'Hardware',
      10: 'Other',
    };
    return categoryMap[categoryId] || 'Uncategorized';
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [adjustData, setAdjustData] = useState({ change: '', notes: '', type: 'in' as 'in' | 'out' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  const selectedProduct = useMemo(
    () => (selectedProductId ? products.find((p) => p.id === selectedProductId) || null : null),
    [products, selectedProductId]
  );

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category || 'Uncategorized'))),
    [products]
  );

  const lowStockProducts = products.filter((p) => p.quantity > 0 && p.quantity <= (p.minStock || 5));
  const outOfStockProducts = products.filter((p) => p.quantity === 0);
  const inStockProducts = products.filter((p) => p.quantity > (p.minStock || 5));

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const category = p.category || 'Uncategorized';
      if (selectedCategory && category !== selectedCategory) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (stockFilter === 'in-stock' && p.quantity <= (p.minStock || 5)) return false;
      if (stockFilter === 'low-stock' && (p.quantity === 0 || p.quantity > (p.minStock || 5))) return false;
      if (stockFilter === 'out-of-stock' && p.quantity > 0) return false;
      return true;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const totalCostValue = products.reduce((sum, p) => sum + ((p.costPrice || p.price) * p.quantity), 0);
  const potentialProfit = totalInventoryValue - totalCostValue;

  const selectedMovements = useMemo(
    () =>
      selectedProductId
        ? movements
          .filter((m) => m.productId === selectedProductId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [],
    [movements, selectedProductId]
  );

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (product: Product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setSelectedProductId(null);
    setShowForm(true);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'status'>) => {
    // Refresh products from API after successful save
    await fetchProducts();
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      if (!isAuthenticated()) {
        alert('Please login to delete products');
        navigate('/login');
        return;
      }
      
      await apiClient.delete(`/products/?id=${productId}`);
      await fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      if (err.message?.includes('session') || err.message?.includes('login')) {
        clearTokens();
        navigate('/login');
        return;
      }
      alert(err.message || 'Failed to delete product. Please try again.');
    }
    setSelectedProductId(null);
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !adjustData.change) return;

    let changeAmount = parseInt(adjustData.change);
    if (isNaN(changeAmount) || changeAmount === 0) return;

    if (adjustData.type === 'out') changeAmount = -Math.abs(changeAmount);
    else changeAmount = Math.abs(changeAmount);

    // Find the product and calculate new quantity
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    const newQuantity = Math.max(0, product.quantity + changeAmount);
    
    // Update via API with automatic token refresh
    try {
      if (!isAuthenticated()) {
        alert('Please login to adjust stock');
        navigate('/login');
        return;
      }
      
      await apiClient.put(`/products/?id=${selectedProductId}`, { quantity: newQuantity });
      
      await fetchProducts(); // Refresh from API
      setMovements((prev) => [
        { id: `m-${Date.now()}`, productId: selectedProductId, date: new Date().toISOString(), change: changeAmount, notes: adjustData.notes || 'Manual adjustment', staff: 'Admin', type: adjustData.type },
        ...prev,
      ]);
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      if (err.message?.includes('session') || err.message?.includes('login')) {
        clearTokens();
        navigate('/login');
        return;
      }
      alert(err.message || 'Failed to adjust stock. Please try again.');
    }

    setAdjustData({ change: '', notes: '', type: 'in' });
    setShowAdjustStock(false);
  };

  const handleQRScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrValue.trim()) return;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: `Scanned Item (${qrValue.trim()})`,
      quantity: 1,
      price: 0,
      image: null,
      status: 'active'
    };

    setProducts((prev) => [newProduct, ...prev]);
    setQrValue('');
    setShowQRModal(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`${t('inventory.deleteConfirm')} ${n(selectedItems.size)} ${t('inventory.itemsSelected')}?`)) {
      setProducts(products.filter(p => !selectedItems.has(p.id)));
      setSelectedItems(new Set());
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      <div className="w-full max-w-1600px mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        {/* Header - Modern Gradient Style */}
        <div className="relative overflow-hidden bg-linear-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-5 sm:p-6 mb-6 shadow-xl shadow-amber-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <FiPackage className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  {t('inventory.title')}
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm">
                    {n(products.length)} items
                  </span>
                </h1>
                <p className="text-white/80 text-sm mt-1">{t('inventory.pageDescription')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => fetchProducts()}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowQRModal(true)}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all"
              >
                <FiCamera className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('inventory.scanQR')}</span>
                <span className="sm:hidden">Scan</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-white text-amber-700 hover:bg-amber-50 shadow-lg hover:shadow-xl transition-all"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                {t('inventory.addProduct')}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <FiLoader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-1">{error}</h3>
                <p className="text-sm text-red-600 dark:text-red-400">Please try refreshing or check your connection.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProducts()}
                className="ml-auto border-red-200 dark:border-red-700 text-red-600"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Main Content - Only show when not loading */}
        {!isLoading && !error && (
          <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <KPICard
            title={t('inventory.totalProducts')}
            value={products.length}
            borderColor="blue"
            onClick={() => setStockFilter('all')}
            icon={<FiPackage className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={`${n(categories.length)} ${t('inventory.categoriesLabel')}`}
            isCurrency={false}
          />

          <KPICard
            title={t('inventory.stockValue')}
            value={totalInventoryValue}
            borderColor="emerald"
            onClick={() => navigate('/reports')}
            icon={<NepaliRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={`${t('inventory.profit')}: ${c(potentialProfit)}`}
          />

          <KPICard
            title={t('inventory.lowStock')}
            value={lowStockProducts.length}
            borderColor="amber"
            onClick={() => setStockFilter('low-stock')}
            icon={<FiAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={t('inventory.needsReorder')}
            isCurrency={false}
          />

          <KPICard
            title={t('inventory.outOfStock')}
            value={outOfStockProducts.length}
            borderColor="red"
            onClick={() => setStockFilter('out-of-stock')}
            icon={<FiArchive className="w-4 h-4 sm:w-5 sm:h-5" />}
            subtitle={t('inventory.needsRestocking')}
            isCurrency={false}
          />
        </div>

        {/* Filters and Search */}
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Stock Status Tabs */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'all' as const, label: t('common.all'), count: products.length, color: '' },
              { id: 'in-stock' as const, label: t('inventory.inStock'), count: inStockProducts.length, color: 'text-emerald-600' },
              { id: 'low-stock' as const, label: t('inventory.lowStock'), count: lowStockProducts.length, color: 'text-amber-600' },
              { id: 'out-of-stock' as const, label: t('inventory.outOfStock'), count: outOfStockProducts.length, color: 'text-red-600' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStockFilter(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${stockFilter === tab.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <span className={`${stockFilter !== tab.id ? tab.color : ''} hidden sm:inline`}>{tab.label}</span>
                <span className={`${stockFilter !== tab.id ? tab.color : ''} sm:hidden`}>{tab.id === 'all' ? 'All' : tab.id === 'in-stock' ? 'In' : tab.id === 'low-stock' ? 'Low' : 'Out'}</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${stockFilter === tab.id
                  ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  {n(tab.count)}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0 sm:min-w-200px">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('inventory.searchPlaceholder')}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">{t('inventory.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 sm:p-2.5 rounded-md sm:rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <FiGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 sm:p-2.5 rounded-md sm:rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <FiList className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => console.log('Export')} className="text-xs sm:text-sm">
              <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{t('common.export')}</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>

          {/* Results summary */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full font-medium text-blue-700 dark:text-blue-300">
              {n(filteredProducts.length)} {t('inventory.productsFound')}
            </span>
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full font-medium text-emerald-700 dark:text-emerald-300 truncate">
              {t('inventory.value')}: {c(filteredProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0))}
            </span>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <Card className="p-3 sm:p-4 mb-4 sm:mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300">
                {n(selectedItems.size)} {t('inventory.itemsSelected')}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                  onClick={handleBulkDelete}
                >
                  <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('inventory.deleteSelected')}</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Products Grid/Table */}
        {filteredProducts.length === 0 ? (
          <Card className="p-8 sm:p-12 lg:p-16 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FiPackage className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
              {t('inventory.noProducts')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
              {searchQuery ? t('inventory.tryDifferentSearch') : t('inventory.addFirstProduct')}
            </p>
            <Button size="sm" onClick={handleOpenAdd}>
              <FiPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              {t('inventory.addProduct')}
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-500/30"
                onClick={() => setSelectedProductId(product.id)}
              >
                {/* Product Image */}
                <div className="h-32 sm:h-36 lg:h-40 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPackage className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  {/* Stock Badge */}
                  <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${product.quantity === 0
                    ? 'bg-red-500 text-white'
                    : product.quantity <= (product.minStock || 5)
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-500 text-white'
                    }`}>
                    {product.quantity === 0 ? t('inventory.outOfStock') : `${n(product.quantity)} ${product.unit || 'pcs'}`}
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                    {product.category || 'Uncategorized'}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">{product.name}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono">{product.sku}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 ml-2 w-4 h-4"
                      checked={selectedItems.has(product.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectItem(product.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                    {c(product.price)}
                  </p>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`flex items-center gap-1 ${product.status === 'active' ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                      {product.status === 'active' ? <FiCheck className="w-3 h-3 sm:w-4 sm:h-4" /> : <FiX className="w-3 h-3 sm:w-4 sm:h-4" />}
                      <span className="hidden sm:inline">{product.status === 'active' ? t('inventory.active') : t('inventory.inactive')}</span>
                    </span>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(product);
                        }}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('inventory.deleteItemConfirm'))) {
                            setProducts(products.filter(p => p.id !== product.id));
                          }
                        }}
                        className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="p-3 sm:p-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        onChange={handleSelectAll}
                        checked={filteredProducts.length > 0 && selectedItems.size === filteredProducts.length}
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('inventory.product')}</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('inventory.category')}</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('inventory.sku')}</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('inventory.stock')}</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('inventory.price')}</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('inventory.status')}</th>
                    <th className="p-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{t('inventory.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          checked={selectedItems.has(product.id)}
                          onChange={() => handleSelectItem(product.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <FiPackage className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 truncate max-w-50">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{product.category || '—'}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400 font-mono">{product.sku || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${product.quantity === 0
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : product.quantity <= (product.minStock || 5)
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}>
                          {n(product.quantity)} {product.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{c(product.price)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}>
                          {product.status === 'active' ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                          {product.status === 'active' ? t('inventory.active') : t('inventory.inactive')}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <FiEdit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t('inventory.deleteItemConfirm'))) {
                                setProducts(products.filter(p => p.id !== product.id));
                              }
                            }}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add/Edit Product Dialog */}
        {showForm && (
          <AddProductDialog
            onClose={() => {
              setShowForm(false);
              setIsEditing(false);
              setEditingId(null);
            }}
            onSave={handleSaveProduct}
            initialData={isEditing && editingId ? products.find(p => p.id === editingId) : undefined}
            isEdit={isEditing}
          />
        )}

        {/* QR Scan Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('inventory.scanProductQR')}</h2>
                <button onClick={() => setShowQRModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleQRScan} className="space-y-4">
                <Input
                  label={t('inventory.qrCode')}
                  value={qrValue}
                  onChange={(e) => setQrValue(e.target.value)}
                  placeholder="Scan or enter code..."
                  required
                />
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">{t('inventory.addToInventory')}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowQRModal(false)}>{t('common.cancel')}</Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {selectedProduct.image ? (
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiPackage className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedProduct.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-mono">{selectedProduct.sku}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${selectedProduct.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                      {selectedProduct.status === 'active' ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                      {selectedProduct.status === 'active' ? t('inventory.active') : t('inventory.inactive')}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedProductId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{t('inventory.currentStock')}</p>
                    <p className={`text-2xl font-bold ${selectedProduct.quantity === 0 ? 'text-red-600' : selectedProduct.quantity <= (selectedProduct.minStock || 5) ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                      {n(selectedProduct.quantity)} {selectedProduct.unit || 'pcs'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{t('inventory.sellingPrice')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{c(selectedProduct.price)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{t('inventory.costPrice')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{c(selectedProduct.costPrice || selectedProduct.price)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{t('inventory.stockValue')}</p>
                    <p className="text-2xl font-bold text-emerald-600">{c(selectedProduct.price * selectedProduct.quantity)}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('common.description')}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Stock Movement History */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('inventory.stockMovementHistory')}</h3>
                  {selectedMovements.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('inventory.noStockMovements')}</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedMovements.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.change >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                              }`}>
                              {m.change >= 0 ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.notes}</p>
                              <p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${m.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {m.change >= 0 ? '+' : ''}{n(m.change)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setShowAdjustStock(true)}>
                    <FiRefreshCw className="w-4 h-4 mr-2" />
                    {t('inventory.adjustStock')}
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenEdit(selectedProduct)}>
                    <FiEdit2 className="w-4 h-4 mr-2" />
                    {t('inventory.editProduct')}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(t('inventory.deleteItemConfirm'))) {
                        setProducts(products.filter(p => p.id !== selectedProduct.id));
                        setSelectedProductId(null);
                      }
                    }}
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        </>
        )}

        {/* Adjust Stock Modal */}
        {showAdjustStock && selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('inventory.adjustStock')}: {selectedProduct.name}
              </h3>
              <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <p className="text-sm text-gray-500 mb-1">{t('inventory.currentQuantity')}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{n(selectedProduct.quantity)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: 'in' })}
                    className={`flex-1 p-3 rounded-xl font-semibold transition-colors ${adjustData.type === 'in'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <FiTrendingUp className="w-5 h-5 mx-auto mb-1" />
                    {t('inventory.stockIn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: 'out' })}
                    className={`flex-1 p-3 rounded-xl font-semibold transition-colors ${adjustData.type === 'out'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <FiTrendingDown className="w-5 h-5 mx-auto mb-1" />
                    {t('inventory.stockOut')}
                  </button>
                </div>
                <Input
                  label={t('inventory.quantity')}
                  type="number"
                  value={adjustData.change}
                  onChange={(e) => setAdjustData({ ...adjustData, change: e.target.value })}
                  placeholder="Enter quantity"
                  required
                  min="1"
                />
                <Input
                  label={t('inventory.reasonNotes')}
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  placeholder="e.g., Received from supplier, Sold to customer..."
                />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdjustStock(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {t('inventory.saveAdjustment')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
