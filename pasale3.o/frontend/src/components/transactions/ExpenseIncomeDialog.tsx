import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Button } from '../ui/Button';
import {
  FiX,
  FiCalendar,
  FiFileText,
  FiCheck,
  FiDollarSign,
  FiTag,
  FiToggleLeft,
  FiToggleRight,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  PaymentMode,
  PAYMENT_MODES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  generateTransactionNumber,
} from './types';

interface ExpenseIncomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'expense' | 'income';
  editData?: any;
  onSuccess?: () => void;
}

export const ExpenseIncomeDialog: React.FC<ExpenseIncomeDialogProps> = ({
  isOpen,
  onClose,
  type,
  editData,
  onSuccess,
}) => {
  const { addTransaction, updateTransaction, addExpense } = useDataStore();
  const isEdit = !!editData;
  const isExpense = type === 'expense';
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Form State
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [isNecessary, setIsNecessary] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Generate transaction number on mount
  useEffect(() => {
    if (!isEdit) {
      setTransactionNumber(generateTransactionNumber(type));
    }
  }, [type, isEdit]);

  // Load edit data
  useEffect(() => {
    if (editData) {
      setCategory(editData.category || '');
      setAmount(editData.totalAmount || editData.amount || 0);
      setDate(editData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setPaymentMode(editData.paymentMode || 'cash');
      setDescription(editData.description || editData.notes || '');
      setReferenceNumber(editData.referenceNumber || '');
      setTransactionNumber(editData.transactionNumber || '');
      setIsNecessary(editData.isNecessary !== false);
    }
  }, [editData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!date) {
      newErrors.date = 'Date is required';
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

      const categoryLabel = categories.find(c => c.value === category)?.label || category;

      const transactionData = {
        id: editData?.id || Date.now().toString(),
        type: type,
        transactionNumber,
        date: new Date(date).toISOString(),
        category,
        description: description || `${categoryLabel} ${isExpense ? 'expense' : 'income'}`,
        totalAmount: amount,
        paidAmount: amount,
        balanceAmount: 0,
        paymentStatus: 'paid' as const,
        paymentMode,
        referenceNumber,
        isNecessary,
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
          type: isExpense ? 'expense' : 'income',
          amount: amount,
          date: transactionData.date,
          description: transactionData.description,
        });

        // Also add to expenses store if it's an expense
        if (isExpense) {
          addExpense({
            id: transactionData.id,
            category: categoryLabel,
            amount,
            date: transactionData.date,
            description: transactionData.description,
            isNecessary,
          });
        }
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`px-6 py-4 ${isExpense ? 'bg-gradient-to-r from-rose-600 to-rose-700' : 'bg-gradient-to-r from-teal-600 to-teal-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {isExpense ? <FiTrendingDown className="w-5 h-5 text-white" /> : <FiTrendingUp className="w-5 h-5 text-white" />}
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">
                  {isEdit ? 'Edit' : 'Record'} {isExpense ? 'Expense' : 'Income'}
                </h2>
                <p className="text-white/80 text-sm">{transactionNumber}</p>
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
            <span className="font-medium">{isExpense ? 'Expense' : 'Income'} recorded successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FiTag className="inline w-4 h-4 mr-1.5" />
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                    category === cat.value
                      ? isExpense
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="truncate w-full text-center">{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
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
                Reference No.
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Mode
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.slice(0, 4).map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setPaymentMode(mode.value as PaymentMode)}
                  className={`flex-1 min-w-24 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMode === mode.value
                      ? isExpense
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span>{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FiFileText className="inline w-4 h-4 mr-1.5" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={`Describe this ${isExpense ? 'expense' : 'income'}...`}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Necessary Toggle (for expenses only) */}
          {isExpense && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Necessary Expense?</p>
                <p className="text-sm text-gray-500">Mark if this is essential for business</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNecessary(!isNecessary)}
                className={`p-2 rounded-lg transition-colors ${isNecessary ? 'text-green-600' : 'text-gray-400'}`}
              >
                {isNecessary ? <FiToggleRight className="w-8 h-8" /> : <FiToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          )}

          {/* Summary */}
          <div className={`p-4 rounded-xl ${isExpense ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800' : 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isExpense ? 'Total Expense' : 'Total Income'}
                </p>
                <p className={`text-2xl font-bold ${isExpense ? 'text-rose-600' : 'text-teal-600'}`}>
                  Rs. {amount.toLocaleString()}
                </p>
                {category && (
                  <p className="text-sm text-gray-500 mt-1">
                    Category: {categories.find(c => c.value === category)?.label}
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isExpense ? 'bg-rose-100 dark:bg-rose-800' : 'bg-teal-100 dark:bg-teal-800'}`}>
                {isExpense ? <FiTrendingDown className={`w-6 h-6 text-rose-600`} /> : <FiTrendingUp className={`w-6 h-6 text-teal-600`} />}
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
              className={`${isExpense ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'} text-white px-6`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update' : 'Save'} {isExpense ? 'Expense' : 'Income'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
