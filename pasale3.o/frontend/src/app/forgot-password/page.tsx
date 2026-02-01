import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { Button } from '../../components/ui/Button';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowLeft,
  FiPhone,
  FiCheck,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

type Step = 'request' | 'verify' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<Step>('request');
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Clear API error when form data changes
  useEffect(() => {
    if (apiError) {
      setApiError(null);
    }
  }, [formData.email, formData.phone, formData.otp, formData.newPassword, formData.confirmPassword]);

  const validateRequest = () => {
    const newErrors: Record<string, string> = {};
    
    if (method === 'email') {
      if (!formData.email) {
        newErrors.email = t('validation.required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('validation.invalidEmail');
      }
    } else {
      if (!formData.phone) {
        newErrors.phone = t('validation.required');
      } else if (!/^[0-9]{10}$/.test(formData.phone)) {
        newErrors.phone = t('validation.invalidPhone');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    const otp = formData.otp.join('');
    if (otp.length !== 6) {
      setErrors({ otp: t('verification.enterOTP') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = t('validation.required');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('validation.minLength').replace('{0}', '8');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = t('forgotPassword.passwordRequirements');
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.required');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateRequest()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendTimer(60);
        setStep('verify');
      } else {
        setApiError(data.message || data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify-reset-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
          otp: formData.otp.join(''),
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('reset');
      } else {
        setApiError(data.message || data.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
          otp: formData.otp.join(''),
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('success');
      } else {
        setApiError(data.message || data.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendTimer(60);
        setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
      } else {
        setApiError(data.message || data.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOTP = [...formData.otp];
    newOTP[index] = value.slice(-1);
    setFormData({ ...formData, otp: newOTP });
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOTP = [...formData.otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOTP[i] = char;
    });
    setFormData({ ...formData, otp: newOTP });
    if (pastedData.length >= 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'request':
        return (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FiLock className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                {t('forgotPassword.title')}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                {t('forgotPassword.subtitle')}
              </p>
            </div>

            {/* Method Toggle */}
            <div className="flex gap-1.5 sm:gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  method === 'phone'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <FiPhone className="w-4 h-4" />
                {t('login.phone')}
              </button>
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  method === 'email'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <FiMail className="w-4 h-4" />
                {t('profile.email')}
              </button>
            </div>

            {method === 'email' ? (
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  {t('profile.email')}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                      errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>}
              </div>
            ) : (
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  {t('login.phone')}
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="98XXXXXXXX"
                    className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                      errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone}</p>}
              </div>
            )}

            {/* API Error Display */}
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
              </div>
            )}

            <Button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl"
            >
              {isLoading ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('forgotPassword.sendCode')
              )}
            </Button>
          </>
        );

      case 'verify':
        return (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FiPhone className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                {t('verification.verifyOTP')}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 break-all px-2">
                {t('forgotPassword.codeSentTo')} {method === 'email' ? formData.email : formData.phone}
              </p>
            </div>

            {/* OTP Input */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 text-center">
                {t('forgotPassword.enterOTP')}
              </label>
              <div className="flex gap-1.5 sm:gap-2 justify-center" onPaste={handleOTPPaste}>
                {formData.otp.map((digit, index) => (
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
                      errors.otp ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-red-500 text-xs sm:text-sm mt-2 text-center">{errors.otp}</p>}
            </div>

            {/* Resend OTP */}
            <div className="text-center mb-4 sm:mb-6">
              {resendTimer > 0 ? (
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  {t('forgotPassword.resendIn')} <span className="font-semibold text-blue-600 dark:text-blue-400">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 sm:gap-2 mx-auto"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  {t('verification.resendOTP')}
                </button>
              )}
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl"
            >
              {isLoading ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('verification.verifyOTP')
              )}
            </Button>

            <button
              onClick={() => setStep('request')}
              className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              {t('forgotPassword.changeMethod')} {method === 'email' ? t('profile.email').toLowerCase() : t('login.phone').toLowerCase()}
            </button>
          </>
        );

      case 'reset':
        return (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FiLock className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                {t('forgotPassword.createNewPassword')}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                {t('forgotPassword.newPasswordHint')}
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  {t('forgotPassword.newPassword')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder={t('forgotPassword.enterNewPassword')}
                    className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  {t('forgotPassword.confirmPassword')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={t('forgotPassword.confirmNewPassword')}
                    className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t('forgotPassword.passwordMustContain')}:</p>
                <ul className="text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                  <li className={`flex items-center gap-1.5 sm:gap-2 ${formData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <FiCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${formData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    {t('forgotPassword.atLeast8Chars')}
                  </li>
                  <li className={`flex items-center gap-1.5 sm:gap-2 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <FiCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    {t('forgotPassword.oneUppercase')}
                  </li>
                  <li className={`flex items-center gap-1.5 sm:gap-2 ${/[a-z]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <FiCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${/[a-z]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    {t('forgotPassword.oneLowercase')}
                  </li>
                  <li className={`flex items-center gap-1.5 sm:gap-2 ${/\d/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <FiCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${/\d/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    {t('forgotPassword.oneNumber')}
                  </li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl"
            >
              {isLoading ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('forgotPassword.resetPassword')
              )}
            </Button>
          </>
        );

      case 'success':
        return (
          <div className="text-center py-4 sm:py-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-bounce">
              <FiCheck className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
              {t('forgotPassword.successTitle')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
              {t('forgotPassword.successMessage')}
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl"
            >
              {t('forgotPassword.goToLogin')}
            </Button>
          </div>
        );
    }
  };

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
        {/* Back to Login */}
        {step !== 'success' && (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 sm:mb-6 font-medium"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
          {renderStep()}
        </div>

        {/* Progress Indicator */}
        {step !== 'success' && (
          <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
            {['request', 'verify', 'reset'].map((s, i) => (
              <div
                key={s}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  ['request', 'verify', 'reset'].indexOf(step) >= i
                    ? 'w-6 sm:w-8 bg-blue-600'
                    : 'w-1.5 sm:w-2 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
