import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserType = 'personal' | 'business' | null;

interface BusinessDetails {
    businessName?: string;
    panNumber?: string;
    ownerName?: string;
}

interface BusinessState {
    userType: UserType;
    businessName: string;
    panNumber: string;
    ownerName: string; // Used for both Business Owner and Personal Name
    isVerified: boolean;
    setupComplete: boolean;
    profileImage?: string; // New: For personal profile
    businessDetails: BusinessDetails | null;

    setUserType: (type: UserType) => void;
    setBusinessDetails: (details: { businessName: string; panNumber: string; ownerName: string }) => void;
    setPersonalDetails: (details: { ownerName: string; profileImage?: string }) => void;
    reset: () => void;
}

export const useBusinessStore = create<BusinessState>()(
    persist(
        (set) => ({
            userType: null,
            businessName: '',
            panNumber: '',
            ownerName: '',
            isVerified: false,
            setupComplete: false,
            businessDetails: null,

            setUserType: (type) => set({ userType: type }),

            setBusinessDetails: (details) =>
                set({ 
                    ...details, 
                    isVerified: true, 
                    setupComplete: true,
                    businessDetails: details 
                }),

            setPersonalDetails: (details) =>
                set({ ...details, isVerified: true, setupComplete: true, businessName: 'Personal Account' }),

            reset: () => set({
                userType: null,
                businessName: '',
                panNumber: '',
                ownerName: '',
                isVerified: false,
                setupComplete: false,
                profileImage: undefined,
                businessDetails: null
            }),
        }),
        {
            name: 'business-store',
        }
    )
);
