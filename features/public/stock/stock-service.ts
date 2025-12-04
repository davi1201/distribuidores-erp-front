import api from '@/lib/api';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export interface StockMovement {
  id: string;
  type: MovementType;
  quantity: number;
  reason: string;
  documentReference?: string;
  costPrice: number;
  balanceAfter: number;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface CreateMovementPayload {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  documentReference?: string;
}

export const createStockMovement = async (payload: CreateMovementPayload) => {
  const { data } = await api.post('/stock/movement', payload);
  return data;
};

export const getProductHistory = async (productId: string): Promise<StockMovement[]> => {
  const { data } = await api.get(`/stock/product/${productId}/history`);
  return data;
};

export const getProductBalance = async (productId: string) => {
  const { data } = await api.get(`/stock/product/${productId}/balance`);
  return data;
};