import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'classic' | 'dark';
export type Language = 'en' | 'np';
export type Currency = 'NPR' | 'INR' | 'USD';
export type CurrencyPosition = 'start' | 'end';
export type CalendarType = 'AD' | 'BS';
export type DateFormat = 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'BS';
export type TimeFormat = '12h' | '24h';
export type NumberFormat = 'international' | 'indian';

export interface GeneralSettings {
  appearance: Theme;
  language: Language;
  currency: Currency;
  currencyPosition: CurrencyPosition;
  calendarType: CalendarType;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  numberFormat: NumberFormat;
  privacyMode: boolean;
  appLock: boolean;
  appLockPin?: string;
}

export interface BusinessProfile {
  businessName: string;
  businessContactNumber: string;
  businessEmail: string;
  businessCategory: string;
  businessType: string;
  province: string;
  district: string;
  municipality: string;
  streetAddress: string;
  registrationNumber: string;
  bankAccounts: BankAccount[];
  businessLogo?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branch?: string;
  isPrimary: boolean;
}

export interface PartySettings {
  partyCategory: boolean;
  uploadPartyImage: boolean;
}

export interface InventorySettings {
  enableBarcode: boolean;
  enableSKU: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  enableCategories: boolean;
  trackCostPrice: boolean;
}

export interface TransactionSettings {
  autoGenerateInvoiceNumber: boolean;
  defaultPaymentMethod: string;
  enablePaymentReminders: boolean;
  reminderDays: number;
  showSignature: boolean;
  defaultNotes: string;
}

export interface InvoicePrintSettings {
  paperSize: 'A4' | 'A5' | 'thermal';
  showLogo: boolean;
  showBusinessDetails: boolean;
  showCustomerDetails: boolean;
  showPaymentInfo: boolean;
  footerText: string;
  printCopies: number;
}

export interface FeatureSettings {
  parties: PartySettings;
  inventory: InventorySettings;
  transactions: TransactionSettings;
  invoicePrint: InvoicePrintSettings;
}

export interface SubscriptionInfo {
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  expiryDate?: string;
  features: string[];
}

interface SettingsState {
  general: GeneralSettings;
  businessProfile: BusinessProfile;
  featureSettings: FeatureSettings;
  subscription: SubscriptionInfo;

  // Actions
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  updatePartySettings: (settings: Partial<PartySettings>) => void;
  updateInventorySettings: (settings: Partial<InventorySettings>) => void;
  updateTransactionSettings: (settings: Partial<TransactionSettings>) => void;
  updateInvoicePrintSettings: (settings: Partial<InvoicePrintSettings>) => void;
  addBankAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (id: string, account: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  resetSettings: () => void;
}

const defaultGeneralSettings: GeneralSettings = {
  appearance: 'dark',
  language: 'en',
  currency: 'NPR',
  currencyPosition: 'start',
  calendarType: 'BS',
  dateFormat: 'BS',
  timeFormat: '12h',
  numberFormat: 'indian',
  privacyMode: false,
  appLock: false,
};

const defaultBusinessProfile: BusinessProfile = {
  businessName: '',
  businessContactNumber: '',
  businessEmail: '',
  businessCategory: '',
  businessType: 'Retailer',
  province: '',
  district: '',
  municipality: '',
  streetAddress: '',
  registrationNumber: '',
  bankAccounts: [],
};

const defaultFeatureSettings: FeatureSettings = {
  parties: {
    partyCategory: false,
    uploadPartyImage: true,
  },
  inventory: {
    enableBarcode: true,
    enableSKU: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    enableCategories: true,
    trackCostPrice: true,
  },
  transactions: {
    autoGenerateInvoiceNumber: true,
    defaultPaymentMethod: 'cash',
    enablePaymentReminders: true,
    reminderDays: 7,
    showSignature: false,
    defaultNotes: '',
  },
  invoicePrint: {
    paperSize: 'A4',
    showLogo: true,
    showBusinessDetails: true,
    showCustomerDetails: true,
    showPaymentInfo: true,
    footerText: 'Thank you for your business!',
    printCopies: 1,
  },
};

const defaultSubscription: SubscriptionInfo = {
  plan: 'free',
  features: ['Basic Inventory', 'Basic Billing', 'Basic Reports'],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      general: defaultGeneralSettings,
      businessProfile: defaultBusinessProfile,
      featureSettings: defaultFeatureSettings,
      subscription: defaultSubscription,

      updateGeneralSettings: (settings) =>
        set((state) => ({
          general: { ...state.general, ...settings },
        })),

      updateBusinessProfile: (profile) =>
        set((state) => ({
          businessProfile: { ...state.businessProfile, ...profile },
        })),

      updatePartySettings: (settings) =>
        set((state) => ({
          featureSettings: {
            ...state.featureSettings,
            parties: { ...state.featureSettings.parties, ...settings },
          },
        })),

      updateInventorySettings: (settings) =>
        set((state) => ({
          featureSettings: {
            ...state.featureSettings,
            inventory: { ...state.featureSettings.inventory, ...settings },
          },
        })),

      updateTransactionSettings: (settings) =>
        set((state) => ({
          featureSettings: {
            ...state.featureSettings,
            transactions: { ...state.featureSettings.transactions, ...settings },
          },
        })),

      updateInvoicePrintSettings: (settings) =>
        set((state) => ({
          featureSettings: {
            ...state.featureSettings,
            invoicePrint: { ...state.featureSettings.invoicePrint, ...settings },
          },
        })),

      addBankAccount: (account) =>
        set((state) => ({
          businessProfile: {
            ...state.businessProfile,
            bankAccounts: [
              ...state.businessProfile.bankAccounts,
              { ...account, id: Date.now().toString() },
            ],
          },
        })),

      updateBankAccount: (id, account) =>
        set((state) => ({
          businessProfile: {
            ...state.businessProfile,
            bankAccounts: state.businessProfile.bankAccounts.map((acc) =>
              acc.id === id ? { ...acc, ...account } : acc
            ),
          },
        })),

      deleteBankAccount: (id) =>
        set((state) => ({
          businessProfile: {
            ...state.businessProfile,
            bankAccounts: state.businessProfile.bankAccounts.filter(
              (acc) => acc.id !== id
            ),
          },
        })),

      resetSettings: () =>
        set({
          general: defaultGeneralSettings,
          businessProfile: defaultBusinessProfile,
          featureSettings: defaultFeatureSettings,
          subscription: defaultSubscription,
        }),
    }),
    {
      name: 'pasale-settings',
    }
  )
);
