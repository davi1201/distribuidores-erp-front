import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useBillingStore } from '../../store/billing/use-billing-store';

// Variável para armazenar a função de pegar token (Injetada pelo React)
let getTokenFn: (() => Promise<string | null>) | null = null;

// Função exportada para ser chamada no Layout
export const registerTokenProvider = (fn: () => Promise<string | null>) => {
  getTokenFn = fn;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // withCredentials: true // Removido ou false, pois Clerk usa Bearer Header, não Cookie HttpOnly cross-site por padrão em API separada
});

// --- REQUEST INTERCEPTOR (Autenticação) ---
api.interceptors.request.use(
  async (config) => {
    if (getTokenFn) {
      // Chama a função do Clerk. Ela verifica se o token expirou e faz refresh automático se necessário.
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR (Erros Globais) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // CASO 1: Bloqueio por Pagamento
      if (status === 403 && data?.code === 'BILLING_REQUIRED') {
        useBillingStore.getState().openBillingModal(data.planId);
        if (data.isProfileComplete !== undefined) {
          useBillingStore.getState().setIsProfileComplete(data.isProfileComplete);
        }
        return Promise.reject(error);
      }

      // CASO 2: Bloqueio de Permissão
      if (status === 403) {
        notifications.show({
          title: 'Acesso Negado',
          message: data?.message || 'Você não tem permissão para realizar esta ação.',
          color: 'red',
          autoClose: 5000,
        });
      }

      // CASO 3: Erro de Autenticação
      if (status === 401) {
        // O Clerk geralmente lida com redirect no middleware, mas se a API rejeitar, podemos forçar
        // window.location.href = '/sign-in';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
