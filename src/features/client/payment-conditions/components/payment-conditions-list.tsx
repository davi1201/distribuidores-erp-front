'use client'

import { useState, useMemo } from 'react';
import {
  Group,
  Text,
  Badge,
  ActionIcon,
  Button,
  Paper,
  Title,
  Modal,
  Tooltip,
  Stack,

} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { notifications } from '@mantine/notifications';
import {
  IconTrash,
  IconPlus,
  IconEdit,

} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { useApiClient } from '@/shared/hooks/use-api-client';
import { PaymentConditionsForm } from './payment-conditions-form';

export function PaymentConditionsList() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [editingTerm, setEditingTerm] = useState<PaymentTerm | undefined>(undefined);
  const api = useApiClient()

  // --- Busca ---
  const { data } = useQuery({
    queryKey: ['payment-terms'],
    queryFn: async () => {
      const response = await api.get('/payment-terms');
      return response.data as PaymentTerm[];
    },
  });

  // --- Delete ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payment-terms/${id}`);
    },
    onSuccess: () => {
      notifications.show({ message: 'Removido com sucesso', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
    },
    onError: () => {
      notifications.show({ title: 'Erro', message: 'Erro ao remover.', color: 'red' });
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Deseja remover esta condição?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (term: PaymentTerm) => {
    notifications.show({ message: 'Edição em desenvolvimento (Mock)', color: 'blue' });
  };

  const handleOpenCreate = () => {
    setEditingTerm(undefined);
    open();
  };

  // --- Colunas do DataGrid ---
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Descrição',
      cell: (info: any) => (
        <Stack gap={0}>
          <Text fw={600} size="sm">{info.row.original.name}</Text>
          {info.row.original.description && (
            <Text size="xs" c="dimmed">{info.row.original.description}</Text>
          )}
        </Stack>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Aplicação',
      size: 120,
      cell: (info: any) => {
        const type = info.getValue();
        const colors: Record<string, string> = { RECEIVABLE: 'green', PAYABLE: 'red', BOTH: 'blue' };
        const labels: Record<string, string> = { RECEIVABLE: 'Venda', PAYABLE: 'Compra', BOTH: 'Geral' };
        return <Badge color={colors[type]} variant="light">{labels[type]}</Badge>;
      },
    },
    {
      id: 'rules',
      header: 'Regras',
      cell: (info: any) => {
        const rules = info.row.original.rules as PaymentTermRule[];
        const isFlexible = info.row.original.isFlexible;

        if (isFlexible) {
          return <Badge color="cyan" variant="outline">Flexível / A Combinar</Badge>;
        }

        return (
          <Group gap={6}>
            {rules.map((rule, idx) => (
              <Badge key={idx} size="sm" variant="outline" color="gray" style={{ textTransform: 'none' }}>
                {rule.days === 0 ? 'Entrada' : `${rule.days}d`}
                <span style={{ marginLeft: 4, opacity: 0.6 }}>{rule.percent}%</span>
              </Badge>
            ))}
          </Group>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      size: 100,
      cell: (info: any) => (
        <Group gap={4} justify="flex-end">
          <Tooltip label="Editar">
            <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(info.row.original)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Excluir">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => handleDelete(info.row.original.id)}
              loading={deleteMutation.isPending && deleteMutation.variables === info.row.original.id}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ], [deleteMutation.isPending]);

  return (
    <>
      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" mb="lg">
          <Title order={4}>Condições de Pagamento</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
            Nova Condição
          </Button>
        </Group>

        <DataGrid
          data={data || []}
          columns={columns}
        />
      </Paper>

      <Modal opened={opened} onClose={close} title={<Text fw={700}>Cadastrar Condição</Text>} size="lg" centered>
        <PaymentConditionsForm
          onSuccess={() => {
            close();
            queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
          }}
          onCancel={close}
        />
      </Modal>
    </>
  );
}