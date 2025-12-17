import api from '@/lib/api';
import { FinancialFilters, FinancialTitle, RegisterPaymentPayload } from '../types';

// --- API CALLS ---

export const getFinancialTitles = async (filters?: FinancialFilters): Promise<FinancialTitle[]> => {
  // O Axios serializa automaticamente o objeto params para query string:
  // ?startDate=2023-01-01&endDate=2023-01-31&status=OPEN
  const { data } = await api.get('/financial/titles', { params: filters });
  return data;
};

export const getFinancialTitleById = async (id: string): Promise<FinancialTitle> => {
  const { data } = await api.get(`/financial/titles/${id}`);
  return data;
};

export const registerPayment = async (payload: RegisterPaymentPayload) => {
  const { data } = await api.post('/financial/movements', payload);
  return data;
};
