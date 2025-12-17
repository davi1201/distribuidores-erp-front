import api from '@/lib/api';

export interface UpdateBillingProfileType {
  personType: 'PF' | 'PJ';
  document: string; 
  phone: string;  
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const updateTenant = async (payload: UpdateBillingProfileType) => {
  const { data } = await api.patch('/tenants/update',  payload );
  return data;
};

export const updateTenantBillingProfile = async (tenantId: string, payload: any) => {
  const { data } = await api.put(`/tenants/${tenantId}/billing-profile`, payload);
  return data;
};