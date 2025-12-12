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

export interface TransferItem {
  id?: string; // Opcional na criação
  productId: string;
  productName?: string; // Auxiliar para UI
  quantity: number;
}

export interface StockTransfer {
  id: string;
  code: number;
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  requester: { name: string };
  origin: { id: string; name: string };
  destination: { id: string; name: string };
  items: {
    product: { name: string; sku: string; unit: string };
    quantity: number;
  }[];
}

export interface CreateTransferPayload {
  originWarehouseId: string;
  destinationWarehouseId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
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

export async function getStockProducts(params: { warehouseId?: string; search?: string }) {
  const { data } = await api.get('/stock/products', { params });
  return data;
}

export async function getTransfers() {
  const { data } = await api.get('/stock/transfers');
  return data as StockTransfer[];
}

export async function createTransfer(payload: CreateTransferPayload) {
  const { data } = await api.post('/stock/transfers', payload);
  return data;
}

export async function approveTransfer(transferId: string) {
  const { data } = await api.patch(`/stock/transfers/${transferId}/approve`);
  return data;
}

export async function completeTransfer(transferId: string) {
  const { data } = await api.patch(`/stock/transfers/${transferId}/complete`);
  return data;
}

export async function rejectTransfer(transferId: string) {
  // Caso implemente rejeição no backend
  const { data } = await api.patch(`/stock/transfers/${transferId}/reject`);
  return data;
}
