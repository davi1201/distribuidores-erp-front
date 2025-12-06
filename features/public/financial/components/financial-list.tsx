'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  SimpleGrid, Paper, ThemeIcon, Flex, TextInput
} from '@mantine/core';
import {
  IconDots, IconCash, IconHistory, IconAlertCircle, IconCheck, IconSearch
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { getFinancialTitles, FinancialTitle } from '../financial-service';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { formatCurrency } from '@/utils/formatter';
import { format, isBefore, isToday, endOfDay } from 'date-fns';
import { PaymentRegistrationModal } from '../components/payment-registration-modal';
import { TitleDetailsDrawer } from '../components/title-details-drawer';
import { PAYMENT_METHOD_LABELS } from '../constants/financial-constants';
import { FinancialFilterValues, FinancialListFilters } from '../components/financial-list-filters';

export function FinancialList() {
  const [localSearch, setLocalSearch] = useState('');

  // 🔧 Garante datas corretas
  const normalizeDate = (date: any): Date | null => {
    if (!date) return null;
    return date instanceof Date ? date : new Date(date);
  };

  const [activeFilters, setActiveFilters] = useState<FinancialFilterValues>({
    search: '',
    status: null,
    startDate: null,
    endDate: null,
  });

  const [paymentModalOpen, { open: openPayment, close: closePayment }] = useDisclosure(false);
  const [detailsDrawerOpen, { open: openDetails, close: closeDetails }] = useDisclosure(false);
  const [selectedTitle, setSelectedTitle] = useState<FinancialTitle | null>(null);

  // 🔧 Serializa com segurança
  const serializedFilters = useMemo(() => ({
    search: activeFilters.search,
    status: activeFilters.status,
    startDate: normalizeDate(activeFilters.startDate)?.toISOString() || null,
    endDate: normalizeDate(activeFilters.endDate)?.toISOString() || null,
  }), [activeFilters]);

  const { data: titles = [], isLoading } = useQuery({
    queryKey: ['financial-titles', serializedFilters],
    queryFn: () => {
      return getFinancialTitles({
        // search: activeFilters.search || undefined,
        status: activeFilters.status || undefined,
        startDate: normalizeDate(activeFilters.startDate)?.toISOString(),
        endDate: activeFilters.endDate
          ? endOfDay(normalizeDate(activeFilters.endDate)!).toISOString()
          : undefined,
      });
    },
  });

  const handleApplyFilters = (filters: FinancialFilterValues) => {
    setActiveFilters({
      ...filters,
      startDate: normalizeDate(filters.startDate),
      endDate: normalizeDate(filters.endDate),
    });
  };

  const stats = useMemo(() => {
    const totalReceivable = titles.reduce((acc, t) =>
      t.status !== 'CANCELED' && t.status !== 'PAID' ? acc + Number(t.balance) : acc, 0
    );

    const overdueTitles = titles.filter(t =>
      t.status === 'OPEN' && isBefore(new Date(t.dueDate), new Date()) && !isToday(new Date(t.dueDate))
    );
    const totalOverdue = overdueTitles.reduce((acc, t) => acc + Number(t.balance), 0);

    const totalPaid = titles.filter(t => t.status === 'PAID')
      .reduce((acc, t) => acc + Number(t.originalAmount), 0);

    return { totalReceivable, totalOverdue, overdueCount: overdueTitles.length, totalPaid };
  }, [titles]);

  const handleRegisterPayment = (title: FinancialTitle) => {
    setSelectedTitle(title);
    openPayment();
  };

  const handleViewDetails = (title: FinancialTitle) => {
    setSelectedTitle(title);
    openDetails();
  };

  const filteredData = useMemo(() => {
    if (!localSearch) return titles;
    const lower = localSearch.toLowerCase();
    return titles.filter(item =>
      item.titleNumber.toLowerCase().includes(lower) ||
      item.customer?.name.toLowerCase().includes(lower)
    );
  }, [titles, localSearch]);

  const columns = useMemo<ColumnDef<FinancialTitle>[]>(
    () => [
      {
        accessorKey: 'titleNumber',
        header: 'Nº Título',
        cell: ({ row }) => (
          <div>
            <Text size="sm" fw={500}>{row.original.titleNumber}</Text>
            <Text size="xs" c="dimmed">
              {PAYMENT_METHOD_LABELS[row.original.paymentMethod || ''] ||
                row.original.paymentMethod}
            </Text>
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
          const isOverdue =
            row.original.status === 'OPEN' &&
            isBefore(date, new Date()) &&
            !isToday(date);

          return (
            <Text size="sm" c={isOverdue ? 'red' : undefined} fw={isOverdue ? 700 : 400}>
              {format(date, 'dd/MM/yyyy')}
              {isOverdue && <IconAlertCircle size={12} />}
            </Text>
          );
        }
      },
      {
        accessorKey: 'originalAmount',
        header: 'Valor Orig.',
        cell: ({ getValue }) =>
          <Text size="sm" c="dimmed">{formatCurrency(Number(getValue()))}</Text>
      },
      {
        accessorKey: 'balance',
        header: 'Saldo Aberto',
        cell: ({ row }) => {
          const val = Number(row.original.balance);
          if (row.original.status === 'PAID') return <Text size="sm" c="dimmed">-</Text>;
          return <Text size="sm" fw={700}>{formatCurrency(val)}</Text>;
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;

          const map = {
            OPEN: { color: 'yellow', label: 'Aberto' },
            PARTIAL: { color: 'blue', label: 'Parcial' },
            PAID: { color: 'green', label: 'Pago' },
            CANCELED: { color: 'gray', label: 'Cancelado' }
          } as any;

          const c = map[status] || { color: 'gray', label: status };

          return <Badge color={c.color} variant="light">{c.label}</Badge>;
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

            <Menu withArrow position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconHistory size={16} />}
                  onClick={() => handleViewDetails(row.original)}
                >
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
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700}>A Receber (Total)</Text>
            <ThemeIcon variant="light" color="blue" radius="xl"><IconCash size={16} /></ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt="sm">{formatCurrency(stats.totalReceivable)}</Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700}>Vencidos</Text>
            <ThemeIcon variant="light" color="red" radius="xl"><IconAlertCircle size={16} /></ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt="sm" c="red">{formatCurrency(stats.totalOverdue)}</Text>
          <Text size="xs" c="red.5">{stats.overdueCount} títulos vencidos</Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700}>Recebido (Filtro)</Text>
            <ThemeIcon variant="light" color="green" radius="xl"><IconCheck size={16} /></ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt="sm" c="green">
            {formatCurrency(stats.totalPaid)}
          </Text>
        </Paper>
      </SimpleGrid>

      <FinancialListFilters onApply={handleApplyFilters} isLoading={isLoading} />

      <TextInput
        placeholder="Filtrar resultados localmente..."
        leftSection={<IconSearch size={16} />}
        value={localSearch}
        onChange={(e) => setLocalSearch(e.currentTarget.value)}
        mb="md"
      />

      <DataGrid data={filteredData} columns={columns} />

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
