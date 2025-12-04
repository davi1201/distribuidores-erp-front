'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Flex, SimpleGrid, Paper, ThemeIcon
} from '@mantine/core';
import {
  IconDots, IconSearch, IconFilter, IconCash, IconHistory, IconAlertCircle, IconCheck
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { getFinancialTitles, FinancialTitle } from '../financial-service';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { formatCurrency } from '@/utils/formatter';
import { format, isBefore, isToday } from 'date-fns';
import { PaymentRegistrationModal } from '../components/payment-registration-modal';
import { TitleDetailsDrawer } from '../components/title-details-drawer';
import { PAYMENT_METHOD_LABELS } from '../constants/financial-constants';

export function FinancialList() {
  const [search, setSearch] = useState('');

  // Modais
  const [paymentModalOpen, { open: openPayment, close: closePayment }] = useDisclosure(false);
  const [detailsDrawerOpen, { open: openDetails, close: closeDetails }] = useDisclosure(false);
  const [selectedTitle, setSelectedTitle] = useState<FinancialTitle | null>(null);

  // Dados
  const { data: titles = [], isLoading } = useQuery({
    queryKey: ['financial-titles'],
    queryFn: () => getFinancialTitles(),
  });

  // --- ESTATÍSTICAS RÁPIDAS (Calculado no front para agilidade) ---
  const stats = useMemo(() => {
    const totalReceivable = titles.reduce((acc, t) => t.status !== 'CANCELED' ? acc + Number(t.balance) : acc, 0);
    const overdueTitles = titles.filter(t => t.status === 'OPEN' && isBefore(new Date(t.dueDate), new Date()) && !isToday(new Date(t.dueDate)));
    const totalOverdue = overdueTitles.reduce((acc, t) => acc + Number(t.balance), 0);
    return { totalReceivable, totalOverdue, overdueCount: overdueTitles.length };
  }, [titles]);

  // Handlers
  const handleRegisterPayment = (title: FinancialTitle) => {
    setSelectedTitle(title);
    openPayment();
  };

  const handleViewDetails = (title: FinancialTitle) => {
    setSelectedTitle(title);
    openDetails();
  };

  // Filtro
  const filteredData = useMemo(() => {
    return titles.filter(item =>
      item.titleNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.customer?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [titles, search]);

  // Colunas
  const columns = useMemo<ColumnDef<FinancialTitle>[]>(
    () => [
      {
        accessorKey: 'titleNumber',
        header: 'Nº Título',
        cell: ({ row }) => (
          <div>
            <Text size="sm" fw={500}>{row.original.titleNumber}</Text>
            <Text size="xs" c="dimmed">{PAYMENT_METHOD_LABELS[row.original.paymentMethod || '']}</Text>
          </div>
        )
      },
      {
        accessorKey: 'customer.name',
        header: 'Cliente',
        cell: ({ getValue }) => <Text size="sm" fw={500}>{getValue() as string}</Text>
      },
      {
        accessorKey: 'dueDate',
        header: 'Vencimento',
        cell: ({ row }) => {
          const date = new Date(row.original.dueDate);
          const isOverdue = row.original.status === 'OPEN' && isBefore(date, new Date()) && !isToday(date);

          return (
            <Text size="sm" c={isOverdue ? 'red' : undefined} fw={isOverdue ? 700 : 400}>
              {format(date, 'dd/MM/yyyy')}
              {isOverdue && <IconAlertCircle size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
            </Text>
          );
        }
      },
      {
        accessorKey: 'originalAmount',
        header: 'Valor Orig.',
        cell: ({ getValue }) => <Text size="sm" c="dimmed">{formatCurrency(Number(getValue()))}</Text>
      },
      {
        accessorKey: 'balance',
        header: 'Saldo Aberto',
        cell: ({ row }) => {
          const val = Number(row.original.balance);
          return <Text size="sm" fw={700}>{val > 0 ? formatCurrency(val) : '-'}</Text>;
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          let color = 'gray';
          if (status === 'OPEN') color = 'yellow';
          if (status === 'PARTIAL') color = 'blue';
          if (status === 'PAID') color = 'green';
          if (status === 'OVERDUE') color = 'red';

          // Tradução visual simples
          const label = status === 'OPEN' ? 'Aberto' : status === 'PARTIAL' ? 'Parcial' : status === 'PAID' ? 'Pago' : status;

          return <Badge color={color} variant="light">{label}</Badge>;
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Group gap={0} justify="flex-end">
            {row.original.status !== 'PAID' && row.original.status !== 'CANCELED' && (
              <Button
                size="compact-xs"
                color="green"
                variant="light"
                mr="xs"
                leftSection={<IconCash size={12} />}
                onClick={() => handleRegisterPayment(row.original)}
              >
                Baixar
              </Button>
            )}

            <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconHistory size={16} />} onClick={() => handleViewDetails(row.original)}>
                  Ver Extrato / Histórico
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ),
      },
    ],
    []
  );

  return (
    <Flex direction="column" gap="md">
      {/* CARDS DE ESTATÍSTICA */}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">A Receber (Total)</Text>
            <ThemeIcon variant="light" color="blue" radius="xl"><IconCash size={16} /></ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt="sm">{formatCurrency(stats.totalReceivable)}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Vencidos</Text>
            <ThemeIcon variant="light" color="red" radius="xl"><IconAlertCircle size={16} /></ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt="sm" c="red">{formatCurrency(stats.totalOverdue)}</Text>
          <Text size="xs" c="red.5">{stats.overdueCount} títulos vencidos</Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Em Dia</Text>
            <ThemeIcon variant="light" color="green" radius="xl"><IconCheck size={16} /></ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt="sm" c="green">
            {formatCurrency(stats.totalReceivable - stats.totalOverdue)}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* FILTROS E TABELA */}
      <Flex justify="space-between" gap="md" mt="md">
        <TextInput
          placeholder="Buscar por Nº Título ou Cliente..."
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Flex>

      <DataGrid
        data={filteredData}
        columns={columns}
      />

      <PaymentRegistrationModal
        opened={paymentModalOpen}
        onClose={closePayment}
        title={selectedTitle}
      />

      <TitleDetailsDrawer
        opened={detailsDrawerOpen}
        onClose={closeDetails}
        titleId={selectedTitle?.id || null}
      />
    </Flex>
  );
}