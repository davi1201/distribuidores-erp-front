'use client';

import { useEffect } from 'react';
import { Modal, Stack, TextInput, NumberInput, Select, Button, Switch, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { IconLink } from '@tabler/icons-react';
import { getSuppliers } from '@/features/client/suppliers/api/suppliers.api';



interface LinkSupplierModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export function LinkSupplierModal({ opened, onClose, onConfirm }: LinkSupplierModalProps) {
  // Busca lista de fornecedores para o select
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    staleTime: 1000 * 60 * 5
  });

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

  const form = useForm({
    initialValues: {
      supplierId: '',
      supplierProductCode: '', // O código que vem na Nota Fiscal deles
      lastPrice: 0,
      leadTimeDays: 0,
      isMain: false,
    },
    validate: {
      supplierId: (val) => (!val ? 'Selecione um fornecedor' : null),
    },
  });

  useEffect(() => {
    if (opened) form.reset();
  }, [opened]);

  const handleSubmit = (values: typeof form.values) => {
    // Encontra o nome do fornecedor para exibição na tabela antes de salvar
    const supplierName = suppliers.find(s => s.id === values.supplierId)?.name;

    onConfirm({
      ...values,
      supplierName // Campo auxiliar apenas para o front mostrar na tabela
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Vincular Fornecedor" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Fornecedor"
            placeholder="Busque pelo nome..."
            data={supplierOptions}
            searchable
            required
            {...form.getInputProps('supplierId')}
          />

          <TextInput
            label="Código no Fornecedor (Ref/SKU)"
            description="Código que aparece na Nota Fiscal (XML) deste fornecedor"
            placeholder="Ex: REF-123"
            {...form.getInputProps('supplierProductCode')}
          />

          <NumberInput
            label="Último Preço de Custo"
            prefix="R$ "
            decimalScale={4}
            min={0}
            {...form.getInputProps('lastPrice')}
          />

          <NumberInput
            label="Prazo de Entrega (Dias)"
            placeholder="Ex: 5"
            min={0}
            {...form.getInputProps('leadTimeDays')}
          />

          <Group justify="space-between" mt="xs">
            <Switch
              label="Fornecedor Principal?"
              description="Será a primeira opção na sugestão de compras"
              {...form.getInputProps('isMain', { type: 'checkbox' })}
            />
          </Group>

          <Button type="submit" fullWidth mt="md" leftSection={<IconLink size={16} />}>
            Adicionar Vínculo
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}