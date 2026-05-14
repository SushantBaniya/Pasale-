import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from '../../utils/i18n';
import {
  FiX,
  FiUpload,
  FiPlus,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiFileText,
  FiTag,
  FiPaperclip,
  FiCheck,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiPackage,
  FiPercent,
  FiHash
} from 'react-icons/fi';
import { DynamicIcon } from '../ui/DynamicIcon';

export type TransactionMode = 'general' | 'payment_in' | 'payment_out' | 'purchase' | 'sales_return' | 'purchase_return' | 'quotation' | 'expense' | 'income';

interface AddTransactionDialogProps {
  onClose: () => void;
  initialType?: 'selling' | 'purchase' | 'expense';
  initialPartyId?: string;
  mode?: TransactionMode;
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  onClose,
  initialType,
  initialPartyId,
  mode = 'general',
}) => {
  const { t } = useTranslation();
  const { parties, addTransaction } = useDataStore();

  // Determine initial values based on mode
  const getInitialType = () => {
    switch (mode) {
      case 'payment_in':
      case 'purchase_return':
      case 'income':
        return 'income';
      case 'payment_out':
      case 'purchase':
      case 'sales_return':
      case 'expense':
        return 'expense';
      default:
        return initialType === 'selling' ? 'income' : 'expense';
    }
  };

  const [type, setType] = useState<'income' | 'expense'>(getInitialType());
  const [transactionType, setTransactionType] = useState<'selling' | 'purchase' | 'expense'>(
    mode === 'purchase' ? 'purchase' :
      mode === 'purchase_return' ? 'purchase' :
        mode === 'sales_return' ? 'selling' :
          initialType || 'selling'
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState(initialPartyId || '');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('13');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incomeCategories = [
    { value: 'sales', label: t('categories.sales'), icon: 'dollar-sign' },
    { value: 'services', label: t('categories.services'), icon: 'settings' },
    { value: 'interest', label: t('categories.interest'), icon: 'trending-up' },
    { value: 'other', label: t('categories.otherIncome'), icon: 'package' },
  ];

  const expenseCategories = [
    { value: 'office', label: t('categories.officeSupplies'), icon: 'paperclip' },
    { value: 'rent', label: t('categories.rent'), icon: 'home' },
    { value: 'utilities', label: t('categories.utilities'), icon: 'zap' },
    { value: 'transport', label: t('categories.transport'), icon: 'truck' },
    { value: 'marketing', label: t('categories.marketing'), icon: 'megaphone' },
    { value: 'salary', label: 'Salary & Wages', icon: 'users' },
    { value: 'inventory', label: 'Inventory', icon: 'package' },
    { value: 'other', label: t('categories.otherExpenses'), icon: 'clipboard' },
  ];

  const paymentMethods = [
    { value: 'cash', label: t('dialog.cash'), icon: 'dollar-sign' },
    { value: 'bank', label: t('dialog.bankTransfer'), icon: 'landmark' },
    { value: 'card', label: t('dialog.card'), icon: 'credit-card' },
    { value: 'cheque', label: t('dialog.cheque'), icon: 'file-text' },
    { value: 'digital', label: t('dialog.digitalWallet'), icon: 'smartphone' },
  ];

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = t('validation.minValue').replace('{0}', '0');
    }
    if (!date) {
      newErrors.date = t('validation.required');
    }
    if (!category) {
      newErrors.category = t('validation.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const discountAmount = parseFloat(discount) || 0;
    const taxRate = parseFloat(tax) || 0;
    const afterDiscount = baseAmount - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    return afterDiscount + taxAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    addTransaction({
      id: Date.now().toString(),
      type: transactionType,
      amount: calculateTotal(),
      date: new Date(date).toISOString(),
      description: notes || `${category} - ${transactionType} transaction`,
      partyId: partyId || undefined,
      partyName: partyId ? parties.find((p) => p.id === partyId)?.name : undefined,
    });

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl p-0 relative my-4 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-4 text-white ${type === 'income' ? 'bg-linear-to-r from-[#D4623A] to-blue-700' : 'bg-linear-to-r from-red-600 to-red-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                {type === 'income' ? <FiTrendingUp className="w-5 h-5" /> : <FiTrendingDown className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {mode === 'payment_in' ? 'Payment In' :
                    mode === 'payment_out' ? 'Payment Out' :
                      mode === 'quotation' ? 'New Quotation' :
                        mode === 'sales_return' ? 'Sales Return' :
                          mode === 'purchase_return' ? 'Purchase Return' :
                            mode === 'purchase' ? 'New Purchase' :
                              t('dialog.addTransaction')}
                </h2>
                <p className="text-white/80 text-xs mt-0.5">
                  {mode !== 'general'
                    ? `Record a new ${mode.replace('_', ' ')}`
                    : `Record a new ${type === 'income' ? 'income' : 'expense'} transaction`}
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

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <FiCheck className="w-5 h-5" />
            </div>
            Transaction recorded successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Toggle - Only show for general mode */}
          {mode === 'general' && (
            <div className="flex gap-2 p-1 #EDE5DA dark:bg-[#1A1A1A] rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setTransactionType('selling');
                  setCategory('');
                }}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'income'
                  ? 'bg-[#D4623A] text-white shadow-md shadow-blue-500/30'
                  : '#8A7060 dark:text-[#555555] hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <FiTrendingUp className="w-4 h-4" />
                {t('dialog.income')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setTransactionType('expense');
                  setCategory('');
                }}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'expense'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                  : '#8A7060 dark:text-[#555555] hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <FiTrendingDown className="w-4 h-4" />
                {t('transactions.expenses')}
              </button>
            </div>
          )}

          {/* Transaction Sub-Type (for income) - Only show for general mode */}
          {type === 'income' && mode === 'general' && (
            <div className="bg-[#FDF1EC] dark:bg-[#D4623A]/15 p-3 rounded-lg border border-[#D4623A]/30 dark:border-[#D4623A]/50">
              <label className="text-xs font-semibold mb-2 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                <FiTag className="w-3.5 h-3.5" />
                {t('dialog.transactionType')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionType('selling')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5 ${transactionType === 'selling'
                    ? 'bg-[#D4623A] text-white border-blue-600 shadow-md'
                    : 'bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-[#CCCCCC] #E5D8CC dark:border-[#333333] hover:border-blue-400'
                    }`}
                >
                  <FiShoppingCart className="w-3.5 h-3.5" />
                  {t('dialog.sale')}
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('purchase')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5 ${transactionType === 'purchase'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-[#CCCCCC] #E5D8CC dark:border-[#333333] hover:border-purple-400'
                    }`}
                >
                  <FiPackage className="w-3.5 h-3.5" />
                  {t('transactions.purchases')}
                </button>
              </div>
            </div>
          )}

          {/* Main Form Grid - 3 column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Column 1: Amount, Date, Party, Reference */}
            <div className="space-y-4">
              {/* Amount */}
              <div className="#FAF7F3 dark:bg-[#1A1A1A]/50 p-3 rounded-xl">
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                  <span className="font-bold">रु</span>
                  {t('common.amount')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 #8A7060 font-bold text-sm">Rs.</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-12 pr-3 py-3 rounded-lg border-2 text-xl font-bold ${errors.amount
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : '#E5D8CC dark:border-[#333333] focus:border-[#D4623A]'
                      } bg-white dark:bg-[#222222] #3D2B1A dark:text-[#E0E0E0] focus:outline-none transition-colors`}
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  {t('common.date')} *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border-2 text-sm ${errors.date
                    ? 'border-red-500'
                    : '#E5D8CC dark:border-[#333333] focus:border-[#D4623A]'
                    } bg-white dark:bg-[#222222] #3D2B1A dark:text-[#E0E0E0] focus:outline-none transition-colors`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>

              {/* Party */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                    <FiUser className="w-3.5 h-3.5" />
                    {t('dialog.partyOptional')}
                  </label>
                  <a href="/parties" className="text-[10px] font-bold text-[#D4623A] dark:text-[#D4623A] hover:underline flex items-center gap-1">
                    <FiPlus className="w-3 h-3" />
                    {t('common.add')}
                  </a>
                </div>
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 #E5D8CC dark:border-[#333333] bg-white dark:bg-[#222222] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] transition-colors text-sm"
                >
                  <option value="">{t('dialog.none')}</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type === 'customer' ? t('parties.customer') : t('parties.supplier')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                  <FiHash className="w-3.5 h-3.5" />
                  Reference / Invoice No.
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., INV-001, REF-123"
                  className="w-full px-3 py-2.5 rounded-lg border-2 #E5D8CC dark:border-[#333333] bg-white dark:bg-[#222222] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Column 2: Category */}
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5" />
                  {t('category')} *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border-2 transition-all flex items-center gap-1.5 ${category === cat.value
                        ? type === 'income'
                          ? 'bg-[#D4623A] text-white border-blue-600'
                          : 'bg-red-600 text-white border-red-600'
                        : 'bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-[#CCCCCC] #E5D8CC dark:border-[#333333] hover:border-gray-400'
                        }`}
                    >
                      <DynamicIcon name={cat.icon} className="text-sm" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                  <FiCreditCard className="w-3.5 h-3.5" />
                  {t('dialog.paymentMethod')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border-2 transition-all flex items-center gap-1.5 ${paymentMethod === method.value
                        ? 'bg-gray-800 dark:#EDE5DA text-white dark:#3D2B1A border-gray-800 dark:#E5D8CC'
                        : 'bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-[#CCCCCC] #E5D8CC dark:border-[#333333] hover:border-gray-400'
                        }`}
                    >
                      <DynamicIcon name={method.icon} className="text-sm" />
                      <span className="truncate">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Discount, Tax, Notes */}
            <div className="space-y-4">
              {/* Discount & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                    <FiPercent className="w-3.5 h-3.5" />
                    Discount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-lg border-2 #E5D8CC dark:border-[#333333] bg-white dark:bg-[#222222] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC]">
                    Tax / VAT (%)
                  </label>
                  <select
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border-2 #E5D8CC dark:border-[#333333] bg-white dark:bg-[#222222] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] transition-colors text-sm"
                  >
                    <option value="0">No Tax</option>
                    <option value="13">13% VAT</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold mb-1.5 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                  <FiFileText className="w-3.5 h-3.5" />
                  {t('dialog.notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border-2 #E5D8CC dark:border-[#333333] bg-white dark:bg-[#222222] #3D2B1A dark:text-[#E0E0E0] focus:outline-none focus:border-[#D4623A] transition-colors resize-none text-sm"
                  placeholder={t('dialog.addNotes')}
                />
              </div>

              {/* Attachments - moved here */}
              <div className="#FAF7F3 dark:bg-[#1A1A1A]/50 p-3 rounded-xl">
                <label className="text-xs font-semibold mb-2 text-gray-700 dark:text-[#CCCCCC] flex items-center gap-1.5">
                  <FiPaperclip className="w-3.5 h-3.5" />
                  {t('dialog.attachments')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-[#333333] rounded-lg cursor-pointer hover:border-[#D4623A] hover:bg-[#FDF1EC] dark:hover:bg-[#D4623A]/15 transition-all">
                    <FiUpload className="w-4 h-4 #8A7060" />
                    <span className="text-xs font-medium #8A7060 dark:text-[#555555]">{t('dialog.uploadFiles')}</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-1.5 px-2 py-1.5 bg-[#FDF1EC] dark:bg-[#D4623A]/20 text-[#B8502E] dark:text-blue-300 rounded-lg">
                      <span className="text-xs truncate max-w-80px">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-[#D4623A] hover:text-[#B8502E]"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          {amount && (
            <div className={`p-3 rounded-xl ${type === 'income' ? 'bg-[#FDF1EC] dark:bg-[#D4623A]/15 border-2 border-[#D4623A]/30 dark:border-[#D4623A]/50' : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="#8A7060 dark:text-[#555555]">Subtotal:</span>
                    <span className="font-medium">Rs. {parseFloat(amount || '0').toLocaleString()}</span>
                  </div>
                  {discount && parseFloat(discount) > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <span>Discount:</span>
                      <span>-Rs. {parseFloat(discount).toLocaleString()}</span>
                    </div>
                  )}
                  {tax && parseFloat(tax) > 0 && (
                    <div className="flex items-center gap-2 #8A7060 dark:text-[#555555]">
                      <span>Tax ({tax}%):</span>
                      <span>+Rs. {(((parseFloat(amount || '0') - parseFloat(discount || '0')) * parseFloat(tax)) / 100).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold #3D2B1A dark:text-[#E0E0E0]">Total:</span>
                  <span className={`text-xl font-black ${type === 'income' ? 'text-[#D4623A]' : 'text-red-600'}`}>
                    Rs. {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t #E5D8CC dark:border-[#222222]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="px-5 py-2.5 text-sm"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className={`px-6 py-2.5 text-sm ${type === 'income' ? 'bg-[#D4623A] hover:bg-[#B8502E]' : 'bg-red-600 hover:bg-red-700'} text-white flex items-center gap-2`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiPlus className="w-4 h-4" />
                  {t('dialog.addTransaction')}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

