export enum PersonType {
  PF = 'PF',
  PJ = 'PJ',
}

export interface CustomerAddress {
  id?: string; // Opcional na criação
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  categoryId: string; // ID da categoria (Padrão, Entrega...)
  complement?: string;
}

export interface CustomerContact {
  id?: string;
  name: string;
  phone: string;
  role?: string;
}

export interface CustomerAttachment {
  id: string;
  name: string;
  url: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  code: number;
  name: string;
  email: string;
  phone?: string;
  document: string;
  personType: PersonType;
  isActive: boolean;
  
  // PJ
  corporateName?: string;
  tradeName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  isExempt?: boolean;

  // Fiscal
  isFinalConsumer: boolean;
  isICMSContributor: boolean;
  invoiceNotes?: string;

  // Configurações Financeiras / Vendas
  creditLimit?: number;
  allowExceedLimit?: boolean;
  priceListId?: string;
  paymentConditionId?: string;
  sellerId?: string;

  // Relacionamentos
  addresses: CustomerAddress[];
  contacts: CustomerContact[];
  attachments?: CustomerAttachment[];
}


export interface CustomerFormValues extends Omit<Customer, 'id' | 'code' | 'addresses' | 'contacts' | 'attachments'> {
  id?: string;
  addresses: CustomerAddress[];
  contacts: CustomerContact[];
  
  attachments?: any[]; 
}

export interface CustomerCategory {
  id: string;
  description: string;
  isActive: boolean;
  tenantId: string;
}

export interface AddressCategory {
  id: string;
  description: string;
  isActive: boolean;
  tenantId: string;
}
