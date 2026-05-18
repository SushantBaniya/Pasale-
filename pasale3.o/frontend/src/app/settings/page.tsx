import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
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
  FiUsers,
  FiPackage,
  FiFileText,
  FiPrinter,
  FiArrowLeft,
  FiCheck,
  FiTrash2,
  FiEdit2,
  FiArchive,
  FiSearch,
  FiPlus,
  FiAlertTriangle,
} from 'react-icons/fi';

type SettingsSection =
  | 'general'
  | 'my-account'
  | 'personal-profile'
  | 'parties'
  | 'transactions';

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
  'Retail', 'Wholesale', 'Manufacturing', 'Services', 'Food & Beverage',
  'Clothing', 'Electronics', 'Pharmacy', 'Hardware', 'Grocery',
  'Information Technology', 'Other',
];

// Default expense categories (real data)
const defaultExpenseCategories = [
  'Clothing', 'Education', 'Entertainment', 'Food', 'Fuel',
  'General', 'Health', 'Maintenance', 'Other', 'Recharge',
  'Rent', 'Salary', 'Transport', 'Utilities',
];

// Default income categories (real data)
const defaultIncomeCategories = [
  'Business Revenue', 'Dividend', 'Freelance', 'Gift',
  'Interest', 'Investment', 'Other', 'Rental Income', 'Salary',
];

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
    updateTransactionSettings,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
  } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [featureExpanded, setFeatureExpanded] = useState(false);
  const [transactionSubView, setTransactionSubView] = useState<'main' | 'income' | 'expense'>('main');
  const [success, setSuccess] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ name: string; index: number } | null>(null);

  // Local state for categories (in real app these come from backend)
  const [expenseCategories, setExpenseCategories] = useState(
    defaultExpenseCategories.map(name => ({ name, total: 0 }))
  );
  const [incomeCategories, setIncomeCategories] = useState(
    defaultIncomeCategories.map(name => ({ name, total: 0 }))
  );

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branch: '',
    isPrimary: false,
  });

  const [accountForm, setAccountForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || '',
    photo: userProfile?.photo || null as string | null,
  });

  const [businessForm, setBusinessForm] = useState({
    businessName: businessProfile?.businessName || '',
    businessCategory: businessProfile?.businessCategory || '',
    businessAddress: businessProfile?.streetAddress || '',
    businessLogo: businessProfile?.businessLogo || null as string | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessLogoRef = useRef<HTMLInputElement>(null);

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAccountForm({ ...accountForm, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleBusinessLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBusinessForm({ ...businessForm, businessLogo: reader.result as string });
      reader.readAsDataURL(file);
    }
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
    if (window.confirm('Delete this bank account?')) {
      deleteBankAccount(id);
      showSuccessMessage('Bank account deleted!');
    }
  };

  //  Reusable UI Primitives 

  const Toggle = ({
    enabled,
    onChange,
    label,
    description,
  }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-4 border-b #E2E8F0 last:border-0 dark:border-slate-700">
      <div className="flex-1 pr-8">
        <p className="text-sm font-medium #1E293B dark:text-[#EAE5DF]">{label}</p>
        {description && <p className="text-xs #475569 mt-0.5 dark:text-[#44454F]">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-[#F2DD50]' : 'bg-gray-200 dark:bg-slate-700'}`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-slate-700 rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );

  const RowSelect = ({
    label,
    description,
    value,
    onChange,
    options,
  }: {
    label: string;
    description?: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex items-center justify-between py-4 border-b #E2E8F0 last:border-0 dark:border-slate-700">
      <div className="flex-1 pr-8">
        <p className="text-sm font-medium #1E293B dark:text-[#EAE5DF]">{label}</p>
        {description && <p className="text-xs #475569 mt-0.5 dark:text-[#44454F]">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm text-gray-700 #FFFFFF border #E2E8F0 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:text-[#EAE5DF] dark:bg-slate-800 dark:border-slate-700"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border #E2E8F0 shadow-sm overflow-hidden mb-4 dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
        {title && (
          <div className="px-6 py-4 border-b #E2E8F0 dark:border-slate-700">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide dark:text-[#64748B]">{title}</h3>
          </div>
        )}
        <div className="px-6">{children}</div>
      </div>
  );

  const PageTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-medium #1E293B mb-6 dark:text-[#EAE5DF]">{title}</h2>
  );

  const SaveBtn = ({ onClick, label = 'Save Settings' }: { onClick: () => void; label?: string }) => (
    <div className="flex justify-end mt-2 mb-4">
      <button
        onClick={onClick}
        className="px-6 py-2.5 bg-[#F2DD50] hover:bg-[#8E7356] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        {label}
      </button>
    </div>
  );

  //  GENERAL SETTINGS 
  const renderGeneral = () => (
    <div>
      <PageTitle title="General Settings" />

      {/* Appearance */}
      <SectionCard title="Appearance">
        <div className="py-4">
          <p className="text-xs #475569 mb-4 dark:text-[#44454F]">To adjust website theme, choose from three preset options</p>
          <div className="flex gap-4">
            {(['light', 'classic', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t as any); updateGeneralSettings({ appearance: t }); }}
                className={`relative rounded-xl overflow-hidden border-2 dark:border-slate-700 transition-all ${theme === t ? 'border-blue-600' : '#E2E8F0 hover:border-gray-300'}`}
              >
                <div className={`w-28 h-20 ${t === 'light' ? '#FFFFFF dark:bg-slate-800' : t === 'classic' ? 'bg-slate-600' : 'bg-gray-900'}`}>
                  <div className={`flex h-full`}>
                    <div className={`w-8 h-full ${t === 'light' ? 'bg-white dark:bg-slate-700 border-r #E2E8F0 dark:border-slate-700' : t === 'classic' ? 'bg-slate-700' : 'bg-gray-800'}`} />
                    <div className="flex-1 p-2">
                      <div className={`h-1.5 w-10 rounded mb-1 ${t === 'light' ? 'bg-gray-300' : 'bg-gray-600'}`} />
                      <div className={`h-1.5 w-7 rounded ${t === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`} />
                    </div>
                  </div>
                  {/* blue accent */}
                  <div className="absolute top-2 left-2 w-4 h-4 rounded bg-[#F2DD50]" />
                </div>
                {theme === t && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#F2DD50] rounded-full flex items-center justify-center">
                    <FiCheck className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className={`text-center py-2 text-xs font-medium ${theme === t ? 'text-[#F2DD50]' : '#475569 dark:text-[#44454F]'}`}>
                  {t === 'light' ? 'Light Theme' : t === 'classic' ? 'Classic Theme' : 'Dark Theme'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Language & Currency */}
      <SectionCard>
        <RowSelect
          label="Language"
          description="To adjust language, choose from available options"
          value={general.language}
          onChange={(v) => updateGeneralSettings({ language: v as 'en' | 'np' })}
          options={[{ value: 'en', label: 'English' }, { value: 'np', label: 'नेपाली' }]}
        />
        <RowSelect
          label="Currency"
          description="To adjust currency type, choose from available options"
          value={general.currency}
          onChange={(v) => updateGeneralSettings({ currency: v as any })}
          options={[
            { value: 'NPR', label: 'Rs.  Nepali Rupee' },
            { value: 'INR', label: '  Indian Rupee' },
            { value: 'USD', label: '$  US Dollar' },
          ]}
        />
        <RowSelect
          label="Currency Position"
          value={general.currencyPosition}
          onChange={(v) => updateGeneralSettings({ currencyPosition: v as 'start' | 'end' })}
          options={[{ value: 'start', label: 'Start' }, { value: 'end', label: 'End' }]}
        />
      </SectionCard>

      {/* Calendar & Format */}
      <SectionCard>
        <div className="flex items-center justify-between py-4 border-b #E2E8F0 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium #1E293B dark:text-[#EAE5DF]">Calendar</p>
            <p className="text-xs #475569 mt-0.5 dark:#475569">To adjust calendar type, choose from available options</p>
          </div>
          <div className="flex #F8FAFC rounded-lg p-0.5 dark:bg-slate-700/40">
            {(['AD', 'BS'] as const).map((cal) => (
              <button
                key={cal}
                onClick={() => updateGeneralSettings({ calendarType: cal })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${general.calendarType === cal ? 'bg-[#F2DD50] text-white shadow-sm' : '#475569 dark:text-[#44454F] hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                {cal}
              </button>
            ))}
          </div>
        </div>
        <RowSelect
          label="Date Format"
          value={general.dateFormat}
          onChange={(v) => updateGeneralSettings({ dateFormat: v as any })}
          options={[
            { value: 'BS', label: 'DD MMM YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
          ]}
        />
        <RowSelect
          label="Time Format"
          value={general.timeFormat}
          onChange={(v) => updateGeneralSettings({ timeFormat: v as '12h' | '24h' })}
          options={[{ value: '12h', label: '7:41 PM' }, { value: '24h', label: '19:41' }]}
        />
        <RowSelect
          label="Number Format"
          description="To adjust number format, choose from two preset options"
          value={general.numberFormat}
          onChange={(v) => updateGeneralSettings({ numberFormat: v as any })}
          options={[{ value: 'indian', label: '1,00,000' }, { value: 'international', label: '1,000,000' }]}
        />
      </SectionCard>

      {/* Privacy & App Lock */}
      <SectionCard>
        <Toggle
          enabled={general.privacyMode}
          onChange={(v) => updateGeneralSettings({ privacyMode: v })}
          label="Privacy Mode"
          description="Hides business stats from homepage & item purchase price."
        />
        <Toggle
          enabled={general.appLock}
          onChange={(v) => updateGeneralSettings({ appLock: v })}
          label="App Lock"
          description="Secure your business access with a lock screen"
        />
      </SectionCard>

      <SaveBtn onClick={() => showSuccessMessage('Settings saved!')} />
    </div>
  );

  //  MY ACCOUNT 
  const renderMyAccount = () => (
    <div>
      <PageTitle title="My Account" />

      <SectionCard>
        {/* Profile Header */}
        <div className="py-5 flex items-center gap-4 border-b #E2E8F0 dark:border-slate-700">
          <div className="relative">
            {accountForm.photo ? (
              <img src={accountForm.photo} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#F2DD50]/10 flex items-center justify-center">
                <FiUser className="w-6 h-6 text-[#F2DD50]" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F2DD50] rounded-full flex items-center justify-center shadow"
            >
              <FiEdit2 className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
          <div>
            <p className="font-medium #1E293B dark:text-[#EAE5DF]">{accountForm.name || 'Your Name'}</p>
            <p className="text-sm #475569 dark:#475569">{accountForm.email}</p>
            <p className="text-xs text-[#F2DD50] mt-0.5">Signed in via Google</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </div>

        {/* Full Name */}
        <div className="py-4 border-b #E2E8F0 dark:border-slate-700">
          <label className="text-xs font-medium #475569 uppercase tracking-wide mb-2 block dark:#475569">Full Name</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:#475569" />
            <input
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm #1E293B focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
            />
          </div>
        </div>

        {/* Email */}
        <div className="py-4 border-b #E2E8F0 dark:border-slate-700">
          <label className="text-xs font-medium #475569 uppercase tracking-wide mb-2 block dark:#475569">Email Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm dark:#475569"></span>
            <input
              value={accountForm.email}
              disabled
              className="w-full pl-9 pr-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:#475569"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 dark:#475569">Email cannot be changed</p>
        </div>

        {/* Phone */}
        <div className="py-4">
          <label className="text-xs font-medium #475569 uppercase tracking-wide mb-2 block dark:#475569">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm dark:#475569"></span>
            <input
              value={accountForm.phone}
              onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
              placeholder="Enter your phone number"
              className="w-full pl-9 pr-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm #1E293B focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center justify-between mt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          Sign Out
        </button>
        <button
          onClick={() => { updateUserProfile({ name: accountForm.name, phone: accountForm.phone, email: accountForm.email, photo: accountForm.photo }); showSuccessMessage('Account updated!'); }}
          className="px-6 py-2.5 bg-[#F2DD50] hover:bg-[#8E7356] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  );

  //  PERSONAL PROFILE (Business Profile) 
  const renderPersonalProfile = () => (
    <div>
      <PageTitle title="Personal Profile" />

      <SectionCard>
        {/* Business Logo & Name Header */}
        <div className="py-5 flex items-center gap-4 border-b #E2E8F0 dark:border-slate-700">
          <div className="relative">
            {businessForm.businessLogo ? (
              <img src={businessForm.businessLogo} alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#F2DD50]/10 flex items-center justify-center">
                <FiBriefcase className="w-7 h-7 text-[#F2DD50]" />
              </div>
            )}
            <button
              onClick={() => businessLogoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F2DD50] rounded-full flex items-center justify-center shadow"
            >
              <span className="text-white text-xs"></span>
            </button>
          </div>
          <div>
            <p className="font-medium #1E293B dark:text-[#EAE5DF]">{businessForm.businessName || 'Business Name'}</p>
            <p className="text-xs text-gray-400 mt-0.5 dark:#475569">Click camera to update logo</p>
          </div>
          <input ref={businessLogoRef} type="file" accept="image/*" onChange={handleBusinessLogoUpload} className="hidden" />
        </div>

        {/* Business Name */}
        <div className="py-4 border-b #E2E8F0 dark:border-slate-700">
          <label className="text-xs font-medium #475569 uppercase tracking-wide mb-2 block dark:#475569">Business Name</label>
          <div className="relative">
            <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:#475569" />
            <input
              value={businessForm.businessName}
              onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm #1E293B focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
            />
          </div>
        </div>

        {/* Business Category */}
        <div className="py-4 border-b #E2E8F0 dark:border-slate-700">
          <label className="text-xs font-medium #475569 uppercase tracking-wide mb-2 block dark:#475569">Business Category</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm dark:#475569"></span>
            <select
              value={businessForm.businessCategory}
              onChange={(e) => setBusinessForm({ ...businessForm, businessCategory: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm #1E293B focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 appearance-none dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
            >
              <option value="">Select Category</option>
              {businessCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Business Address */}
        <div className="py-4">
          <label className="text-xs font-medium #475569 uppercase tracking-wide mb-2 block dark:#475569">Business Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm dark:#475569"></span>
            <input
              value={businessForm.businessAddress}
              onChange={(e) => setBusinessForm({ ...businessForm, businessAddress: e.target.value })}
              placeholder="Enter business address"
              className="w-full pl-9 pr-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm #1E293B focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
            />
          </div>
        </div>
      </SectionCard>

      <SaveBtn
        label="Save Profile"
        onClick={() => {
          updateBusinessProfile({ ...businessProfile, businessName: businessForm.businessName, businessCategory: businessForm.businessCategory, streetAddress: businessForm.businessAddress, businessLogo: businessForm.businessLogo });
          showSuccessMessage('Profile saved!');
        }}
      />
    </div>
  );

  //  PARTIES FEATURE SETTINGS 
  const renderParties = () => (
    <div>
      <PageTitle title="Party Feature Settings" />
      <SectionCard>
        <Toggle
          enabled={featureSettings.parties.partyCategory ?? true}
          onChange={(v) => updatePartySettings({ partyCategory: v })}
          label="Send Payment Reminders"
          description="Enable sending payment reminders to parties via notifications"
        />
        <Toggle
          enabled={featureSettings.parties.uploadPartyImage ?? true}
          onChange={(v) => updatePartySettings({ uploadPartyImage: v })}
          label="Opening Balance"
          description="Allow setting opening balance when creating a new party"
        />
        <Toggle
          enabled={true}
          onChange={() => {}}
          label="Party Photo Upload"
          description="Allow uploading photos for parties"
        />
        <Toggle
          enabled={true}
          onChange={() => {}}
          label="PAN Number Field"
          description="Show PAN number field in party form"
        />
      </SectionCard>
      <SaveBtn onClick={() => showSuccessMessage('Party settings saved!')} />
    </div>
  );

  //  TRANSACTION SETTINGS 
  const CategoryManager = ({
    title,
    categories,
    setCategories,
    onBack,
  }: {
    title: string;
    categories: { name: string; total: number }[];
    setCategories: React.Dispatch<React.SetStateAction<{ name: string; total: number }[]>>;
    onBack: () => void;
  }) => {
    const filtered = categories.filter(c =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-1.5 hover:#F8FAFC rounded-lg transition-colors dark:hover:bg-slate-700 dark:bg-slate-700">
            <FiArrowLeft className="w-4 h-4 #475569 dark:#475569" />
          </button>
          <h2 className="text-xl font-medium #1E293B flex-1 dark:text-[#EAE5DF]">{title}</h2>
          <button
            onClick={() => { setShowAddCategory(true); setNewCategory(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#F2DD50] text-white text-sm font-medium rounded-lg hover:bg-[#8E7356] transition-colors shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add New Category
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:#475569" />
          <input
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search Category..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border #E2E8F0 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border #E2E8F0 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
          <div className="grid grid-cols-3 px-6 py-3 border-b #E2E8F0 #FFFFFF dark:border-slate-700 dark:bg-slate-800/20">
            <span className="text-xs font-medium #475569 uppercase tracking-wide dark:text-[#64748B]">Category Name</span>
            <span className="text-xs font-medium #475569 uppercase tracking-wide text-right dark:text-[#64748B]">Total Amount</span>
            <span className="text-xs font-medium #475569 uppercase tracking-wide text-right dark:text-[#64748B]">Action</span>
          </div>

          {filtered.map((cat, i) => (
            <div key={cat.name} className="grid grid-cols-3 px-6 py-4 border-b border-gray-50 hover:#FFFFFF transition-colors items-center dark:border-slate-700 dark:hover:bg-slate-700/40 dark:bg-slate-800/50">
              {editingCategory?.index === i ? (
                <>
                  <input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="text-sm border border-blue-600 rounded-lg px-2 py-1 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-sm text-gray-700 text-right dark:text-[#64748B]">Rs. {cat.total}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, name: editingCategory.name } : c));
                        setEditingCategory(null);
                      }}
                      className="text-[#F2DD50] hover:text-[#8E7356] p-1"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:#475569 p-1 dark:#475569">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm #1E293B dark:text-[#EAE5DF]">{cat.name}</span>
                  <span className="text-sm #475569 text-right dark:text-[#64748B]">Rs. {cat.total}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCategory({ name: cat.name, index: i })}
                      className="p-1.5 hover:#F8FAFC rounded-lg transition-colors text-gray-400 hover:#475569 dark:hover:bg-slate-700 dark:bg-slate-700 dark:#475569"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${cat.name}"?`)) {
                          setCategories(prev => prev.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500 dark:#475569"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm dark:#475569">No categories found</div>
          )}
        </div>

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl dark:bg-slate-800 dark:shadow-none">
              <h3 className="font-medium #1E293B mb-4 dark:text-[#EAE5DF]">Add New Category</h3>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name"
                className="w-full px-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategory.trim()) {
                    setCategories(prev => [...prev, { name: newCategory.trim(), total: 0 }]);
                    setShowAddCategory(false);
                    setNewCategory('');
                    showSuccessMessage('Category added!');
                  }
                }}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddCategory(false)} className="flex-1 py-2 border #E2E8F0 rounded-lg text-sm font-medium #475569 hover:#FFFFFF dark:border-slate-700 dark:#475569 dark:hover:bg-slate-700/40 dark:bg-slate-800">Cancel</button>
                <button
                  onClick={() => {
                    if (newCategory.trim()) {
                      setCategories(prev => [...prev, { name: newCategory.trim(), total: 0 }]);
                      setShowAddCategory(false);
                      setNewCategory('');
                      showSuccessMessage('Category added!');
                    }
                  }}
                  className="flex-1 py-2 bg-[#F2DD50] text-white rounded-lg text-sm font-medium hover:bg-[#8E7356]"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTransactions = () => {
    if (transactionSubView === 'income') {
      return (
        <CategoryManager
          title="Manage Income Categories"
          categories={incomeCategories}
          setCategories={setIncomeCategories}
          onBack={() => { setTransactionSubView('main'); setCategorySearch(''); }}
        />
      );
    }
    if (transactionSubView === 'expense') {
      return (
        <CategoryManager
          title="Manage Expense Categories"
          categories={expenseCategories}
          setCategories={setExpenseCategories}
          onBack={() => { setTransactionSubView('main'); setCategorySearch(''); }}
        />
      );
    }
    return (
      <div>
        <PageTitle title="Transaction Settings" />
        <div className="bg-white rounded-xl border #E2E8F0 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
          <button
            onClick={() => setTransactionSubView('income')}
            className="w-full flex items-center justify-between px-6 py-4 border-b #E2E8F0 hover:#FFFFFF transition-colors dark:border-slate-700 dark:hover:bg-slate-700/40 dark:bg-slate-800"
          >
            <span className="text-sm font-medium #1E293B dark:text-[#EAE5DF]">Manage Income Categories</span>
            <FiChevronRight className="w-4 h-4 text-gray-400 dark:#475569" />
          </button>
          <button
            onClick={() => setTransactionSubView('expense')}
            className="w-full flex items-center justify-between px-6 py-4 hover:#FFFFFF transition-colors dark:hover:bg-slate-700/40 dark:bg-slate-800"
          >
            <span className="text-sm font-medium #1E293B dark:text-[#EAE5DF]">Manage Expense Categories</span>
            <FiChevronRight className="w-4 h-4 text-gray-400 dark:#475569" />
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneral();
      case 'my-account': return renderMyAccount();
      case 'personal-profile': return renderPersonalProfile();
      case 'parties': return renderParties();
      case 'transactions': return renderTransactions();
      default: return renderGeneral();
    }
  };

  const sidebarItems = [
    { id: 'general' as const, label: 'General', icon: FiSettings },
    { id: 'my-account' as const, label: 'My Account', icon: FiUser },
    { id: 'personal-profile' as const, label: 'Personal Profile', icon: FiBriefcase },
  ];

  const featureItems = [
    { id: 'parties' as const, label: 'Parties', icon: FiUsers },
    { id: 'transactions' as const, label: 'Transactions', icon: FiFileText },
  ];

  const isFeatureActive = featureItems.some(f => f.id === activeSection);

  return (
    <div className="min-h-screen #FFFFFF flex #1E293B dark:bg-slate-900 dark:text-[#EAE5DF]">
      {/* Success Toast */}
      {success && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 bg-white border border-blue-600/30 rounded-xl shadow-lg text-sm font-medium text-gray-700 animate-in slide-in-from-top-2 duration-300 dark:bg-slate-800 dark:border-blue-600/30 dark:shadow-none dark:text-[#EAE5DF]">
          <div className="w-5 h-5 bg-[#F2DD50] rounded-full flex items-center justify-center flex-shrink-0">
            <FiCheck className="w-3 h-3 text-white" />
          </div>
          {success}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r #E2E8F0 flex flex-col py-6 flex-shrink-0 min-h-screen dark:bg-slate-800 dark:border-slate-700">
        {/* Back & Title */}
        <div className="px-4 mb-6 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:#F8FAFC rounded-lg transition-colors dark:hover:bg-slate-700 dark:bg-slate-700"
          >
            <FiArrowLeft className="w-4 h-4 #475569 dark:#475569" />
          </button>
          <span className="font-medium #1E293B dark:text-[#EAE5DF]">Settings</span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setFeatureExpanded(false); setTransactionSubView('main'); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${ active ? 'bg-[#F2DD50]/10 text-[#F2DD50] font-medium' : '#475569 hover:#FFFFFF hover:#1E293B' } dark:text-[#EAE5DF] dark:hover:bg-slate-700/40 dark:bg-slate-800`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#F2DD50]' : 'text-gray-400 dark:#475569'}`} />
                {item.label}
              </button>
            );
          })}

          {/* Feature Settings accordion */}
          <div className="pt-1">
            <button
              onClick={() => setFeatureExpanded(!featureExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${ featureExpanded || isFeatureActive ? '#FFFFFF #1E293B font-medium' : '#475569 hover:#FFFFFF hover:#1E293B' } dark:bg-slate-800 dark:text-[#EAE5DF] dark:hover:bg-slate-700/40`}
            >
              <div className="flex items-center gap-3">
                <FiSettings className="w-4 h-4 text-gray-400 flex-shrink-0 dark:#475569" />
                Feature Settings
              </div>
              {featureExpanded ? <FiChevronDown className="w-3.5 h-3.5 text-gray-400 dark:#475569" /> : <FiChevronRight className="w-3.5 h-3.5 text-gray-400 dark:#475569" />}
            </button>

            {(featureExpanded || isFeatureActive) && (
              <div className="mt-0.5 ml-4 space-y-0.5">
                {featureItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setTransactionSubView('main'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${ active ? 'bg-[#F2DD50]/10 text-[#F2DD50] font-medium' : '#475569 hover:#FFFFFF hover:#1E293B' } dark:text-[#EAE5DF] dark:hover:bg-slate-700/40 dark:bg-slate-800`}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-[#F2DD50]' : 'text-gray-400 dark:#475569'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto #FFFFFF #1E293B dark:bg-slate-900 dark:text-[#EAE5DF]">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {renderContent()}
        </div>
      </main>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden #1E293B dark:bg-slate-800 dark:text-[#EAE5DF]">
            <div className="flex items-center justify-between px-6 py-5 border-b #E2E8F0 dark:border-slate-700">
              <h3 className="font-medium #1E293B dark:text-[#EAE5DF]">{editingBank ? 'Edit Bank Account' : 'Bank Accounts'}</h3>
              <button
                onClick={() => { setShowBankModal(false); setEditingBank(null); setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false }); }}
                className="p-1.5 hover:#F8FAFC rounded-lg transition-colors dark:hover:bg-slate-700 dark:bg-slate-700/40"
              >
                <FiX className="w-4 h-4 #475569 dark:#475569" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Existing Accounts */}
              {!editingBank && businessProfile.bankAccounts?.length > 0 && (
                <div className="space-y-2 pb-4 border-b #E2E8F0 dark:border-slate-700">
                  {businessProfile.bankAccounts.map((bank) => (
                    <div key={bank.id} className="flex items-center justify-between p-3 #FFFFFF rounded-xl dark:bg-slate-800/20">
                      <div>
                        <p className="text-sm font-medium #1E293B dark:text-[#EAE5DF]">{bank.bankName}</p>
                        <p className="text-xs #475569 dark:text-[#64748B]">{bank.accountNumber}</p>
                        {bank.isPrimary && <span className="text-xs text-[#F2DD50] font-medium">Primary</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditBank(bank)} className="p-1.5 hover:bg-white rounded-lg transition-colors dark:bg-slate-800 dark:hover:bg-slate-700">
                          <FiEdit2 className="w-3.5 h-3.5 #475569 dark:text-[#64748B]" />
                        </button>
                        <button onClick={() => handleDeleteBank(bank.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {[
                { label: 'Bank Name', key: 'bankName', placeholder: 'e.g. Nepal Bank Limited' },
                { label: 'Account Number', key: 'accountNumber', placeholder: 'Enter account number' },
                { label: 'Account Holder Name', key: 'accountHolderName', placeholder: 'As on bank documents' },
                { label: 'Branch (Optional)', key: 'branch', placeholder: 'Enter branch name' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium #475569 uppercase tracking-wide mb-1.5 block dark:#475569">{label}</label>
                  <input
                    value={(bankForm as any)[key]}
                    onChange={(e) => setBankForm({ ...bankForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 #FFFFFF border #E2E8F0 rounded-lg text-sm #1E293B focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-[#EAE5DF]"
                  />
                </div>
              ))}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankForm.isPrimary}
                  onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#F2DD50] focus:ring-blue-600/30 accent-blue-600 dark:border-slate-600"
                />
                <span className="text-sm text-gray-700 font-medium dark:text-[#EAE5DF]">Set as primary account</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t #E2E8F0 flex gap-3 dark:border-slate-700">
              <button
                onClick={() => { setShowBankModal(false); setEditingBank(null); setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false }); }}
                className="flex-1 py-2.5 border #E2E8F0 rounded-xl text-sm font-medium #475569 hover:#FFFFFF transition-colors dark:border-slate-700 dark:text-[#EAE5DF] dark:hover:bg-slate-700/40 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBankAccount}
                disabled={!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolderName}
                className="flex-1 py-2.5 bg-[#F2DD50] hover:bg-[#8E7356] text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBank ? 'Save Changes' : 'Add Bank'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}