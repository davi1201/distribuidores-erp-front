import api from '@/lib/api';
import { PriceList } from '../types';

export type PriceListFormValues = {
  name: string;
  isActive: boolean;
};

export const getPriceLists = async (): Promise<PriceList[]> => {
  const { data } = await api.get('/price-lists');
  return data;
};

export const getPriceListById = async (id: string): Promise<PriceList> => {
  const { data } = await api.get(`/price-lists/${id}`);
  return data;
};

export const createPriceList = async (data: PriceListFormValues): Promise<PriceList> => {
  const { data: response } = await api.post('/price-lists', data);
  return response;
};

export const updatePriceList = async (
  id: string,
  data: PriceListFormValues
): Promise<PriceList> => {
  const { data: response } = await api.patch(`/price-lists/${id}`, data);
  return response;
};

export const deletePriceList = async (id: string): Promise<void> => {
  await api.delete(`/price-lists/${id}`);
};
