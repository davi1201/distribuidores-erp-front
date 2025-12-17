'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Drawer, Button,
  TextInput, Flex
} from '@mantine/core';
import { IconDots, IconPencil, IconTrash, IconSearch, IconPlus, IconTag } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { getPriceLists, deletePriceList } from '../api/price-lists.api';
import { PriceListForm } from './price-list-form';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { PriceList } from '../types';

export function PriceListList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const [opened, { open, close }] = useDisclosure(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);

  const { data: priceLists = [], isLoading } = useQuery({
    queryKey: ['price-lists'],
    queryFn: getPriceLists,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePriceList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      notifications.show({ message: 'Tabela excluída', color: 'green' });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao excluir';
      notifications.show({ message: msg, color: 'red' });
    }
  });

  const handleEdit = (priceList: PriceList) => {
    setEditingPriceList(priceList);
    open();
  };

  const handleCreate = () => {
    setEditingPriceList(null);
    open();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tabela?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSuccess = () => {
    close();
    queryClient.invalidateQueries({ queryKey: ['price-lists'] });
  };

  const filteredData = useMemo(() => {
    return priceLists.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [priceLists, search]);

  const columns = useMemo<ColumnDef<PriceList>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome da Tabela',
        cell: ({ row }) => (
          <Group gap="sm">
            <IconTag size={16} color="gray" />
            <Text size="sm" fw={500}>{row.original.name}</Text>
          </Group>
        ),
      },
      {
        accessorKey: '_count.customers',
        header: 'Clientes Vinculados',
        cell: ({ row }) => (
          <Badge variant="light" color="blue">
            {row.original._count?.customers || 0} clientes
          </Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => (
          getValue()
            ? <Badge color="green" variant="dot">Ativa</Badge>
            : <Badge color="gray" variant="dot">Inativa</Badge>
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
                <Menu.Item leftSection={<IconPencil size={16} />} onClick={() => handleEdit(row.original)}>
                  Editar
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash size={16} />}
                  color="red"
                  onClick={() => handleDelete(row.original.id)}
                  disabled={(row.original._count?.customers || 0) > 0} // Impede deletar se tiver uso
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
          placeholder="Buscar tabela..."
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Button leftSection={<IconPlus size={18} />} onClick={handleCreate}>
          Nova Tabela
        </Button>
      </Flex>

      <DataGrid
        data={filteredData}
        columns={columns}

      />

      <Drawer
        opened={opened}
        onClose={close}
        title={<Text fw={700} size="lg">{editingPriceList ? 'Editar Tabela' : 'Nova Tabela de Preço'}</Text>}
        position="right"
        size="md" // Tamanho ajustado pois o form é menor
        padding="xl"
      >
        <PriceListForm
          initialData={editingPriceList}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </Drawer>
    </>
  );
}