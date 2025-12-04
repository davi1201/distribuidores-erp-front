'use client';

import { useMemo } from 'react';
import { Group, Avatar, Text, NumberInput, ActionIcon, Stack, Center } from '@mantine/core';
import { IconTrash, IconShoppingCartOff } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';
import { useCartStore, CartItem } from '../stores/use-cart-store';
import { formatCurrency } from '@/utils/formatter';
import { DataGrid } from '@/components/ui/data-grid/data-grid';

export function CartList() {
  const { items, updateQuantity, removeItem } = useCartStore();

  const columns = useMemo<ColumnDef<CartItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Produto',
        cell: ({ row }) => (
          <Group gap="sm">
            <Avatar src={row.original.imageUrl} radius="sm" size="md" color="blue" />
            <div style={{ maxWidth: 300 }}>
              <Text size="sm" fw={500} lineClamp={2}>{row.original.name}</Text>
              <Text size="xs" c="dimmed">SKU: {row.original.sku}</Text>
            </div>
          </Group>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: 'Preço Unit.',
        size: 120,
        cell: ({ getValue }) => (
          <Text size="sm">{formatCurrency(Number(getValue()))}</Text>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Qtd',
        size: 100,
        cell: ({ row }) => (
          <NumberInput
            value={row.original.quantity}
            min={1}
            allowNegative={false}
            onChange={(val) => updateQuantity(row.original.productId, Number(val))}
            size="xs"
            w={80}
          />
        ),
      },
      {
        id: 'subtotal',
        header: 'Subtotal',
        size: 120,
        cell: ({ row }) => {
          const subtotal = (row.original.unitPrice * row.original.quantity) - row.original.discount;
          return <Text size="sm" fw={700}>{formatCurrency(subtotal)}</Text>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => (
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => removeItem(row.original.productId)}
          >
            <IconTrash size={18} />
          </ActionIcon>
        ),
      },
    ],
    [updateQuantity, removeItem]
  );

  if (items.length === 0) {
    return (
      <Center h={300} bg="var(--mantine-color-default)" style={{ borderRadius: 8 }}>
        <Stack align="center" gap="xs" c="dimmed">
          <IconShoppingCartOff size={48} stroke={1.5} />
          <Text>Seu carrinho está vazio</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <DataGrid
      data={items}
      columns={columns}
    />
  );
}