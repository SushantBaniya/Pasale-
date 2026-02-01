import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Button } from '../ui/Button';
import {
  FiX,
  FiUser,
  FiCalendar,
  FiHash,
  FiFileText,
  FiCheck,
  FiSearch,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiDollarSign,
} from 'react-icons/fi';
import {
  PaymentMode,
  PAYMENT_MODES,
  generateTransactionNumber,
} from './types';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payment_in' | 'payment_out';
  editData?: any;
  onSuccess?: () => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  type,
  editData,
  onSuccess,
}) => {
  const { parties, addTransaction, updateTransaction } = useDataStore();
  const isEdit = !!editData;
  const isPaymentIn = type === 'payment_in';

  // Form State
  const [partyId, setPartyId] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter parties - payment in from customers, payment out to suppliers
  const filteredParties = parties.filter(p => {
    const matchesType = isPaymentIn ? p.type === 'customer' : p.type === 'supplier';
    const matchesSearch = p.name.toLowerCase().includes(partySearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedParty = parties.find(p => p.id === partyId);

  // Generate receipt number on mount
  useEffect(() => {
    if (!isEdit) {
      setReceiptNumber(generateTransactionNumber(type));
    }
  }, [type, isEdit]);

  // Load edit data
  useEffect(() => {
    if (editData) {
      setPartyId(editData.partyId || '');
      setDate(editData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setAmount(editData.totalAmount || editData.amount || 0);
      setPaymentMode(editData.paymentMode || 'cash');
      setReferenceNumber(editData.referenceNumber || '');
      setNotes(editData.notes || '');
      setReceiptNumber(editData.transactionNumber || '');
    }
  }, [editData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!partyId) {
      newErrors.party = `Please select a ${isPaymentIn ? 'customer' : 'supplier'}`;
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
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

      const transactionData = {
        id: editData?.id || Date.now().toString(),
        type: type,
        transactionNumber: receiptNumber,
        date: new Date(date).toISOString(),
        partyId,
        partyName: selectedParty?.name,
        partyType: selectedParty?.type,
        totalAmount: amount,
        paidAmount: amount,
        balanceAmount: 0,
        paymentStatus: 'paid' as const,
        paymentMode,
        referenceNumber,
        notes,
        items: [],
        subtotal: amount,
        taxAmount: 0,
        discountAmount: 0,
        createdAt: editData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        updateTransaction(editData.id, transactionData);
      } else {
        addTransaction({
          id: transactionData.id,
          type: isPaymentIn ? 'payment_in' : 'payment_out',
          amount: amount,
          date: transactionData.date,
          description: `${isPaymentIn ? 'Payment Received' : 'Payment Made'} - ${receiptNumber}`,
          partyId,
          partyName: selectedParty?.name,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (error) {
      setErrors({ submit: 'Failed to save payment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`px-6 py-4 ${isPaymentIn ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {isPaymentIn ? <FiArrowDownLeft className="w-5 h-5 text-white" /> : <FiArrowUpRight className="w-5 h-5 text-white" />}
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">
                  {isEdit ? 'Edit' : 'Record'} {isPaymentIn ? 'Payment In' : 'Payment Out'}
                </h2>
                <p className="text-white/80 text-sm">{receiptNumber}</p>
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
            <span className="font-medium">Payment recorded successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Party Selection */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FiUser className="inline w-4 h-4 mr-1.5" />
              {isPaymentIn ? 'Received From (Customer)' : 'Paid To (Supplier)'} *
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
                placeholder={`Search ${isPaymentIn ? 'customer' : 'supplier'}...`}
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
                      <span className={`text-sm ${party.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {party.balance >= 0 ? 'To Receive' : 'To Pay'}: Rs. {Math.abs(party.balance).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.party && <p className="text-red-500 text-xs mt-1">{errors.party}</p>}
            
            {/* Party Balance Info */}
            {selectedParty && (
              <div className={`mt-2 p-3 rounded-lg ${selectedParty.balance >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current Balance: </span>
                  <span className={`font-semibold ${selectedParty.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs. {Math.abs(selectedParty.balance).toLocaleString()} {selectedParty.balance >= 0 ? '(Receivable)' : '(Payable)'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FiDollarSign className="inline w-4 h-4 mr-1.5" />
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">Rs.</span>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={`w-full pl-14 pr-4 py-4 rounded-xl border-2 text-2xl font-bold ${
                  errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FiHash className="inline w-4 h-4 mr-1.5" />
                Reference No.
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., CHQ-123"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setPaymentMode(mode.value as PaymentMode)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                    paymentMode === mode.value
                      ? isPaymentIn
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className="text-xl">{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FiFileText className="inline w-4 h-4 mr-1.5" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional notes..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Summary */}
          <div className={`p-4 rounded-xl ${isPaymentIn ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isPaymentIn ? 'Amount to Receive' : 'Amount to Pay'}
                </p>
                <p className={`text-2xl font-bold ${isPaymentIn ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {amount.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaymentIn ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'}`}>
                {isPaymentIn ? <FiArrowDownLeft className={`w-6 h-6 ${isPaymentIn ? 'text-green-600' : 'text-red-600'}`} /> : <FiArrowUpRight className={`w-6 h-6 ${isPaymentIn ? 'text-green-600' : 'text-red-600'}`} />}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
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
              className={`${isPaymentIn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-6`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update' : 'Record'} Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
