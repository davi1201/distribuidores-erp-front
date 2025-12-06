import api from '@/lib/api';

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
  id: string;
  titleNumber: string;
  description?: string;
  customer?: { name: string };
  originalAmount: number;
  balance: number; // Saldo devedor atual
  issueDate: string;
  dueDate: string;
  status: TitleStatus;
  paymentMethod?: string;
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
  status?: string;
  customerId?: string;
  startDate?: string; // Alterado para string (ISO date)
  endDate?: string;   // Alterado para string (ISO date)
}

// --- API CALLS ---

export const getFinancialTitles = async (filters?: FinancialFilters): Promise<FinancialTitle[]> => {
  // O Axios serializa automaticamente o objeto params para query string:
  // ?startDate=2023-01-01&endDate=2023-01-31&status=OPEN
  const { data } = await api.get('/financial/titles', { params: filters });
  return data;
};

export const getFinancialTitleById = async (id: string): Promise<FinancialTitle> => {
  const { data } = await api.get(`/financial/titles/${id}`);
  return data;
};

export const registerPayment = async (payload: RegisterPaymentPayload) => {
  const { data } = await api.post('/financial/payments', payload);
  return data;
};