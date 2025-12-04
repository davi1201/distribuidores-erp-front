import { create } from 'zustand';

interface BillingState {
  isOpen: boolean;
  suggestedPlanId: string | null;
  isProfileComplete: boolean;
  openBillingModal: (planId?: string) => void;
  closeBillingModal: () => void;
  setIsProfileComplete: (isProfileComplete: boolean) => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  isOpen: false,
  suggestedPlanId: null,
  isProfileComplete: false,
  openBillingModal: (planId) => set({ isOpen: true, suggestedPlanId: planId || null }),
  closeBillingModal: () => set({ isOpen: false }),
  setIsProfileComplete: (isProfileComplete: boolean) => set({ isProfileComplete }),
}));