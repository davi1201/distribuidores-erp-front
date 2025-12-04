import api from '@/lib/api';

export const getStates = async () => {
  const { data } = await api.get('/locations/states');
  return data;
};

export const getCities = async (uf: string) => {
  if (!uf) return [];
  const { data } = await api.get(`/locations/cities/${uf}`);
  return data;
};