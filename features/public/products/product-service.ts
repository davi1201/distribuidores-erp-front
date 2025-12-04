import api from '@/lib/api';

// --- TIPOS ---

export interface ProductImage {
  id?: string;
  url: string;
  order: number;
}

export interface ProductPrice {
  priceListId: string;
  price: number;
}

export interface StockItem {
  quantity: number;
  minStock: number;
  maxStock?: number;
}

export interface Product {
  totalStock: number;
  variants: any[];
  id: string;
  name: string;
  sku: string;
  ean?: string;
  brand?: string;
  unit: string;
  description?: string;
  
  // Fiscal
  ncm: string;
  cest?: string;
  cfop?: string;
  origin: number;
  taxProfileId?: string;

  // Custos
  costPrice: number;
  expenses: number;
  markup: number;

  // Relacionamentos
  images: ProductImage[];
  prices: ProductPrice[];
  stock?: StockItem; // Pode vir como array ou objeto dependendo do back, ajustamos para objeto único por enquanto
  isActive: boolean;
}

// --- SERVICE ---

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

export const updateProduct = async (id: string, payload: any): Promise<Product> => {
  const { data } = await api.patch(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};