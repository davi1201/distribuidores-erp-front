import { useApiClient } from '@/shared/hooks/use-api-client';

const api = useApiClient();

export const getSecret = async (payload: StripeCheckoutProps): Promise<any> => {
  const { data } = await api.post('/payment/checkout', payload);
  return data;
};
