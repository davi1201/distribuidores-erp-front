export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | 'SUPPORT';
  permissions: string[]; // Array de strings vindo do backend
  createdAt: string;
}

export const AVAILABLE_PERMISSIONS = [
  { group: 'Clientes', label: 'Cadastrar Clientes', value: 'customers.create' },
  { group: 'Clientes', label: 'Editar Clientes', value: 'customers.edit' },
  { group: 'Clientes', label: 'Excluir Clientes', value: 'customers.delete' },
  
  { group: 'Vendas', label: 'Criar Pedidos', value: 'orders.create' },
  { group: 'Vendas', label: 'Aprovar Descontos', value: 'orders.approve_discount' },
  
  { group: 'Financeiro', label: 'Ver Relatórios', value: 'financial.view' },
];