'use client';

import { useMemo, useState } from 'react';
import { Badge, Text, ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { useSalesList } from '../hooks/use-sales';
import { OrderStatus, SaleListItem } from '../types';
import { useDisclosure } from '@mantine/hooks';
import { SaleDetailsDrawer } from './sales-details';
import { DataGrid } from '@/shared/components/ui/data-grid/data-grid';




export function SalesList() {
  const { data: sales = [], isLoading } = useSalesList();

  // Estado para controlar o Drawer e qual venda está selecionada
  const [detailsOpen, { open, close }] = useDisclosure(false);
  const [selectedSale, setSelectedSale] = useState<SaleListItem | null>(null);

  const handleViewDetails = (sale: SaleListItem) => {
    setSelectedSale(sale);
    open();
  };

  // Definição das colunas para o DataGrid
  const columns = useMemo(() => [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }: any) => <Text fw={700} size="sm">#{row.original.code}</Text>,
      size: 80,
    },
    {
      accessorKey: 'customer.name',
      header: 'Cliente',
      cell: ({ row }: any) => (
        <Text size="sm" fw={500} truncate>{row.original.customer.name}</Text>
      ),
    },
    {
      accessorKey: 'seller.name',
      header: 'Vendedor',
      cell: ({ row }: any) => (
        <Text size="sm" c={row.original.seller ? 'dimmed' : 'blue'}>
          {row.original.seller?.name || 'Sistema'}
        </Text>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: any) => (
        <Text size="sm" fw={600}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.original.total)}
        </Text>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status as OrderStatus;
        let color = 'gray';
        if (status === 'COMPLETED') color = 'green';
        if (status === 'DRAFT') color = 'yellow';
        if (status === 'CANCELED') color = 'red';
        if (status === 'SEPARATION') color = 'blue';

        return <Badge color={color} variant="light">{status}</Badge>;
      },
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      enableSorting: false,
      cell: ({ row }: any) => (
        <Group gap={0} justify="flex-end">
          <Tooltip label="Ver Detalhes">
            <ActionIcon variant="subtle" color="gray" onClick={() => handleViewDetails(row.original)}>
              <IconEye size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
      size: 60,
    },
  ], []);

  return (
    <>
      <DataGrid
        data={sales}
        columns={columns}
        onRowClicked={(row: any) => handleViewDetails(row)}
      />

      <SaleDetailsDrawer
        opened={detailsOpen}
        onClose={close}
        sale={selectedSale}
      />
    </>
  );
}