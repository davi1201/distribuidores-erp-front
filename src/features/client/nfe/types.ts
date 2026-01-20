export interface NfeInboxItem {
  id: string;
  accessKey: string;
  senderEmail: string;
  status: 'PENDING' | 'IMPORTED' | 'IGNORED' | 'ERROR';
  receivedAt: string;
  tenantId: string;
}

export type ACTION_TYPE = 'NEW' | 'LINK_XML_INDEX' | 'LINK_EXISTING' | 'LINK_VARIANT';

export interface NfeItem {
  index: number;
  code: string;
  name: string;
  ean: string | null;
  ncm: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  suggestedAction: ACTION_TYPE;
  suggestedTargetIndex?: number;
  supplierCode: string;
}

export interface Mapping {
  action: ACTION_TYPE;
  targetIndex?: number | null;
  targetId?: string;
  markup: number;
}

export interface NfeImportModalProps {
  opened: boolean;
  onClose: () => void;
  initialData?: any;
  onImportSuccess?: () => void;
}

export interface PaymentTerm {
  id: string;
  name: string;
  type: string;
  isFlexible: boolean;
  rules: { days: number; percent: number }[];
}

export interface FinancialConfig {
  generate: boolean;
  entryAmount: number;
  installmentsCount: number;
  daysInterval: number;
  firstDueDate: Date | null;
  paymentMethod: string;
  paymentTermId?: string | null;
}
