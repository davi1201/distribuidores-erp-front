'use client';

import {
  AppShell,
  Avatar,
  Burger,
  Flex,
  Group,
  Menu,
  Text,
  UnstyledButton,
  rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout, IconSettings, IconChevronDown } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

// Importe o seu Store
import { useAuthStore } from '@/store/auth/use-auth';
import BackofficeNavBar from '@/components/ui/navbar/backoffice-navbar';

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();

  // Hooks de Auth e Navegação
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Função de Logout
  const handleLogout = async () => {
    await logout(); // Limpa cookie (API) e estado (Zustand)
    router.push('/login'); // Redireciona
  };

  return (
    <AppShell
      padding="xl"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'lg',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header
        style={{
          height: 60,
          backgroundColor: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <Flex
          align="center"
          justify="space-between"
          px="xl"
          h="100%"
          w="100%"
        >
          {/* Lado Esquerdo: Burger e Logo (se tiver) */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="lg" size="sm" />
            <Text fw={700} size="lg">SaaS Distribuidor</Text> {/* Opcional: Nome do App */}
          </Group>

          {/* Lado Direito: Menu do Usuário */}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Group gap={7}>
                  <Avatar radius="xl" size={34} color="blue">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>

                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500} lh={1} mr={3}>
                      {user?.name || 'Usuário'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.role || 'Visitante'}
                    </Text>
                  </div>

                  <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Minha Conta</Menu.Label>

              <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
                Configurações
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                color="red"
                leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                onClick={handleLogout}
              >
                Sair
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

        </Flex>
      </AppShell.Header>

      <AppShell.Navbar p="lg">
        <BackofficeNavBar toggle={toggle} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Flex direction="column" style={{ minHeight: '100%' }}>
          {children}
        </Flex>
      </AppShell.Main>
    </AppShell>
  );
}