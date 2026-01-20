export type TitleStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'CANCELED' | 'OVERDUE';

export interface FinancialMovement {
  id: string;
  type: 'PAYMENT' | 'REVERSAL' | 'INTEREST' | 'DISCOUNT';
  amount: number;
  paymentDate: string;
  user?: { name: string };
  observation?: string;
  createdAt: string;
}

export interface FinancialTitle {
  supplier: any;
  id: string;
  titleNumber: string;
  description?: string;
  customer?: { name: string };
  originalAmount: number;
  balance: number; // Saldo devedor atual
  issueDate: string;
  dueDate: string;
  status: TitleStatus;
  paymentMethod: { name: string };
  movements?: FinancialMovement[];
}

export interface RegisterPaymentPayload {
  titleId: string;
  amount: number;
  paymentDate: Date;
  interest?: number;
  discount?: number;
  observation?: string;
}

export interface FinancialFilters {
  type: 'RECEIVABLE' | 'PAYABLE';
  status?: string;
  customerId?: string;
  startDate?: string; // Alterado para string (ISO date)
  endDate?: string; // Alterado para string (ISO date)
}

export interface FinancialFilterValues {
  search: string;
  status: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface FinancialListFiltersProps {
  onApply: (filters: FinancialFilterValues) => void;
  isLoading?: boolean;
}

export interface TitleDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  titleId: string | null;
}

export interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  title: FinancialTitle | null;
}
