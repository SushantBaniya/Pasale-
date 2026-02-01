import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore, Transaction, Expense, Party } from '../../store/dataStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import {
  FiX,
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiUser,
  FiPackage,
  FiCalendar,
  FiPercent,
  FiTag,
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
  FiTruck,
  FiHash,
  FiChevronDown,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../ui/NepaliRupeeIcon';
import { useTranslation } from '../../utils/i18n';

interface AddNewDialogProps {
  onClose: () => void;
}

type DialogType = 'purchase' | 'selling' | 'expense' | 'payment_in' | 'payment_out' | 'quotation' | 'sales_return' | 'purchase_return' | 'income' | null;
type PaymentStatus = 'paid' | 'partial' | 'unpaid';
type PaymentMethod = 'cash' | 'bank' | 'credit' | 'upi' | 'cheque' | 'online';

interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  tax: number;
  total: number;
}

const expenseCategories = [
  { id: 'rent', label: 'Rent', icon: '🏠' },
  { id: 'utilities', label: 'Utilities', icon: '💡' },
  { id: 'salary', label: 'Salary/Wages', icon: '💰' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'office', label: 'Office Supplies', icon: '📎' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️' },
  { id: 'taxes', label: 'Taxes & Fees', icon: '📋' },
  { id: 'other', label: 'Other', icon: '📦' },
];

const units = ['pcs', 'kg', 'ltr', 'mtr', 'box', 'dozen', 'set', 'unit'];

export const AddNewDialog: React.FC<AddNewDialogProps> = ({ onClose }) => {
  const { c } = useTranslation();
  const navigate = useNavigate();
  const { addTransaction, addExpense, parties, addParty } = useDataStore();

  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Transaction form state
  const [partyId, setPartyId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { id: '1', name: '', quantity: 1, unit: 'pcs', rate: 0, discount: 0, tax: 0, total: 0 },
  ]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCharges, setShippingCharges] = useState('0');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Quick add party
  const [showAddParty, setShowAddParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');

  // Expense form state
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('cash');
  const [isNecessary, setIsNecessary] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [vendor, setVendor] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Payment In/Out form state
  const [paymentPartyId, setPaymentPartyId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<PaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Income form state
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('');
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeSource, setIncomeSource] = useState('');

  // Calculate totals
  const calculateItemTotal = (item: TransactionItem) => {
    const subtotal = item.quantity * item.rate;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax / 100);
    return afterDiscount + taxAmount;
  };

  const updateItemTotal = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index].total = calculateItemTotal(updated[index]);
      return updated;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + item.quantity * item.rate * (item.discount / 100),
    0
  );
  const totalTax = items.reduce((sum, item) => {
    const afterDiscount = item.quantity * item.rate * (1 - item.discount / 100);
    return sum + afterDiscount * (item.tax / 100);
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax + parseFloat(shippingCharges || '0');
  const balanceDue = grandTotal - parseFloat(amountPaid || '0');



  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof TransactionItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.total = calculateItemTotal(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const handleAddParty = () => {
    if (!newPartyName.trim()) return;

    const newParty: Party = {
      id: Date.now().toString(),
      name: newPartyName.trim(),
      type: dialogType === 'purchase' ? 'supplier' : 'customer',
      phone: newPartyPhone || undefined,
      balance: 0,
    };
    addParty(newParty);
    setPartyId(newParty.id);
    setShowAddParty(false);
    setNewPartyName('');
    setNewPartyPhone('');
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!partyId) {
      setError('Required: Party');
      return;
    }

    if (items.some((item) => !item.name || item.rate <= 0)) {
      setError('Required: Item details');
      return;
    }

    const selectedParty = parties.find((p) => p.id === partyId);
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: dialogType!,
      amount: grandTotal,
      date: new Date(transactionDate).toISOString(),
      description: items.map((i) => i.name).join(', '),
      partyId,
      partyName: selectedParty?.name,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.rate,
        total: item.total,
      })),
    };

    addTransaction(transaction);
    setSuccess(true);

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!expenseCategory || !expenseAmount) {
      setError('Required field missing');
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      date: new Date(expenseDate).toISOString(),
      description: expenseDescription,
      isNecessary,
    };

    addExpense(expense);
    setSuccess(true);

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleCreateBill = () => {
    navigate(partyId ? `/billing?partyId=${partyId}` : '/billing');
    onClose();
  };

  const resetForm = () => {
    setDialogType(null);
    setPartyId('');
    setItems([{ id: '1', name: '', quantity: 1, unit: 'pcs', rate: 0, discount: 0, tax: 0, total: 0 }]);
    setPaymentStatus('unpaid');
    setAmountPaid('0');
    setNotes('');
    setExpenseCategory('');
    setExpenseAmount('');
    setExpenseDescription('');
    setIsNecessary(true);
    setError('');
    setSuccess(false);
  };

  // Type Selection Screen
  if (!dialogType) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
        <Card className="w-full max-w-3xl p-0 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 my-8 bg-white dark:bg-gray-800">
          {/* Header MATCHING AddTransactionDialog */}
          <div className="p-4 text-white bg-linear-to-r from-indigo-600 to-indigo-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FiPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    Add New
                  </h2>
                  <p className="text-white/80 text-xs mt-0.5">
                    Select an action to proceed
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

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Sales Button */}
              <button
                onClick={() => setDialogType('selling')}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 dark:border-gray-700 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-900/20 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiTrendingUp className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Add Sales</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">New sale</p>
                </div>
              </button>

              {/* Purchase Button */}
              <button
                onClick={() => setDialogType('purchase')}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500/50 dark:hover:bg-blue-900/20 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiShoppingCart className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">Add Purchase</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">New purchase</p>
                </div>
              </button>

              {/* Expense Button */}
              <button
                onClick={() => setDialogType('expense')}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-500/50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiCreditCard className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-red-700 dark:group-hover:text-red-400">Add Expense</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track expense</p>
                </div>
              </button>

              {/* Create Invoice Button */}
              <button
                onClick={handleCreateBill}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-500/50 dark:hover:bg-purple-900/20 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiFileText className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400">Create Invoice</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generate bill</p>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }



  // Expense Form
  if (dialogType === 'expense') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-3xl p-0 max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 my-4 bg-white dark:bg-gray-800">
          {/* Header MATCHING AddTransactionDialog */}
          <div className="p-4 text-white bg-linear-to-r from-red-600 to-red-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FiTrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Add Expense</h2>
                  <p className="text-white/80 text-xs mt-0.5">Track and manage your business expenses</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-green-700 dark:text-green-400 flex items-center gap-3 animate-in slide-in-from-top-2">
              <FiCheckCircle className="w-5 h-5" />
              <span className="font-medium">Expense added successfully</span>
            </div>
          )}

          <form onSubmit={handleExpenseSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
            {/* Category Selection */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiTag className="w-3.5 h-3.5" />
                Category *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {expenseCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setExpenseCategory(cat.id)}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${expenseCategory === cat.id
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-gray-200 dark:border-gray-600 hover:border-red-400 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <span className="text-xl block mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-semibold truncate block">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <NepaliRupeeIcon className="w-3.5 h-3.5" />
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-all font-bold text-lg"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Date *
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiCreditCard className="w-3.5 h-3.5" />
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['cash', 'bank', 'credit', 'upi'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setExpensePaymentMethod(method)}
                    className={`px-2 py-2 rounded-lg border-2 text-xs font-medium capitalize transition-all ${expensePaymentMethod === method
                      ? 'border-gray-800 bg-gray-800 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                      }`}
                  >
                    {method === 'upi' ? 'UPI' : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor and Receipt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5" />
                  Vendor
                </label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-all text-sm"
                  placeholder="Vendor Name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiHash className="w-3.5 h-3.5" />
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-all text-sm"
                  placeholder="REC-001"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiFileText className="w-3.5 h-3.5" />
                Description
              </label>
              <textarea
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-all resize-none text-sm"
                rows={2}
                placeholder="Enter description"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isNecessary}
                  onChange={(e) => setIsNecessary(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 transition-colors">
                  Necessary
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 transition-colors">
                  Recurring
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2 animate-pulse text-sm">
                <FiAlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={resetForm} className="px-5 py-2.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600">
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add Expense
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Payment In/Out Form
  if (dialogType === 'payment_in' || dialogType === 'payment_out') {
    const isPaymentIn = dialogType === 'payment_in';
    const mainColorClass = isPaymentIn ? 'emerald' : 'orange';
    const filteredParties = parties.filter((p) => p.type === (isPaymentIn ? 'customer' : 'supplier'));

    const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!paymentPartyId || !paymentAmount) {
        setError('Please fill in all required fields');
        return;
      }

      const selectedParty = parties.find((p) => p.id === paymentPartyId);
      addTransaction({
        id: Date.now().toString(),
        type: isPaymentIn ? 'payment_in' : 'payment_out',
        amount: parseFloat(paymentAmount),
        date: new Date(paymentDate).toISOString(),
        description: `Payment ${isPaymentIn ? 'received from' : 'made to'} ${selectedParty?.name}`,
        partyId: paymentPartyId,
        partyName: selectedParty?.name,
      });

      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 my-4 bg-white dark:bg-gray-800">
          {/* Header MATCHING AddTransactionDialog */}
          <div className={`p-4 text-white ${isPaymentIn ? 'bg-linear-to-r from-emerald-600 to-emerald-700' : 'bg-linear-to-r from-orange-600 to-orange-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FiCreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isPaymentIn ? 'Payment In' : 'Payment Out'}
                  </h2>
                  <p className="text-white/80 text-xs mt-0.5">
                    {isPaymentIn ? 'Record money received' : 'Record money paid'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {success && (
            <div className={`mx-6 mt-6 p-4 border rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${isPaymentIn
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
              }`}>
              <FiCheckCircle className="w-5 h-5" />
              <span className="font-medium">Payment recorded successfully</span>
            </div>
          )}

          <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
            {/* Party Selection */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5" />
                {isPaymentIn ? 'Customer' : 'Supplier'} *
              </label>
              <div className="relative">
                <select
                  value={paymentPartyId}
                  onChange={(e) => setPaymentPartyId(e.target.value)}
                  className={`w-full pl-3 pr-10 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none transition-all appearance-none text-sm ${isPaymentIn ? 'border-gray-200 focus:border-emerald-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  required
                >
                  <option value="">Select {isPaymentIn ? 'Customer' : 'Supplier'}</option>
                  {filteredParties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <NepaliRupeeIcon className="w-3.5 h-3.5" />
                  Amount *
                </label>
                <div className="relative group">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold transition-colors text-sm ${isPaymentIn ? 'text-emerald-500' : 'text-orange-500'
                    }`}>
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none transition-all font-bold text-lg ${isPaymentIn ? 'border-gray-200 focus:border-emerald-500' : 'border-gray-200 focus:border-orange-500'
                      }`}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className={`w-full px-3 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none transition-all text-sm ${isPaymentIn ? 'border-gray-200 focus:border-emerald-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiCreditCard className="w-3.5 h-3.5" />
                Payment Method
              </label>
              <div className="relative">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentMethod)}
                  className={`w-full pl-3 pr-10 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none transition-all appearance-none text-sm ${isPaymentIn ? 'border-gray-200 focus:border-emerald-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Reference and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiHash className="w-3.5 h-3.5" />
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className={`w-full px-3 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none transition-all text-sm ${isPaymentIn ? 'border-gray-200 focus:border-emerald-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  placeholder="e.g., CHQ-001"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiFileText className="w-3.5 h-3.5" />
                  Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className={`w-full px-3 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none transition-all text-sm ${isPaymentIn ? 'border-gray-200 focus:border-emerald-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={resetForm} className="px-5 py-2.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600">
                Cancel
              </Button>
              <Button
                type="submit"
                className={`px-6 py-2.5 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-all ${isPaymentIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                  : 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20'
                  }`}
              >
                <FiPlus className="w-4 h-4" />
                {isPaymentIn ? 'Record Payment' : 'Make Payment'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Income Form
  if (dialogType === 'income') {
    const handleIncomeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!incomeAmount || !incomeCategory) {
        setError('Please fill in all required fields');
        return;
      }

      addTransaction({
        id: Date.now().toString(),
        type: 'income',
        amount: parseFloat(incomeAmount),
        date: new Date(incomeDate).toISOString(),
        description: incomeDescription || `Income from ${incomeSource || incomeCategory}`,
      });

      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    };

    const incomeCategories = ['Interest', 'Rent', 'Commission', 'Royalty', 'Dividends', 'Service Fee', 'Other'];

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-2xl p-0 max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 bg-white dark:bg-gray-800">
          {/* Header MATCHING AddTransactionDialog */}
          <div className="p-4 text-white bg-linear-to-r from-purple-600 to-purple-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Record Income</h2>
                  <p className="text-white/80 text-xs mt-0.5">Record other income sources</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {success && (
            <div className="m-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-3">
              <FiCheckCircle className="w-5 h-5" />
              <span className="font-medium">Income recorded successfully!</span>
            </div>
          )}

          <form onSubmit={handleIncomeSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
            {/* Category */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiTag className="w-3.5 h-3.5" />
                Category *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {incomeCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setIncomeCategory(cat)}
                    className={`p-2 rounded-lg border-2 text-center transition-all text-xs font-medium truncate ${incomeCategory === cat
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <NepaliRupeeIcon className="w-3.5 h-3.5" />
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">रु.</span>
                  <input
                    type="number"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all font-bold text-lg"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Date *
                </label>
                <input
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Source and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5" />
                  Source
                </label>
                <input
                  type="text"
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all text-sm"
                  placeholder="e.g., XYZ Company"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiFileText className="w-3.5 h-3.5" />
                  Description
                </label>
                <input
                  type="text"
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all text-sm"
                  placeholder="Additional details"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2 animate-pulse text-sm">
                <FiAlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={resetForm} className="px-5 py-2.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600">
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <FiPlus className="w-4 h-4" />
                Record Income
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Quotation, Sales Return, Purchase Return - Simplified versions using similar form structure
  if (dialogType === 'quotation' || dialogType === 'sales_return' || dialogType === 'purchase_return') {
    const isPurchaseReturn = dialogType === 'purchase_return';
    const isSalesReturn = dialogType === 'sales_return';
    const isQuotation = dialogType === 'quotation';

    const getConfig = () => {
      if (isQuotation) return { title: 'Create Quotation', color: 'cyan', icon: FiFileText };
      if (isSalesReturn) return { title: 'Sales Return', color: 'pink', icon: FiPackage };
      return { title: 'Purchase Return', color: 'indigo', icon: FiPackage };
    };

    const config = getConfig();
    const colorMap: Record<string, string> = {
      cyan: 'from-cyan-500 to-cyan-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600',
    };
    const focusRing: Record<string, string> = {
      cyan: 'focus:ring-cyan-500',
      pink: 'focus:ring-pink-500',
      indigo: 'focus:ring-indigo-500',
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-4xl p-0 max-h-[95vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 bg-white dark:bg-gray-800">
          {/* Header MATCHING AddTransactionDialog standard */}
          <div className={`p-4 text-white bg-linear-to-r ${colorMap[config.color]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <config.icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{config.title}</h2>
                  <p className="text-white/80 text-xs mt-0.5">Fill in the details below</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {success && (
            <div className="m-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2 animate-pulse text-sm">
              <FiCheckCircle className="w-4 h-4" />
              <span className="font-medium">{config.title} created successfully!</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSuccess(true);
              setTimeout(() => onClose(), 1000);
            }}
            className="p-6 space-y-6 overflow-y-auto max-h-[calc(95vh-180px)]"
          >
            {/* Party Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5" />
                  {isQuotation || isSalesReturn ? 'Customer' : 'Supplier'} *
                </label>
                <div className="relative">
                  <select
                    className={`w-full pl-3 pr-10 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white bg-white dark:bg-gray-800 outline-none transition-all appearance-none text-sm ${focusRing[config.color].replace('focus:ring-', 'focus:border-').replace('focus:ring', 'focus:border')} border-gray-200 dark:border-gray-600`}
                    required
                  >
                    <option value="">Select a party</option>
                    {parties
                      .filter((p) => {
                        if (isQuotation || isSalesReturn) return p.type === 'customer';
                        return p.type === 'supplier';
                      })
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Date *
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none transition-all text-sm ${focusRing[config.color].replace('focus:ring-', 'focus:border-').replace('focus:ring', 'focus:border')} border-gray-200 dark:border-gray-600`}
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <NepaliRupeeIcon className="w-3.5 h-3.5" />
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">रु.</span>
                <input
                  type="number"
                  className={`w-full pl-10 pr-3 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none transition-all font-bold text-lg ${focusRing[config.color].replace('focus:ring-', 'focus:border-').replace('focus:ring', 'focus:border')} border-gray-200 dark:border-gray-600`}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiFileText className="w-3.5 h-3.5" />
                Description
              </label>
              <textarea
                className={`w-full px-3 py-2.5 border-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none transition-all text-sm resize-none ${focusRing[config.color].replace('focus:ring-', 'focus:border-').replace('focus:ring', 'focus:border')} border-gray-200 dark:border-gray-600`}
                rows={3}
                placeholder="Add details..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={resetForm} className="px-5 py-2.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600">
                Cancel
              </Button>
              <Button
                type="submit"
                className={`px-6 py-2.5 text-white font-bold rounded-lg text-sm flex items-center gap-2 bg-linear-to-r ${colorMap[config.color]}`}
              >
                <FiPlus className="w-4 h-4" />
                {config.title}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }
  const isPurchase = dialogType === 'purchase';
  const colorTheme = isPurchase ? 'blue' : 'green';
  const filteredParties = parties.filter((p) => p.type === (isPurchase ? 'supplier' : 'customer'));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl p-0 max-h-[95vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 bg-white dark:bg-gray-800">
        {/* Header MATCHING AddTransactionDialog standard */}
        <div
          className={`p-4 text-white bg-linear-to-r ${isPurchase ? 'from-blue-600 to-blue-700' : 'from-emerald-600 to-emerald-700'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                {isPurchase ? (
                  <FiShoppingCart className="w-5 h-5" />
                ) : (
                  <FiTrendingUp className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isPurchase ? 'Add Purchase' : 'Add Sales'}
                </h2>
                <p className={`${isPurchase ? 'text-blue-100' : 'text-emerald-100'} text-xs mt-0.5`}>
                  {isPurchase ? 'Record a new purchase' : 'Record a new sale'}
                </p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {success && (
          <div className="m-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-3 animate-in slide-in-from-top-2">
            <FiCheckCircle className="w-5 h-5" />
            <span className="font-medium">Transaction added successfully</span>
          </div>
        )}

        <form
          onSubmit={handleTransactionSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(95vh-180px)]"
        >
          {/* Party Selection and Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Party Selection */}
            <div className="md:col-span-1">
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5" />
                {isPurchase ? 'Supplier' : 'Customer'} *
              </label>
              {showAddParty ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    placeholder="Party Name"
                    className="w-full px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <input
                    type="tel"
                    value={newPartyPhone}
                    onChange={(e) => setNewPartyPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleAddParty} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddParty(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-sm appearance-none"
                      required
                    >
                      <option value="">Select Party</option>
                      {filteredParties.map((party) => (
                        <option key={party.id} value={party.id}>
                          {party.name}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddParty(true)}
                    className="px-3 border-2 rounded-lg border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <FiPlus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Invoice Number */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiFileText className="w-3.5 h-3.5" />
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5" />
                Date *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FiPackage className="w-5 h-5" />
                Items
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <FiPlus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Item Name
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-20">
                      Quantity
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-20">
                      Unit
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-24">
                      Rate
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-20">
                      Discount %
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-20">
                      Tax %
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-28">
                      Total
                    </th>
                    <th className="px-2 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                          placeholder="Item Name"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          min="1"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {units.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {c(item.total)}
                      </td>
                      <td className="px-2 py-2">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiCreditCard className="w-3.5 h-3.5" />
                  Payment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['paid', 'partial', 'unpaid'] as PaymentStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPaymentStatus(status)}
                      className={`p-2 rounded-lg border-2 text-xs font-medium capitalize transition-all ${paymentStatus === status
                        ? status === 'paid'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                          : status === 'partial'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'
                            : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {paymentStatus !== 'unpaid' && (
                <>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['cash', 'bank', 'credit', 'upi'] as PaymentMethod[]).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`p-2 rounded-lg border-2 text-xs font-medium capitalize transition-all ${paymentMethod === method
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                          {method === 'upi' ? 'UPI' : method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiFileText className="w-3.5 h-3.5" />
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="Add notes..."
                />
              </div>

              {/* Shipping Charges - NEW */}
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiTruck className="w-3.5 h-3.5" />
                  Shipping
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={shippingCharges}
                    onChange={(e) => setShippingCharges(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-sm font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">
                Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{c(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Discount</span>
                  <span className="text-red-500">-{c(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax</span>
                  <span>+{c(totalTax)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>+{c(parseFloat(shippingCharges || '0'))}</span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100">
                    <span>Total</span>
                    <span>{c(grandTotal)}</span>
                  </div>
                </div>
                {paymentStatus !== 'paid' && (
                  <div
                    className={`flex justify-between font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                  >
                    <span>Balance Due</span>
                    <span>{c(balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-3">
              <FiAlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              className={`px-6 py-2.5 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg ${isPurchase ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
            >
              <FiPlus className="w-4 h-4 mr-2" />
              {isPurchase ? 'Add Purchase' : 'Add Sales'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateBill}
              className="px-5 py-2.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600"
              disabled={!partyId}
            >
              <FiFileText className="w-4 h-4 mr-2" />
              Create Bill
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} className="px-5 py-2.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

