'use client';

import { useState, useEffect } from 'react';
import {
  Button, Group, Tabs, LoadingOverlay, Title, Paper, Stack, ActionIcon, Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconBox,
  IconCurrencyDollar,
  IconReceiptTax,
  IconPackages,
  IconPhoto,
  IconArrowLeft,
  IconCheck,
  IconVersions
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { createProduct, updateProduct, Product } from '../product-service';
import { GeneralInfoPanel } from '../components/form-panels/general-info';
import { PricingPanel } from './form-panels/pricing-panel';
import { TaxInfoPanel } from './form-panels/tax-info-panel';
import { StockPanel } from './form-panels/stoke-panel';
import { ImagesPanel } from './form-panels/images-panel';
import { VariationsPanel } from './form-panels/variations-panel';

interface ProductFormProps {
  initialData?: Product | null;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>('general');

  const form = useForm({
    initialValues: {
      // Geral
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      ean: initialData?.ean || '',
      brand: initialData?.brand || '',
      unit: initialData?.unit || 'UN',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,

      // Fiscal
      ncm: initialData?.ncm || '',
      cest: initialData?.cest || '',
      cfop: initialData?.cfop || '',
      origin: initialData?.origin || 0,
      taxProfileId: initialData?.taxProfileId || '',

      // Custos & Preços
      costPrice: initialData?.costPrice || 0,
      expenses: initialData?.expenses || 0,
      markup: initialData?.markup || 0,
      prices: initialData?.prices || [], // Array de { priceListId, price }

      // Estoque
      stock: {
        quantity: initialData?.stock?.quantity || 0,
        minStock: initialData?.stock?.minStock || 0,
        maxStock: initialData?.stock?.maxStock || 0,
      },

      // Imagens
      images: initialData?.images || [],
    },

    validate: {
      name: (val) => (val.length < 3 ? 'Nome obrigatório' : null),
      sku: (val) => (val.length < 1 ? 'SKU obrigatório' : null),
      ncm: (val) => (val.length < 4 ? 'NCM inválido' : null),
      costPrice: (val) => (val < 0 ? 'Não pode ser negativo' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      // Ajustes finos no payload se necessário (ex: converter strings para number)
      const payload = {
        ...values,
        origin: Number(values.origin),
        // Garante que o estoque seja enviado como objeto
        stock: {
          quantity: Number(values.stock.quantity),
          minStock: Number(values.stock.minStock),
          maxStock: Number(values.stock.maxStock),
        }
      };

      if (initialData?.id) {
        return updateProduct(initialData.id, payload);
      }
      return createProduct(payload);
    },
    onSuccess: () => {
      notifications.show({ message: 'Produto salvo com sucesso!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/registrations/products'); // Volta para listagem
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao salvar produto';
      notifications.show({ title: 'Erro', message: msg, color: 'red' });
    }
  });

  const handleSubmit = (values: typeof form.values) => {
    // Validação extra se precisar (ex: verificar se tem preço em todas as tabelas)
    mutation.mutate(values);
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" color="gray" onClick={() => router.back()}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={3}>{initialData ? 'Editar Produto' : 'Novo Produto'}</Title>
            <Text size="sm" c="dimmed">Preencha as informações abaixo</Text>
          </div>
        </Group>
        <Button
          loading={mutation.isPending}
          onClick={() => form.onSubmit(handleSubmit)()}
          leftSection={<IconCheck size={18} />}
        >
          Salvar Produto
        </Button>
      </Group>

      <Paper withBorder shadow="sm" radius="md" style={{ position: 'relative', overflow: 'hidden' }}>
        <LoadingOverlay visible={mutation.isPending} overlayProps={{ radius: "sm", blur: 2 }} />

        <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
          <Tabs.List bg="var(--mantine-color-default)" style={{ borderBottom: '1px solid var(--mantine-color-gray-6)' }}>
            <Tabs.Tab value="general" leftSection={<IconBox size={16} />}>Dados Gerais</Tabs.Tab>
            <Tabs.Tab value="tax" leftSection={<IconReceiptTax size={16} />}>Fiscal</Tabs.Tab>
            <Tabs.Tab value="pricing" leftSection={<IconCurrencyDollar size={16} />}>Preços e Custos</Tabs.Tab>
            <Tabs.Tab value="variations" leftSection={<IconVersions size={16} />}>Variações</Tabs.Tab>
            <Tabs.Tab value="stock" leftSection={<IconPackages size={16} />}>Estoque</Tabs.Tab>
            <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>Imagens</Tabs.Tab>
          </Tabs.List>

          <div style={{ padding: '20px' }}>
            <Tabs.Panel value="general">
              <GeneralInfoPanel form={form} />
            </Tabs.Panel>

            <Tabs.Panel value="tax">
              <TaxInfoPanel form={form} />
            </Tabs.Panel>

            <Tabs.Panel value="pricing">
              <PricingPanel form={form} />
            </Tabs.Panel>

            <Tabs.Panel value="variations">
              <VariationsPanel parentProduct={initialData} />
            </Tabs.Panel>


            <Tabs.Panel value="stock">
              <StockPanel form={form} productId={initialData?.id} />
            </Tabs.Panel>

            <Tabs.Panel value="images">
              <ImagesPanel form={form} />
            </Tabs.Panel>
          </div>
        </Tabs>
      </Paper>
    </Stack>
  );
}