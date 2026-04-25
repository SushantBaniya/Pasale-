import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import {
  FiX,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
} from 'react-icons/fi';
import { useTranslation } from '../../utils/i18n';

interface AddNewDialogProps {
  onClose: () => void;
}

export const AddNewDialog: React.FC<AddNewDialogProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    type: 'customer' as 'customer' | 'counter',
    counterNumber: '1',
    description: '',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    const queryParams = new URLSearchParams({
      name: formData.name.trim(),
      type: formData.type,
      counter: formData.type === 'counter' ? formData.counterNumber : '',
      description: formData.description,
    }).toString();

    onClose();
    navigate(`/order-cart?${queryParams}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="p-4 text-white bg-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <FiPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Add New</h2>
                <p className="text-white/80 text-xs mt-0.5">Fill in the details below</p>
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
          {success ? (
            <div className="py-8 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
              <p className="text-gray-500 dark:text-gray-400">Entry has been added successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'customer' })}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      formData.type === 'customer'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'counter' })}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      formData.type === 'counter'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    Counter
                  </button>
                </div>
              </div>

              {formData.type === 'counter' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Counter Number
                  </label>
                  <div className="relative">
                    <select
                      value={formData.counterNumber}
                      onChange={(e) => setFormData({ ...formData, counterNumber: e.target.value })}
                      className="w-full pl-4 pr-10 py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600 appearance-none"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          Counter {n}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600 resize-none"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2 text-sm">
                  <FiAlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Submit
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};
