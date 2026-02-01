import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCamera } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on input when component mounts
    if (inputRef.current && scanMode === 'manual') {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualScan(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiX className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <FiCamera className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Scan Barcode</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Use a USB barcode scanner or enter the barcode manually
          </p>
        </div>
        

        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-3">
            <Button
              variant={scanMode === 'manual' ? 'primary' : 'outline'}
              className="flex-1"
              onClick={() => setScanMode('manual')}
            >
              Manual Entry
            </Button>
            <Button
              variant={scanMode === 'camera' ? 'primary' : 'outline'}
              className="flex-1"
              onClick={() => setScanMode('camera')}
            >
              Camera Scan
            </Button>
          </div>

          {scanMode === 'manual' && (
            <form onSubmit={handleManualScan} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Enter Barcode
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scan or type barcode..."
                  className="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full py-3 text-lg font-semibold">
                Add Product
              </Button>
            </form>
          )}

          {scanMode === 'camera' && (
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                <div className="border-4 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-12">
                  <FiCamera className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Camera scanning requires additional libraries
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Use manual entry or USB barcode scanner for now
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setScanMode('manual')}
              >
                Switch to Manual Entry
              </Button>
            </div>
          )}
        </div>

        {/* Scanner Help */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            💡 How to scan:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Enter the product barcode/SKU from your inventory</li>
            <li>• Use a USB barcode scanner for faster input</li>
            <li>• Products must be added to inventory first</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
