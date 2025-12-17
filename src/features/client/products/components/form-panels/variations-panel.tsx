'use client';

import { useState } from 'react';
import {
  Button, Table, Text, Group, TextInput, Modal, Stack, ActionIcon, Badge, Alert, Tooltip
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconPlus, IconTrash, IconInfoCircle, IconExternalLink } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { createProduct, deleteProduct } from '../../api/product.api';

interface VariationsPanelProps {
  parentProduct: Product | null | undefined;
}

export function VariationsPanel({ parentProduct }: VariationsPanelProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  if (!parentProduct?.id) {
    return (
      <Alert color="blue" title="Modo de Criação" icon={<IconInfoCircle />}>
        Para adicionar variações (grades de tamanho, cor, etc), primeiro salve este produto principal.
      </Alert>
    );
  }

  const form = useForm({
    initialValues: {
      variantName: '',
      sku: '',
    },
    validate: {
      variantName: (val) => val.length < 1 ? 'Nome obrigatório' : null,
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const payload = {
        name: `${parentProduct.name} - ${values.variantName}`,
        variantName: values.variantName,
        sku: values.sku,
        parentId: parentProduct.id,
        ncm: parentProduct.ncm,
        origin: parentProduct.origin,
        taxProfileId: parentProduct.taxProfileId,
        unit: parentProduct.unit,
        costPrice: parentProduct.costPrice,
        expenses: parentProduct.expenses,
        markup: parentProduct.markup,
        stock: { quantity: 0, minStock: 0 },
        prices: [],
        images: []
      };

      return createProduct(payload);
    },
    onSuccess: () => {
      notifications.show({ message: 'Variação criada com sucesso!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['product', parentProduct.id] });
      setModalOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      notifications.show({ title: 'Erro', message: err.response?.data?.message || 'Erro ao criar', color: 'red' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      notifications.show({ message: 'Variação removida', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['product', parentProduct.id] });
    }
  });

  const variants = parentProduct.variants || [];

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Text fw={700}>Grade de Variações</Text>
          <Text size="sm" c="dimmed">
            Produtos filhos vinculados a este cadastro (ex: Cores, Tamanhos).
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)} variant="light">
          Adicionar Variação
        </Button>
      </Group>

      {variants.length > 0 ? (
        <Table withTableBorder striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome da Variação</Table.Th>
              <Table.Th>SKU</Table.Th>
              <Table.Th>Estoque</Table.Th>
              <Table.Th style={{ width: 100 }}>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {variants.map((v: any) => (
              <Table.Tr key={v.id}>
                <Table.Td fw={500}>{v.variantName || v.name}</Table.Td>
                <Table.Td><Badge variant="outline" color="gray">{v.sku}</Badge></Table.Td>
                <Table.Td>
                  {v.stock?.quantity || 0} {parentProduct.unit}
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <Tooltip label="Abrir cadastro completo desta variação">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => router.push(`/catalog/products/${v.id}`)}
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        if (confirm('Excluir esta variação?')) deleteMutation.mutate(v.id)
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" fs="italic" ta="center" py="xl" bg="gray.0" style={{ borderRadius: 8 }}>
          Nenhuma variação cadastrada.
        </Text>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Nova Variação" centered>
        <form onSubmit={form.onSubmit((v) => createMutation.mutate(v))}>
          <Stack>
            <Alert color="blue" icon={<IconInfoCircle />}>
              A nova variação herdará os dados fiscais e custos do produto pai. Você poderá editá-la individualmente depois.
            </Alert>

            <TextInput
              label="Nome da Variação"
              placeholder="Ex: Vermelho G"
              description={`Nome final: ${parentProduct.name} - [Variação]`}
              required
              data-autofocus
              {...form.getInputProps('variantName')}
            />

            <TextInput
              label="SKU da Variação"
              placeholder="Ex: PROD-VER-G"
              {...form.getInputProps('sku')}
            />

            <Button type="submit" loading={createMutation.isPending} fullWidth mt="md">
              Criar Variação
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
