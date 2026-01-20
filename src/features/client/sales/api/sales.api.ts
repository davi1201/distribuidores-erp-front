import api from '@/lib/api'; // Sua instância configurada do Axios
import { OrderStatus, SaleDetails, SaleListItem } from '../types';

// Ajuste a rota base se no backend for '/orders'
const BASE_URL = '/sales';

export const getSales = async (): Promise<SaleListItem[]> => {
  const { data } = await api.get(BASE_URL);
  return data;
};

export const getSaleById = async (id: string): Promise<SaleDetails> => {
  const { data } = await api.get(`${BASE_URL}/${id}`);
  return data;
};

export const updateSaleStatus = async (id: string, status: OrderStatus): Promise<void> => {
  await api.patch(`${BASE_URL}/status/${id}`, { status });
};

export const approveManualCommission = async (orderId: string): Promise<void> => {
  await api.patch(`${BASE_URL}/approve-manual-commission/${orderId}`);
};
