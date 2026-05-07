import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../../utils/api';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiMoreHorizontal, FiTag, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll();
      const items = res.results || res || [];
      setProducts(items);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const filtered = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.product_name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.product_code?.toLowerCase().includes(q)
    );
  });

  const formatMoney = (n: any) => {
    const val = Number(n || 0);
    return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
  };

  const getStockColor = (qty: number) => {
    if (qty <= 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (qty <= 5) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await productApi.delete(id);
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FiTag className="w-3.5 h-3.5" /> Manage Categories
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FiDownload className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => navigate('/inventory/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add New Item
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search items by name or sku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <FiFilter className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                <th className="py-3 px-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ITEM NAME</th>
                <th className="py-3 px-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                <th className="py-3 px-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">STOCK QUANTITY</th>
                <th className="py-3 px-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">PURCHASE PRICE</th>
                <th className="py-3 px-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">SELLING PRICE</th>
                <th className="py-3 px-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Loading inventory...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">No items found</p>
                    <button
                      onClick={() => navigate('/inventory/new')}
                      className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
                    >
                      Add your first item
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {product.product_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-gray-500 dark:text-gray-400">
                      {product.product_code || product.sku || '–'}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-bold ${getStockColor(product.quantity || 0)}`}>
                        Qty: {product.quantity || 0} {product.unit || ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                      {formatMoney(product.cost_price || product.unit_price || 0)}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                      {formatMoney(product.unit_price || 0)}
                    </td>
                    <td className="py-3.5 px-5 text-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === product.id ? null : product.id);
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <FiMoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {openMenu === product.id && (
                        <div className="absolute right-4 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 py-1 text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(null);
                              // Could navigate to edit page
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(null);
                              handleDelete(product.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}