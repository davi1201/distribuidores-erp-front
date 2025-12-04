'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Flex, Drawer
} from '@mantine/core';
import {
  IconDots, IconPencil, IconTrash, IconSearch, IconPlus, IconReceiptTax
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { getTaxProfiles, deleteTaxProfile, TaxProfile } from '../tax-profiles-service';
import { TaxProfileForm } from './tax-profiles-form';
import { DataGrid } from '@/components/ui/data-grid/data-grid';

export function TaxProfileList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Controle da Gaveta
  const [opened, { open, close }] = useDisclosure(false);
  const [editingProfile, setEditingProfile] = useState<TaxProfile | null>(null);

  // Busca dados
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['tax-profiles'],
    queryFn: getTaxProfiles,
  });

  // Mutation de Delete
  const deleteMutation = useMutation({
    mutationFn: deleteTaxProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-profiles'] });
      notifications.show({ message: 'Perfil excluído', color: 'green' });
    },
    onError: (error: any) => {
      // Tratamento para erro de chave estrangeira (se estiver em uso)
      const msg = error.response?.data?.message || 'Erro ao excluir perfil';
      notifications.show({ message: msg, color: 'red' });
    }
  });

  // Handlers
  const handleEdit = (profile: TaxProfile) => {
    setEditingProfile(profile);
    open();
  };

  const handleCreate = () => {
    setEditingProfile(null);
    open();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Isso pode afetar produtos que usam este perfil.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSuccess = () => {
    close();
    queryClient.invalidateQueries({ queryKey: ['tax-profiles'] });
  };

  // Filtro Local
  const filteredData = useMemo(() => {
    return profiles.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [profiles, search]);

  // Definição das Colunas
  const columns = useMemo<ColumnDef<TaxProfile>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome do Perfil',
        cell: ({ row }) => (
          <Group gap="sm">
            <IconReceiptTax size={20} color="gray" />
            <div>
              <Text size="sm" fw={500}>{row.original.name}</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>{row.original.description || 'Sem descrição'}</Text>
            </div>
          </Group>
        ),
      },
      {
        id: 'rulesCount',
        header: 'Regras Configuradas',
        cell: ({ row }) => (
          <Badge variant="light" color="blue">
            {row.original.rules?.length || 0} regras
          </Badge>
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
                  Editar Regras
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
          placeholder="Buscar perfil..."
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={handleCreate}
        >
          Novo Perfil
        </Button>
      </Flex>

      <DataGrid
        data={filteredData}
        columns={columns}
      />

      <Drawer
        opened={opened}
        onClose={close}
        title={<Text fw={700} size="lg">{editingProfile ? 'Editar Perfil Tributário' : 'Novo Perfil Tributário'}</Text>}
        position="right"
        size="xl" // XL para caber a tabela de regras confortavelmente
        padding="xl"
      >
        <TaxProfileForm
          initialData={editingProfile}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </Drawer>
    </>
  );
}