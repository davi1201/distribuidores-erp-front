'use client';

import { Grid, Stack, Title, Text, Skeleton, Paper, Group, ThemeIcon, SimpleGrid, Button } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconWallet, IconClock, IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link'; // Importante para navegação

import { getDashboardData } from '../api/dashboard.api';
import { StatsGroup } from './stats-group';
import { SalesChart } from './sales-chart';
import { RecentSalesTable } from './recent-sales-table';
import { useMyMetrics } from '../../commissions/hooks/use-commissions';
import { useAuthStore } from '@/store/auth/use-auth';

// Helper de formatação
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function DashboardView() {
  // 1. Busca dados Gerais do Dashboard
  const { data: dashData, isLoading: loadingDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5
  });

  // 2. Busca dados de Comissão do Usuário (Em paralelo)
  const { data: commissions, isLoading: loadingComms } = useMyMetrics();

  const isLoading = loadingDash || loadingComms;

  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <Stack p="md">
        <Skeleton height={50} width={200} mb="md" />
        {/* Skeleton para Comissões */}
        <Grid>
          <Grid.Col span={6}><Skeleton height={80} radius="md" /></Grid.Col>
          <Grid.Col span={6}><Skeleton height={80} radius="md" /></Grid.Col>
        </Grid>
        <Grid mt="md">
          <Grid.Col span={4}><Skeleton height={140} /></Grid.Col>
          <Grid.Col span={4}><Skeleton height={140} /></Grid.Col>
          <Grid.Col span={4}><Skeleton height={140} /></Grid.Col>
          <Grid.Col span={8}><Skeleton height={300} /></Grid.Col>
          <Grid.Col span={4}><Skeleton height={300} /></Grid.Col>
        </Grid>
      </Stack>
    );
  }

  if (!dashData) return null;

  return (
    <Stack gap="lg" p="md">

      {/* SEÇÃO 1: Estatísticas Gerais da Loja/Tenant */}
      <StatsGroup data={dashData.stats} />

      {/* SEÇÃO 2: Minha Carteira (Comissões) - NOVO */}
      {user?.role === 'SELLER' && (
        <div>
          <Group justify="space-between" mb="xs">
            <Title order={4}>Minha Carteira</Title>
            <Button
              component={Link}
              href="/commissions" // Ajuste para a rota correta do seu app
              variant="subtle"
              size="xs"
              rightSection={<IconArrowRight size={14} />}
            >
              Ver Extrato Completo
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* Card Disponível */}
            <Paper withBorder p="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-green-6)' }}>
              <Group>
                <ThemeIcon color="green" variant="light" size="lg" radius="md">
                  <IconWallet size={24} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Disponível para Saque</Text>
                  <Text size="xl" fw={700} c="green.8">
                    {formatCurrency(commissions?.availableBalance || 0)}
                  </Text>
                </div>
              </Group>
            </Paper>

            {/* Card Pendente */}
            <Paper withBorder p="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-yellow-6)' }}>
              <Group>
                <ThemeIcon color="yellow" variant="light" size="lg" radius="md">
                  <IconClock size={24} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Saldo Futuro (Pendente)</Text>
                  <Text size="xl" fw={700} c="yellow.8">
                    {formatCurrency(commissions?.pendingBalance || 0)}
                  </Text>
                </div>
              </Group>
            </Paper>
          </SimpleGrid>
        </div>
      )}

      {/* SEÇÃO 3: Gráficos e Tabelas */}
      <Grid>
        {/* Coluna da Esquerda (Gráfico) */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <SalesChart data={dashData.salesChart} />
        </Grid.Col>

        {/* Coluna da Direita (Últimas Vendas) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <RecentSalesTable data={dashData.recentSales} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}