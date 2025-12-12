'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Modal, Stack, Group, Select, Divider, Text, NumberInput, Button,
  ActionIcon, Card
} from '@mantine/core';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';

import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { getStockProducts, createTransfer } from '../../stock-service';

interface TransferRequestModalProps {
  opened: boolean;
  onClose: () => void;
  warehouses: any[];
  user: any;
  onSuccess: () => void;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
}

export function TransferRequestModal({ opened, onClose, warehouses, user, onSuccess }: TransferRequestModalProps) {
  // Estados do Formulário
  const [originId, setOriginId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  // Estados de Adição de Item
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string | null>(null);
  // NOVO: Estado para persistir o objeto do produto selecionado
  const [tempSelectedProduct, setTempSelectedProduct] = useState<any>(null);

  const [qtyToAdd, setQtyToAdd] = useState<number | string>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  // Busca produtos para o Select (Autocomplete)
  const { data: searchProducts = [] } = useQuery({
    queryKey: ['products-search', debouncedQuery, originId],
    queryFn: () => getStockProducts({ search: debouncedQuery, warehouseId: originId || undefined }),
    enabled: !!debouncedQuery && opened
  });

  const createMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      notifications.show({ title: 'Sucesso', message: 'Solicitação criada com sucesso!', color: 'green' });
      handleClose();
      onSuccess();
    },
    onError: (err: any) => notifications.show({ title: 'Erro', message: err.response?.data?.message, color: 'red' })
  });

  const handleClose = () => {
    onClose();
    setItems([]);
    setOriginId(null);
    setDestinationId(null);
    setTempSelectedProduct(null); // Limpa o temporário
    setSearchQuery('');
  }

  // Configuração Inicial de Origem/Destino baseada no User
  useEffect(() => {
    if (opened && warehouses.length > 0) {
      const matrix = warehouses.find((w: any) => w.isDefault);
      const myWarehouse = warehouses.find((w: any) => w.responsibleUserId === user?.id);

      if (user?.role === 'SELLER') {
        if (matrix) setOriginId(matrix.id);
        if (myWarehouse) setDestinationId(myWarehouse.id);
      } else {
        if (matrix) setOriginId(matrix.id);
      }
    }
  }, [opened, user, warehouses]);

  const handleAddItem = () => {
    // CORREÇÃO: Usa o objeto salvo no estado, em vez de buscar na lista que pode ter mudado
    const product = tempSelectedProduct;

    if (!product) return;

    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      notifications.show({ message: 'Produto já está na lista', color: 'orange' });
      return;
    }

    setItems([...items, {
      productId: product.id,
      name: product.name,
      quantity: Number(qtyToAdd),
      unit: product.unit
    }]);

    // Reseta os campos
    setSelectedProductToAdd(null);
    setTempSelectedProduct(null);
    setQtyToAdd(1);
    setSearchQuery('');
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const handleSubmit = () => {
    if (!originId || !destinationId || items.length === 0) return;
    createMutation.mutate({
      originWarehouseId: originId,
      destinationWarehouseId: destinationId,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
    });
  };

  const productSelectData = searchProducts.map((p: any) => ({
    value: p.id,
    label: `${p.name} (Disp: ${p.quantity})`,
    disabled: p.quantity <= 0
  }));

  // Definição das colunas do Carrinho para o DataGrid
  const cartColumns = useMemo<ColumnDef<CartItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Produto',
      },
      {
        accessorKey: 'quantity',
        header: 'Qtd',
        cell: ({ row }) => `${row.original.quantity} ${row.original.unit}`
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveItem(row.original.productId)}>
            <IconTrash size={16} />
          </ActionIcon>
        )
      }
    ],
    [items]
  );

  return (
    <Modal opened={opened} onClose={handleClose} title="Nova Solicitação de Estoque" size="lg">
      <Stack>
        <Group grow>
          <Select
            label="Origem (Sair de)"
            data={warehouses.map((w: any) => ({ value: w.id, label: w.name }))}
            value={originId}
            onChange={setOriginId}
            disabled={user?.role === 'SELLER'}
            readOnly={user?.role === 'SELLER'}
          />
          <Select
            label="Destino (Enviar para)"
            data={warehouses.map((w: any) => ({ value: w.id, label: w.name }))}
            value={destinationId}
            onChange={setDestinationId}
            disabled={user?.role === 'SELLER'}
            readOnly={user?.role === 'SELLER'}
          />
        </Group>

        <Divider />

        <Text size="sm" fw={500}>Adicionar Produtos ao Pedido</Text>
        <Group align="flex-end">
          <Select
            label="Buscar Produto"
            placeholder="Digite nome ou SKU"
            data={productSelectData}
            searchable
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            value={selectedProductToAdd}
            onChange={(val) => {
              setSelectedProductToAdd(val);
              const found = searchProducts.find((p: any) => p.id === val);
              if (found) setTempSelectedProduct(found);
            }}
            style={{ flex: 1 }}
            nothingFoundMessage="Nenhum produto encontrado"
          />
          <NumberInput
            label="Qtd"
            min={1}
            value={qtyToAdd}
            onChange={setQtyToAdd}
            w={100}
          />
          <Button onClick={handleAddItem} disabled={!selectedProductToAdd}>
            <IconPlus size={18} />
          </Button>
        </Group>

        <Card withBorder p={0} radius="sm">
          {items.length === 0 ? (
            <Text c="dimmed" size="sm" p="md" ta="center">Nenhum item adicionado.</Text>
          ) : (
            <DataGrid
              data={items}
              columns={cartColumns}
            />
          )}
        </Card>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            loading={createMutation.isPending}
            disabled={items.length === 0 || !originId || !destinationId}
          >
            Confirmar Solicitação
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}