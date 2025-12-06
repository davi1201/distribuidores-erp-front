import api from '@/lib/api';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export interface Warehouse {
  id: string;
  name: string;
  isDefault: boolean;
  responsibleUserId?: string;
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

export interface TransferStockPayload {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason?: string;
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

export const getWarehouses = async (): Promise<Warehouse[]> => {
  // Certifique-se de criar esta rota no seu StockController backend (GET /stock/warehouses)
  const { data } = await api.get('/stock/warehouses');
  return data;
};

export const createWarehouse = async (payload: { name: string; responsibleUserId?: string }) => {
  // Rota genérica para criar depósitos (POST /stock/warehouses)
  const { data } = await api.post('/stock/warehouses', payload);
  return data;
};

export const transferStock = async (payload: TransferStockPayload) => {
  const { data } = await api.post('/stock/transfer', payload);
  return data;
};