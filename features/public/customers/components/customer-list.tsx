'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Drawer, Button,
  TextInput, Flex
} from '@mantine/core';
import { IconDots, IconPencil, IconTrash, IconSearch, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { getCustomers, deleteCustomer } from '../customers-service';
import { Customer } from '../types';
import { CustomerForm } from './customer-form';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { formatDocumentNumber } from '@/utils/formatter';

export function CustomerList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const [opened, { open, close }] = useDisclosure(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      notifications.show({ message: 'Cliente excluído', color: 'green' });
    },
    onError: () => {
      notifications.show({ message: 'Erro ao excluir', color: 'red' });
    }
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    open();
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    open();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSuccess = () => {
    close();
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const filteredData = useMemo(() => {
    return customers.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.document.includes(search)
    );
  }, [customers, search]);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Cliente',
        cell: ({ row }) => (
          <div>
            <Text size="sm" fw={500}>{row.original.name}</Text>
            <Text size="xs" c="dimmed">{row.original.email}</Text>
          </div>
        ),
      },
      {
        accessorKey: 'document',
        header: 'Documento',
        cell: ({ getValue }) => <Text>{formatDocumentNumber(getValue() as string)}</Text>,
      },
      {
        accessorKey: 'personType',
        header: 'Tipo',
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return (
            <Badge color={val === 'PJ' ? 'blue' : 'teal'} variant="light">
              {val}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => (
          getValue()
            ? <Badge color="green">Ativo</Badge>
            : <Badge color="gray">Inativo</Badge>
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
                <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => handleDelete(row.original.id)}>
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
          placeholder="Buscar por nome ou CPF/CNPJ..."
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Button leftSection={<IconPlus size={18} />} onClick={handleCreate}>
          Novo Cliente
        </Button>
      </Flex>

      <DataGrid
        data={filteredData}
        columns={columns}
      />

      <Drawer
        opened={opened}
        onClose={close}
        title={<Text fw={700} size="lg">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</Text>}
        position="right"
        size="xl"
        padding="xl"
      >
        <CustomerForm
          initialData={editingCustomer}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </Drawer>
    </>
  );
}