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
