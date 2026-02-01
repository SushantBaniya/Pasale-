import React, { useState, useEffect } from 'react';
import { FiX, FiPrinter, FiDownload } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Transaction, useDataStore } from '../../store/dataStore';
import { useLanguageStore } from '../../store/languageStore';
import { formatCurrency } from '../../utils/nepaliDate';

interface InvoiceDetailProps {
  invoice: Transaction | null;
  onClose: () => void;
  onUpdate?: () => void;  // Callback to refresh parent
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoice, onClose, onUpdate }) => {
  const { language } = useLanguageStore();
  const { updateTransaction, transactions } = useDataStore();
  
  // Get the latest version of the invoice from transactions
  const currentInvoice = invoice ? transactions.find(t => t.id === invoice.id) || invoice : null;
  const [isPaid, setIsPaid] = useState(currentInvoice?.description?.includes('[PAID]') || false);

  // Update isPaid when currentInvoice changes
  useEffect(() => {
    if (currentInvoice) {
      setIsPaid(currentInvoice.description?.includes('[PAID]') || false);
    }
  }, [currentInvoice]);

  if (!currentInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download functionality would be implemented here');
  };

  const handleMarkAsPaid = () => {
    if (isPaid) return;
    
    // Update the transaction with [PAID] marker
    const currentDesc = currentInvoice.description || '';
    const newDescription = currentDesc.includes('[PAID]') ? currentDesc : `[PAID] ${currentDesc}`;
    
    updateTransaction(currentInvoice.id, {
      description: newDescription,
    });
    
    setIsPaid(true);
    
    // Call onUpdate callback to refresh parent component
    if (onUpdate) {
      onUpdate();
    }
  };

  // Calculate totals
  const items = currentInvoice.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const tax = subtotal * 0.13; // 13% VAT
  const grandTotal = subtotal + tax;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getInvoiceStatus = (): 'Paid' | 'Unpaid' | 'Overdue' => {
    if (isPaid || currentInvoice.description?.includes('[PAID]')) return 'Paid';
    
    const invoiceDate = new Date(currentInvoice.date);
    const daysDiff = Math.floor((new Date().getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 30) return 'Overdue';
    return 'Unpaid';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:static print:bg-transparent">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:rounded-none print:shadow-none shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invoice Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 print:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Invoice ID</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentInvoice.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Issue Date</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {new Date(currentInvoice.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(getInvoiceStatus())}`}>
                {getInvoiceStatus()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {new Date(new Date(currentInvoice.date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Party Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Client Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name: {currentInvoice.partyName || 'Walk-in Customer'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Invoice ID: {currentInvoice.id}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date: {new Date(currentInvoice.date).toLocaleDateString()}</p>
            </Card>
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Invoice Summary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Items: {items.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amount: {formatCurrency(currentInvoice.amount, language)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status: {getInvoiceStatus()}</p>
            </Card>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Item Description</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Price</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      No items in this invoice
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.price, language)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.total, language)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div />
            <Card className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(subtotal, language)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">VAT (13%)</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(tax, language)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900 dark:text-gray-100">Total</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(grandTotal, language)}</span>
              </div>
            </Card>
          </div>

          {/* Notes */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentInvoice.description?.replace('[PAID]', '').trim() || 'No additional notes'}
            </p>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <FiPrinter className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <FiDownload className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={handleMarkAsPaid}
            disabled={isPaid}
            className={isPaid ? 'opacity-50 cursor-not-allowed' : 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white'}
          >
            {isPaid ? '✓ Paid' : 'Mark as Paid'}
          </Button>
        </div>
      </div>
    </div>
  );
};
