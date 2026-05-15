import React, { useState } from 'react';
import { useDataStore, Party } from '../../store/dataStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import {
  FiX,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiTag,
  FiCheckCircle,
  FiAlertCircle,
  FiTruck,
  FiShoppingBag,
  FiCreditCard,
  FiCalendar,
  FiFileText,
  FiHash,
  FiGlobe,
  FiHome,
  FiBriefcase,
  FiLoader,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../ui/NepaliRupeeIcon';
import { useTranslation } from '../../utils/i18n';
import { partyApi, ApiPartyData } from '../../utils/api';

interface AddPartyDialogProps {
  onClose: () => void;
  initialData?: Party;
  isEdit?: boolean;
  defaultType?: 'customer' | 'supplier';
}

export const AddPartyDialog: React.FC<AddPartyDialogProps> = ({
  onClose,
  initialData,
  isEdit = false,
  defaultType,
}) => {
  const { t } = useTranslation();
  const { addParty, updateParty } = useDataStore();

  // Common fields
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: (initialData?.type || defaultType || 'customer') as 'customer' | 'supplier',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    // Customer specific
    customerCode: '',
    dateOfBirth: '',
    anniversary: '',
    loyaltyPoints: '0',
    preferredPayment: 'cash' as 'cash' | 'credit' | 'upi' | 'bank',
    referredBy: '',
    // Supplier specific
    supplierCode: '',
    companyName: '',
    gstNumber: '',
    panNumber: '',
    bankName: '',
    bankAccount: '',
    ifscCode: '',
    paymentTerms: 'net30',
    leadTime: '',
    minOrderValue: '',
    // Common additional
    openingBalance: '0',
    creditLimit: '',
    notes: '',
    city: '',
    state: '',
    pincode: '',
    country: 'Nepal',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'additional'>('basic');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Compute form validity for disabling the save button
  const isFormValid = () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 3) return false;
    if (!formData.phone.trim()) return false;
    if (!formData.address.trim()) return false;
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    const errors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();

    // Name validation: required and minimum 3 characters
    if (!trimmedName) {
      errors.name = t('validation.required') + ': ' + t('name');
    } else if (trimmedName.length < 3) {
      errors.name = t('name') + ' must be at least 3 characters';
    }

    // Phone validation: required and must be 10 digits
    if (!trimmedPhone) {
      errors.phone = t('validation.required') + ': Phone Number';
    } else if (!/^[0-9]{10}$/.test(trimmedPhone.replace(/\s/g, ''))) {
      errors.phone = t('validation.invalidPhone');
    }

    // Address validation: required
    if (!trimmedAddress) {
      errors.address = t('validation.required') + ': Address';
    }

    // Email validation: optional but must be valid format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('validation.invalidEmail');
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError(Object.values(errors)[0]); // Show first error in main error area
      setLoading(false);
      return;
    }

    try {
      if (isEdit && initialData) {
        // Update existing party via API
        const apiData: Partial<ApiPartyData> = {
          name: formData.name.trim(),
          email: formData.email || undefined,
          phone_no: formData.phone || undefined,
          address: formData.address || undefined,
        };

        if (formData.type === 'customer') {
          apiData.Customer_code = formData.customerCode || undefined;
          apiData.open_balance = parseFloat(formData.openingBalance) || 0;
          apiData.credit_limmit = parseFloat(formData.creditLimit) || 0;
          apiData.preferred_payment_method = formData.preferredPayment === 'cash' ? 'Cash' : 
            formData.preferredPayment === 'credit' ? 'Credit Card' : 
            formData.preferredPayment === 'upi' ? 'UPI' : 'Bank Transfer';
          apiData.referred_by = formData.referredBy || undefined;
          apiData.notes = formData.notes || undefined;
        } else {
          apiData.code = formData.supplierCode || undefined;
        }

        await partyApi.update(parseInt(initialData.id), apiData);

        // Update local store
        const updatedParty: Party = {
          ...initialData,
          name: formData.name.trim(),
          type: formData.type,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
        };
        updateParty(updatedParty);
      } else {
        // Create new party via API
        const apiData: ApiPartyData = {
          Category_type: formData.type === 'customer' ? 'Customer' : 'Supplier',
          is_active: true,
          name: formData.name.trim(),
          email: formData.email || undefined,
          phone_no: formData.phone || undefined,
          address: formData.address || undefined,
        };

        if (formData.type === 'customer') {
          apiData.Customer_code = formData.customerCode || undefined;
          apiData.open_balance = parseFloat(formData.openingBalance) || 0;
          apiData.credit_limmit = parseFloat(formData.creditLimit) || 0;
          apiData.preferred_payment_method = formData.preferredPayment === 'cash' ? 'Cash' : 
            formData.preferredPayment === 'credit' ? 'Credit Card' : 
            formData.preferredPayment === 'upi' ? 'UPI' : 'Bank Transfer';
          apiData.loyalty_points = parseInt(formData.loyaltyPoints) || 0;
          apiData.referred_by = formData.referredBy || undefined;
          apiData.notes = formData.notes || undefined;
        } else {
          apiData.code = formData.supplierCode || `SUP-${Date.now()}`;
        }

        const response = await partyApi.create(apiData);

        // Add to local store with API-returned ID
        const newParty: Party = {
          id: response.party.id.toString(),
          name: formData.name.trim(),
          type: formData.type,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          balance: parseFloat(formData.openingBalance) || 0,
        };
        addParty(newParty);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = formData.type === 'customer';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0D0E12] rounded-2xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header with gradient */}
        <div
          className={`${isCustomer ? 'bg-gradient-to-r from-[#A3876A] to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'} px-6 py-5 text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {isCustomer ? (
                  <FiUser className="w-6 h-6" />
                ) : (
                  <FiTruck className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEdit
                    ? 'Edit Party'
                    : isCustomer
                    ? 'Add New Customer'
                    : 'Add New Supplier'}
                </h2>
                <p className="text-white/80 text-sm">
                  {isCustomer ? 'Add a new customer to your business' : 'Add a new supplier to your business'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-3">
            <FiCheckCircle className="w-5 h-5" />
            <span className="font-medium">
              {t('partySuccess').replace('{action}', isEdit ? t('updated') : t('added'))}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Party Type Selection */}
          {!isEdit && !defaultType && (
            <div className="p-6 border-b #DDD7CC dark:border-[#1C1D24] #F4F0EA dark:bg-[#15161C]/50">
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-[#C8C3BC]">
                <FiTag className="w-4 h-4 inline mr-2" />
                Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'customer' })}
                  className={`p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    formData.type === 'customer'
                      ? 'bg-[#F5F0E6] dark:bg-[#A3876A]/15 border-[#A3876A] shadow-lg scale-[1.02]'
                      : 'bg-white dark:bg-[#15161C] border-gray-300 dark:border-[#2A2B36] hover:border-blue-400'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      formData.type === 'customer'
                        ? 'bg-[#A3876A] text-white'
                        : '#E3DDD2 dark:bg-[#1C1D24] #6B7280'
                    }`}
                  >
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold #1A1C20 dark:text-[#EAE5DF] block">
                      Customer
                    </span>
                    <span className="text-xs #6B7280 dark:text-[#44454F]">
                      Buys from you
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'supplier' })}
                  className={`p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    formData.type === 'supplier'
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 shadow-lg scale-[1.02]'
                      : 'bg-white dark:bg-[#15161C] border-gray-300 dark:border-[#2A2B36] hover:border-purple-400'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      formData.type === 'supplier'
                        ? 'bg-purple-500 text-white'
                        : '#E3DDD2 dark:bg-[#1C1D24] #6B7280'
                    }`}
                  >
                    <FiTruck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold #1A1C20 dark:text-[#EAE5DF] block">
                      Supplier
                    </span>
                    <span className="text-xs #6B7280 dark:text-[#44454F]">
                      You buy from
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b #DDD7CC dark:border-[#1C1D24] px-6">
            <div className="flex gap-1">
              {(['basic', 'financial', 'additional'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? `${
                          isCustomer
                            ? 'border-[#A3876A] text-[#A3876A]'
                            : 'border-purple-500 text-purple-600'
                        }`
                      : 'border-transparent #6B7280 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'basic' && <><FiFileText className="inline mr-2" />Basic Info</>}
                  {tab === 'financial' && <><FiCreditCard className="inline mr-2" />Financial Info</>}
                  {tab === 'additional' && <><FiTag className="inline mr-2" />Additional Info</>}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <>
                {/* Name and Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      <FiUser className="w-4 h-4 inline mr-2" />
                      {isCustomer ? 'Customer Name' : 'Supplier Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (validationErrors.name) {
                          setValidationErrors({ ...validationErrors, name: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#A3876A] ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-[#2A2B36]'
                      }`}
                      placeholder="Enter name (min 3 characters)"
                      required
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" /> {validationErrors.name}
                      </p>
                    )}
                    {formData.name && formData.name.trim().length > 0 && formData.name.trim().length < 3 && !validationErrors.name && (
                      <p className="mt-1 text-xs text-amber-500 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" /> Name must be at least 3 characters ({formData.name.trim().length}/3)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      <FiHash className="w-4 h-4 inline mr-2" />
                      {isCustomer ? 'Customer Code' : 'Supplier Code'}
                    </label>
                    <input
                      type="text"
                      value={isCustomer ? formData.customerCode : formData.supplierCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [isCustomer ? 'customerCode' : 'supplierCode']: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                      placeholder={isCustomer ? 'CUST-001' : 'SUP-001'}
                    />
                  </div>
                </div>

                {/* Supplier: Company Name */}
                {!isCustomer && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      <FiBriefcase className="w-4 h-4 inline mr-2" />
                      {t('companyName')}
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                      placeholder={t('companyNamePlaceholder')}
                    />
                  </div>
                )}

                {/* Phone and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      <FiPhone className="w-4 h-4 inline mr-2" />
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (validationErrors.phone) {
                          setValidationErrors({ ...validationErrors, phone: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#A3876A] ${
                        validationErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-[#2A2B36]'
                      }`}
                      placeholder="9812345678"
                      required
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" /> {validationErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      <FiMail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (validationErrors.email) {
                          setValidationErrors({ ...validationErrors, email: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#A3876A] ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-[#2A2B36]'
                      }`}
                      placeholder="email@example.com"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" /> {validationErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address - Required field */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                    <FiMapPin className="w-4 h-4 inline mr-2" />
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (validationErrors.address) {
                        setValidationErrors({ ...validationErrors, address: '' });
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] focus:outline-none focus:ring-2 focus:ring-[#A3876A] resize-none ${
                      validationErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-[#2A2B36]'
                    }`}
                    rows={2}
                    placeholder="Enter address"
                    required
                  />
                  {validationErrors.address && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" /> {validationErrors.address}
                    </p>
                  )}
                </div>
                {!isCustomer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                        <FiFileText className="w-4 h-4 inline mr-2" />
                        {t('gstNumber')}
                      </label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                        placeholder="GST Number"
                      />
                    </div> */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                        <FiFileText className="w-4 h-4 inline mr-2" />
                        {t('panNumber')}
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                        placeholder="PAN Number"
                      />
                    </div>
                  </div>
                )}

                {/* Address
                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      <FiHome className="w-4 h-4 inline mr-2" />
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                      placeholder="Kathmandu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                      placeholder="Bagmati"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                      placeholder="44600"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Financial Info Tab */}
            {activeTab === 'financial' && (
              <>
                {/* Opening Balance and Credit Limit */}
                <div
                  className={`${
                    isCustomer ? 'bg-[#F5F0E6] dark:bg-[#A3876A]/15' : 'bg-purple-50 dark:bg-purple-900/20'
                  } p-6 rounded-xl border ${
                    isCustomer
                      ? 'border-[#A3876A]/30 dark:border-[#A3876A]/50'
                      : 'border-purple-200 dark:border-purple-800'
                  }`}
                >
                  <h3 className="font-bold #1A1C20 dark:text-[#EAE5DF] mb-4 flex items-center gap-2">
                    <NepaliRupeeIcon className="w-5 h-5" />
                    Balance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                        {t('ledger.openingBalance')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 #6B7280 font-semibold">
                          रु.
                        </span>
                        <input
                          type="number"
                          value={formData.openingBalance}
                          onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs #6B7280 mt-1">
                        {isCustomer ? t('amountOwed') : t('amountYouOwe')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                        {t('creditLimit')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 #6B7280 font-semibold">
                          रु.
                        </span>
                        <input
                          type="number"
                          value={formData.creditLimit}
                          onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                          placeholder={t('optional')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer: Payment Preference and Loyalty */}
                {isCustomer && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                        <FiCreditCard className="w-4 h-4 inline mr-2" />
                        {t('preferredPayment')}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['cash', 'credit', 'upi', 'bank'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setFormData({ ...formData, preferredPayment: method })}
                            className={`p-3 rounded-xl border-2 font-medium capitalize transition-all ${
                              formData.preferredPayment === method
                                ? 'border-[#A3876A] bg-[#F5F0E6] dark:bg-[#A3876A]/15 text-[#A3876A]'
                                : '#DDD7CC dark:border-[#1C1D24] #6B7280 dark:text-[#44454F]'
                            }`}
                          >
                            {method === 'upi' ? 'UPI' : method}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                        <FiCheckCircle className="inline mr-2" />{t('loyaltyPoints')}
                      </label>
                      <input
                        type="number"
                        value={formData.loyaltyPoints}
                        onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                        className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Supplier: Bank Details */}
                {!isCustomer && (
                  <>
                    <div className="#F4F0EA dark:bg-[#15161C]/50 p-6 rounded-xl border #DDD7CC dark:border-[#1C1D24]">
                      <h3 className="font-bold #1A1C20 dark:text-[#EAE5DF] mb-4 flex items-center gap-2">
                        <FiHome className="inline mr-2" />{t('bankDetails')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                            {t('bankName')}
                          </label>
                          <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                            placeholder="Bank Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                            {t('accountNumber')}
                          </label>
                          <input
                            type="text"
                            value={formData.bankAccount}
                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                            placeholder="Account Number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                            {t('ifscCode')}
                          </label>
                          <input
                            type="text"
                            value={formData.ifscCode}
                            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                            placeholder="IFSC Code"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                          {t('paymentTerms')}
                        </label>
                        <select
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                          className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="net15">Net 15 Days</option>
                          <option value="net30">Net 30 Days</option>
                          <option value="net45">Net 45 Days</option>
                          <option value="net60">Net 60 Days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                          {t('leadTime')}
                        </label>
                        <input
                          type="text"
                          value={formData.leadTime}
                          onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                          className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                          {t('minOrderValue')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 #6B7280 font-semibold">
                            रु.
                          </span>
                          <input
                            type="number"
                            value={formData.minOrderValue}
                            onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Additional Info Tab */}
            {activeTab === 'additional' && (
              <>
                {/* Customer: Referred By */}
                {isCustomer && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                      <FiUser className="inline mr-2" />{t('referredBy')}
                    </label>
                    <input
                      type="text"
                      value={formData.referredBy}
                      onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A]"
                      placeholder={t('referredByPlaceholder')}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-[#C8C3BC]">
                    <FiFileText className="inline mr-2" />{t('notesOptional')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#15161C] #1A1C20 dark:text-[#EAE5DF] border-gray-300 dark:border-[#2A2B36] focus:outline-none focus:ring-2 focus:ring-[#A3876A] resize-none"
                    rows={4}
                    placeholder={t('addNotes')}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t #DDD7CC dark:border-[#1C1D24] #F4F0EA dark:bg-[#15161C]/50">
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-all ${
                isCustomer
                  ? 'bg-gradient-to-r from-[#A3876A] to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              {loading ? (
                <>
                  <FiLoader className="w-5 h-5 mr-2 animate-spin" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : isEdit ? (
                <>
                  <FiCheckCircle className="w-5 h-5 mr-2" />
                  {t('updateParty')}
                </>
              ) : (
                <>
                  <FiUser className="w-5 h-5 mr-2" />
                  {isCustomer ? t('addCustomer') : t('addSupplier')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-[#C8C3BC] bg-white dark:bg-[#15161C] border-2 border-gray-300 dark:border-[#2A2B36] hover:#F4F0EA dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
