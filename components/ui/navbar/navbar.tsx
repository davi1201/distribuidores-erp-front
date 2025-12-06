'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ActionIcon,
  AppShell,
  NavLink,
  ScrollArea,
  Stack,
  Title,
  Tooltip,
  useMantineColorScheme,
  Text,
  Group
} from '@mantine/core';
import { IconSun, IconMoonStars } from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth/use-auth';
import { MENU_ITEMS, MenuItem, UserRole } from '@/config/menu-config';

interface NavbarProps {
  toggle?: () => void; // Opcional
}

export default function NavBar({ toggle }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();

  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  // --- LÓGICA DE SEGURANÇA (FILTRO RECURSIVO) ---
  const hasPermission = (item: MenuItem): boolean => {
    // 1. Se não tem roles definidas, é público (dentro do sistema)
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;

    // 2. Verifica se a role do usuário está permitida
    return item.allowedRoles.includes(user.role as UserRole);
  };

  // Filtra os itens recursivamente
  const getVisibleItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => hasPermission(item)) // Filtra o pai
      .map(item => {
        if (item.links) {
          // Filtra os filhos
          const visibleChildren = getVisibleItems(item.links);
          // Se tem filhos, retorna o item com os filhos filtrados
          if (visibleChildren.length > 0) {
            return { ...item, links: visibleChildren };
          }
          // Se o pai tem lista de links mas todos foram filtrados, esconde o pai
          return null;
        }
        return item;
      })
      .filter(Boolean) as MenuItem[]; // Remove os nulos
  };

  const visibleMenu = getVisibleItems(MENU_ITEMS);

  // --- RENDERIZAÇÃO ---
  const renderLinks = (items: MenuItem[]) => {
    return items.map((item) => {
      // Verifica se algum filho está ativo para abrir o pai automaticamente
      const isParentActive = item.links?.some((link) => link.href && pathname.startsWith(link.href));
      const isActive = item.href ? pathname === item.href : false;

      // Se tem submenus
      if (item.links && item.links.length > 0) {
        return (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<item.icon size="1rem" stroke={1.5} />}
            childrenOffset={28}
            defaultOpened={isParentActive}
            active={isParentActive} // Opcional: Destacar o pai se o filho estiver ativo
          >
            {renderLinks(item.links)}
          </NavLink>
        );
      }

      // Se é item final
      return (
        <NavLink
          key={item.label}
          label={item.label}
          leftSection={<item.icon size="1rem" stroke={1.5} />}
          component={Link}
          href={item.href || '#'}
          active={isActive}
          onClick={toggle}
          variant="light"
          color={isActive ? 'blue' : 'gray'}
        />
      );
    });
  };

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section grow component={ScrollArea}>
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
            Menu Principal
          </Text>
          {renderLinks(visibleMenu)}
        </Stack>
      </AppShell.Section>

      <AppShell.Section style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: '1rem' }}>
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={700}>{user.name}</Text>
            <Text size="xs" c="dimmed">{user.role}</Text>
          </div>

          <Tooltip label="Alternar tema" position="top" withArrow>
            <ActionIcon
              variant="default"
              onClick={() => toggleColorScheme()}
              size="lg"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Section>
    </AppShell.Navbar>
  );
}