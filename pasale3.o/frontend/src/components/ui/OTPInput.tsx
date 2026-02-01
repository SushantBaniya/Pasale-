import React, { useRef, useEffect } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, digit: string) => {
    if (digit.length > 1) return; // Only allow single digit

    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('').slice(0, length);
    onChange(updatedValue);

    // Move to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    onChange(pastedData);
    if (pastedData.length === length) {
      inputRefs.current[length - 1]?.focus();
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`
              w-12 h-12 text-center text-xl font-semibold
              border-2 rounded-lg
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              border-gray-300 dark:border-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all
              ${error ? 'border-red-500 dark:border-red-500' : ''}
            `}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

