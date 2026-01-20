export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  SEPARATION = 'SEPARATION', // Em separação
  INVOICED = 'INVOICED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
}

// Interface simplificada para a Listagem (Tabela)
export interface SaleListItem {
  commissionRecord: any;
  id: string;
  code: number; // Código amigável (ex: 1023)
  status: OrderStatus;
  total: number;
  createdAt: string; // Vem como string ISO do backend

  customer: {
    [x: string]: string;
    name: string;
  };

  seller?: {
    name: string;
  } | null;

  _count: {
    items: number;
  };
}

// Interface detalhada para a Visualização Única (Detalhes)
export interface SaleDetails extends SaleListItem {
  subtotal: number;
  discount: number;
  shipping: number;
  totalIcms: number;
  totalIpi: number;

  // Endereço e Cliente completos
  customer: {
    id: string;
    name: string;
    document: string;
    email: string;
    phone?: string;
  };

  // Itens do Pedido
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      name: string;
      sku: string;
      images: Array<{ url: string }>;
    };
  }>;
}
