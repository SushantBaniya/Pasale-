/**
 * useAuth Hook
 * 
 * Simple hook to access auth store state and actions.
 */

import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';

// Define the user profile type locally
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  photo: string | null;
  panNumber?: string;
}

interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  user: UserProfile;
  onboardingComplete: boolean;

  // Actions
  loginState: () => void;
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  // OTP Actions
  sendOTP: (data: any) => Promise<boolean>;
  verifyOTP: (data: any) => Promise<boolean>;
  error: { message: string } | null;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const authStore = useAuthStore();

  const logout = useCallback(() => {
    // Clear tokens from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    authStore.logout();
  }, [authStore]);

  const [error, setError] = useState<{ message: string } | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const sendOTP = useCallback(async (data: any) => {
    // Mock API call
    setError(null);
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }, []);

  const verifyOTP = useCallback(async (data: any) => {
    // Mock API call
    setError(null);
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        if (data.otp === '123456') {
          resolve(true);
        } else {
          setError({ message: 'Invalid OTP. Try 123456' });
          resolve(false);
        }
      }, 1000);
    });
  }, []);

  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.userProfile,
    onboardingComplete: authStore.onboardingComplete,
    loginState: authStore.login,
    logout,
    updateUserProfile: authStore.updateUserProfile,
    completeOnboarding: authStore.completeOnboarding,
    sendOTP,
    verifyOTP,
    error,
    clearError
  };
}

export default useAuth;
