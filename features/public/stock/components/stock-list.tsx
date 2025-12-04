'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Flex, Avatar, Drawer, Tooltip
} from '@mantine/core';
import {
  IconDots, IconSearch, IconHistory, IconArrowsExchange, IconBox, IconAlertTriangle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';


import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { getProducts, Product } from '../../products/product-service';
import { ProductKardex } from './product-kardex';
import { StockMovementModal } from './stock-movement-modal';


export function StockList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Controle de Modais
  const [movementModalOpen, { open: openMovement, close: closeMovement }] = useDisclosure(false);
  const [historyDrawerOpen, { open: openHistory, close: closeHistory }] = useDisclosure(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Busca produtos (já traz o saldo atual no objeto stock)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'], // Reutiliza cache de produtos
    queryFn: getProducts,
  });

  // Handlers
  const handleOpenMovement = (product: Product) => {
    setSelectedProduct(product);
    openMovement();
  };

  const handleOpenHistory = (product: Product) => {
    setSelectedProduct(product);
    openHistory();
  };

  const handleSuccessMovement = () => {
    // Invalida para atualizar o saldo na lista
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  // Filtro local
  const filteredData = useMemo(() => {
    return products.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  // Definição das Colunas Focadas em Estoque
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
        header: 'Saldo Atual',
        accessorKey: 'stock.quantity',
        cell: ({ row }) => {
          const qty = Number(row.original.totalStock || 0);
          const min = Number(row.original.stock?.minStock || 0);

          let color = 'gray';
          if (qty <= 0) color = 'red';
          else if (qty <= min) color = 'orange';
          else color = 'green';

          return (
            <Group gap={6}>
              <Badge color={color} variant="light" size="lg">
                {qty} {row.original.unit}
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
        header: 'Estoque Mín/Máx',
        accessorKey: 'stock.minStock',
        cell: ({ row }) => (
          <Text size="sm" c="dimmed">
            {Number(row.original.stock?.minStock || 0)} / {Number(row.original.stock?.maxStock || 0) || '∞'}
          </Text>
        ),
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
              onClick={() => handleOpenMovement(row.original)}
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
                  onClick={() => handleOpenHistory(row.original)}
                >
                  Ver Histórico (Kardex)
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
    <>
      <Flex justify="space-between" mb="lg" gap="md">
        <TextInput
          placeholder="Buscar produto por nome ou SKU..."
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        {/* Aqui poderíamos ter botões de filtros rápidos: "Ver apenas estoque baixo" */}
      </Flex>

      <DataGrid
        data={filteredData}
        columns={columns}
      />

      {/* MODAL DE MOVIMENTAÇÃO (Entrada/Saída) */}
      {selectedProduct && (
        <StockMovementModal
          opened={movementModalOpen}
          onClose={closeMovement}
          product={selectedProduct} // <--- Passa o objeto todo
          onSuccess={handleSuccessMovement}
        />
      )}

      {/* DRAWER DE HISTÓRICO (KARDEX) */}
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