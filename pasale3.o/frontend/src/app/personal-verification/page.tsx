import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiFileText, 
  FiCamera, 
  FiCheck, 
  FiArrowLeft,
  FiArrowRight,
  FiShield,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';

type VerificationMethod = 'email' | 'phone' | null;

export default function PersonalVerificationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setProfileComplete, completeOnboarding, updateUserProfile } = useAuthStore();
  const { setPersonalDetails } = useBusinessStore();
  const { sendOTP, verifyOTP, error: apiError, clearError } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'profile' | 'verify'>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [resendTimer, setResendTimer] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Clear API error when form data changes
  useEffect(() => {
    if (apiError) {
      clearError();
    }
  }, [otp, name, email, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfile = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = t('common.required');
    }

    if (!email.trim()) {
      newErrors.email = t('common.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('verification.invalidEmail') || 'Invalid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = t('common.required');
    } else if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = t('verification.invalidPhone') || 'Invalid phone number';
    }

    if (!pan.trim()) {
      newErrors.pan = t('common.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateProfile() && verificationMethod) {
      setStep('verify');
    }
  };

  const handleSendOTPRequest = async (method: VerificationMethod) => {
    if (!method) return;

    setIsSendingOTP(true);
    setOtpError('');
    setVerificationMethod(method);

    // Use the auth hook to send OTP
    const success = await sendOTP({
      email: method === 'email' ? email : undefined,
      phone: method === 'phone' ? phone : undefined,
      type: method,
      purpose: 'verification',
    });

    setIsSendingOTP(false);
    
    if (success) {
      // Start resend timer
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    if (pastedData.length > 0) {
      otpRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerifyOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setOtpError(t('verification.enterOTP'));
      return;
    }

    setIsVerifying(true);

    // Use the auth hook to verify OTP
    const success = await verifyOTP({
      email: verificationMethod === 'email' ? email : undefined,
      phone: verificationMethod === 'phone' ? phone : undefined,
      otp: otpValue,
      purpose: 'verification',
    });

    if (success) {
      // Save user data
      updateUserProfile({ name, email, phone, panNumber: pan, photo: photo || null });
      setPersonalDetails({ ownerName: name, profileImage: photo || undefined });
      setProfileComplete(true);
      completeOnboarding();
      navigate('/dashboard');
    } else {
      setOtpError(apiError?.message || t('verification.invalidOTP'));
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }

    setIsVerifying(false);
  };

  const handleResendOTP = () => {
    if (verificationMethod && resendTimer === 0) {
      handleSendOTPRequest(verificationMethod);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    }
  };

  // Verification Step
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Theme/Language Switchers */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>

        <div className={`w-full max-w-md transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">Pasale</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">{t('verification.verifyOTP')}</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FiShield className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">{t('verification.verifyOTP')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                {t('verification.enterOTP')} {verificationMethod === 'email' ? email : phone}
              </p>
            </div>

            <form onSubmit={handleVerifyOTPSubmit} className="space-y-4 sm:space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 text-center">
                  {t('forgotPassword.enterOTP')}
                </label>
                <div className="flex gap-1.5 sm:gap-2 justify-center" onPaste={handleOTPPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border-2 ${
                        otpError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="text-red-500 text-xs sm:text-sm mt-2 text-center">{otpError}</p>
                )}
              </div>

              {/* Resend OTP */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {t('forgotPassword.resendIn')} <span className="font-semibold text-gray-700 dark:text-gray-300">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isSendingOTP}
                    className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 sm:gap-2 mx-auto"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {t('verification.resendOTP')}
                  </button>
                )}
              </div>

              {/* Demo Hint */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-center">
                <p className="text-yellow-700 dark:text-yellow-400 text-xs sm:text-sm">
                  💡 Demo OTP: <span className="font-bold">123456</span>
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isVerifying || otp.join('').length !== 6}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    {t('verification.verifyOTP')}
                  </>
                )}
              </Button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep('profile')}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <FiArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t('common.back')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Profile Step
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme/Language Switchers */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className={`w-full max-w-lg transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">Pasale</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">{t('verification.personalTitle')}</p>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/business-type')}
          className="mb-3 sm:mb-4 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
          title={t('common.back')}
        >
          <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

            {/* Content */}
            <form onSubmit={handleProfileSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Profile Photo */}
              <div className="flex justify-center -mt-12 sm:-mt-16 relative z-10">
                <div className="relative">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer group"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt="Profile"
                        className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                        <FiUser className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-gray-700 dark:bg-gray-600 text-white p-2 sm:p-2.5 rounded-full shadow-lg group-hover:bg-gray-800 dark:group-hover:bg-gray-500 transition-colors">
                      <FiCamera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>
              <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {t('verification.uploadPhoto')}
              </p>

              {/* Form Fields */}
              <div className="space-y-3 sm:space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    {t('verification.name')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    {t('verification.email')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    {t('verification.phone')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98XXXXXXXX"
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone}</p>}
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    {t('verification.panNumber')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      placeholder="123456789"
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.pan ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.pan && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.pan}</p>}
                </div>
              </div>

              {/* Verification Method Selection */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 text-center">
                  {t('verification.chooseMethod')}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleSendOTPRequest('email')}
                    disabled={isSendingOTP}
                    className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                      verificationMethod === 'email'
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      verificationMethod === 'email' 
                        ? 'bg-blue-100 dark:bg-blue-900/50' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <FiMail className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold">{t('verification.emailOTP')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendOTPRequest('phone')}
                    disabled={isSendingOTP}
                    className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                      verificationMethod === 'phone'
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      verificationMethod === 'phone' 
                        ? 'bg-blue-100 dark:bg-blue-900/50' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <FiPhone className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold">{t('verification.smsOTP')}</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!verificationMethod || isSendingOTP}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isSendingOTP ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('common.continue')}
                    <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </Button>
            </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
          © 2024 Pasale. {t('common.allRightsReserved') || 'All rights reserved.'}
        </p>
      </div>
    </div>
  );
}

