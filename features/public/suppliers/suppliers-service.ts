import api from '@/lib/api';

export interface Supplier {
  id: string;
  name: string;
  corporateName?: string;
  document: string;
  email?: string;
  phone?: string;
  isActive: boolean;

  // Endereço
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  ibgeCode?: string;
}

// O DTO de envio pode ter endereço aninhado ou flat, aqui vamos padronizar para flat no envio
export type CreateSupplierPayload = Omit<Supplier, 'id' | 'isActive'>;

export const getSuppliers = async (): Promise<Supplier[]> => {
  const { data } = await api.get('/suppliers');
  return data;
};

export const getSupplierById = async (id: string): Promise<Supplier> => {
  const { data } = await api.get(`/suppliers/${id}`);
  return data;
};

export const createSupplier = async (payload: CreateSupplierPayload) => {
  const { data } = await api.post('/suppliers', payload);
  return data;
};

export const updateSupplier = async (id: string, payload: Partial<CreateSupplierPayload>) => {
  const { data } = await api.patch(`/suppliers/${id}`, payload);
  return data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await api.delete(`/suppliers/${id}`);
};
