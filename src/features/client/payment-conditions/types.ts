interface PaymentTermRule {
  days: number;
  percent: number;
}

interface PaymentTerm {
  id: string;
  name: string;
  description?: string;
  type: 'PAYABLE' | 'RECEIVABLE' | 'BOTH';
  rules: PaymentTermRule[];
  isFlexible: boolean;
  isActive: boolean;
}

// Tipos baseados no DTO do backend
interface PaymentTermRule {
  days: number;
  percent: number;
}

interface PaymentTermFormValues {
  name: string;
  description: string;
  type: 'PAYABLE' | 'RECEIVABLE' | 'BOTH';
  isFlexible: boolean; // Define se permite edição manual na venda
  rules: PaymentTermRule[];
}

interface PaymentTermFormProps {
  initialValues?: PaymentTermFormValues;
  onSuccess?: () => void;
  onCancel?: () => void;
}
