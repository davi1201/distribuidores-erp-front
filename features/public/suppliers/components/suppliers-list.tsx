'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Flex, Drawer, Avatar
} from '@mantine/core';
import {
  IconDots, IconPencil, IconTrash, IconSearch, IconPlus, IconTruckDelivery
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { getSuppliers, deleteSupplier, Supplier } from '../suppliers-service';
import { SupplierForm } from './supplier-form';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { formatDocumentNumber } from '@/utils/formatter'; // Assumindo que você tem essa util

export function SupplierList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Gaveta
  const [opened, { open, close }] = useDisclosure(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Busca dados
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      notifications.show({ message: 'Fornecedor excluído', color: 'green' });
    },
    onError: () => {
      notifications.show({ message: 'Erro ao excluir (pode haver produtos vinculados)', color: 'red' });
    }
  });

  // Handlers
  const handleCreate = () => {
    setEditingSupplier(null);
    open();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    open();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSuccess = () => {
    close();
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  };

  // Filtro
  const filteredData = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return suppliers.filter(item =>
      item.name.toLowerCase().includes(lowerSearch) ||
      item.document.includes(lowerSearch)
    );
  }, [suppliers, search]);

  // Colunas
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Fornecedor',
        cell: ({ row }) => (
          <Group gap="sm">
            <Avatar color="blue" radius="sm"><IconTruckDelivery size={18} /></Avatar>
            <div>
              <Text size="sm" fw={500}>{row.original.name}</Text>
              <Text size="xs" c="dimmed">{row.original.email}</Text>
            </div>
          </Group>
        ),
      },
      {
        accessorKey: 'document',
        header: 'CNPJ / CPF',
        cell: ({ getValue }) => <Text size="sm">{formatDocumentNumber(getValue() as string)}</Text>,
      },
      {
        accessorKey: 'city', // Assume que o backend retorna city no nível raiz do objeto
        header: 'Localização',
        cell: ({ row }) => (
          <Text size="sm" c="dimmed">
            {row.original.city && row.original.state
              ? `${row.original.city} - ${row.original.state}`
              : '-'}
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
                  onClick={() => handleEdit(row.original)}
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
          placeholder="Buscar fornecedor..."
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={handleCreate}
        >
          Novo Fornecedor
        </Button>
      </Flex>

      <DataGrid
        data={filteredData}
        columns={columns}
      />

      <Drawer
        opened={opened}
        onClose={close}
        title={<Text fw={700} size="lg">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</Text>}
        position="right"
        size="lg"
        padding="xl"
      >
        <SupplierForm
          initialData={editingSupplier}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </Drawer>
    </>
  );
}