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
  FiArrowRight,
  FiArrowLeft,
  FiAlertCircle,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiCheck
} from 'react-icons/fi';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

type SignupStep = 'form' | 'otp' | 'success';

export default function SignupPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<SignupStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone_no: '',
    business_name: '',
  });
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Clear API error when form data changes
  useEffect(() => {
    if (apiError) {
      setApiError(null);
    }
  }, [formData, otp]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.email) {
      newErrors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    } else if (!/^[^\s@]+@[^\s@]+\.(com|org|net|edu|gov|io|co|in|uk|us|info)$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email with a recognized domain';
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.required');
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (!@#$%^&*)';
    }
    
    if (!formData.phone_no) {
      newErrors.phone_no = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone_no)) {
      newErrors.phone_no = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.business_name) {
      newErrors.business_name = 'Business name is required';
    } else if (formData.business_name.length < 2) {
      newErrors.business_name = 'Business name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Move to OTP step
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
      } else {
        // Handle Django validation errors
        let errorMessage = 'Signup failed';
        if (data.error) {
          errorMessage = data.error;
        } else if (data.username) {
          errorMessage = data.username[0];
        } else if (data.email) {
          errorMessage = data.email[0];
        } else if (data.password) {
          errorMessage = data.password[0];
        }
        setApiError(errorMessage);
      }
    } catch (err) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setApiError('Please enter the complete 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify-signup-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otpCode,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Show success and redirect to login
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setApiError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOtp(['', '', '', '', '', '']);
        setApiError(null);
      } else {
        setApiError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToForm = () => {
    setStep('form');
    setOtp(['', '', '', '', '', '']);
    setApiError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme/Language Switchers */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className={`w-full max-w-md transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">Pasale</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">{t('welcome.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
          {step === 'form' && (
            <>
              <div className="text-center mb-5 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                  Create Account
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Fill in your details to get started
                </p>
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="johndoe"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.username 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('profile.email')}
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.email 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone_no}
                      onChange={(e) => setFormData({ ...formData, phone_no: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="98XXXXXXXX"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.phone_no 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.phone_no && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone_no}</p>
                  )}
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Business Name
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="My Business"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.business_name 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.business_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('login.password')}
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 ${
                        errors.password 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
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
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link 
                    to="/login"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              {/* OTP Verification Step */}
              <div className="text-center mb-5 sm:mb-6 lg:mb-8">
                <button
                  onClick={goBackToForm}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back</span>
                </button>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                  Verify Email
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code sent to <br />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formData.email}</span>
                </p>
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {/* OTP Input */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify Email
                      <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Account Created!
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                Your account has been verified successfully.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Redirecting to login...
              </p>
            </div>
          )}
        </div>

        {/* Info message */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 text-center">
            <span className="font-semibold">Note:</span> OTP will be sent to your email address for verification
          </p>
        </div>
      </div>
    </div>
  );
}
