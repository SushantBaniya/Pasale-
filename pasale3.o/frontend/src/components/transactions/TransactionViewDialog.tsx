import React from 'react';
import {
  FiX,
  FiCalendar,
  FiUser,
  FiHash,
  FiFileText,
  FiPackage,
  FiCreditCard,
  FiPrinter,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { TRANSACTION_TYPE_CONFIG, STATUS_CONFIG, TransactionType, PaymentStatus } from './types';

interface TransactionViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onEdit?: () => void;
  onPrint?: () => void;
}

export const TransactionViewDialog: React.FC<TransactionViewDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onPrint,
}) => {
  if (!isOpen || !transaction) return null;

  const type = transaction.type as TransactionType;
  const typeConfig = TRANSACTION_TYPE_CONFIG[type] || TRANSACTION_TYPE_CONFIG.selling;
  const status = (transaction.paymentStatus || 'paid') as PaymentStatus;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.paid;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'unpaid':
        return <FiXCircle className="w-4 h-4" />;
      case 'partial':
        return <FiClock className="w-4 h-4" />;
      case 'overdue':
        return <FiAlertCircle className="w-4 h-4" />;
      default:
        return <FiFileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${
          type === 'selling' || type === 'payment_in' ? 'from-emerald-600 to-emerald-700' :
          type === 'purchase' || type === 'payment_out' ? 'from-blue-600 to-blue-700' :
          type === 'expense' ? 'from-rose-600 to-rose-700' :
          type === 'income' ? 'from-teal-600 to-teal-700' :
          type === 'quotation' ? 'from-purple-600 to-purple-700' :
          'from-gray-600 to-gray-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">
                  Transaction Details
                </h2>
                <p className="text-white/80 text-sm">{transaction.transactionNumber || transaction.id}</p>
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
          {/* Type & Status Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${typeConfig.lightBg} ${typeConfig.textColor}`}>
              {typeConfig.label}
            </span>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {getStatusIcon(status)}
              {statusConfig.label}
            </span>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Transaction Number */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <FiHash className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transaction Number</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {transaction.transactionNumber || transaction.id || '-'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <FiCalendar className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(transaction.date)}
                  </p>
                  {transaction.dueDate && (
                    <p className="text-sm text-gray-500">Due: {formatDate(transaction.dueDate)}</p>
                  )}
                </div>
              </div>

              {/* Party */}
              {transaction.partyName && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <FiUser className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.partyType === 'customer' ? 'Customer' : 'Supplier'}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {transaction.partyName}
                    </p>
                  </div>
                </div>
              )}

              {/* Category (for expense/income) */}
              {transaction.category && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <FiPackage className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {transaction.category}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Mode */}
              {transaction.paymentMode && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <FiCreditCard className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Payment Mode</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {transaction.paymentMode}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Amount Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Amount Summary</h3>
              
              <div className="space-y-3">
                {transaction.subtotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Rs. {(transaction.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                )}

                {transaction.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      + Rs. {(transaction.taxAmount || 0).toLocaleString()}
                    </span>
                  </div>
                )}

                {transaction.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <span className="font-medium text-red-600">
                      - Rs. {(transaction.discountAmount || 0).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Total Amount</span>
                    <span className={typeConfig.textColor}>
                      Rs. {(transaction.totalAmount || transaction.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {transaction.paidAmount !== undefined && transaction.paidAmount !== transaction.totalAmount && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Paid Amount</span>
                      <span className="font-medium text-green-600">
                        Rs. {(transaction.paidAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Balance Due</span>
                      <span className="font-bold text-red-600">
                        Rs. {(transaction.balanceAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          {transaction.items && transaction.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Items</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transaction.items.map((item: any, index: number) => (
                    <div key={index} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                      <div className="col-span-5 font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </div>
                      <div className="col-span-2 text-center text-gray-600 dark:text-gray-400">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-center text-gray-600 dark:text-gray-400">
                        Rs. {(item.rate || item.price || 0).toLocaleString()}
                      </div>
                      <div className="col-span-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                        Rs. {(item.total || (item.quantity * (item.rate || item.price || 0))).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes/Description */}
          {(transaction.notes || transaction.description) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {transaction.notes ? 'Notes' : 'Description'}
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300">
                  {transaction.notes || transaction.description}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button type="button" variant="outline" onClick={onEdit}>
                <FiEdit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onPrint && (
              <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onPrint}>
                <FiPrinter className="w-4 h-4 mr-2" />
                Print / Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
