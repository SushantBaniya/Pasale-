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
  FiSend,
  FiClock,
} from 'react-icons/fi';
import {
  TransactionItem,
  generateTransactionNumber,
  calculateTransactionTotals,
} from './types';

interface QuotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
  onSuccess?: () => void;
}

export const QuotationDialog: React.FC<QuotationDialogProps> = ({
  isOpen,
  onClose,
  editData,
  onSuccess,
}) => {
  const { parties, addTransaction, updateTransaction } = useDataStore();
  const isEdit = !!editData;

  // Form State
  const [partyId, setPartyId] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { id: '1', name: '', quantity: 1, rate: 0, price: 0, tax: 0, discount: 0, total: 0 },
  ]);
  const [additionalTax, setAdditionalTax] = useState(13);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter parties - quotations are usually for customers
  const filteredParties = parties.filter(p => {
    const matchesType = p.type === 'customer';
    const matchesSearch = p.name.toLowerCase().includes(partySearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedParty = parties.find(p => p.id === partyId);

  // Calculate totals
  const totals = calculateTransactionTotals(items, additionalTax, additionalDiscount);

  // Generate quotation number and set default validity
  useEffect(() => {
    if (!isEdit) {
      setQuotationNumber(generateTransactionNumber('quotation'));
      // Default validity: 30 days from now
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 30);
      setValidUntil(validDate.toISOString().split('T')[0]);
    }
  }, [isEdit]);

  // Load edit data
  useEffect(() => {
    if (editData) {
      setPartyId(editData.partyId || '');
      setDate(editData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setValidUntil(editData.validUntil?.split('T')[0] || '');
      setQuotationNumber(editData.transactionNumber || '');
      setItems(editData.items?.length ? editData.items : [
        { id: '1', name: '', quantity: 1, rate: 0, tax: 0, discount: 0, total: 0 },
      ]);
      setNotes(editData.notes || '');
      setTerms(editData.terms || '');
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
      newErrors.party = 'Please select a customer';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!validUntil) {
      newErrors.validUntil = 'Validity date is required';
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
        type: 'quotation' as const,
        transactionNumber: quotationNumber,
        date: new Date(date).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        partyId,
        partyName: selectedParty?.name,
        partyType: selectedParty?.type,
        items: validItems,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        balanceAmount: totals.totalAmount,
        paymentStatus: 'draft' as const,
        notes,
        terms,
        createdAt: editData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        updateTransaction(editData.id, {
          type: 'quotation',
          amount: totals.totalAmount,
          date: transactionData.date,
          description: `Quotation - ${quotationNumber}`,
          partyId,
          partyName: selectedParty?.name,
          items: validItems.map(item => ({ ...item, price: item.rate })),
        });
      } else {
        addTransaction({
          id: transactionData.id,
          type: 'quotation',
          amount: totals.totalAmount,
          date: transactionData.date,
          description: `Quotation - ${quotationNumber}`,
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
      setErrors({ submit: 'Failed to save quotation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">
                  {isEdit ? 'Edit' : 'Create'} Quotation
                </h2>
                <p className="text-white/80 text-sm">{quotationNumber}</p>
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
            <span className="font-medium">Quotation saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Customer & Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Customer Selection */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiUser className="inline w-4 h-4 mr-1.5" />
                Customer *
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
                  placeholder="Search customer..."
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

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline w-4 h-4 mr-1.5" />
                Quotation Date *
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

            {/* Valid Until */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiClock className="inline w-4 h-4 mr-1.5" />
                Valid Until *
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.validUntil ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors`}
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
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Item Name</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Rate</div>
                <div className="col-span-1 text-center">Tax %</div>
                <div className="col-span-2 text-center">Discount</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Item/Service name"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                      />
                    </div>
                    <div className="col-span-1">
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
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.tax || ''}
                        onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="0.00"
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-center"
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

          {/* Notes & Totals Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Notes & Terms */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiFileText className="inline w-4 h-4 mr-1.5" />
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes for the customer..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  placeholder="Payment terms, delivery conditions, etc..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Rs. {totals.subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
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

                <div className="border-t border-purple-200 dark:border-purple-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Quote Total</span>
                    <span className="text-purple-600">Rs. {totals.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-400 text-sm">
                    <FiClock className="w-4 h-4" />
                    <span>Valid for {validUntil ? Math.ceil((new Date(validUntil).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)) : 30} days</span>
                  </div>
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
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSend className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update' : 'Create'} Quotation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
