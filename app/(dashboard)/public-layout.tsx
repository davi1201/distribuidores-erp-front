'use client';

import {
  AppShell,
  Avatar,
  Burger,
  Button,
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

// Imports de Estado e Componentes
import { useAuthStore } from '../../store/auth/use-auth';
import NavBar from '../../src/shared/components/ui/navbar/navbar';
import { formatDateOnlyBR } from '../../src/shared/utils/formatter';
import { SubscriptionWizardModal } from '../../src/shared/components/subscription/subscription-wizard';
import { useAppStore } from '../../store/app/use-app-store';
import { NotificationBell } from '../../src/shared/components/page-header/notification-bell';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();

  // Hooks de Auth
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { openSubscriptionWizard } = useAppStore()


  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
          {/* Lado Esquerdo: Burger e Nome da Empresa/App */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="lg" size="sm" />
            {/* Opcional: Mostrar o nome da empresa do usuário se disponível */}
            <Text fw={700} size="lg" visibleFrom="xs">
              Gestão Distribuidora
            </Text>
          </Group>
          <Flex align="center" gap={8}>

            {/* Lado Direito: Menu do Usuário */}
            <Menu shadow="md" width={200} position="bottom-end" transitionProps={{ transition: 'pop-top-right' }}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={7}>
                    <Avatar radius="xl" size={34} color="blue" alt={user?.name}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>

                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} lh={1} mr={3}>
                        {user?.name || 'Carregando...'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user?.role || ''}
                      </Text>
                    </div>

                    <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Minha Conta</Menu.Label>

                <Menu.Item
                  component='a'
                  href="/user"
                  leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
                  Meus Dados
                </Menu.Item>

                {/* Se for OWNER, pode ter um atalho para Assinatura aqui */}
                {user?.role === 'OWNER' && (
                  <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
                    Assinatura
                  </Menu.Item>
                )}

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
            <NotificationBell />
          </Flex>


        </Flex>
      </AppShell.Header>

      <AppShell.Navbar p="lg">
        <NavBar toggle={toggle} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Flex direction="column" mb={60} style={{ minHeight: '100%' }}>
          {children}
        </Flex>
        <SubscriptionWizardModal />
      </AppShell.Main>

      <AppShell.Footer
        p="sm"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 'calc(100% - 300px)',
          left: 300,
          height: 70,
        }}
      >
        <Flex align="center" gap={10}>
          <Text fw={500} size="sm" c="dimmed">
            {user?.isTrialExpired ? 'Sua período de teste terminou em: ' : 'Seu período de teste termina em: '} {formatDateOnlyBR(user?.trialEndsAt ?? '')}
          </Text>
          <Button size='sm' variant='light' onClick={openSubscriptionWizard}>
            Fazer Upgrade
          </Button>
        </Flex>
      </AppShell.Footer>

    </AppShell>
  );
}