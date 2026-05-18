import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCamera, FiInfo } from 'react-icons/fi';
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
          className="absolute top-4 right-4 p-2 hover:#F8FAFC dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiX className="w-6 h-6 #475569 dark:text-[#44454F]" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F2DD50] dark:bg-[#F2DD50] rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <FiCamera className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-medium #1E293B dark:text-[#EAE5DF] mb-2">Scan Barcode</h2>
          <p className="#475569 dark:text-[#44454F]">
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
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-[#64748B]">
                  Enter Barcode
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scan or type barcode..."
                  className="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-[#15161C] #1E293B dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#F2DD50] focus:border-transparent transition-all text-center text-2xl font-mono"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full py-3 text-lg font-medium">
                Add Product
              </Button>
            </form>
          )}

          {scanMode === 'camera' && (
            <div className="space-y-4">
              <div className="#F8FAFC dark:bg-[#15161C] rounded-lg p-8 text-center">
                <div className="border-4 border-dashed border-gray-400 dark:border-[#2A2B36] rounded-lg p-12">
                  <FiCamera className="w-16 h-16 mx-auto text-gray-400 dark:#475569 mb-4" />
                  <p className="#475569 dark:text-[#44454F]">
                    Camera scanning requires additional libraries
                  </p>
                  <p className="text-sm #475569 dark:#475569 mt-2">
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
        <div className="mt-6 p-4 bg-[#F1F5F9] dark:bg-[#F2DD50]/15 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1.5">
            <FiInfo className="w-4 h-4" />
            How to scan:
          </p>
          <ul className="text-xs #475569 dark:text-[#44454F] space-y-1">
            <li> Enter the product barcode/SKU from your inventory</li>
            <li> Use a USB barcode scanner for faster input</li>
            <li> Products must be added to inventory first</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
