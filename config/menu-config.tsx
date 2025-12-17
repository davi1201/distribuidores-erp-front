import {
  IconDashboard,
  IconUsers,
  IconBox,
  IconReceipt2,
  IconSettings,
  IconChartBar,
  IconTruckDelivery,
  IconCreditCard,
  IconCurrencyReal,
  IconPercentage,
  IconShoppingBag,
  IconPackages,
  IconPlus,
  IconCashRegister,
  IconPackage,
  IconFile,
  IconFileDownloadFilled,
  IconFileCheck,
  IconFileTypeXml,
  IconFileDownload,
  IconHistory
} from '@tabler/icons-react';

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'SELLER' | 'SUPPORT';

export interface MenuItem {
  label: string;
  href?: string; // Opcional se tiver submenus
  icon: React.FC<any>;
  allowedRoles?: UserRole[];
  links?: MenuItem[]; // Submenus
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard', // Mapeia para (dashboard)/dashboard/page.tsx
    icon: IconDashboard,
  },
  {
    label: 'Catálogo',
    href: '/catalog/products', // Acesso rápido ao catálogo
    icon: IconShoppingBag,
    allowedRoles: ['SELLER']
  },
  {
    label: 'Vendas',
    icon: IconCreditCard,
    href: '/sales', // PDV (Ponto de Venda)
    allowedRoles: ['OWNER', 'ADMIN', 'SELLER'],
    links: [
      { label: 'Nova Venda (PDV)', href: '/sales', icon: IconCashRegister },
      { label: 'Histórico de Pedidos', href: '/sales/orders', icon: IconHistory },
    ]
  },
  {
    label: 'Estoque',
    icon: IconPackages,
    allowedRoles: ['OWNER', 'ADMIN', 'SELLER'],
    links: [
      { label: 'Movimentações', href: '/inventory/stock', icon: IconPackage },
      { label: 'Fornecedores', href: '/inventory/suppliers', icon: IconTruckDelivery, allowedRoles: ['OWNER', 'ADMIN'] },
    ]
  },
  {
    label: 'Cadastros',
    icon: IconPlus,
    allowedRoles: ['OWNER', 'ADMIN', 'SELLER'],
    links: [
      { label: 'Clientes', href: '/crm/clients', icon: IconUsers },
      { label: 'Produtos', href: '/catalog/products', icon: IconShoppingBag, allowedRoles: ['OWNER', 'ADMIN'] },
      { label: 'Categorias', href: '/catalog/categories', icon: IconBox, allowedRoles: ['OWNER', 'ADMIN'] },
      { label: 'Tabelas de Preço', href: '/catalog/price-lists', icon: IconCurrencyReal, allowedRoles: ['OWNER', 'ADMIN'] },
    ]
  },
  {
    label: 'Financeiro',
    icon: IconCashRegister,
    allowedRoles: ['OWNER', 'ADMIN'],
    links: [
      { label: 'Contas a Receber', href: '/financial/receivables', icon: IconReceipt2 },
      { label: 'Contas a Pagar', href: '/financial/payables', icon: IconReceipt2 }, // Ajuste o nome da pasta para 'payables' no futuro para padronizar
      { label: 'Formas de Pagamento', href: '/financial/settings/payment-terms', icon: IconCreditCard },
      { label: 'Perfis Fiscais', href: '/financial/settings/tax-profiles', icon: IconPercentage },
    ]
  },
  {
    label: 'NFE',
    icon: IconFileTypeXml,
    allowedRoles: ['OWNER', 'ADMIN'],
    links: [
      { label: 'Importar XML', href: '/inventory/nfe/inbox', icon: IconFileDownload },
      { label: 'Emitir Nota', href: '/inventory/nfe/emit', icon: IconFileCheck },
    ]
  },
  {
    label: 'Relatórios',
    href: '/backoffice/dashboard', // Ou crie uma rota especifica em (dashboard)/reports
    icon: IconChartBar,
    allowedRoles: ['OWNER', 'ADMIN'],
  },
  {
    label: 'Configurações',
    icon: IconSettings,
    allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'],
    links: [
      { label: 'Equipe', href: '/settings/team', icon: IconUsers },
      { label: 'Assinatura', href: '/settings/billing', icon: IconSettings },
      { label: 'Meu Perfil', href: '/settings/profile', icon: IconUsers },
    ]
  },
];