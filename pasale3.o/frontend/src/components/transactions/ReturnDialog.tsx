import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Button } from '../ui/Button';
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCheck,
  FiSearch,
  FiPackage,
  FiRotateCcw,
  FiRotateCw,
} from 'react-icons/fi';
import {
  TransactionItem,
  PaymentMode,
  PAYMENT_MODES,
  generateTransactionNumber,
  calculateTransactionTotals,
} from './types';

interface ReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sales_return' | 'purchase_return';
  editData?: any;
  onSuccess?: () => void;
}

export const ReturnDialog: React.FC<ReturnDialogProps> = ({
  isOpen,
  onClose,
  type,
  editData,
  onSuccess,
}) => {
  const { parties, addTransaction, updateTransaction } = useDataStore();
  const isEdit = !!editData;
  const isSalesReturn = type === 'sales_return';

  // Form State
  const [partyId, setPartyId] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [originalInvoice, setOriginalInvoice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnNumber, setReturnNumber] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { id: '1', name: '', quantity: 1, rate: 0, price: 0, tax: 0, discount: 0, total: 0 },
  ]);
  const [reason, setReason] = useState('');
  const [refundMode, setRefundMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter parties
  const filteredParties = parties.filter(p => {
    const matchesType = isSalesReturn ? p.type === 'customer' : p.type === 'supplier';
    const matchesSearch = p.name.toLowerCase().includes(partySearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedParty = parties.find(p => p.id === partyId);

  // Calculate totals
  const totals = calculateTransactionTotals(items, 0, 0);

  // Generate return number on mount
  useEffect(() => {
    if (!isEdit) {
      setReturnNumber(generateTransactionNumber(type));
    }
  }, [type, isEdit]);

  // Load edit data
  useEffect(() => {
    if (editData) {
      setPartyId(editData.partyId || '');
      setOriginalInvoice(editData.originalInvoiceNumber || '');
      setDate(editData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setReturnNumber(editData.transactionNumber || '');
      setItems(editData.items?.length ? editData.items : [
        { id: '1', name: '', quantity: 1, rate: 0, tax: 0, discount: 0, total: 0 },
      ]);
      setReason(editData.reason || '');
      setRefundMode(editData.paymentMode || 'cash');
      setNotes(editData.notes || '');
    }
  }, [editData]);

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
      newErrors.party = `Please select a ${isSalesReturn ? 'customer' : 'supplier'}`;
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!reason) {
      newErrors.reason = 'Please provide a reason for return';
    }

    if (items.length === 0 || items.every(item => !item.name)) {
      newErrors.items = 'At least one item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const validItems = items.filter(item => item.name);

      const transactionData = {
        id: editData?.id || Date.now().toString(),
        type: type,
        transactionNumber: returnNumber,
        originalInvoiceNumber: originalInvoice,
        date: new Date(date).toISOString(),
        partyId,
        partyName: selectedParty?.name,
        partyType: selectedParty?.type,
        items: validItems,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: 0,
        totalAmount: totals.totalAmount,
        paidAmount: totals.totalAmount,
        balanceAmount: 0,
        paymentStatus: 'paid' as const,
        paymentMode: refundMode,
        reason,
        notes,
        createdAt: editData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        updateTransaction(editData.id, {
          type: type,
          amount: totals.totalAmount,
          date: transactionData.date,
          description: `${isSalesReturn ? 'Sales' : 'Purchase'} Return - ${returnNumber}`,
          partyId,
          partyName: selectedParty?.name,
          items: validItems.map(item => ({ ...item, price: item.rate })),
        });
      } else {
        addTransaction({
          id: transactionData.id,
          type: type,
          amount: totals.totalAmount,
          date: transactionData.date,
          description: `${isSalesReturn ? 'Sales' : 'Purchase'} Return - ${returnNumber}`,
          partyId,
          partyName: selectedParty?.name,
          items: validItems.map(item => ({ ...item, price: item.rate })),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (error) {
      setErrors({ submit: 'Failed to save return' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`px-6 py-4 ${isSalesReturn ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 'bg-gradient-to-r from-amber-600 to-amber-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {isSalesReturn ? <FiRotateCcw className="w-5 h-5 text-white" /> : <FiRotateCw className="w-5 h-5 text-white" />}
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">
                  {isEdit ? 'Edit' : 'New'} {isSalesReturn ? 'Sales Return' : 'Purchase Return'}
                </h2>
                <p className="text-white/80 text-sm">{returnNumber}</p>
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
            <span className="font-medium">Return processed successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Party & Invoice Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Party Selection */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiUser className="inline w-4 h-4 mr-1.5" />
                {isSalesReturn ? 'Customer' : 'Supplier'} *
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
                  placeholder={`Search ${isSalesReturn ? 'customer' : 'supplier'}...`}
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
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">{party.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.party && <p className="text-red-500 text-xs mt-1">{errors.party}</p>}
            </div>

            {/* Original Invoice */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Original Invoice No.
              </label>
              <input
                type="text"
                value={originalInvoice}
                onChange={(e) => setOriginalInvoice(e.target.value)}
                placeholder="e.g., INV-123456"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline w-4 h-4 mr-1.5" />
                Return Date *
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
          </div>

          {/* Reason for Return */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reason for Return *
            </label>
            <div className="flex flex-wrap gap-2">
              {['Defective Product', 'Wrong Item', 'Quality Issue', 'Customer Changed Mind', 'Damaged in Transit', 'Other'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    reason === r
                      ? isSalesReturn
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FiPackage className="inline w-4 h-4 mr-1.5" />
                Items Being Returned
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <FiPlus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                <div className="col-span-5">Item Name</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Rate</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="0.00"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-center"
                      />
                    </div>
                    <div className="col-span-2 text-right font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      Rs. {item.total.toLocaleString()}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
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

          {/* Refund & Notes Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiFileText className="inline w-4 h-4 mr-1.5" />
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any additional notes..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />

              {/* Refund Mode */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Refund Mode
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_MODES.slice(0, 4).map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setRefundMode(mode.value as PaymentMode)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1.5 ${
                        refundMode === mode.value
                          ? isSalesReturn
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
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
            <div className={`p-5 rounded-xl border ${isSalesReturn ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Return Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Rs. {totals.subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax Amount</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Rs. {totals.taxAmount.toLocaleString()}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Refund Amount</span>
                    <span className={isSalesReturn ? 'text-orange-600' : 'text-amber-600'}>Rs. {totals.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Reason:</span> {reason || 'Not specified'}
                </p>
                {originalInvoice && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">Original Invoice:</span> {originalInvoice}
                  </p>
                )}
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
              className={`${isSalesReturn ? 'bg-orange-600 hover:bg-orange-700' : 'bg-amber-600 hover:bg-amber-700'} text-white px-6`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update' : 'Process'} Return
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
