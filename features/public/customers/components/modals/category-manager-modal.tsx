import { useState, useEffect, useMemo } from 'react';
import {
  Modal, Stack, Paper, Group, TextInput, Switch, Button,
  Divider, Text, Badge, ActionIcon, Select
} from '@mantine/core';
import { IconCheck, IconPlus, IconPencil, IconTrash, IconSearch, IconX } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { AddressCategory, CustomerCategory } from '../../types';

interface CategoryManagerModalProps {
  opened: boolean;
  onClose: () => void;
  type: 'customer' | 'address' | null;
  categories: CustomerCategory[] | AddressCategory[];
  onSave: (name: string, active: boolean, id?: string) => void;
  onDelete: (val: string) => void;
}

export function CategoryManagerModal({
  opened,
  onClose,
  type,
  categories,
  onSave,
  onDelete
}: CategoryManagerModalProps) {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, active, editingId || undefined);
    reset();
  };

  const handleEdit = (cat: CustomerCategory | AddressCategory) => {
    setName(cat.description);
    setActive(cat.isActive);
    setEditingId(cat.id);
    setSearchValue(cat.id);
    setDeleteConfirmId(null);
  };

  const handleSearchSelect = (val: string | null) => {
    setSearchValue(val);
    if (val) {
      const cat = categories.find(c => c.id === val);
      if (cat) handleEdit(cat);
    } else {
      reset();
    }
  };

  const reset = () => {
    setName('');
    setActive(true);
    setEditingId(null);
    setSearchValue(null);
    setDeleteConfirmId(null);
  };

  useEffect(() => {
    if (!opened) reset();
  }, [opened]);

  const columns = useMemo<ColumnDef<CustomerCategory | AddressCategory>[]>(
    () => [
      {
        accessorKey: 'description',
        header: 'Nome',
        cell: (info) => <Text size="sm" fw={500}>{info.getValue() as string}</Text>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: (info) => (
          info.getValue()
            ? <Badge size="xs" color="green" variant="outline">Ativo</Badge>
            : <Badge size="xs" color="gray" variant="outline">Inativo</Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => {
          const isConfirming = deleteConfirmId === row.original.id;

          return (
            <Group gap={4}>
              {isConfirming ? (
                <>
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="md"
                    onClick={() => {
                      onDelete(row.original.id);
                      setDeleteConfirmId(null);
                    }}
                    title="Confirmar Exclusão"
                  >
                    <IconCheck size={14} />
                  </ActionIcon>
                  <ActionIcon
                    variant="default"
                    size="md"
                    onClick={() => setDeleteConfirmId(null)}
                    title="Cancelar"
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </>
              ) : (
                <>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => handleEdit(row.original)}
                    title="Editar"
                    disabled={!!deleteConfirmId}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => setDeleteConfirmId(row.original.id)}
                    title="Excluir"
                    disabled={!!deleteConfirmId && deleteConfirmId !== row.original.id}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </>
              )}
            </Group>
          );
        },
      },
    ],
    [categories, deleteConfirmId]
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Gerenciar Categorias de {type === 'customer' ? 'Cliente' : 'Endereço'}</Text>}
      size="lg"
    >
      <Stack>
        <Select
          placeholder="Buscar categoria para editar..."
          leftSection={<IconSearch size={16} />}
          data={categories.map(cat => ({ value: cat.id, label: cat.description }))}
          searchable
          clearable
          value={searchValue}
          onChange={handleSearchSelect}
          nothingFoundMessage="Categoria não encontrada"
        />

        <Divider my="xs" />

        <Paper withBorder p="sm" bg="var(--mantine-color-default)">
          <Group align="flex-end" mb="xs">
            <TextInput
              label={editingId ? "Editar Categoria" : "Nova Categoria"}
              placeholder="Ex: VIP, Filial..."
              style={{ flex: 1 }}
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              data-autofocus={!editingId}
            />
            <Switch
              label="Ativa"
              checked={active}
              onChange={(e) => setActive(e.currentTarget.checked)}
              mb={8}
            />
          </Group>
          <Group justify="flex-end">
            {editingId && (
              <Button variant="subtle" color="gray" size="xs" onClick={reset}>Cancelar Edição</Button>
            )}
            <Button size="xs" onClick={handleSave} leftSection={editingId ? <IconCheck size={14} /> : <IconPlus size={14} />}>
              {editingId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </Group>
        </Paper>

        <Divider label="Categorias Existentes" labelPosition="center" />

        <DataGrid
          data={categories || []}
          columns={columns}
          headerTitle="Categorias"
        />
      </Stack>
    </Modal>
  );
}