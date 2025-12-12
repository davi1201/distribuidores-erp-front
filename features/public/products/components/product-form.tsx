'use client';

import { useState } from 'react';
import {
  Button, Group, Tabs, LoadingOverlay, Title, Paper, Stack, ActionIcon, Text, Badge, Alert
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
  IconVersions,
  IconTruckDelivery,
  IconInfoCircle,
  IconArrowUp,
  IconAlertTriangle
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { createProduct, updateProduct, Product } from '../product-service';
import { GeneralInfoPanel } from './form-panels/general-info-panel';
import { PricingPanel } from './form-panels/pricing-panel';
import { TaxInfoPanel } from './form-panels/tax-info-panel';
import { StockPanel } from './form-panels/stock-panel';
import { ImagesPanel } from './form-panels/images-panel';
import { VariationsPanel } from './form-panels/variations-panel';
import { SuppliersPanel } from './form-panels/suppliers-panel';

interface ProductFormProps {
  initialData?: Product | null;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>('general');

  // Detecta se é uma Variação (Filho) ou Produto Principal (Pai)
  const isVariation = !!initialData?.parentId;
  const isCreateMode = !initialData?.id;

  // Verifica se é um Pai que já possui filhos (Grade)
  // O backend precisa retornar variants no include para isso funcionar (como já configuramos)
  const hasVariants = !isVariation && initialData?.variants && initialData.variants.length > 0;

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
      prices: initialData?.prices || [],

      // Estoque
      stock: {
        quantity: initialData?.stock?.quantity || 0,
        minStock: initialData?.stock?.minStock || 0,
        maxStock: initialData?.stock?.maxStock || 0,
        warehouseId: '', // Para entrada inicial
      },

      // Imagens e Fornecedores
      images: initialData?.images || [],
      suppliers: initialData?.suppliers || [],
    },

    validate: {
      name: (val) => (val.length < 3 ? 'Nome obrigatório' : null),
      // SKU é opcional no create (gerado auto), mas obrigatório na edição se o usuário limpar
      sku: (val) => (!isCreateMode && val.length < 1 ? 'SKU obrigatório' : null),
      ncm: (val) => (val.length < 4 ? 'NCM inválido' : null),
      costPrice: (val) => (val < 0 ? 'Não pode ser negativo' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const payload = {
        ...values,
        origin: Number(values.origin),
        stock: {
          quantity: Number(values.stock.quantity),
          minStock: Number(values.stock.minStock),
          maxStock: Number(values.stock.maxStock),
          warehouseId: values.stock.warehouseId || undefined,
        }
      };

      if (initialData?.id) {
        return updateProduct(initialData.id, payload);
      }
      return createProduct(payload);
    },
    onSuccess: (data) => {
      notifications.show({ message: 'Produto salvo com sucesso!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Se for criação, redireciona para edição para liberar as abas (Variações, etc)
      if (isCreateMode) {
        router.push(`/registrations/products/${data.id}`);
      } else if (isVariation) {
        // Mantém na tela para continuar editando
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao salvar produto';
      notifications.show({ title: 'Erro', message: msg, color: 'red' });
    }
  });

  const handleSubmit = (values: typeof form.values) => {
    mutation.mutate(values);
  };

  // Se for variação, permite voltar para o produto pai
  const handleBack = () => {
    if (isVariation && initialData?.parentId) {
      router.push(`/registrations/products/${initialData.parentId}`);
    } else {
      router.push('/registrations/products');
    }
  };

  return (
    <Stack gap="lg">
      {/* HEADER DINÂMICO */}
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" color="gray" onClick={handleBack}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Group gap="xs">
              <Title order={3}>
                {isCreateMode ? 'Novo Produto' : isVariation ? 'Editar Variação' : 'Editar Produto'}
              </Title>
              {isVariation && <Badge color="blue" variant="light">Variação / SKU</Badge>}
              {!isCreateMode && !isVariation && <Badge color="orange" variant="light">Produto Mestre</Badge>}
            </Group>

            <Text size="sm" c="dimmed">
              {isVariation
                ? 'Defina preços, estoque e fornecedores exclusivos para este tamanho/cor.'
                : 'Dados mestres. Para preços diferenciados por tamanho, utilize a aba "Grade / Variações".'}
            </Text>
          </div>
        </Group>

        <Button
          loading={mutation.isPending}
          onClick={() => form.onSubmit(handleSubmit)()}
          leftSection={<IconCheck size={18} />}
        >
          Salvar {isVariation ? 'Variação' : 'Produto'}
        </Button>
      </Group>

      {/* AVISO SE FOR CRIAÇÃO */}
      {isCreateMode && (
        <Alert variant="light" color="blue" title="Cadastro Inicial" icon={<IconInfoCircle />}>
          Preencha os dados básicos e salve para liberar as abas de <b>Variações</b> e <b>Fornecedores</b>.
        </Alert>
      )}

      {/* ÁREA DE VOLTAR AO PAI (Se for variação) */}
      {isVariation && (
        <Button
          variant="subtle"
          size="xs"
          fullWidth={false}
          style={{ alignSelf: 'flex-start' }}
          leftSection={<IconArrowUp size={14} />}
          onClick={() => router.push(`/registrations/products/${initialData?.parentId}`)}
        >
          Voltar para o Produto Pai (Grade Completa)
        </Button>
      )}

      <Paper withBorder shadow="sm" radius="md" style={{ position: 'relative', overflow: 'hidden' }}>
        <LoadingOverlay visible={mutation.isPending} overlayProps={{ radius: "sm", blur: 2 }} />

        <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
          <Tabs.List bg="var(--mantine-color-default)" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>

            <Tabs.Tab value="general" leftSection={<IconBox size={16} />}>
              Geral
            </Tabs.Tab>

            <Tabs.Tab value="tax" leftSection={<IconReceiptTax size={16} />}>
              Fiscal
            </Tabs.Tab>

            <Tabs.Tab value="pricing" leftSection={<IconCurrencyDollar size={16} />}>
              Preços
            </Tabs.Tab>

            {/* SÓ MOSTRA ABA FORNECEDORES SE JÁ SALVOU O PRODUTO */}
            {!isCreateMode && (
              <Tabs.Tab value="suppliers" leftSection={<IconTruckDelivery size={16} />}>
                Fornecedores
              </Tabs.Tab>
            )}

            {/* SÓ MOSTRA ABA ESTOQUE SE JÁ SALVOU O PRODUTO */}
            {!isCreateMode && (
              <Tabs.Tab value="stock" leftSection={<IconPackages size={16} />}>
                Estoque
              </Tabs.Tab>
            )}

            <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
              Imagens
            </Tabs.Tab>

            {/* SÓ MOSTRA ABA VARIAÇÕES SE FOR O PAI E JÁ TIVER SALVO */}
            {!isCreateMode && !isVariation && (
              <Tabs.Tab value="variations" ml="auto" leftSection={<IconVersions size={16} />} style={{ fontWeight: 600 }}>
                Grade / Variações
              </Tabs.Tab>
            )}
          </Tabs.List>

          <div style={{ padding: '20px' }}>
            <Tabs.Panel value="general">
              <GeneralInfoPanel form={form} />
            </Tabs.Panel>

            <Tabs.Panel value="tax">
              <TaxInfoPanel form={form} />
            </Tabs.Panel>

            <Tabs.Panel value="pricing">
              {/* ALERTA VISUAL SE FOR PAI COM FILHOS */}
              {hasVariants && (
                <Alert
                  color="orange"
                  icon={<IconAlertTriangle size={16} />}
                  mb="lg"
                  title="Atenção: Produto com Grade"
                >
                  Este produto possui variações cadastradas. Os preços definidos aqui servirão apenas como padrão,
                  mas o sistema utilizará os preços específicos de cada variação (ex: 500ml vs 750ml) na hora da venda.
                  <br />
                  <b>Vá na aba "Grade / Variações" para precificar cada tamanho individualmente.</b>
                </Alert>
              )}
              <PricingPanel form={form} />
            </Tabs.Panel>

            <Tabs.Panel value="suppliers">
              <SuppliersPanel form={form} />
            </Tabs.Panel>

            {/* Passa o objeto completo para o painel de estoque saber se é variação */}
            <Tabs.Panel value="stock">
              <StockPanel
                form={form}
                productId={initialData?.id}
                productName={form.values.name}
                product={initialData}
              />
            </Tabs.Panel>

            <Tabs.Panel value="images">
              <ImagesPanel form={form} />
            </Tabs.Panel>

            {/* Painel de Variações: Só renderiza se for o Pai */}
            {!isVariation && (
              <Tabs.Panel value="variations">
                <VariationsPanel parentProduct={initialData} />
              </Tabs.Panel>
            )}
          </div>
        </Tabs>
      </Paper>
    </Stack>
  );
}