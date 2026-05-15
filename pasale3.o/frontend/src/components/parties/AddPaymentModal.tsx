import React, { useState } from 'react';
import { FiX, FiCamera, FiCalendar } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { useTranslation } from '../../utils/i18n';
import { useDataStore } from '../../store/dataStore';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payment_in' | 'payment_out';
  defaultPartyId?: string;
}

export function AddPaymentModal({ isOpen, onClose, type, defaultPartyId }: AddPaymentModalProps) {
  const { t } = useTranslation();
  const { parties, addTransaction } = useDataStore();
  
  const [receiptNumber, setReceiptNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState(defaultPartyId || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const isPaymentIn = type === 'payment_in';
  const title = isPaymentIn ? 'Add Payment In' : 'Add Payment Out';
  const amountLabel = isPaymentIn ? 'Received Amount' : 'Paid Amount';
  const saveBtnColor = isPaymentIn ? 'bg-[#A3876A] hover:bg-[#8E7356]' : 'bg-red-500 hover:bg-red-600';

  const handleSave = (e: React.FormEvent, isSaveAndNew: boolean = false) => {
    e.preventDefault();
    if (!partyId || !amount) return;

    const party = parties.find(p => p.id === partyId);

    addTransaction({
      id: Date.now().toString(),
      type: type,
      amount: parseFloat(amount),
      date: date,
      description: remarks || `Payment ${isPaymentIn ? 'Received from' : 'Paid to'} ${party?.name || 'Party'}`,
      partyId: partyId,
      partyName: party?.name
    });

    if (isSaveAndNew) {
      setReceiptNumber('');
      setAmount('');
      setRemarks('');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#15161C] rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b #DDD7CC dark:border-[#1C1D24]">
          <h2 className="text-xl font-bold #1A1C20 dark:text-[#EAE5DF]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:#6B7280 dark:hover:text-gray-300 hover:#E3DDD2 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <form id="payment-form" onSubmit={(e) => handleSave(e, false)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#C8C3BC] mb-1">Receipt Number</label>
                  <span className="text-xs text-[#A3876A] font-medium">Manual</span>
                </div>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 #F4F0EA dark:bg-[#0D0E12] border #DDD7CC dark:border-[#1C1D24] rounded-lg focus:ring-2 focus:ring-[#A3876A] outline-none #1A1C20 dark:text-[#EAE5DF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#C8C3BC] mb-1">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 #F4F0EA dark:bg-[#0D0E12] border #DDD7CC dark:border-[#1C1D24] rounded-lg focus:ring-2 focus:ring-[#A3876A] outline-none #1A1C20 dark:text-[#EAE5DF]"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-[#C8C3BC] mb-1">Party Name</label>
                <span className="text-xs text-[#A3876A] font-medium">Rs. 0.00</span>
              </div>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                required
                className="w-full px-3 py-2 #F4F0EA dark:bg-[#0D0E12] border #DDD7CC dark:border-[#1C1D24] rounded-lg focus:ring-2 focus:ring-[#A3876A] outline-none #1A1C20 dark:text-[#EAE5DF]"
              >
                <option value="" disabled>Search for party</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#C8C3BC] mb-1">{amountLabel}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rs.</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 #F4F0EA dark:bg-[#0D0E12] border #DDD7CC dark:border-[#1C1D24] rounded-lg focus:ring-2 focus:ring-[#A3876A] outline-none #1A1C20 dark:text-[#EAE5DF]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#C8C3BC] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 #F4F0EA dark:bg-[#0D0E12] border #DDD7CC dark:border-[#1C1D24] rounded-lg focus:ring-2 focus:ring-[#A3876A] outline-none #1A1C20 dark:text-[#EAE5DF]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Digital Wallet">Digital Wallet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#C8C3BC] mb-1">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks here..."
                rows={3}
                className="w-full px-3 py-2 #F4F0EA dark:bg-[#0D0E12] border #DDD7CC dark:border-[#1C1D24] rounded-lg focus:ring-2 focus:ring-[#A3876A] outline-none #1A1C20 dark:text-[#EAE5DF] resize-none"
              />
            </div>

            <div>
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-[#2A2B36] rounded-lg text-gray-400 hover:text-[#A3876A] hover:border-[#A3876A] transition-colors"
              >
                <FiCamera className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t #DDD7CC dark:border-[#1C1D24] flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={(e) => handleSave(e, true)} className="flex-1 sm:flex-none">
            {isPaymentIn ? 'Save & New' : 'Cancel'}
          </Button>
          <button
            type="submit"
            form="payment-form"
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-white font-medium shadow-md transition-colors ${saveBtnColor}`}
          >
            {title}
          </button>
        </div>
      </div>
    </div>
  );
}
