// --- ENUMS (Espelho do Backend) ---

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  HYBRID = 'HYBRID',
}

export enum CommissionStatus {
  PENDING = 'PENDING', // Pendente (Futuro)
  APPROVED = 'APPROVED', // Aprovado (Disponível)
  PAID = 'PAID', // Pago (Histórico)
  CANCELED = 'CANCELED', // Cancelado
}

export enum CommissionScope {
  GLOBAL = 'GLOBAL',
  SELLER = 'SELLER',
  PRODUCT = 'PRODUCT',
}

// --- INTERFACES DE DADOS ---

export interface CommissionRule {
  id: string;
  name: string;
  scope: CommissionScope;
  type: CommissionType;

  // Valores podem vir como string do backend se for Decimal,
  // mas tipamos como number para facilitar calculos no front se o serializador converter.
  percentage?: number;
  fixedValue?: number;

  isActive: boolean;
  specificUserId?: string;
  specificProductId?: string;

  createdAt: string; // ISO Date
}

export interface CommissionRecord {
  id: string;
  status: CommissionStatus;

  // Valores Financeiros
  calculationBase: number; // Valor da Venda (Base)
  appliedPercentage: number; // Taxa efetiva aplicada
  commissionAmount: number; // Valor final da comissão

  referenceDate: string; // Data da venda
  dueDate?: string; // Previsão de pagamento
  paidAt?: string; // Data do pagamento real

  // Relacionamento expandido (útil para o extrato)
  order?: {
    code: number;
    customerName: string;
  };
}

export interface SellerMetrics {
  pendingBalance: number; // A receber (Futuro)
  availableBalance: number; // Disponível para saque
  totalPaid: number; // Já pago
  totalCanceled: number; // Perdido
}

// --- DTOs (Payloads de Envio) ---

export interface CreateCommissionRuleDTO {
  name: string;
  scope: CommissionScope;
  type: CommissionType;
  percentage?: number;
  fixedValue?: number;
  specificUserId?: string; // Opcional: ID do vendedor
  specificProductId?: string; // Opcional: ID do produto
}

export interface CommissionStatementParams {
  page?: number;
  sellerId?: string; // Opcional, usado apenas pelo Admin
}
