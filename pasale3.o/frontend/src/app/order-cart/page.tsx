import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productApi, orderApi, counterApi, partyApi } from '../../utils/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiArrowLeft, FiCheck } from 'react-icons/fi';

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data.results || data || []);
    } catch (err: any) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.product_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.product_name,
        quantity: 1,
        unit_price: product.unit_price
      }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [cart]);

  const handleSave = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      setSaving(true);
      setError('');

      let partyId: number | undefined;
      let counterId: number | undefined;

      if (type === 'customer') {
        // Create customer party first
        const party = await partyApi.create({
          name,
          Category_type: 'Customer',
          address: description
        });
        partyId = party.party.id;
      } else {
        // Find or create counter
        const counters = await counterApi.getAll();
        const existingCounter = counters.find((c: any) => c.counter_number === parseInt(counterNumber));
        
        if (existingCounter) {
          counterId = existingCounter.id;
        } else {
          const newCounter = await counterApi.create({
            counter_number: parseInt(counterNumber),
            description: description
          });
          counterId = newCounter.id;
        }
      }

      const orderData = {
        customer_id: partyId,
        counter_id: counterId,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        total_amount: totalAmount
      };

      await orderApi.create(orderData);
      navigate('/counters');
    } catch (err: any) {
      setError(err.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order Cart</h1>
            <p className="text-xs text-gray-500">
              {type === 'customer' ? `Customer: ${name}` : `Counter ${counterNumber}: ${name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
            <p className="text-xl font-black text-indigo-600">Rs. {totalAmount.toLocaleString()}</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || cart.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Product Selection */}
        <div className="flex-[3] p-6 overflow-y-auto border-r bg-white">
          <div className="mb-6 sticky top-0 bg-white pb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className="p-4 hover:border-indigo-600 cursor-pointer transition-all group active:scale-95"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {product.product_name}
                    </h3>
                    <FiPlus className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-indigo-600 font-bold">Rs. {product.unit_price}</p>
                  <p className="text-xs text-gray-500 mt-1">Stock: {product.quantity}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="flex-[2] bg-gray-50 p-6 flex flex-col shadow-inner">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <FiShoppingCart className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-900">Current Cart ({cart.length})</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FiShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                <p>No products added yet</p>
              </div>
            ) : (
              cart.map(item => (
                <Card key={item.product_id} className="p-4 bg-white shadow-sm border-0">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Price: Rs. {item.unit_price}</p>
                      <p className="font-bold text-indigo-600 text-sm">Rs. {(item.unit_price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <FiTrash2 className="shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
