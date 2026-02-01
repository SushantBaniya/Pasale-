import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserType = 'personal' | 'business' | null;

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  photo: string | null;
  panNumber?: string;
  businessName?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  userType: UserType;
  isProfileComplete: boolean;
  isBusinessVerified: boolean;
  userProfile: UserProfile;
  accessToken: string | null;
  refreshToken: string | null;
  login: () => void;
  logout: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setUserType: (type: UserType) => void;
  setProfileComplete: (complete: boolean) => void;
  setBusinessVerified: (verified: boolean) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      onboardingComplete: false,
      userType: null,
      isProfileComplete: false,
      isBusinessVerified: false,
      userProfile: {
        name: 'Demo User Admin',
        email: 'demo@pasale.com',
        phone: '9812345678',
        photo: null,
      },
      accessToken: null,
      refreshToken: null,
      login: () => set({ isAuthenticated: true }),
      logout: () =>
        set({
          isAuthenticated: false,
          onboardingComplete: false,
          userType: null,
          isProfileComplete: false,
          isBusinessVerified: false,
          userProfile: {
            name: 'Demo User Admin',
            email: 'demo@pasale.com',
            phone: '9812345678',
            photo: null,
          },
          accessToken: null,
          refreshToken: null,
        }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false }),
      setUserType: (userType) => set({ userType }),
      setProfileComplete: (isProfileComplete) => set({ isProfileComplete }),
      setBusinessVerified: (isBusinessVerified) => set({ isBusinessVerified }),
      updateUserProfile: (profile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile },
        })),
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken, isAuthenticated: true }),
      clearTokens: () => 
        set({ accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

