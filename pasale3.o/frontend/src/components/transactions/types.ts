// Transaction Types and Interfaces for the Transaction Management System

// Use 'selling' for compatibility with existing dataStore
export type TransactionType = 
  | 'selling'  // 'sales' mapped to 'selling' for dataStore compatibility
  | 'purchase'
  | 'payment_in'
  | 'payment_out'
  | 'quotation'
  | 'sales_return'
  | 'purchase_return'
  | 'expense'
  | 'income';

export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'draft' | 'overdue';
export type PaymentMode = 'cash' | 'bank' | 'upi' | 'card' | 'cheque' | 'credit';

// TransactionItem compatible with dataStore
export interface TransactionItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;  // Required by dataStore
  rate: number;   // For display purposes (same as price)
  tax: number;
  discount: number;
  total: number;
  unit?: string;
  sku?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  transactionNumber: string;
  date: string;
  partyId?: string;
  partyName?: string;
  partyType?: 'customer' | 'supplier';
  items: TransactionItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  category?: string;
  description?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Form Data Types for Each Transaction Type
export interface SalesFormData {
  partyId: string;
  partyName: string;
  date: string;
  dueDate?: string;
  invoiceNumber: string;
  items: TransactionItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  notes?: string;
}

export interface PurchaseFormData {
  partyId: string;
  partyName: string;
  date: string;
  dueDate?: string;
  billNumber: string;
  items: TransactionItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  notes?: string;
}

export interface PaymentFormData {
  partyId: string;
  partyName: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  linkedInvoices?: string[];
}

export interface ExpenseFormData {
  category: string;
  amount: number;
  date: string;
  paymentMode: PaymentMode;
  description: string;
  referenceNumber?: string;
  isNecessary: boolean;
}

export interface IncomeFormData {
  category: string;
  amount: number;
  date: string;
  paymentMode: PaymentMode;
  description: string;
  referenceNumber?: string;
  partyId?: string;
  partyName?: string;
}

export interface QuotationFormData {
  partyId: string;
  partyName: string;
  date: string;
  validUntil: string;
  quotationNumber: string;
  items: TransactionItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
}

export interface ReturnFormData {
  originalInvoiceNumber: string;
  partyId: string;
  partyName: string;
  date: string;
  items: TransactionItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  reason: string;
  refundMode: PaymentMode;
  notes?: string;
}

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'salary', label: 'Salary & Wages', icon: '👥' },
  { value: 'inventory', label: 'Inventory', icon: '📦' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'food', label: 'Food & Beverages', icon: '🍽️' },
  { value: 'office', label: 'Office Supplies', icon: '📎' },
  { value: 'phone', label: 'Phone & Internet', icon: '📱' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'taxes', label: 'Taxes & Fees', icon: '📋' },
  { value: 'other', label: 'Other', icon: '📝' },
];

// Income Categories
export const INCOME_CATEGORIES = [
  { value: 'sales', label: 'Sales Revenue', icon: '💰' },
  { value: 'services', label: 'Service Income', icon: '🛠️' },
  { value: 'interest', label: 'Interest Income', icon: '📈' },
  { value: 'commission', label: 'Commission', icon: '💵' },
  { value: 'rental', label: 'Rental Income', icon: '🏢' },
  { value: 'dividend', label: 'Dividends', icon: '📊' },
  { value: 'refund', label: 'Refunds', icon: '↩️' },
  { value: 'other', label: 'Other Income', icon: '📦' },
];

// Payment Modes
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'credit', label: 'Credit', icon: '📋' },
];

// Transaction Type Config
export const TRANSACTION_TYPE_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  lightBg: string;
  icon: string;
  prefix: string;
}> = {
  selling: {
    label: 'Sales',
    color: 'emerald',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'shopping-cart',
    prefix: 'INV',
  },
  purchase: {
    label: 'Purchase',
    color: 'blue',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'package',
    prefix: 'PO',
  },
  payment_in: {
    label: 'Payment In',
    color: 'green',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'arrow-down-left',
    prefix: 'RCV',
  },
  payment_out: {
    label: 'Payment Out',
    color: 'red',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'arrow-up-right',
    prefix: 'PAY',
  },
  quotation: {
    label: 'Quotation',
    color: 'purple',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'file-text',
    prefix: 'QT',
  },
  sales_return: {
    label: 'Sales Return',
    color: 'orange',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600',
    lightBg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'rotate-ccw',
    prefix: 'SR',
  },
  purchase_return: {
    label: 'Purchase Return',
    color: 'amber',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'rotate-cw',
    prefix: 'PR',
  },
  expense: {
    label: 'Expense',
    color: 'rose',
    bgColor: 'bg-rose-500',
    textColor: 'text-rose-600',
    lightBg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: 'credit-card',
    prefix: 'EXP',
  },
  income: {
    label: 'Income',
    color: 'teal',
    bgColor: 'bg-teal-500',
    textColor: 'text-teal-600',
    lightBg: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'trending-up',
    prefix: 'INC',
  },
};

// Status Badge Config
export const STATUS_CONFIG = {
  paid: {
    label: 'Paid',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    icon: 'check-circle',
  },
  unpaid: {
    label: 'Unpaid',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    icon: 'x-circle',
  },
  partial: {
    label: 'Partial',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    icon: 'clock',
  },
  draft: {
    label: 'Draft',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'file',
  },
  overdue: {
    label: 'Overdue',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-700 dark:text-rose-400',
    icon: 'alert-circle',
  },
};

// Helper Functions
export const generateTransactionNumber = (type: TransactionType): string => {
  const config = TRANSACTION_TYPE_CONFIG[type] || TRANSACTION_TYPE_CONFIG.selling;
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${config.prefix}-${timestamp}${random}`;
};

export const calculateItemTotal = (item: Partial<TransactionItem>): number => {
  const quantity = item.quantity || 0;
  const rate = item.rate || 0;
  const tax = item.tax || 0;
  const discount = item.discount || 0;
  
  const subtotal = quantity * rate;
  const taxAmount = (subtotal * tax) / 100;
  const discountAmount = discount;
  
  return subtotal + taxAmount - discountAmount;
};

export const calculateTransactionTotals = (items: TransactionItem[], taxRate: number = 0, discountAmount: number = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const itemTaxTotal = items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.tax) / 100), 0);
  const additionalTax = (subtotal * taxRate) / 100;
  const taxAmount = itemTaxTotal + additionalTax;
  const totalAmount = subtotal + taxAmount - discountAmount;
  
  return {
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
  };
};
