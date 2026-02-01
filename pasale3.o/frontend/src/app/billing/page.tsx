import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useDataStore, Transaction } from '../../store/dataStore';
import { useBusinessStore } from '../../store/businessStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarcodeScanner } from '../../components/scanner/BarcodeScanner';
import { InvoiceDetail } from '../../components/billing/InvoiceDetail';
import {
  FiPlus,
  FiTrash2,
  FiPackage,
  FiZap,
  FiSearch,
  FiPrinter,
  FiSave,
  FiUser,
  FiCalendar,
  FiHash,
  FiFileText,
  FiCreditCard,
  FiDollarSign,
  FiX,
  FiCheck,
  FiChevronDown,
} from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  barcode?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  barcode?: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: 'percent' | 'flat';
  tax: number;
  total: number;
}

type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'unpaid' | 'cancelled';
type PaymentMethod = 'cash' | 'card' | 'bank' | 'upi' | 'credit';

const statusOptions: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'credit', label: 'Credit' },
];

const taxRates = [0, 5, 10, 13, 18];

export default function BillingPage() {
  const { c } = useTranslation();
  const { parties, transactions, addTransaction, addParty } = useDataStore();
  const { businessName, panNumber } = useBusinessStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get transaction/party from URL params
  const transactionIdParam = searchParams.get('transactionId');
  const partyIdParam = searchParams.get('partyId');

  // Invoice Meta State
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('draft');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Customer State
  const [customerId, setCustomerId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerVat, setCustomerVat] = useState('');

  // Items State
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, discount: 0, discountType: 'percent', tax: 13, total: 0 },
  ]);

  // Payment State
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // UI State
  const [showScanner, setShowScanner] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customers = parties.filter((p) => p.type === 'customer');
  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Load transaction data from URL params
  useEffect(() => {
    if (dataLoaded) return;

    // If transactionId is provided, load transaction data
    if (transactionIdParam) {
      const transaction = transactions.find(t => t.id === transactionIdParam);
      if (transaction) {
        // Set customer
        if (transaction.partyId) {
          setCustomerId(transaction.partyId);
        }
        
        // Set items from transaction
        if (transaction.items && transaction.items.length > 0) {
          const invoiceItems: InvoiceItem[] = transaction.items.map((item: any, index: number) => ({
            id: item.id || String(index + 1),
            description: item.name || item.description || '',
            barcode: item.barcode || '',
            quantity: item.quantity || 1,
            rate: item.rate || item.price || 0,
            discount: item.discount || 0,
            discountType: 'percent' as const,
            tax: item.tax || 13,
            total: item.total || (item.quantity * (item.rate || item.price || 0)),
          }));
          setItems(invoiceItems);
        }

        // Set notes
        if (transaction.notes || transaction.description) {
          setNotes(transaction.notes || transaction.description || '');
        }

        // Set dates
        if (transaction.date) {
          setInvoiceDate(transaction.date.split('T')[0]);
        }

        // Generate new invoice number based on transaction
        setInvoiceNumber(`INV-${transaction.transactionNumber || transaction.id}`);
        
        setDataLoaded(true);
      }
    } 
    // If only partyId is provided, just set the customer
    else if (partyIdParam) {
      setCustomerId(partyIdParam);
      setDataLoaded(true);
    }
  }, [transactionIdParam, partyIdParam, transactions, dataLoaded]);

  // Update customer details when selected
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerPhone(selectedCustomer.phone || '');
      setCustomerAddress(selectedCustomer.address || '');
    }
  }, [selectedCustomer]);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/products/`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          const apiProducts = data.results || data || [];
          setProducts(apiProducts.map((p: any) => ({
            id: String(p.id),
            name: p.product_name,
            price: parseFloat(p.unit_price),
            quantity: p.quantity,
            sku: p.sku || `SKU-${p.id}`,
            barcode: p.barcode || p.sku || '',
          })));
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter Products
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);
  }, [products, productSearch]);

  // Calculations
  const calculateItemTotal = (item: InvoiceItem) => {
    const amount = item.quantity * item.rate;
    const discountAmount = item.discountType === 'percent'
      ? amount * (item.discount / 100)
      : item.discount;
    const taxableAmount = amount - discountAmount;
    const taxAmount = taxableAmount * (item.tax / 100);
    return taxableAmount + taxAmount;
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      return { ...updated, total: calculateItemTotal(updated) };
    }));
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      discount: 0,
      discountType: 'percent',
      tax: 13,
      total: 0
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    } else {
      setItems([{ id: Date.now().toString(), description: '', quantity: 1, rate: 0, discount: 0, discountType: 'percent', tax: 13, total: 0 }]);
    }
  };

  // Summary Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalDiscount = items.reduce((sum, item) => {
    const amount = item.quantity * item.rate;
    return sum + (item.discountType === 'percent' ? amount * (item.discount / 100) : item.discount);
  }, 0);
  const totalTax = items.reduce((sum, item) => {
    const amount = item.quantity * item.rate;
    const discountAmount = item.discountType === 'percent' ? amount * (item.discount / 100) : item.discount;
    return sum + ((amount - discountAmount) * (item.tax / 100));
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;
  const balanceDue = grandTotal - paidAmount;

  // Handlers
  const handleProductSelect = (p: Product) => {
    const lastItem = items[items.length - 1];
    const isLastItemEmpty = !lastItem.description && lastItem.rate === 0;

    const newItemValues: Partial<InvoiceItem> = {
      description: p.name,
      rate: p.price,
      quantity: 1,
      discount: 0,
      discountType: 'percent',
      tax: 13,
    };

    if (isLastItemEmpty) {
      Object.entries(newItemValues).forEach(([key, value]) => {
        updateItem(lastItem.id, key as keyof InvoiceItem, value);
      });
    } else {
      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        description: p.name,
        rate: p.price,
        quantity: 1,
        discount: 0,
        discountType: 'percent',
        tax: 13,
        total: 0,
      };
      newItem.total = calculateItemTotal(newItem);
      setItems(prev => [...prev, newItem]);
    }

    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleBarcodeScanned = (barcode: string) => {
    const p = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (p) {
      handleProductSelect(p);
    } else {
      alert(`Product with barcode ${barcode} not found`);
    }
    setShowScanner(false);
  };

  const handleAddCustomer = () => {
    if (!newCustomerName.trim() || newCustomerName.trim().length < 3) {
      alert('Customer name must be at least 3 characters');
      return;
    }
    const cId = `cust-${Date.now()}`;
    addParty({ id: cId, name: newCustomerName, phone: newCustomerPhone, type: 'customer', balance: 0 });
    setCustomerId(cId);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowAddCustomer(false);
  };

  const handleSave = () => {
    const valid = items.filter(i => i.description && i.quantity > 0);
    if (!valid.length) {
      alert('Please add at least one item');
      return;
    }

    addTransaction({
      id: invoiceNumber,
      type: 'selling',
      amount: grandTotal,
      date: new Date(invoiceDate).toISOString(),
      description: `Invoice ${invoiceNumber}`,
      partyId: customerId || undefined,
      partyName: selectedCustomer?.name || 'Walk-in Customer',
      items: valid.map(i => ({
        id: i.id,
        name: i.description,
        quantity: i.quantity,
        price: i.rate,
        total: i.total
      }))
    });

    alert('Invoice saved successfully!');
    resetForm();
  };

  const resetForm = () => {
    setItems([{ id: '1', description: '', quantity: 1, rate: 0, discount: 0, discountType: 'percent', tax: 13, total: 0 }]);
    setCustomerId('');
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 30);
    setDueDate(newDueDate.toISOString().split('T')[0]);
    setInvoiceStatus('draft');
    setPaymentMethod('cash');
    setPaidAmount(0);
    setNotes('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerVat('');
  };

  const handlePrint = () => window.print();

  // Common input styles
  const inputClass = "w-full h-11 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
  const noSpinnerClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:bg-white">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

        {/* LEFT PANEL - Invoice Form */}
        <div className="w-full lg:w-[55%] h-full overflow-y-auto p-4 lg:p-6 space-y-4 print:hidden">

          {/* Transaction Loaded Banner */}
          {transactionIdParam && dataLoaded && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
                <FiFileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Invoice from Transaction</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Data has been pre-filled from the selected transaction</p>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Invoice</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new sales invoice</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowScanner(true)} className="gap-2">
              <FiZap className="w-4 h-4" /> Scan Barcode
            </Button>
          </div>

          {/* Section 1: Invoice Meta */}
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <FiFileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Invoice Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  <FiHash className="w-4 h-4 inline mr-1.5" />Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  readOnly
                  className={`${inputClass} bg-gray-50 dark:bg-gray-900 cursor-not-allowed font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <FiCalendar className="w-4 h-4 inline mr-1.5" />Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <FiCalendar className="w-4 h-4 inline mr-1.5" />Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <FiCreditCard className="w-4 h-4 inline mr-1.5" />Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className={inputClass}
                >
                  {paymentMethods.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Invoice Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setInvoiceStatus(status.value)}
                      className={`px-4 h-11 rounded-lg text-sm font-medium transition-all ${invoiceStatus === status.value
                          ? status.color + ' ring-2 ring-offset-2 ring-blue-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Customer / Party Details */}
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FiUser className="w-5 h-5 text-green-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Customer Details</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddCustomer(true)} className="gap-1.5">
                <FiPlus className="w-4 h-4" /> New
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Party Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    className={`${inputClass} pr-10 appearance-none`}
                  >
                    <option value="">Select Customer (Walk-in)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="9800000000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>VAT/PAN (Optional)</label>
                <input
                  type="text"
                  value={customerVat}
                  onChange={e => setCustomerVat(e.target.value)}
                  placeholder="Enter VAT/PAN"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Customer address"
                  className={inputClass}
                />
              </div>
            </div>

            {selectedCustomer && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Current Balance:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{c(selectedCustomer.balance || 0)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Section 3: Item Entry */}
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Items</h2>
              </div>

              {/* Product Search */}
              <div className="relative w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />

                {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleProductSelect(p)}
                        className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{p.sku}</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{c(p.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto -mx-5">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Qty</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Rate</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Disc</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Tax%</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Total</th>
                    <th className="px-2 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                          className="w-full h-10 px-3 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-blue-500 rounded-lg text-sm outline-none dark:text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className={`w-full h-10 px-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none dark:text-white ${noSpinnerClass}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className={`w-full h-10 px-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none dark:text-white ${noSpinnerClass}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            className={`w-14 h-10 px-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none dark:text-white ${noSpinnerClass}`}
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, 'discountType', item.discountType === 'percent' ? 'flat' : 'percent')}
                            className="h-10 px-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {item.discountType === 'percent' ? '%' : '₹'}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.tax}
                          onChange={e => updateItem(item.id, 'tax', parseFloat(e.target.value))}
                          className="w-full h-10 px-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        >
                          {taxRates.map(rate => (
                            <option key={rate} value={rate}>{rate}%</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">{c(item.total)}</span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button variant="outline" onClick={addItem} className="w-full h-11 border-dashed gap-2">
                <FiPlus className="w-4 h-4" /> Add Item
              </Button>
            </div>
          </Card>

          {/* Section 4: Summary Panel */}
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <FiDollarSign className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Summary</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notes */}
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:text-white"
                />
              </div>

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{c(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="text-sm font-medium text-red-600">-{c(totalDiscount)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tax (VAT)</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">+{c(totalTax)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{c(grandTotal)}</span>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <label className={labelClass}>Paid Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className={`${inputClass} ${noSpinnerClass}`}
                  />
                </div>

                <div className="flex justify-between items-center py-3 bg-amber-50 dark:bg-amber-900/20 -mx-5 px-5 rounded-lg">
                  <span className="text-base font-semibold text-amber-800 dark:text-amber-300">Balance Due</span>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{c(balanceDue)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons (Mobile) */}
          <div className="lg:hidden sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 -mx-4 -mb-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button variant="outline" className="flex-1" onClick={handlePrint}><FiPrinter className="mr-2" />Print</Button>
            <Button className="flex-1 bg-blue-600 text-white" onClick={handleSave}><FiSave className="mr-2" />Save</Button>
          </div>
        </div>

        {/* RIGHT PANEL - Live Preview */}
        <div className="hidden lg:flex w-[45%] h-full bg-gray-100 dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 flex-col print:w-full print:h-auto print:border-0">

          {/* Preview Header */}
          <div className="flex-none flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 print:hidden">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Live Preview</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <FiPrinter className="mr-2 w-4 h-4" /> Print
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">
                <FiSave className="mr-2 w-4 h-4" /> Save
              </Button>
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="flex-1 overflow-y-auto p-6 print:p-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 print:shadow-none print:rounded-none">

              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <FiPackage className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{businessName || 'Business Name'}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-52">{panNumber || 'PAN/VAT Number'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">INVOICE</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-mono mt-1">{invoiceNumber}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{invoiceDate}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusOptions.find(s => s.value === invoiceStatus)?.color || 'bg-gray-100 text-gray-700'
                    }`}>
                    {statusOptions.find(s => s.value === invoiceStatus)?.label || 'Draft'}
                  </span>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</h3>
                {selectedCustomer ? (
                  <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                    {customerPhone && <p className="text-sm text-gray-500 dark:text-gray-400">{customerPhone}</p>}
                    {customerAddress && <p className="text-sm text-gray-500 dark:text-gray-400">{customerAddress}</p>}
                    {customerVat && <p className="text-sm text-gray-500 dark:text-gray-400">VAT/PAN: {customerVat}</p>}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Walk-in Customer</p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-800">
                    <th className="text-left py-3 text-xs font-bold text-gray-500 uppercase">Description</th>
                    <th className="text-center py-3 text-xs font-bold text-gray-500 uppercase w-16">Qty</th>
                    <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase w-24">Rate</th>
                    <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {items.filter(i => i.description).map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{item.description}</td>
                      <td className="py-3 text-center text-sm text-gray-700 dark:text-gray-300">{item.quantity}</td>
                      <td className="py-3 text-right text-sm text-gray-700 dark:text-gray-300">{c(item.rate)}</td>
                      <td className="py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">{c(item.total)}</td>
                    </tr>
                  ))}
                  {items.filter(i => i.description).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 italic">No items added yet</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{c(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Discount:</span>
                    <span className="font-medium text-red-600">-{c(totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Tax (VAT):</span>
                    <span className="font-medium text-gray-900 dark:text-white">+{c(totalTax)}</span>
                  </div>
                  <div className="pt-3 border-t-2 border-gray-100 dark:border-gray-800 flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                    <span className="text-xl font-bold text-blue-600">{c(grandTotal)}</span>
                  </div>
                  {paidAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Paid:</span>
                        <span className="font-medium text-green-600">{c(paidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-amber-700">Balance Due:</span>
                        <span className="font-bold text-amber-600">{c(balanceDue)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400">Thank you for your business!</p>
                <p className="text-xs text-gray-300 mt-1">Generated by Pasale</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800 shadow-2xl rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Customer</h3>
              <button onClick={() => setShowAddCustomer(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Customer name (min 3 characters)"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className={inputClass}
                />
                {newCustomerName && newCustomerName.trim().length < 3 && (
                  <p className="text-xs text-red-500 mt-1">Name must be at least 3 characters</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
              <Button
                onClick={handleAddCustomer}
                disabled={!newCustomerName.trim() || newCustomerName.trim().length < 3}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheck className="mr-2 w-4 h-4" /> Save Customer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
