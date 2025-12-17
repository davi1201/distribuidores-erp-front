import api from '@/lib/api';
import { TaxProfile } from '../types';

export const getTaxProfiles = async (): Promise<TaxProfile[]> => {
  const { data } = await api.get('/tax-profiles');
  return data;
};

export const getTaxProfileById = async (id: string): Promise<TaxProfile> => {
  const { data } = await api.get(`/tax-profiles/${id}`);
  return data;
};

export const createTaxProfile = async (data: Omit<TaxProfile, 'id'>): Promise<TaxProfile> => {
  const { data: response } = await api.post('/tax-profiles', data);
  return response;
};

export const updateTaxProfile = async (
  id: string,
  data: Partial<TaxProfile>
): Promise<TaxProfile> => {
  const { data: response } = await api.patch(`/tax-profiles/${id}`, data);
  return response;
};

export const deleteTaxProfile = async (id: string): Promise<void> => {
  await api.delete(`/tax-profiles/${id}`);
};
