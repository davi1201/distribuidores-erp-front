'use client';

import React, { useState } from 'react';
import {
  SimpleGrid, Paper, Text, Group, Stack, RingProgress,
  Table, Badge, Pagination, Center, Loader, Tooltip, ThemeIcon
} from '@mantine/core';
import {
  IconCurrencyReal, IconClock, IconWallet, IconBan,
  IconInfoCircle, IconTrendingUp
} from '@tabler/icons-react';

// Hooks criados anteriormente
import { useMyMetrics, useMyStatement } from '../hooks/use-commissions';
import { CommissionStatus } from '../types';

// Utilitário de formatação de moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Utilitário para formatar datas
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function SellerCommissionDashboard() {
  const [activePage, setActivePage] = useState(1);

  // Busca dados em paralelo
  const { data: metrics, isLoading: loadingMetrics } = useMyMetrics();
  const { data: statement, isLoading: loadingStatement } = useMyStatement(activePage);

  // Helper para Status Visual
  const getStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.APPROVED:
        return <Badge color="green" variant="filled">Aprovado</Badge>;
      case CommissionStatus.PAID:
        return <Badge color="blue" variant="filled">Pago</Badge>;
      case CommissionStatus.PENDING:
        return <Badge color="yellow" variant="light">Pendente</Badge>;
      case CommissionStatus.CANCELED:
        return <Badge color="red" variant="outline">Cancelado</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  if (loadingMetrics && loadingStatement) {
    return <Center h={400}><Loader size="lg" /></Center>;
  }

  return (
    <Stack gap="lg">

      {/* 1. SEÇÃO DE KPIs (Métricas Financeiras) */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">

        {/* Card: Disponível (O mais importante) */}
        <Paper withBorder p="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-green-6)' }}>
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Disponível para Saque</Text>
              <Text fw={700} size="xl" c="green.8">
                {formatCurrency(metrics?.availableBalance || 0)}
              </Text>
            </div>
            <ThemeIcon color="green" variant="light" size="lg" radius="md">
              <IconWallet size={24} />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" mt="sm">
            Valores já recebidos do cliente e prontos para pagamento.
          </Text>
        </Paper>

        {/* Card: Pendente (Futuro) */}
        <Paper withBorder p="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-yellow-6)' }}>
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Saldo Pendente</Text>
              <Text fw={700} size="xl" c="yellow.8">
                {formatCurrency(metrics?.pendingBalance || 0)}
              </Text>
            </div>
            <ThemeIcon color="yellow" variant="light" size="lg" radius="md">
              <IconClock size={24} />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" mt="sm">
            Aguardando pagamento do cliente ou prazo de liberação.
          </Text>
        </Paper>

        {/* Card: Histórico Pago */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Total Recebido</Text>
              <Text fw={700} size="xl">
                {formatCurrency(metrics?.totalPaid || 0)}
              </Text>
            </div>
            <ThemeIcon color="blue" variant="light" size="lg" radius="md">
              <IconCurrencyReal size={24} />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" mt="sm">
            Soma de todas as comissões já pagas a você.
          </Text>
        </Paper>
      </SimpleGrid>


      {/* 2. SEÇÃO DE EXTRATO DETALHADO */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconTrendingUp size={20} color="gray" />
            <Text fw={600}>Extrato de Comissões</Text>
          </Group>
          {/* Aqui poderia entrar um filtro de data futuramente */}
        </Group>

        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data</Table.Th>
              <Table.Th>Venda / Referência</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Valor Venda</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>% Aplicada</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Comissão</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {statement?.map((record) => (
              <Table.Tr key={record.id} style={{ opacity: record.status === 'CANCELED' ? 0.5 : 1 }}>
                <Table.Td>
                  <Text size="sm">{formatDate(record.referenceDate)}</Text>
                  {record.dueDate && record.status === 'PENDING' && (
                    <Text size="xs" c="dimmed">Prev: {formatDate(record.dueDate)}</Text>
                  )}
                </Table.Td>

                <Table.Td>
                  <Text size="sm" fw={500}>
                    {record.order ? `#${record.order.code} - ${record.order.customerName}` : 'N/A'}
                  </Text>
                  <Text size="xs" c="dimmed" truncate w={200}>
                    ID: {record.id.slice(0, 8)}...
                  </Text>
                </Table.Td>

                <Table.Td align="right">
                  <Text size="sm">{formatCurrency(Number(record.calculationBase))}</Text>
                </Table.Td>

                <Table.Td align="center">
                  <Badge variant="outline" color="gray" size="sm">
                    {Number(record.appliedPercentage).toFixed(2)}%
                  </Badge>
                </Table.Td>

                <Table.Td align="right">
                  <Text
                    fw={700}
                    c={record.status === 'CANCELED' ? 'dimmed' : 'green.8'}
                    style={{ textDecoration: record.status === 'CANCELED' ? 'line-through' : 'none' }}
                  >
                    {formatCurrency(Number(record.commissionAmount))}
                  </Text>
                </Table.Td>

                <Table.Td align="center">
                  {getStatusBadge(record.status)}
                </Table.Td>
              </Table.Tr>
            ))}

            {!loadingStatement && statement?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6} align="center" py="xl">
                  <Stack align="center" gap="xs">
                    <IconInfoCircle size={32} color="gray" opacity={0.5} />
                    <Text c="dimmed">Nenhuma comissão registrada ainda.</Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        {/* Paginação */}
        <Group justify="center" mt="lg">
          <Pagination
            total={10} // Idealmente viria do backend (meta.totalPages)
            value={activePage}
            onChange={setActivePage}
            color="violet"
          />
        </Group>
      </Paper>
    </Stack>
  );
}