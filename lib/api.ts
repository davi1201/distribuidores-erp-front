import { useBillingStore } from '@/store/billing/use-billing-store';
import axios from 'axios';
import { notifications } from '@mantine/notifications'; // Importação necessária

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // <--- ISSO É OBRIGATÓRIO PARA COOKIES
});

api.interceptors.response.use(
  (response) => response,
  (error) => {    
    if (error.response) {
      const { status, data } = error.response;
      
      // CASO 1: Bloqueio por Pagamento (BillingGuard)
      if (status === 403 && data?.code === 'BILLING_REQUIRED') {        
        useBillingStore.getState().openBillingModal(data.planId);
        if (data.isProfileComplete !== undefined) {
          useBillingStore.getState().setIsProfileComplete(data.isProfileComplete);
        }       
        // Retornamos aqui para não mostrar o toast de "Sem Permissão" abaixo
        return Promise.reject(error);
      }

      // CASO 2: Bloqueio de Permissão (RolesGuard / PermissionsGuard)
      // Ex: Vendedor tentando deletar cliente
      if (status === 403) {
        notifications.show({
          title: 'Acesso Negado',
          message: data?.message || 'Você não tem permissão para realizar esta ação.',
          color: 'red',
          autoClose: 5000,
        });
      }

      // CASO 3: Erro de Autenticação (Token expirado/inválido)
      if (status === 401) {
        // Opcional: Redirecionar para login ou avisar
        // window.location.href = '/login'; 
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;