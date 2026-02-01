import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Button } from '../ui/Button';
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiUser,
  FiCalendar,
  FiHash,
  FiPackage,
  FiFileText,
  FiPercent,
  FiDollarSign,
  FiCheck,
  FiSearch,
} from 'react-icons/fi';
import {
  TransactionItem,
  PaymentStatus,
  PaymentMode,
  PAYMENT_MODES,
  generateTransactionNumber,
  calculateTransactionTotals,
} from './types';

interface SalesPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sales' | 'purchase';
  editData?: any;
  onSuccess?: () => void;
}

export const SalesPurchaseDialog: React.FC<SalesPurchaseDialogProps> = ({
  isOpen,
  onClose,
  type,
  editData,
  onSuccess,
}) => {
  const { parties, addTransaction, updateTransaction } = useDataStore();
  const isEdit = !!editData;
  const isSales = type === 'sales';

  // Form State
  const [partyId, setPartyId] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { id: '1', name: '', quantity: 1, rate: 0, price: 0, tax: 0, discount: 0, total: 0 },
  ]);
  const [additionalTax, setAdditionalTax] = useState(13);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter parties by type
  const filteredParties = parties.filter(p => {
    const matchesType = isSales ? p.type === 'customer' : p.type === 'supplier';
    const matchesSearch = p.name.toLowerCase().includes(partySearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Selected party
  const selectedParty = parties.find(p => p.id === partyId);

  // Calculate totals
  const totals = calculateTransactionTotals(items, additionalTax, additionalDiscount);
  const balanceAmount = totals.totalAmount - paidAmount;

  // Generate invoice number on mount
  useEffect(() => {
    if (!isEdit) {
      setInvoiceNumber(generateTransactionNumber(isSales ? 'selling' : 'purchase'));
    }
  }, [type, isEdit]);

  // Load edit data
  useEffect(() => {
    if (editData) {
      setPartyId(editData.partyId || '');
      setDate(editData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDueDate(editData.dueDate?.split('T')[0] || '');
      setInvoiceNumber(editData.transactionNumber || '');
      setItems(editData.items?.length ? editData.items : [
        { id: '1', name: '', quantity: 1, rate: 0, tax: 0, discount: 0, total: 0 },
      ]);
      setPaidAmount(editData.paidAmount || 0);
      setPaymentMode(editData.paymentMode || 'cash');
      setPaymentStatus(editData.paymentStatus || 'unpaid');
      setNotes(editData.notes || '');
    }
  }, [editData]);

  // Update payment status based on paid amount
  useEffect(() => {
    if (paidAmount <= 0) {
      setPaymentStatus('unpaid');
    } else if (paidAmount >= totals.totalAmount) {
      setPaymentStatus('paid');
      setPaidAmount(totals.totalAmount);
    } else {
      setPaymentStatus('partial');
    }
  }, [paidAmount, totals.totalAmount]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', quantity: 1, rate: 0, price: 0, tax: 0, discount: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof TransactionItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate total
        const subtotal = updated.quantity * updated.rate;
        const taxAmount = (subtotal * updated.tax) / 100;
        updated.total = subtotal + taxAmount - updated.discount;
        return updated;
      }
      return item;
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!partyId) {
      newErrors.party = `Please select a ${isSales ? 'customer' : 'supplier'}`;
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (items.length === 0 || items.every(item => !item.name)) {
      newErrors.items = 'At least one item is required';
    }

    const hasInvalidItems = items.some(item => item.name && (item.quantity <= 0 || item.rate <= 0));
    if (hasInvalidItems) {
      newErrors.items = 'All items must have valid quantity and rate';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));

      const validItems = items.filter(item => item.name).map(item => ({
        ...item,
        price: item.rate, // Add price field for dataStore compatibility
      }));

      const transactionData = {
        id: editData?.id || Date.now().toString(),
        type: isSales ? 'selling' as const : 'purchase' as const, // Use 'selling' for dataStore
        transactionNumber: invoiceNumber,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        partyId,
        partyName: selectedParty?.name,
        partyType: selectedParty?.type,
        items: validItems,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        paidAmount,
        balanceAmount,
        paymentStatus,
        paymentMode,
        notes,
        createdAt: editData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        updateTransaction(editData.id, {
          type: transactionData.type,
          amount: totals.totalAmount,
          date: transactionData.date,
          description: `${isSales ? 'Sale' : 'Purchase'} - ${invoiceNumber}`,
          partyId,
          partyName: selectedParty?.name,
          items: validItems,
        });
      } else {
        addTransaction({
          id: transactionData.id,
          type: transactionData.type,
          amount: totals.totalAmount,
          date: transactionData.date,
          description: `${isSales ? 'Sale' : 'Purchase'} - ${invoiceNumber}`,
          partyId,
          partyName: selectedParty?.name,
          items: validItems,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (error) {
      setErrors({ submit: 'Failed to save transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`px-6 py-4 ${isSales ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {isSales ? <FiFileText className="w-5 h-5 text-white" /> : <FiPackage className="w-5 h-5 text-white" />}
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">
                  {isEdit ? 'Edit' : 'New'} {isSales ? 'Sales Invoice' : 'Purchase Bill'}
                </h2>
                <p className="text-white/80 text-sm">{invoiceNumber}</p>
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
          <div className="m-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
              <FiCheck className="w-5 h-5" />
            </div>
            <span className="font-medium">{isSales ? 'Invoice' : 'Bill'} saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Party & Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Party Selection */}
            <div className="lg:col-span-2 relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiUser className="inline w-4 h-4 mr-1.5" />
                {isSales ? 'Customer' : 'Supplier'} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedParty?.name || partySearch}
                  onChange={(e) => {
                    setPartySearch(e.target.value);
                    setPartyId('');
                    setShowPartyDropdown(true);
                  }}
                  onFocus={() => setShowPartyDropdown(true)}
                  placeholder={`Search ${isSales ? 'customer' : 'supplier'}...`}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.party ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors`}
                />
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                
                {showPartyDropdown && filteredParties.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-48 overflow-auto">
                    {filteredParties.map((party) => (
                      <button
                        key={party.id}
                        type="button"
                        onClick={() => {
                          setPartyId(party.id);
                          setPartySearch('');
                          setShowPartyDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">{party.name}</span>
                        <span className="text-sm text-gray-500">Balance: Rs. {party.balance.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.party && <p className="text-red-500 text-xs mt-1">{errors.party}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline w-4 h-4 mr-1.5" />
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline w-4 h-4 mr-1.5" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FiPackage className="inline w-4 h-4 mr-1.5" />
                Items
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <FiPlus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Item Name</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Rate</div>
                <div className="col-span-1 text-center">Tax %</div>
                <div className="col-span-2 text-center">Discount</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="0.00"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.tax || ''}
                        onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="0.00"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-1 text-right font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      Rs. {item.total.toLocaleString()}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {errors.items && <p className="text-red-500 text-xs mt-2">{errors.items}</p>}
          </div>

          {/* Totals & Payment Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiFileText className="inline w-4 h-4 mr-1.5" />
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any additional notes..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />

              {/* Payment Mode */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Payment Mode
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setPaymentMode(mode.value as PaymentMode)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1.5 ${
                        paymentMode === mode.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Rs. {totals.subtotal.toLocaleString()}</span>
                </div>
                
                {/* Additional Tax */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Additional Tax</span>
                    <input
                      type="number"
                      value={additionalTax}
                      onChange={(e) => setAdditionalTax(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-center"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">+ Rs. {((totals.subtotal * additionalTax) / 100).toLocaleString()}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <input
                      type="number"
                      value={additionalDiscount || ''}
                      onChange={(e) => setAdditionalDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-center"
                      placeholder="0"
                    />
                  </div>
                  <span className="font-medium text-red-600">- Rs. {additionalDiscount.toLocaleString()}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Total Amount</span>
                    <span className={isSales ? 'text-emerald-600' : 'text-blue-600'}>Rs. {totals.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Paid Amount */}
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Rs.</span>
                    <input
                      type="number"
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      max={totals.totalAmount}
                      className="w-28 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-right font-semibold"
                    />
                  </div>
                </div>

                {/* Balance */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Balance Due</span>
                  <span className={`font-bold ${balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Rs. {balanceAmount.toLocaleString()}
                  </span>
                </div>

                {/* Payment Status Badge */}
                <div className="flex justify-end pt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    paymentStatus === 'paid' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : paymentStatus === 'partial'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {paymentStatus === 'paid' ? '✓ Fully Paid' : paymentStatus === 'partial' ? '◐ Partially Paid' : '○ Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={`${isSales ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update' : 'Save'} {isSales ? 'Invoice' : 'Bill'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
