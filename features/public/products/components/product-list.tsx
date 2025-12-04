'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Flex, NumberFormatter, Avatar
} from '@mantine/core';
import {
  IconDots, IconPencil, IconTrash, IconSearch, IconPlus, IconPhoto, IconBox
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { getProducts, deleteProduct, Product } from '../product-service';
import { DataGrid } from '@/components/ui/data-grid/data-grid';

export function ProductList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Busca produtos
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Deletar produto
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notifications.show({ message: 'Produto excluído', color: 'green' });
    },
    onError: () => {
      notifications.show({ message: 'Erro ao excluir produto', color: 'red' });
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filtro local
  const filteredData = useMemo(() => {
    return products.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  // Definição das Colunas
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
        accessorKey: 'brand',
        header: 'Marca',
        cell: ({ getValue }) => <Text size="sm">{getValue() as string || '-'}</Text>,
      },
      {
        accessorKey: 'stock.quantity', // Acessando objeto aninhado se o DataGrid suportar, ou use cell customizada
        header: 'Estoque',
        cell: ({ row }) => {
          const qty = row.original.totalStock || 0;
          const min = row.original.stock?.minStock || 0;
          const isLow = qty <= min;

          return (
            <Badge
              color={isLow ? 'orange' : 'gray'}
              variant={isLow ? 'light' : 'transparent'}
            >
              {qty} {row.original.unit}
            </Badge>
          );
        }
      },
      {
        header: 'Custo Base',
        accessorKey: 'costPrice',
        cell: ({ row }) => (
          <Text size="sm">
            <NumberFormatter
              prefix="R$ "
              value={row.original.costPrice}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale
            />
          </Text>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => (
          getValue()
            ? <Badge color="green" size="sm" variant="dot">Ativo</Badge>
            : <Badge color="gray" size="sm" variant="dot">Inativo</Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Group gap={0} justify="flex-end">
            <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPencil size={16} />}
                  onClick={() => router.push(`/registrations/products/${row.original.id}`)}
                >
                  Editar
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash size={16} />}
                  color="red"
                  onClick={() => handleDelete(row.original.id)}
                >
                  Excluir
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
          placeholder="Buscar por nome ou SKU..."
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={() => router.push('/registrations/products/create')}
        >
          Novo Produto
        </Button>
      </Flex>

      <DataGrid
        data={filteredData}
        columns={columns}
      />
    </>
  );
}