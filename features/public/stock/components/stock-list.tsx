'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Flex, Avatar, Drawer, Tooltip, Select, Paper
} from '@mantine/core';
import {
  IconDots, IconSearch, IconHistory, IconArrowsExchange, IconBox,
  IconAlertTriangle, IconVersions, IconBuildingWarehouse,
  IconPlus
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';


import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { getProducts, Product } from '../../products/product-service';
import { getWarehouses } from '../stock-service';
import { StockMovementModal } from './modals/stock-movement-modal';
import { WarehouseFormModal } from './modals/warehouse-form-modal';
import { ProductKardex } from './product-kardex';
import { useAuthStore } from '@/store/auth/use-auth';


export function StockList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { user } = useAuthStore()
  // Estado do Filtro de Depósito (null = Todos/Geral)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  // Modais
  const [movementModalOpen, { open: openMovement, close: closeMovement }] = useDisclosure(false);
  const [historyDrawerOpen, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const [warehouseModalOpen, { open: openWarehouse, close: closeWarehouse }] = useDisclosure(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 1. Busca Produtos
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // 2. Busca Depósitos para o Filtro
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  // Opções para o Select
  const warehouseOptions = [
    { value: 'all', label: 'Todos os Depósitos (Visão Geral)' },
    ...warehouses.map(w => ({ value: w.id, label: w.name }))
  ];

  // Filtro local de Texto
  const filteredData = useMemo(() => {
    return products.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  useMemo(() => {
    const warehouse = warehouses.find((warehouse) => warehouse.responsibleUserId === user?.id)
    if (warehouse) {
      setSelectedWarehouseId(warehouse.id)
    }
  }, [user])

  // Definição das Colunas Dinâmicas
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Produto',
        cell: ({ row }) => (
          <Group gap="sm">
            <Avatar src={row.original.images?.[0]?.url} radius="sm" color="blue">
              <IconBox size={20} />
            </Avatar>
            <div>
              <Text size="sm" fw={500}>{row.original.name}</Text>
              <Text size="xs" c="dimmed">SKU: {row.original.sku}</Text>
            </div>
          </Group>
        ),
      },
      {
        id: 'stock',
        header: selectedWarehouseId && selectedWarehouseId !== 'all'
          ? `Saldo em ${warehouses.find(w => w.id === selectedWarehouseId)?.name}`
          : 'Saldo Total',
        accessorKey: 'stock',
        cell: ({ row }) => {
          const product = row.original;
          let qty = 0;
          let min = 0;

          // Lógica de Filtragem de Estoque
          if (selectedWarehouseId && selectedWarehouseId !== 'all') {
            // Se tem filtro, busca o item específico daquele depósito
            // Nota: Se for variação, temos que somar o estoque das variações NAQUELE depósito
            if (product.variants && product.variants.length > 0) {
              qty = product.variants.reduce((acc: number, v: any) => {
                const stockInWarehouse = v.stock?.find((s: any) => s.warehouseId === selectedWarehouseId);
                return acc + Number(stockInWarehouse?.quantity || 0);
              }, 0);
            } else {
              // Produto simples
              const stockInWarehouse = Array.isArray(product.stock)
                ? product.stock.find((s: any) => s.warehouseId === selectedWarehouseId)
                : (product.stock?.warehouseId === selectedWarehouseId ? product.stock : null);

              qty = Number(stockInWarehouse?.quantity || 0);
              min = Number(stockInWarehouse?.minStock || 0);
            }
          } else {
            // Sem filtro: Usa o total calculado pelo backend
            qty = Number(product.totalStock || 0);
            const defaultStock = Array.isArray(product.stock) ? product.stock[0] : product.stock;
            min = Number(defaultStock?.minStock || 0);
          }

          let color = 'gray';
          if (qty <= 0) color = 'red';
          else if (qty <= min) color = 'orange';
          else color = 'green';

          return (
            <Group gap={6}>
              <Badge
                color={color}
                variant="light"
                size="lg"
                leftSection={product.variants?.length ? <IconVersions size={14} /> : undefined}
              >
                {qty} {product.unit}
              </Badge>
              {qty <= min && (
                <Tooltip label="Estoque Baixo ou Zerado">
                  <IconAlertTriangle size={16} color="var(--mantine-color-orange-6)" />
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
            <Button
              size="xs"
              variant="light"
              mr="xs"
              leftSection={<IconArrowsExchange size={14} />}
              onClick={() => {
                setSelectedProduct(row.original);
                openMovement();
              }}
            >
              Movimentar
            </Button>

            <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconHistory size={16} />}
                  onClick={() => {
                    setSelectedProduct(row.original);
                    openHistory();
                  }}
                >
                  Ver Histórico
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ),
      },
    ],
    [selectedWarehouseId, warehouses]
  );

  return (
    <>
      <Paper p="md" mb="lg" withBorder bg="var(--mantine-color-default)">
        <Flex justify="space-between" align="center" gap="md" wrap="wrap">

          {/* BARRA DE BUSCA E FILTROS */}
          <Group style={{ flex: 1 }}>
            <TextInput
              placeholder="Buscar produto..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ minWidth: 300 }}
            />

            <Select
              placeholder="Filtrar por Depósito"
              data={warehouseOptions}
              value={selectedWarehouseId || 'all'}
              onChange={(val) => setSelectedWarehouseId(val)}
              leftSection={<IconBuildingWarehouse size={16} />}
              allowDeselect={false}
              w={280}
            />
          </Group>

          {/* AÇÕES GERAIS */}
          {user?.role !== 'SELLER' &&
            <Button
              variant="default"
              leftSection={<IconPlus size={16} />}
              onClick={openWarehouse}
            >
              Novo Depósito
            </Button>
          }
        </Flex>
      </Paper>

      <DataGrid
        data={filteredData}
        columns={columns}
      />

      {/* MODAL DE MOVIMENTAÇÃO */}
      {selectedProduct && (
        <StockMovementModal
          opened={movementModalOpen}
          onClose={closeMovement}
          product={selectedProduct}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
        />
      )}

      {/* MODAL DE CRIAÇÃO DE DEPÓSITO */}
      <WarehouseFormModal
        opened={warehouseModalOpen}
        onClose={closeWarehouse}
      />

      {/* HISTÓRICO */}
      <Drawer
        opened={historyDrawerOpen}
        onClose={closeHistory}
        title={<Text fw={700} size="lg">Histórico: {selectedProduct?.name}</Text>}
        position="right"
        size="xl"
        padding="md"
      >
        {selectedProduct && (
          <ProductKardex productId={selectedProduct.id} />
        )}
      </Drawer>
    </>
  );
}