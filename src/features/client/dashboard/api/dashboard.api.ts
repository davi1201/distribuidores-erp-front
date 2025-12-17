import api from '@/lib/api';

export const getDashboardData = async (): Promise<DashboardData> => {
  const { data } = await api.get('/dashboard/overview');
  return data;
};
