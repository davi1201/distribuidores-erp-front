import api from '@/lib/api';

// Busca a configuração atual
export const getTenantEmailConfig = async (): Promise<TenantEmailConfig> => {
  const { data } = await api.get('/tenants/email-config');
  return data;
};

// Salva/Atualiza a configuração
export const saveTenantEmailConfig = async (config: Omit<TenantEmailConfig, 'isActive'>) => {
  const { data } = await api.post('/tenants/email-config', config);
  return data;
};

export const testTenantEmailConnection = async () => {
  // Chama o endpoint de teste no backend
  const { data } = await api.post('/tenants/email-test-connection');
  return data;
};
