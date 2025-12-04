import { useBillingStore } from '@/store/billing/use-billing-store';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // <--- ISSO É OBRIGATÓRIO PARA COOKIES
});


api.interceptors.response.use(
  (response) => response,
  (error) => {    
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 403 && data?.code === 'BILLING_REQUIRED') {        
        useBillingStore.getState().openBillingModal(data.planId);
        if (data.isProfileComplete !== undefined) {
          useBillingStore.getState().setIsProfileComplete(data.isProfileComplete);
        }       
      }
    }
    return Promise.reject(error);
  }
);

export default api;