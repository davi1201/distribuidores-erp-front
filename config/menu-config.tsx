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
  IconFileDownload
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
    href: '/dashboard',
    icon: IconDashboard,
  },
  { label: 'Produtos', href: '/registrations/products', icon: IconShoppingBag, allowedRoles: ['SELLER'] },
  {
    label: 'Vendas',
    icon: IconCreditCard,
    href: '/registrations/sales', // Pode ser direto ou ter submenus
    allowedRoles: ['OWNER', 'ADMIN', 'SELLER'],
  },
  {
    label: 'Estoque',
    href: '/registrations/stock',
    icon: IconPackages,
    allowedRoles: ['OWNER', 'ADMIN', 'SELLER'],
    links: [
      { label: 'Depósitos e transferências', href: '/registrations/stock', icon: IconPackage, allowedRoles: ['OWNER', 'ADMIN', 'SELLER'] },
    ]
  },
  {
    label: 'Cadastros',
    icon: IconPlus,
    allowedRoles: ['OWNER', 'ADMIN', 'SELLER'],
    links: [
      { label: 'Clientes', href: '/registrations/clients', icon: IconUsers, allowedRoles: ['OWNER', 'ADMIN', 'SELLER'] },
      { label: 'Fornecedores', href: '/registrations/suppliers', icon: IconTruckDelivery, allowedRoles: ['OWNER', 'ADMIN'] },
      { label: 'Produtos', href: '/registrations/products', icon: IconShoppingBag, allowedRoles: ['OWNER', 'ADMIN'] },
      { label: 'Listas de Preço', href: '/registrations/price-lists', icon: IconCurrencyReal, allowedRoles: ['OWNER', 'ADMIN'] }, // Vendedor não edita tabela
      { label: 'Taxas e Impostos', href: '/registrations/tax-profiles', icon: IconPercentage, allowedRoles: ['OWNER', 'ADMIN'] },
    ]
  },
  {
    label: 'Financeiro',
    icon: IconCashRegister,
    allowedRoles: ['OWNER', 'ADMIN', 'SELLER'],
    links: [
      { label: 'Contas a Receber', href: '/registrations/financial', icon: IconReceipt2, },
      // Futuro: { label: 'Contas a Pagar', href: '/backoffice/payables', icon: ... }
    ]
  },
  {
    label: 'NFE',
    href: '/backoffice/reports',
    icon: IconFileTypeXml,
    allowedRoles: ['OWNER', 'ADMIN'],
    links: [
      { label: 'Importar notas', href: '/nfe/inbox', icon: IconFileDownload },
    ]
  },
  {
    label: 'Relatórios',
    href: '/backoffice/reports',
    icon: IconChartBar,
    allowedRoles: ['OWNER', 'ADMIN'],
  },
  {
    label: 'Configurações',
    icon: IconSettings,
    allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'],
    links: [
      { label: 'Equipe / Representantes', href: '/settings/team', icon: IconUsers },
      { label: 'Assinatura', href: '/settings/subscription', icon: IconSettings },
    ]
  },
];