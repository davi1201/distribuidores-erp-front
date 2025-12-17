'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Group, TextInput, Select, Avatar, Text, Badge, Tooltip,
  Button, ActionIcon, Menu, Center, Loader
} from '@mantine/core';
import {
  IconSearch, IconBox, IconVersions, IconAlertTriangle,
  IconArrowsExchange, IconDots, IconHistory
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { ColumnDef } from '@tanstack/react-table';

import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { getStockProducts } from '../../api/stock.api';
import { StockMovementModal } from '../modals/stock-movement-modal';
import { ProductKardex } from '../product-kardex';
import { Drawer } from '@mantine/core';

interface StockBalanceTabProps {
  user: any;
  warehouses: any[];
}

export function StockBalanceTab({ user, warehouses }: StockBalanceTabProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 500);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Modais Locais
  const [movementModalOpen, { open: openMovement, close: closeMovement }] = useDisclosure(false);
  const [historyDrawerOpen, { open: openHistory, close: closeHistory }] = useDisclosure(false);

  const IS_USER_WAREHOUSE = selectedWarehouseId === user?.id

  // Define Depósito Padrão (Seller)
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      if (user?.role === 'SELLER') {
        const userWarehouse = warehouses.find(w => w.responsibleUserId === user.id);
        if (userWarehouse) setSelectedWarehouseId(userWarehouse.id);
      }
    }
  }, [user, warehouses, selectedWarehouseId]);

  // Query de Produtos
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['stock-products', selectedWarehouseId, debouncedSearch],
    queryFn: () => getStockProducts({
      warehouseId: selectedWarehouseId === 'all' ? undefined : (selectedWarehouseId || undefined),
      search: debouncedSearch
    }),
  });

  const warehouseOptions = [
    { value: 'all', label: 'Visão Geral (Todos)' },
    ...warehouses.map(w => ({ value: w.id, label: w.name }))
  ];

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Produto',
        cell: ({ row }) => (
          <Group gap="sm">
            <Avatar src={row.original.imageUrl} radius="sm" color="blue"><IconBox size={20} /></Avatar>
            <div>
              <Text size="sm" fw={500}>{row.original.name}</Text>
              <Text size="xs" c="dimmed">{row.original.sku}</Text>
            </div>
          </Group>
        ),
      },
      {
        id: 'quantity',
        header: selectedWarehouseId && selectedWarehouseId !== 'all'
          ? `Saldo em ${warehouses.find(w => w.id === selectedWarehouseId)?.name || 'Depósito'}`
          : 'Saldo Total',
        accessorKey: 'quantity',
        cell: ({ row }) => {
          const qty = Number(row.original.quantity);
          const hasVariants = row.original.variants && row.original.variants.length > 0;

          let color = 'gray';
          if (qty <= 0) color = 'red';
          else if (qty < 10) color = 'orange';
          else color = 'green';

          return (
            <Group gap={6}>
              <Badge
                color={color}
                variant="light"
                size="lg"
                leftSection={hasVariants ? <IconVersions size={14} /> : undefined}
              >
                {qty} {row.original.unit}
              </Badge>
              {qty <= 0 && (
                <Tooltip label="Estoque Zerado">
                  <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
                </Tooltip>
              )}
            </Group>
          );
        }
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Group gap={0} justify="flex-end">
            {IS_USER_WAREHOUSE || user?.role !== 'SELLER' && (
              <>
                <Button size="xs" variant="light" onClick={() => { setSelectedProduct(row.original); openMovement(); }}>
                  Ajuste
                </Button>
                <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconHistory size={16} />} onClick={() => { setSelectedProduct(row.original); openHistory(); }}>
                      Ver Histórico
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}
          </Group>
        ),
      },
    ],
    [selectedWarehouseId, warehouses]
  );

  return (
    <>
      <Group mb="md">
        <TextInput
          placeholder="Buscar produto ou SKU..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Selecione o Depósito"
          data={warehouseOptions}
          value={selectedWarehouseId || 'all'}
          onChange={setSelectedWarehouseId}
          allowDeselect={false}
          searchable
        />
      </Group>

      {isLoading ? (
        <Center h={200}><Loader color="blue" /></Center>
      ) : (
        <DataGrid data={products} columns={columns} />
      )}

      {/* Modais Locais */}
      {selectedProduct && (
        <StockMovementModal
          opened={movementModalOpen}
          onClose={closeMovement}
          product={selectedProduct}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['stock-products'] })}
        />
      )}

      <Drawer
        opened={historyDrawerOpen}
        onClose={closeHistory}
        title={<Text fw={700} size="lg">Histórico: {selectedProduct?.name}</Text>}
        position="right"
        size="xl"
      >
        {selectedProduct && <ProductKardex productId={selectedProduct.id} />}
      </Drawer>
    </>
  );
}