'use client';

import { useMemo } from 'react';
import { Badge, Text, Group, Skeleton, Alert, Paper } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getProductHistory, MovementType, StockMovement } from '../stock-service';
import { format } from 'date-fns';
import { IconArrowUp, IconArrowDown, IconInfoCircle, IconPlus, IconMinus, IconTransfer } from '@tabler/icons-react';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { ColumnDef } from '@tanstack/react-table';

interface ProductKardexProps {
  productId: string;
}

export function ProductKardex({ productId }: ProductKardexProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['product-history', productId],
    queryFn: () => getProductHistory(productId),
    enabled: !!productId,
  });

  const MOVEMENT_TYPES = useMemo(() => new Map([
    ['ENTRY', { label: 'ENTRADA', color: 'green', icon: IconPlus }],
    ['EXIT', { label: 'SAÍDA', color: 'red', icon: IconMinus }],
    ['TRANSFER', { label: 'TRANSFERÊNCIA', color: 'yellow', icon: IconTransfer }],
  ]), []);

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Data',
        cell: ({ getValue }) => (
          <Text size="sm">{format(new Date(getValue() as string), "dd/MM/yy HH:mm")}</Text>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ getValue }) => {
          const type = getValue() as string;
          const config = MOVEMENT_TYPES.get(type);
          const Icon = config?.icon || IconInfoCircle;

          return (
            <Badge
              size="sm"
              variant="light"
              color={config?.color}
              leftSection={<Icon size={12} />}
            >
              {config?.label || type}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Qtd',
        cell: ({ row }) => {
          const type = row.original.type;
          const config = MOVEMENT_TYPES.get(type);
          const Icon = config?.icon || IconInfoCircle;
          const isEntry = type === 'ENTRY';

          return (
            <Group gap={4}>
              <Icon size={14} color={`var(--mantine-color-${config?.color}-filled)`} />
              <Text size="sm" fw={700} c={config?.color}>
                {Number(row.original.quantity)}
              </Text>
            </Group>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Motivo',
        cell: ({ getValue }) => (
          <Text size="sm" lineClamp={1} title={getValue() as string}>
            {getValue() as string}
          </Text>
        ),
      },
      {
        accessorKey: 'balanceAfter',
        header: 'Saldo Após',
        cell: ({ getValue }) => (
          <Text size="sm" fw={500}>{Number(getValue())}</Text>
        ),
      },
      {
        accessorKey: 'user.name',
        header: 'Usuário',
        cell: ({ row }) => (
          <Text size="xs" c="dimmed">
            {row.original.user?.name || 'Sistema'}
          </Text>
        ),
      },
    ],
    [MOVEMENT_TYPES]
  );

  if (isLoading) {
    return <Skeleton height={200} />;
  }

  if (history.length === 0) {
    return (
      <Alert color="gray" icon={<IconInfoCircle />}>
        Nenhuma movimentação registrada para este produto.
      </Alert>
    );
  }

  return (
    <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
      <DataGrid
        data={history}
        columns={columns}
      />
    </Paper>
  );
}