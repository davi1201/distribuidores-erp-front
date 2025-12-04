import { create } from 'zustand';

interface AppState {  
  isSubscriptionWizardOpen: boolean;
  openSubscriptionWizard: () => void;
  closeSubscriptionWizard: () => void;  
}

export const useAppStore = create<AppState>((set) => ({
  isSubscriptionWizardOpen: false,
  openSubscriptionWizard: () => set({ isSubscriptionWizardOpen: true }),
  closeSubscriptionWizard: () => set({ isSubscriptionWizardOpen: false }),
}));