import api from '@/lib/api';
import {
  CreateMovementPayload,
  CreateTransferPayload,
  StockMovement,
  StockTransfer,
  Warehouse,
} from '../types';

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
