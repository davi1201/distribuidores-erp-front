'use client';

import { useEffect } from 'react';
import {
  Button, Group, TextInput, Switch, Stack, LoadingOverlay, Paper, Text,
  NumberInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPriceList, updatePriceList } from '../api/price-lists.api';
import { IconCheck, IconDeviceFloppy, IconPercentage } from '@tabler/icons-react';
import { PriceList } from '../types';

interface PriceListFormProps {
  initialData?: PriceList | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PriceListForm({ initialData, onSuccess, onCancel }: PriceListFormProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      name: '',
      percentageAdjustment: 0,
      isActive: true,
    },
    validate: {
      name: (val) => (val.length < 3 ? 'O nome deve ter pelo menos 3 caracteres' : null),
    },
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name,
        // Garante que o valor venha como número. Se nulo, assume 0.
        percentageAdjustment: Number(initialData.percentageAdjustment || 0),
        isActive: initialData.isActive,
      });
    } else {
      form.reset();
    }
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (initialData?.id) {
        return updatePriceList(initialData.id, values);
      } else {
        return createPriceList(values);
      }
    },
    onSuccess: () => {
      notifications.show({
        message: initialData ? 'Tabela atualizada com sucesso!' : 'Tabela criada com sucesso!',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      onSuccess();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao salvar tabela de preço';
      notifications.show({ title: 'Erro', message: msg, color: 'red' });
    }
  });

  const handleSubmit = (values: typeof form.values) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} style={{ position: 'relative' }}>
      <LoadingOverlay visible={mutation.isPending} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Stack gap="md">
        {initialData && (
          <Paper p="xs" bg="blue.0" withBorder>
            <Text size="xs" c="blue.9">
              Editando tabela: <b>{initialData.name}</b>
            </Text>
          </Paper>
        )}

        <TextInput
          label="Nome da Tabela"
          placeholder="Ex: Varejo, Atacado, VIP..."
          withAsterisk
          data-autofocus
          {...form.getInputProps('name')}
        />

        <NumberInput
          label="Ajuste Automático de Preço"
          description="Percentual aplicado sobre o preço base do produto. Use valores negativos para desconto."
          placeholder="Ex: -10 para 10% de desconto"
          rightSection={<IconPercentage size={16} color="gray" />}
          decimalScale={2}
          fixedDecimalScale
          allowNegative // Permite valores negativos
          min={-100}    // Limite mínimo (desconto total)
          max={1000}    // Limite máximo
          {...form.getInputProps('percentageAdjustment')}
        />

        <Switch
          label="Tabela Ativa"
          description="Se desativada, não aparecerá para novos clientes"
          {...form.getInputProps('isActive', { type: 'checkbox' })}
        />

        <Group justify="flex-end" mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Button variant="default" onClick={onCancel} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            {initialData ? 'Atualizar' : 'Criar Tabela'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}