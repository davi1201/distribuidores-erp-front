import api from '@/lib/api';

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await api.get('/products');
  return data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const createProduct = async (payload: any): Promise<Product> => {
  const { data } = await api.post('/products', payload);
  return data;
};

export const createProductBatch = async (payload: any): Promise<Product> => {
  const { data } = await api.post('/products/batch', payload);
  return data;
};

export const updateProduct = async (id: string, payload: any): Promise<Product> => {
  const { data } = await api.patch(`/products/batch/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const getSellableProducts = async (): Promise<Product[]> => {
  const { data } = await api.get('/products/sellable');
  return data;
};
