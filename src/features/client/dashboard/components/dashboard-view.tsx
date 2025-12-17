'use client';

import { Grid, Stack, Title, Text, Skeleton } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '../api/dashboard.api';
import { StatsGroup } from './stats-group';
import { SalesChart } from './sales-chart';
import { RecentSalesTable } from './recent-sales-table';



export function DashboardView() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5 // Cache de 5 min
  });

  if (isLoading) {
    return (
      <Stack p="md">
        <Skeleton height={50} width={200} mb="md" />
        <Grid>
          <Grid.Col span={4}><Skeleton height={140} /></Grid.Col>
          <Grid.Col span={4}><Skeleton height={140} /></Grid.Col>
          <Grid.Col span={4}><Skeleton height={140} /></Grid.Col>
          <Grid.Col span={8}><Skeleton height={300} /></Grid.Col>
          <Grid.Col span={4}><Skeleton height={300} /></Grid.Col>
        </Grid>
      </Stack>
    );
  }

  if (!data) return null;

  return (
    <Stack gap="lg" p="md">
      <StatsGroup data={data.stats} />
      <Grid>
        {/* Coluna da Esquerda (Gráfico) */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <SalesChart data={data.salesChart} />
        </Grid.Col>

        {/* Coluna da Direita (Últimas Vendas / Lista Rápida) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <RecentSalesTable data={data.recentSales} />
        </Grid.Col>
      </Grid>

      {/* Futuro: Grid com Produtos com Estoque Baixo aqui embaixo */}
    </Stack>
  );
}