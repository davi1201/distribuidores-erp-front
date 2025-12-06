'use client';

import { useEffect } from 'react';
import { Modal, Stack, TextInput, NumberInput, Select, Button, Group, Text, SegmentedControl, Divider, SimpleGrid, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconArrowDown, IconArrowUp, IconDeviceFloppy, IconVersions, IconArrowsExchange } from '@tabler/icons-react';
import { createStockMovement, transferStock, getWarehouses, MovementType } from '../../stock-service';
import { Product } from '@/features/public/products/product-service';


interface StockMovementModalProps {
  opened: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

export function StockMovementModal({ opened, onClose, product, onSuccess }: StockMovementModalProps) {
  const queryClient = useQueryClient();

  // Busca depósitos disponíveis para transferência
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
    staleTime: 1000 * 60 * 5
  });

  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name }));

  const hasVariants = product.variants && product.variants.length > 0;

  const variantOptions = hasVariants
    ? product.variants.map(v => ({ value: v.id, label: v.name || v.variantName || v.sku }))
    : [];

  const form = useForm({
    initialValues: {
      productId: product.id,
      type: 'ENTRY' as MovementType | 'TRANSFER', // Adicionado TRANSFER
      quantity: 1,
      reasonType: '',
      reasonCustom: '',
      documentReference: '',
      // Campos de Transferência
      fromWarehouseId: '',
      toWarehouseId: '',
    },
    validate: {
      quantity: (val) => (val <= 0 ? 'Quantidade deve ser maior que zero' : null),
      productId: (val) => (!val ? 'Selecione o produto/variação' : null),
      // Validação condicional
      reasonType: (val, values) => (values.type !== 'TRANSFER' && !val ? 'Selecione um motivo' : null),
      fromWarehouseId: (val, values) => (values.type === 'TRANSFER' && !val ? 'Origem obrigatória' : null),
      toWarehouseId: (val, values) => (values.type === 'TRANSFER' && !val ? 'Destino obrigatório' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue('productId', hasVariants ? '' : product.id);

      // Tenta preencher defaults para transferência
      if (warehouses.length >= 2) {
        // Ex: Origem = Matriz (primeiro), Destino = Segundo
        form.setFieldValue('fromWarehouseId', warehouses[0].id);
      }
    }
  }, [opened, product, warehouses]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const finalReason = values.reasonCustom
        ? `${values.reasonType ? values.reasonType + ' - ' : ''}${values.reasonCustom}`
        : values.reasonType || 'Transferência Manual';

      // FLUXO DE TRANSFERÊNCIA
      if (values.type === 'TRANSFER') {
        return transferStock({
          productId: values.productId,
          fromWarehouseId: values.fromWarehouseId,
          toWarehouseId: values.toWarehouseId,
          quantity: Number(values.quantity),
          reason: finalReason
        });
      }

      // FLUXO DE ENTRADA/SAÍDA (Padrão)
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      title={<Text fw={700}>Movimentar Estoque: {product.name}</Text>}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
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
              {
                value: 'TRANSFER',
                label: (
                  <Group gap={6}>
                    <IconArrowsExchange size={16} color="yellow" />
                    <span>Transferência</span>
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

          {operationType === 'TRANSFER' ? (
            <Paper withBorder p="sm" bg="var(--mantine-color-default)">
              <Text size="sm" fw={500} mb="xs">Rota da Transferência</Text>
              <SimpleGrid cols={2}>
                <Select
                  label="Origem (Sai de)"
                  placeholder="Selecione..."
                  data={warehouseOptions}
                  required
                  {...form.getInputProps('fromWarehouseId')}
                />
                <Select
                  label="Destino (Entra em)"
                  placeholder="Selecione..."
                  data={warehouseOptions.filter(w => w.value !== form.values.fromWarehouseId)}
                  required
                  {...form.getInputProps('toWarehouseId')}
                />
              </SimpleGrid>
            </Paper>
          ) : (
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
                'Venda',
                'Perda / Quebra',
                'Uso Interno / Consumo',
                'Ajuste de Inventário (Falta)',
                'Devolução ao Fornecedor'
              ]}
              required
              {...form.getInputProps('reasonType')}
            />
          )}

          <TextInput
            label="Observação / Justificativa"
            placeholder={operationType === 'TRANSFER' ? "Motivo da transferência..." : "Detalhes adicionais..."}
            {...form.getInputProps('reasonCustom')}
          />

          {operationType !== 'TRANSFER' && (
            <TextInput
              label="Nº Documento / Nota"
              placeholder="Ex: NF 1234"
              {...form.getInputProps('documentReference')}
            />
          )}

          <Button
            type="submit"
            fullWidth
            mt="md"
            loading={mutation.isPending}
            color={operationType === 'ENTRY' ? 'green' : operationType === 'EXIT' ? 'red' : 'blue'}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            Confirmar {operationType === 'ENTRY' ? 'Entrada' : operationType === 'EXIT' ? 'Saída' : 'Transferência'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}