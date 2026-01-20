import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import api from '@/lib/api'; // Sua instância do Axios configurada com withCredentials: true
import { UserRole } from '../../types/auth';

// Definição do Tipo de Usuário (O que o backend retorna)
export interface User {
  neighborhood: string;
  complement: string;
  number: string;
  street: string;
  zipCode: string;
  billingPhone: string;
  billingEmail: string;
  tenantName: string;
  isTrial: boolean;
  billingCycle: 'monthly' | 'annual';
  phone: any;
  state: any;
  city: any;
  address: any;
  document: any;
  companyName: string;
  status: string;
  avatarUrl: string | null | undefined;
  planName: any;
  planSlug: any;
  planMaxUsers: number;
  trialEndsAt: any;
  subscriptionEndsAt: any;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  expiresTrialDate: string;
  isTrialExpired: boolean;
  isProfileComplete: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Erro ao fazer logout no servidor', error);
        } finally {
          set({ user: null, isLoading: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/users/me');
          set({ user: data });
        } catch (error) {
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({ user: state.user }),
    }
  )
);
