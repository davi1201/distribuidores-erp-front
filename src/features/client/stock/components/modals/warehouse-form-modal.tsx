'use client';

import { useEffect } from 'react';
import { Modal, Stack, TextInput, Button, Select, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconUser } from '@tabler/icons-react';
import api from '@/lib/api'; // Ou importe seu serviço de usuários (getMembers)
import { createWarehouse } from '../../api/stock.api';

interface WarehouseFormModalProps {
  opened: boolean;
  onClose: () => void;
}

export function WarehouseFormModal({ opened, onClose }: WarehouseFormModalProps) {
  const queryClient = useQueryClient();

  // Busca lista de usuários para selecionar o responsável (Vendedor)
  const { data: users = [] } = useQuery({
    queryKey: ['team-members-select'],
    queryFn: async () => {
      const { data } = await api.get('/team'); // Ajuste para sua rota de listar time
      return data.map((u: any) => ({ value: u.id, label: u.name }));
    },
    staleTime: 1000 * 60 * 5,
  });

  const form = useForm({
    initialValues: {
      name: '',
      responsibleUserId: '',
    },
    validate: {
      name: (val) => (val.length < 3 ? 'Nome obrigatório' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      notifications.show({ message: 'Depósito criado com sucesso!', color: 'green' });
      // Invalida a lista de depósitos para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onClose();
      form.reset();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao criar depósito',
        color: 'red'
      });
    },
  });

  useEffect(() => {
    if (!opened) form.reset();
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Novo Local de Estoque"
      centered
    >
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack pos="relative">
          <LoadingOverlay visible={mutation.isPending} overlayProps={{ radius: "sm", blur: 2 }} />

          <TextInput
            label="Nome do Depósito"
            placeholder="Ex: Carro do João, Filial Centro"
            data-autofocus
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Responsável (Opcional)"
            placeholder="Selecione um vendedor"
            data={users}
            searchable
            clearable
            leftSection={<IconUser size={16} />}
            description="Se vinculado, este usuário verá apenas este estoque no app de vendas."
            {...form.getInputProps('responsibleUserId')}
          />

          <Button
            type="submit"
            fullWidth
            mt="md"
            loading={mutation.isPending}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            Salvar Local
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}