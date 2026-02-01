import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore, type Theme, type BankAccount } from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';
import {
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronRight,
  FiChevronDown,
  FiX,
  FiBriefcase,
  FiCreditCard,
  FiUsers,
  FiPackage,
  FiFileText,
  FiPrinter,
  FiArrowLeft,
  FiCheck,
  FiTrash2,
  FiEdit2,
  FiArchive,
} from 'react-icons/fi';

type SettingsSection = 'general' | 'my-account' | 'business-profile' | 'subscription' | 'parties' | 'inventory' | 'transactions' | 'invoice-print';

// Nepal Location Data
const provinces = [
  'Koshi Province',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province',
];

const districtsByProvince: Record<string, string[]> = {
  'Koshi Province': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh Province': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati Province': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki Province': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  'Lumbini Province': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Nawalparasi West', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
  'Karnali Province': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'],
  'Sudurpashchim Province': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
};

const businessCategories = [
  'Retail',
  'Wholesale',
  'Manufacturing',
  'Services',
  'Food & Beverage',
  'Clothing',
  'Electronics',
  'Pharmacy',
  'Hardware',
  'Grocery',
  'Other',
];

const businessTypes = ['Retailer', 'Wholesaler', 'Manufacturer', 'Distributor', 'Service Provider'];

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile, updateUserProfile, logout } = useAuthStore();
  const {
    general,
    businessProfile,
    featureSettings,
    updateGeneralSettings,
    updateBusinessProfile,
    updatePartySettings,
    updateInventorySettings,
    updateTransactionSettings,
    updateInvoicePrintSettings,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
  } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [featureSettingsExpanded, setFeatureSettingsExpanded] = useState(false);
  const [success, setSuccess] = useState('');
  const [dangerExpanded, setDangerExpanded] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branch: '',
    isPrimary: false,
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: userProfile.name || '',
    phone: userProfile.phone || '',
    email: userProfile.email || '',
    photo: userProfile.photo || null as string | null,
  });

  // Business profile form state
  const [businessForm, setBusinessForm] = useState({
    ...businessProfile,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessLogoRef = useRef<HTMLInputElement>(null);

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogout = () => {
    if (window.confirm(t('settings.logoutConfirm'))) {
      logout();
      navigate('/');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccountForm({ ...accountForm, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBusinessLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessForm({ ...businessForm, businessLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateAccount = () => {
    updateUserProfile({
      name: accountForm.name,
      phone: accountForm.phone,
      email: accountForm.email,
      photo: accountForm.photo,
    });
    showSuccessMessage('Account updated successfully!');
  };

  const handleUpdateBusinessProfile = () => {
    updateBusinessProfile(businessForm);
    showSuccessMessage('Business profile updated successfully!');
  };

  const handleSaveBankAccount = () => {
    if (editingBank) {
      updateBankAccount(editingBank.id, bankForm);
    } else {
      addBankAccount(bankForm);
    }
    setShowBankModal(false);
    setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false });
    setEditingBank(null);
    showSuccessMessage('Bank account saved successfully!');
  };

  const handleEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setBankForm({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountHolderName: bank.accountHolderName,
      branch: bank.branch || '',
      isPrimary: bank.isPrimary,
    });
    setShowBankModal(true);
  };

  const handleDeleteBank = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      deleteBankAccount(id);
      showSuccessMessage('Bank account deleted successfully!');
    }
  };

  const sidebarItems = [
    { id: 'general' as const, label: 'General', icon: FiSettings },
    { id: 'my-account' as const, label: 'My Account', icon: FiUser },
    { id: 'business-profile' as const, label: 'Business Profile', icon: FiBriefcase },
    { id: 'subscription' as const, label: 'Subscription', icon: FiCreditCard },
  ];

  const featureSettingsItems = [
    { id: 'parties' as const, label: 'Parties', icon: FiUsers },
    { id: 'inventory' as const, label: 'Inventory', icon: FiPackage },
    { id: 'transactions' as const, label: 'Transactions', icon: FiFileText },
    { id: 'invoice-print' as const, label: 'Invoice Print', icon: FiPrinter },
  ];

  // Toggle Switch Component
  const ToggleSwitch = ({ enabled, onChange, label, description }: { enabled: boolean; onChange: (val: boolean) => void; label: string; description?: string }) => (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
      <div>
        <p className="text-gray-900 dark:text-white font-medium">{label}</p>
        {description && <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );

  // Render General Settings
  const renderGeneralSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">General Settings</h2>

      {/* Appearance */}
      <Card className="p-6">
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Appearance</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Choose how the application looks to you.</p>
        <div className="flex gap-4">
          {(['light', 'classic', 'dark'] as Theme[]).map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => {
                setTheme(themeOption);
                updateGeneralSettings({ appearance: themeOption });
              }}
              className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${theme === themeOption ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <div className={`w-28 h-20 ${themeOption === 'light' ? 'bg-white' : themeOption === 'classic' ? 'bg-gray-700' : 'bg-gray-900'}`}>
                <div className={`h-4 ${themeOption === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`} />
                <div className="p-2">
                  <div className={`h-2 w-16 rounded ${themeOption === 'light' ? 'bg-gray-300' : 'bg-gray-700'}`} />
                  <div className={`h-2 w-12 rounded mt-1 ${themeOption === 'light' ? 'bg-gray-300' : 'bg-gray-700'}`} />
                </div>
              </div>
              {theme === themeOption && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <FiCheck className="w-4 h-4 text-white" />
                </div>
              )}
              <p className={`text-center py-2 text-sm font-medium ${theme === themeOption ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {themeOption === 'light' ? 'Light' : themeOption === 'classic' ? 'Classic' : 'Dark'}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Language */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Language</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Choose your preferred language.</p>
          </div>
          <select
            value={general.language}
            onChange={(e) => updateGeneralSettings({ language: e.target.value as 'en' | 'np' })}
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-transparent rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 font-medium transition-all"
          >
            <option value="en">🇺🇸 English</option>
            <option value="np">🇳🇵 नेपाली</option>
          </select>
        </div>
      </Card>

      {/* Currency */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Currency</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Select the currency for your business.</p>
          </div>
          <select
            value={general.currency}
            onChange={(e) => updateGeneralSettings({ currency: e.target.value as 'NPR' | 'INR' | 'USD' })}
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-transparent rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 font-medium transition-all"
          >
            <option value="NPR">Rs.</option>
            <option value="INR">₹</option>
            <option value="USD">$</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 font-medium">Currency Position</p>
          <select
            value={general.currencyPosition}
            onChange={(e) => updateGeneralSettings({ currencyPosition: e.target.value as 'start' | 'end' })}
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-transparent rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-600 font-medium transition-all"
          >
            <option value="start">Start</option>
            <option value="end">End</option>
          </select>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-medium">Calendar</h3>
            <p className="text-gray-400 text-sm">To adjust calendar type, choose from available options</p>
          </div>
          <div className="flex gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => updateGeneralSettings({ calendarType: 'AD' })}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${general.calendarType === 'AD' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
            >
              AD
            </button>
            <button
              onClick={() => updateGeneralSettings({ calendarType: 'BS' })}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${general.calendarType === 'BS' ? 'bg-emerald-500 text-white' : 'text-gray-400'}`}
            >
              BS
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400">Date Format</p>
          <select
            value={general.dateFormat}
            onChange={(e) => updateGeneralSettings({ dateFormat: e.target.value as any })}
            className="bg-gray-700 text-white border-gray-600 rounded-lg px-3 py-2"
          >
            <option value="BS">2082 Pou 17</option>
            <option value="YYYY-MM-DD">2026-01-01</option>
            <option value="DD-MM-YYYY">01-01-2026</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Time Format</p>
          <select
            value={general.timeFormat}
            onChange={(e) => updateGeneralSettings({ timeFormat: e.target.value as '12h' | '24h' })}
            className="bg-gray-700 text-white border-gray-600 rounded-lg px-3 py-2"
          >
            <option value="12h">6:17 AM</option>
            <option value="24h">06:17</option>
          </select>
        </div>
      </Card>

      {/* Number Format */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Number Format</h3>
            <p className="text-gray-400 text-sm">To adjust number format, choose from two preset options</p>
          </div>
          <select
            value={general.numberFormat}
            onChange={(e) => updateGeneralSettings({ numberFormat: e.target.value as 'international' | 'indian' })}
            className="bg-gray-700 text-white border-gray-600 rounded-lg px-3 py-2"
          >
            <option value="indian">10,00,000</option>
            <option value="international">1,000,000</option>
          </select>
        </div>
      </Card>

      {/* Privacy Mode */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <ToggleSwitch
          enabled={general.privacyMode}
          onChange={(val) => updateGeneralSettings({ privacyMode: val })}
          label="Privacy Mode"
          description="Hides business stats from homepage & item purchase price."
        />
      </Card>

      {/* App Lock */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <ToggleSwitch
          enabled={general.appLock}
          onChange={(val) => updateGeneralSettings({ appLock: val })}
          label="App Lock"
          description="Secure your business access with a lock screen"
        />
      </Card>
    </div>
  );

  // Render My Account Settings
  const renderMyAccountSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h2>

      <Card className="p-6">
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Basic Information</h3>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Your Name</label>
              <Input
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Your Phone Number</label>
              <div className="flex">
                <span className="bg-gray-200 dark:bg-gray-600 border-transparent rounded-l-xl px-4 py-2 text-gray-700 dark:text-gray-300 flex items-center text-sm font-medium">
                  🇳🇵 +977
                </span>
                <Input
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-l-none rounded-r-xl flex-1 focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Your Email</label>
              <Input
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                placeholder="Enter your Email"
                className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {accountForm.photo ? (
                <img
                  src={accountForm.photo}
                  alt="Profile"
                  className="w-28 h-28 rounded-lg object-cover bg-gray-700"
                />
              ) : (
                <div className="w-28 h-28 rounded-lg bg-gray-700 flex items-center justify-center">
                  <FiUser className="w-12 h-12 text-gray-500" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Change Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 font-semibold transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            Sign Out
          </button>
          <Button onClick={handleUpdateAccount} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all">
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );

  // Render Business Profile Settings
  const renderBusinessProfileSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Profile</h2>

      <Card className="p-6">
        {/* Basic Information */}
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-1">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Business Name</label>
                <Input
                  value={businessForm.businessName}
                  onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Business Contact Number</label>
                <Input
                  value={businessForm.businessContactNumber}
                  onChange={(e) => setBusinessForm({ ...businessForm, businessContactNumber: e.target.value })}
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Business Email</label>
                <Input
                  type="email"
                  value={businessForm.businessEmail}
                  onChange={(e) => setBusinessForm({ ...businessForm, businessEmail: e.target.value })}
                  placeholder="Enter your business email"
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Business Category</label>
                  <select
                    value={businessForm.businessCategory}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessCategory: e.target.value })}
                    className="w-full bg-gray-700 text-white border-gray-600 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {businessCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Business Type</label>
                  <select
                    value={businessForm.businessType}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessType: e.target.value })}
                    className="w-full bg-gray-700 text-white border-gray-600 rounded-lg px-3 py-2"
                  >
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-start">
            <div className="relative">
              {businessForm.businessLogo ? (
                <img
                  src={businessForm.businessLogo}
                  alt="Business Logo"
                  className="w-28 h-28 rounded-lg object-cover bg-gray-700"
                />
              ) : (
                <div className="w-28 h-28 rounded-lg bg-gray-700 flex items-center justify-center">
                  <FiBriefcase className="w-12 h-12 text-gray-500" />
                </div>
              )}
            </div>
            <button
              onClick={() => businessLogoRef.current?.click()}
              className="mt-4 px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Change Logo
            </button>
            <input
              ref={businessLogoRef}
              type="file"
              accept="image/*"
              onChange={handleBusinessLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Address Information */}
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6 pt-8 border-t border-gray-100 dark:border-gray-700">Address Details</h3>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Province</label>
            <select
              value={businessForm.province}
              onChange={(e) => setBusinessForm({ ...businessForm, province: e.target.value, district: '', municipality: '' })}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-transparent rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 font-medium transition-all"
            >
              <option value="">Select Province</option>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">District</label>
            <select
              value={businessForm.district}
              onChange={(e) => setBusinessForm({ ...businessForm, district: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-transparent rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 font-medium transition-all disabled:opacity-50"
              disabled={!businessForm.province}
            >
              <option value="">Select District</option>
              {businessForm.province && districtsByProvince[businessForm.province]?.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Municipality</label>
            <Input
              value={businessForm.municipality}
              onChange={(e) => setBusinessForm({ ...businessForm, municipality: e.target.value })}
              placeholder="Enter municipality"
              className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Street Address</label>
            <Input
              value={businessForm.streetAddress}
              onChange={(e) => setBusinessForm({ ...businessForm, streetAddress: e.target.value })}
              className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-medium"
            />
          </div>
        </div>

        {/* Financial Information */}
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-6 pt-8 border-t border-gray-100 dark:border-gray-700">Financial Information</h3>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Registration Number</label>
            <Input
              value={businessForm.registrationNumber}
              onChange={(e) => setBusinessForm({ ...businessForm, registrationNumber: e.target.value })}
              placeholder="Enter registration number"
              className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-400 text-sm font-medium mb-1.5">Bank Information</label>
            <button
              onClick={() => setShowBankModal(true)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-left text-blue-600 dark:text-blue-400 border border-transparent rounded-xl px-4 py-2.5 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-between font-semibold"
            >
              <span>{businessProfile.bankAccounts.length} Connected Accounts</span>
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <Button onClick={handleUpdateBusinessProfile} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all">
            Save Business Details
          </Button>
        </div>

        {/* Danger Area */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setDangerExpanded(!dangerExpanded)}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-red-500 font-bold flex items-center gap-2">
              <FiX className="w-5 h-5" />
              Critical Actions (Danger Zone)
            </span>
            {dangerExpanded ? <FiChevronDown className="w-5 h-5 text-gray-400" /> : <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />}
          </button>

          {dangerExpanded && (
            <div className="mt-4 space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Close Fiscal Year</p>
                  <p className="text-gray-400 text-sm">This business will be archived & a new profile will be created by carrying forward old balance as opening balance.</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <FiArchive className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Archive Business Profile</p>
                  <p className="text-gray-400 text-sm">This business profile will be inactive but you will be able to access all data in read-only mode.</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <FiTrash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 font-medium">Delete Business Profile</p>
                  <p className="text-gray-400 text-sm">Your business profile will be deleted permanently</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  // Render Subscription Settings
  const renderSubscriptionSettings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Subscription</h2>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCreditCard className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Free Plan</h3>
          <p className="text-gray-400 mb-4">You are currently on the free plan</p>
          <div className="bg-gray-700/50 rounded-lg p-4 max-w-md mx-auto mb-6">
            <h4 className="text-white font-medium mb-2">Included Features:</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>✓ Basic Inventory Management</li>
              <li>✓ Basic Billing & Invoicing</li>
              <li>✓ Basic Reports</li>
              <li>✓ Up to 100 Products</li>
              <li>✓ Up to 50 Parties</li>
            </ul>
          </div>
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Upgrade to Pro
          </Button>
        </div>
      </Card>
    </div>
  );

  // Render Party Settings
  const renderPartySettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Party Settings</h2>

      <Card className="p-4 space-y-4">
        <ToggleSwitch
          enabled={featureSettings.parties.partyCategory}
          onChange={(val) => updatePartySettings({ partyCategory: val })}
          label="Party Category"
          description="Enable Party Category to effortlessly manage parties"
        />
        <ToggleSwitch
          enabled={featureSettings.parties.uploadPartyImage}
          onChange={(val) => updatePartySettings({ uploadPartyImage: val })}
          label="Upload Party Image"
          description="Enable party image uploads to recognize parties easily"
        />
      </Card>
    </div>
  );

  // Render Inventory Settings
  const renderInventorySettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Settings</h2>

      <Card className="p-4 space-y-4">
        <ToggleSwitch
          enabled={featureSettings.inventory.enableBarcode}
          onChange={(val) => updateInventorySettings({ enableBarcode: val })}
          label="Enable Barcode"
          description="Scan and manage products using barcodes"
        />
        <ToggleSwitch
          enabled={featureSettings.inventory.enableSKU}
          onChange={(val) => updateInventorySettings({ enableSKU: val })}
          label="Enable SKU"
          description="Use Stock Keeping Units for product identification"
        />
        <ToggleSwitch
          enabled={featureSettings.inventory.lowStockAlert}
          onChange={(val) => updateInventorySettings({ lowStockAlert: val })}
          label="Low Stock Alert"
          description="Get notified when stock falls below threshold"
        />
        {featureSettings.inventory.lowStockAlert && (
          <div className="pl-4">
            <label className="block text-gray-400 text-sm mb-1">Low Stock Threshold</label>
            <Input
              type="number"
              value={featureSettings.inventory.lowStockThreshold}
              onChange={(e) => updateInventorySettings({ lowStockThreshold: parseInt(e.target.value) || 10 })}
              className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all w-32 font-medium"
            />
          </div>
        )}
        <ToggleSwitch
          enabled={featureSettings.inventory.enableCategories}
          onChange={(val) => updateInventorySettings({ enableCategories: val })}
          label="Enable Categories"
          description="Organize products into categories"
        />
        <ToggleSwitch
          enabled={featureSettings.inventory.trackCostPrice}
          onChange={(val) => updateInventorySettings({ trackCostPrice: val })}
          label="Track Cost Price"
          description="Record cost price for profit calculation"
        />
      </Card>
    </div>
  );

  // Render Transaction Settings
  const renderTransactionSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Settings</h2>

      <Card className="p-4 space-y-4">
        <ToggleSwitch
          enabled={featureSettings.transactions.autoGenerateInvoiceNumber}
          onChange={(val) => updateTransactionSettings({ autoGenerateInvoiceNumber: val })}
          label="Auto-generate Invoice Number"
          description="Automatically generate unique invoice numbers"
        />
        <div className="py-3 px-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Default Payment Method</p>
              <p className="text-gray-400 text-sm">Set the default payment method for transactions</p>
            </div>
            <select
              value={featureSettings.transactions.defaultPaymentMethod}
              onChange={(e) => updateTransactionSettings({ defaultPaymentMethod: e.target.value })}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-transparent rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-600 font-medium transition-all"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="credit">Credit</option>
            </select>
          </div>
        </div>
        <ToggleSwitch
          enabled={featureSettings.transactions.enablePaymentReminders}
          onChange={(val) => updateTransactionSettings({ enablePaymentReminders: val })}
          label="Payment Reminders"
          description="Send payment reminders for due invoices"
        />
        {featureSettings.transactions.enablePaymentReminders && (
          <div className="pl-4">
            <label className="block text-gray-400 text-sm mb-1">Reminder Days Before Due</label>
            <Input
              type="number"
              value={featureSettings.transactions.reminderDays}
              onChange={(e) => updateTransactionSettings({ reminderDays: parseInt(e.target.value) || 7 })}
              className="bg-gray-700 border-gray-600 text-white w-32"
            />
          </div>
        )}
        <ToggleSwitch
          enabled={featureSettings.transactions.showSignature}
          onChange={(val) => updateTransactionSettings({ showSignature: val })}
          label="Show Signature"
          description="Display signature field on invoices"
        />
      </Card>
    </div>
  );

  // Render Invoice Print Settings
  const renderInvoicePrintSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Print Settings</h2>

      <Card className="p-4 space-y-4">
        <div className="py-3 px-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Paper Size</p>
              <p className="text-gray-400 text-sm">Select the default paper size for printing</p>
            </div>
            <select
              value={featureSettings.invoicePrint.paperSize}
              onChange={(e) => updateInvoicePrintSettings({ paperSize: e.target.value as 'A4' | 'A5' | 'thermal' })}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-transparent rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-600 font-medium transition-all"
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="thermal">Thermal (80mm)</option>
            </select>
          </div>
        </div>
        <ToggleSwitch
          enabled={featureSettings.invoicePrint.showLogo}
          onChange={(val) => updateInvoicePrintSettings({ showLogo: val })}
          label="Show Logo"
          description="Display business logo on invoices"
        />
        <ToggleSwitch
          enabled={featureSettings.invoicePrint.showBusinessDetails}
          onChange={(val) => updateInvoicePrintSettings({ showBusinessDetails: val })}
          label="Show Business Details"
          description="Display business name, address, and contact"
        />
        <ToggleSwitch
          enabled={featureSettings.invoicePrint.showCustomerDetails}
          onChange={(val) => updateInvoicePrintSettings({ showCustomerDetails: val })}
          label="Show Customer Details"
          description="Display customer information on invoices"
        />
        <ToggleSwitch
          enabled={featureSettings.invoicePrint.showPaymentInfo}
          onChange={(val) => updateInvoicePrintSettings({ showPaymentInfo: val })}
          label="Show Payment Info"
          description="Display payment details and bank information"
        />
        <div className="py-3 px-4 bg-gray-800/50 rounded-lg">
          <label className="block text-white font-medium mb-1">Footer Text</label>
          <p className="text-gray-400 text-sm mb-2">Custom text to display at the bottom of invoices</p>
          <Input
            value={featureSettings.invoicePrint.footerText}
            onChange={(e) => updateInvoicePrintSettings({ footerText: e.target.value })}
            placeholder="Thank you for your business!"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        <div className="py-3 px-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Print Copies</p>
              <p className="text-gray-400 text-sm">Number of copies to print by default</p>
            </div>
            <Input
              type="number"
              min={1}
              max={5}
              value={featureSettings.invoicePrint.printCopies}
              onChange={(e) => updateInvoicePrintSettings({ printCopies: parseInt(e.target.value) || 1 })}
              className="bg-gray-700 border-gray-600 text-white w-20"
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'my-account':
        return renderMyAccountSettings();
      case 'business-profile':
        return renderBusinessProfileSettings();
      case 'subscription':
        return renderSubscriptionSettings();
      case 'parties':
        return renderPartySettings();
      case 'inventory':
        return renderInventorySettings();
      case 'transactions':
        return renderTransactionSettings();
      case 'invoice-print':
        return renderInvoicePrintSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Success Message */}
      {success && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm font-medium animate-in slide-in-from-top duration-300">
          <FiCheck className="inline-block w-4 h-4 mr-2" />
          {success}
        </div>
      )}

      <div className="flex flex-col lg:flex-row h-full relative">
        {/* Glassmorphism Sidebar */}
        <div className="w-full lg:w-72 lg:min-h-screen bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-gray-200/50 dark:border-gray-700/50 p-6 flex flex-col shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3 mb-8 group">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
          </div>

          <nav className="flex-1 space-y-1 relative">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setFeatureSettingsExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-left relative overflow-hidden group/item ${isActive
                    ? 'text-white shadow-xl shadow-blue-500/25 active:scale-101'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/40 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  {/* Active Background Glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 animate-in fade-in zoom-in-95 duration-500" />
                  )}

                  {/* Hover Indicator */}
                  {!isActive && (
                    <div className="absolute inset-y-2 left-0 w-1 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-100 transition-all duration-300 -translate-x-1 group-hover/item:translate-x-0" />
                  )}

                  <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/item:scale-110'}`} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700/50">
              <button
                onClick={() => setFeatureSettingsExpanded(!featureSettingsExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-left group/feat ${featureSettingsExpanded || ['parties', 'inventory', 'transactions', 'invoice-print'].includes(activeSection)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/40 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <FiSettings className={`w-5 h-5 transition-transform duration-500 ${featureSettingsExpanded ? 'rotate-90' : 'group-hover/feat:rotate-45'}`} />
                  <span>Feature Settings</span>
                </div>
                {featureSettingsExpanded ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
              </button>

              {featureSettingsExpanded && (
                <div className="ml-4 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {featureSettingsItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-left text-sm font-bold group/sub ${isActive
                          ? 'text-blue-600 bg-blue-100/50 dark:bg-blue-600/10'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-gray-700/20'
                          }`}
                      >
                        <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : 'group-hover/sub:scale-110'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-10 overflow-auto scrollbar-none">
          <div className="max-w-4xl mx-auto">
            {/* Dynamic Sticky Header for Content */}
            <div className="sticky top-0 z-30 mb-8 -mx-6 px-6 py-4 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-transparent transition-all lg:hidden">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {sidebarItems.find(i => i.id === activeSection)?.label || featureSettingsItems.find(i => i.id === activeSection)?.label || 'Settings'}
              </h1>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingBank ? 'Edit Bank Account' : 'Bank Accounts'}
              </h3>
              <button
                onClick={() => {
                  setShowBankModal(false);
                  setEditingBank(null);
                  setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false });
                }}
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <FiX className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {!editingBank && businessProfile.bankAccounts.length > 0 && (
              <div className="space-y-4 mb-8">
                {businessProfile.bankAccounts.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                    <div>
                      <p className="text-gray-900 dark:text-white font-bold">{bank.bankName}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{bank.accountNumber}</p>
                      {bank.isPrimary && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-600/10 px-2 py-0.5 rounded-full mt-1 inline-block">Primary</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditBank(bank)}
                        className="p-2.5 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all shadow-sm"
                      >
                        <FiEdit2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm"
                      >
                        <FiTrash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-semibold mb-2">Bank Name</label>
                <Input
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="Enter bank name"
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-semibold mb-2">Account Number</label>
                <Input
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-semibold mb-2">Account Holder Name</label>
                <Input
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  placeholder="Enter account holder name"
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-400 text-sm font-semibold mb-2">Branch (Optional)</label>
                <Input
                  value={bankForm.branch}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  placeholder="Enter branch name"
                  className="bg-gray-100 dark:bg-gray-700 border-transparent text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={bankForm.isPrimary}
                  onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-blue-600 focus:ring-blue-600 transition-all cursor-pointer"
                />
                <label htmlFor="isPrimary" className="text-gray-700 dark:text-gray-400 text-sm font-semibold cursor-pointer">Set as primary account</label>
              </div>
              <div className="flex gap-4 pt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowBankModal(false);
                    setEditingBank(null);
                    setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false });
                  }}
                  className="flex-1 py-3 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveBankAccount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all"
                  disabled={!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolderName}
                >
                  {editingBank ? 'Save Changes' : 'Add Bank'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
