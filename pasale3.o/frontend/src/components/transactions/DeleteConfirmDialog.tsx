import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Transaction',
  message = 'Are you sure you want to delete this transaction? This action cannot be undone.',
  itemName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FiAlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-2">{message}</p>
            {itemName && (
              <p className="font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg inline-block">
                {itemName}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
