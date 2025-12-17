'use client';

import { useEffect } from 'react';
import { Modal, Stack, TextInput, NumberInput, Select, Button, Group, Text, SegmentedControl } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconArrowDown, IconArrowUp, IconDeviceFloppy, IconVersions } from '@tabler/icons-react';
import { createStockMovement } from '../../api/stock.api';
import { MovementType } from '../../types';

interface StockMovementModalProps {
  opened: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

export function StockMovementModal({ opened, onClose, product, onSuccess }: StockMovementModalProps) {
  const queryClient = useQueryClient();

  const hasVariants = product.variants && product.variants.length > 0;

  const variantOptions = hasVariants
    ? product.variants.map(v => ({ value: v.id, label: v.name || v.variantName || v.sku }))
    : [];

  const form = useForm({
    initialValues: {
      productId: product.id,
      type: 'ENTRY' as MovementType, // Apenas ENTRY ou EXIT agora
      quantity: 1,
      reasonType: '',
      reasonCustom: '',
      documentReference: '',
    },
    validate: {
      quantity: (val) => (val <= 0 ? 'Quantidade deve ser maior que zero' : null),
      productId: (val) => (!val ? 'Selecione o produto/variação' : null),
      reasonType: (val) => (!val ? 'Selecione um motivo' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue('productId', hasVariants ? '' : product.id);
    }
  }, [opened, product, hasVariants]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const finalReason = values.reasonCustom
        ? `${values.reasonType ? values.reasonType + ' - ' : ''}${values.reasonCustom}`
        : values.reasonType;

      // FLUXO DE ENTRADA/SAÍDA (Ajuste Rápido)
      return createStockMovement({
        productId: values.productId,
        type: values.type as MovementType,
        quantity: Number(values.quantity),
        reason: finalReason,
        documentReference: values.documentReference,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Movimentação realizada com sucesso!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-history'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha na movimentação',
        color: 'red'
      });
    },
  });

  const operationType = form.values.type;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Ajuste Rápido de Estoque</Text>}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <Text size="sm" c="dimmed" mb={-10}>
            Produto: <b>{product.name}</b>
          </Text>

          {hasVariants && (
            <Select
              label="Selecione a Variação"
              placeholder="Escolha cor/tamanho..."
              data={variantOptions}
              leftSection={<IconVersions size={16} />}
              required
              {...form.getInputProps('productId')}
            />
          )}

          <SegmentedControl
            fullWidth
            value={form.values.type}
            onChange={(val) => form.setFieldValue('type', val as any)}
            data={[
              {
                value: 'ENTRY',
                label: (
                  <Group gap={6}>
                    <IconArrowUp size={16} color="green" />
                    <span>Entrada</span>
                  </Group>
                )
              },
              {
                value: 'EXIT',
                label: (
                  <Group gap={6}>
                    <IconArrowDown size={16} color="red" />
                    <span>Saída</span>
                  </Group>
                )
              },
            ]}
          />

          <NumberInput
            label="Quantidade"
            placeholder="0.00"
            min={1}
            fixedDecimalScale
            required
            size="md"
            {...form.getInputProps('quantity')}
          />

          <Select
            label="Motivo"
            placeholder="Selecione..."
            data={operationType === 'ENTRY' ? [
              'Compra / Reposição',
              'Produção Interna',
              'Devolução de Cliente',
              'Ajuste de Inventário (Sobra)',
              'Bonificação Recebida'
            ] : [
              'Perda / Quebra',
              'Uso Interno / Consumo',
              'Ajuste de Inventário (Falta)',
              'Devolução ao Fornecedor',
              'Venda Avulsa (Sem Pedido)'
            ]}
            required
            {...form.getInputProps('reasonType')}
          />

          <TextInput
            label="Observação / Justificativa"
            placeholder="Detalhes adicionais..."
            {...form.getInputProps('reasonCustom')}
          />

          <TextInput
            label="Nº Documento / Nota (Opcional)"
            placeholder="Ex: NF 1234"
            {...form.getInputProps('documentReference')}
          />

          <Button
            type="submit"
            fullWidth
            mt="md"
            loading={mutation.isPending}
            color={operationType === 'ENTRY' ? 'green' : 'red'}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            Confirmar {operationType === 'ENTRY' ? 'Entrada' : 'Saída'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}