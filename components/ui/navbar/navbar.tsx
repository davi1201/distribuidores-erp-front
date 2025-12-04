'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { usePathname } from 'next/navigation';
import {
  IconBasketOff,
  IconBox,
  IconCalendarClock,
  IconCalendarDollar,
  IconCalendarEvent,
  IconCashRegister,
  IconCurrencyReal,
  IconHeart,
  IconHome,
  IconMoonStars,
  IconPackage,
  IconPackages,
  IconPercentage,
  IconPlus,
  IconReport,
  IconSettings,
  IconShoppingBag,
  IconShoppingCart,
  IconSun,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  AppShell,
  Box,
  NavLink,
  ScrollArea,
  Stack,
  Title,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';

interface NavbarProps {
  toggle: () => void;
}

const linksMockdata = [
  { to: '/dashboard', label: 'Dashboard', icon: IconHome },
  {
    label: 'Cadastros',
    icon: IconPlus,
    links: [
      { to: '/registrations/clients', label: 'Clientes', icon: IconUsers },
      { to: '/registrations/price-lists', label: 'Listas de Preços', icon: IconCurrencyReal },
      { to: '/registrations/products', label: 'Produtos', icon: IconShoppingBag },
      { to: '/registrations/tax-profiles', label: 'Taxas e impostos', icon: IconPercentage },
      { to: '/registrations/stock', label: 'Estoque', icon: IconPackages },
      { to: '/registrations/sales', label: 'Vendas', icon: IconShoppingCart },
    ],
  },
  { to: '/registrations/financial', label: 'Financeiro', icon: IconCashRegister },
  {
    label: 'Pessoas',
    icon: IconUsers,
    links: [
      { to: 'clients', label: 'Clientes', icon: IconUsers },
      { to: 'suppliers', label: 'Fornecedores', icon: IconPackage },
    ],
  },
  {
    label: 'Financeiro',
    icon: IconCalendarDollar,
    links: [{ to: 'accounts-receivable', label: 'Contas a Receber', icon: IconCalendarDollar }],
  },
  {
    label: 'Configurações',
    icon: IconSettings,
    links: [
      { to: 'appointments', label: 'Agendamentos', icon: IconCalendarClock },
      { to: 'availability/create', label: 'Dias e Horários', icon: IconCalendarEvent },
      { to: 'appointments/create', label: 'Criar agendamento', icon: IconCalendarDollar },
    ],
  },
  { to: 'reports', label: 'Relatórios', icon: IconReport },
];

export default function NavBar({ toggle }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState('Dashboard');
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();


  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const links = linksMockdata.map((item) => {
    const baseHref = '/';

    if (item.links) {
      // MUDANÇA 3: Usar 'pathname' em vez de 'router.pathname'
      const isParentActive = item.links.some((link) => pathname === `${baseHref}/${link.to}`);

      return (
        <NavLink
          key={item.label}
          label={item.label}
          leftSection={<item.icon size="1rem" stroke={1.5} />}
          defaultOpened={isParentActive}
          childrenOffset={28}
        >
          {item.links.map((link) => (
            <NavLink
              key={link.label}
              label={link.label}
              leftSection={link.icon ? <link.icon size="1rem" stroke={1.5} /> : undefined}
              component={Link}
              href={link.to}
              // MUDANÇA 4: Usar 'pathname' em vez de 'router.pathname'
              active={pathname === link.to}
              onClick={toggle}
            />
          ))}
        </NavLink>
      );
    }

    return (
      <NavLink
        key={item.label}
        label={item.label}
        leftSection={<item.icon size="1rem" stroke={1.5} />}
        component={Link}
        href={item.to}
        active={pathname === item.to}
        onClick={toggle}
      />
    );
  });

  return (
    <AppShell.Navbar p="lg">
      <AppShell.Section grow component={ScrollArea}>
        <Stack gap="md">
          <Stack mt="lg" gap="xs">
            <Title order={5} c="gray.3" mb="xs">
              Menu
            </Title>
            {links}
          </Stack>
        </Stack>
      </AppShell.Section>

      <AppShell.Section>
        <Title order={6} c="gray.5" ta="center" mt="md">
          {active}
        </Title>

        <Tooltip label="Alternar tema" position="top" withArrow>
          <ActionIcon
            variant="filled"
            color={colorScheme === 'dark' ? 'yellow' : 'blue'}
            onClick={() => toggleColorScheme()}
            size="lg"
            mt="md"
          >
            {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
          </ActionIcon>
        </Tooltip>
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
