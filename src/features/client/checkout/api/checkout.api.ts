import { useApiClient } from '@/shared/hooks/use-api-client';

export const getSecret = async (payload: StripeCheckoutProps): Promise<any> => {
  const api = useApiClient();
  const { data } = await api.post('/payment/checkout', payload);
  return data;
};
