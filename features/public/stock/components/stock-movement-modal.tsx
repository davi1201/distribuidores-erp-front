'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, NumberInput, Select, Button, Group, Text, SegmentedControl } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconArrowDown, IconArrowUp, IconDeviceFloppy, IconVersions } from '@tabler/icons-react';
import { createStockMovement, MovementType } from '../stock-service';
import { Product } from '../../products/product-service';


interface StockMovementModalProps {
  opened: boolean;
  onClose: () => void;
  product: Product; // Recebe o objeto completo agora
  onSuccess?: () => void;
}

export function StockMovementModal({ opened, onClose, product, onSuccess }: StockMovementModalProps) {
  const queryClient = useQueryClient();

  // Verifica se tem variações
  const hasVariants = product.variants && product.variants.length > 0;

  // Prepara as opções de variação
  const variantOptions = hasVariants
    ? product.variants.map(v => ({ value: v.id, label: v.name || v.variantName || v.sku }))
    : [];

  const form = useForm({
    initialValues: {
      productId: product.id, // ID do produto que será movimentado (Pai ou Filho)
      type: 'ENTRY',
      quantity: 1,
      reasonType: '',
      reasonCustom: '',
      documentReference: '',
    },
    validate: {
      quantity: (val) => (val <= 0 ? 'Quantidade deve ser maior que zero' : null),
      reasonType: (val) => (!val ? 'Selecione um motivo' : null),
      productId: (val) => (!val ? 'Selecione o produto/variação' : null),
    },
  });

  // Reseta o form quando abre um novo produto
  useEffect(() => {
    if (opened) {
      form.reset();
      // Se tiver variações, não seleciona nenhuma (obriga o usuário a escolher)
      // Se não tiver, seleciona o próprio produto pai
      form.setFieldValue('productId', hasVariants ? '' : product.id);
    }
  }, [opened, product]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const finalReason = values.reasonCustom
        ? `${values.reasonType} - ${values.reasonCustom}`
        : values.reasonType;

      return createStockMovement({
        productId: values.productId, // Usa o ID selecionado (pode ser variação)
        type: values.type as MovementType,
        quantity: Number(values.quantity),
        reason: finalReason,
        documentReference: values.documentReference,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Estoque atualizado com sucesso!', color: 'green' });
      // Invalida query geral e específica
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-history'] });

      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao movimentar estoque',
        color: 'red'
      });
    },
  });

  const isEntry = form.values.type === 'ENTRY';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Ajuste de Estoque: {product.name}</Text>}
      centered
    >
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          {/* SELETOR DE VARIAÇÃO (Só aparece se tiver filhos) */}
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
            onChange={(val) => form.setFieldValue('type', val)}
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
            min={0.001}
            fixedDecimalScale
            required
            size="md"
            {...form.getInputProps('quantity')}
          />

          <Select
            label="Motivo"
            placeholder="Selecione..."
            data={isEntry ? [
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

          <TextInput
            label="Observação"
            placeholder="Detalhes adicionais..."
            {...form.getInputProps('reasonCustom')}
          />

          <TextInput
            label="Nº Documento / Nota"
            placeholder="Ex: NF 1234"
            {...form.getInputProps('documentReference')}
          />

          <Button
            type="submit"
            fullWidth
            mt="md"
            loading={mutation.isPending}
            color={isEntry ? 'green' : 'red'}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            Confirmar {isEntry ? 'Entrada' : 'Saída'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}