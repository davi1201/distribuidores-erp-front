import api from '@/lib/api';

export interface DashboardData {
  stats: {
    revenue: number;
    ordersCount: number;
    customers: number;
    growth: number;
  };
  salesChart: Array<{ date: string; value: number }>;
  recentSales: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const { data } = await api.get('/dashboard/overview');
  return data;
};