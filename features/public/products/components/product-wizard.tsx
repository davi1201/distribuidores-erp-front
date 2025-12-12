'use client';

import { useState } from 'react';
import { Stepper, Button, Group, Paper, Title, Text, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconBox, IconReceiptTax, IconVersions, IconPackages, IconCheck } from '@tabler/icons-react';

import { createProductBatch, Product, updateProduct } from '../product-service';
import { StepBasic } from './wizard-steps/step-1-basic';
import { StepFiscal } from './wizard-steps/step-2-fiscal';
import { StepVariations, VariationItem } from './wizard-steps/step-3-variations';
import { StepStock } from './wizard-steps/step-4-stock';

interface ProductWizardProps {
  initialData?: Product | null;
}

export function ProductWizard({ initialData }: ProductWizardProps) {
  const [active, setActive] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();

  const isEditMode = !!initialData?.id;
  // Verifica se é um produto pai (tem variantes) ou simples
  const isParent = initialData?.variants && initialData.variants.length > 0;

  // Mapeia dados vindos do backend para o formato do form
  const mapProductToVariantItem = (p: any): VariationItem => {
    // Garante que pegamos o estoque corretamente, seja array ou objeto
    const stockItem = Array.isArray(p.stock) ? p.stock[0] : p.stock;

    return {
      id: p.id,
      name: p.variantName || p.name, // Se for variante usa variantName, se simples usa name
      sku: p.sku,
      unit: p.unit,
      costPrice: Number(p.costPrice),
      expenses: Number(p.expenses),
      markup: Number(p.markup),
      prices: p.prices || [],
      images: p.images || [],
      // Dados de estoque para edição
      initialStock: Number(stockItem?.quantity || 0),
      minStock: Number(stockItem?.minStock || 0),
      warehouseId: stockItem?.warehouseId || '',
    };
  };

  const getInitialValues = () => {
    const defaults = {
      name: '', description: '', brand: '', hasVariations: false,
      ncm: '', cest: '', cfop: '', origin: 0, taxProfileId: '',
      costPrice: 0, expenses: 0, markup: 0,
      supplierId: '', supplierProductCode: '',
      variants: [] as VariationItem[],
    };

    if (!initialData) return defaults;

    let variants: VariationItem[] = [];

    if (isParent) {
      variants = initialData.variants!.map(mapProductToVariantItem);
    } else {
      // Se for edição de produto simples, transformamos ele em uma "variante" visual para o form
      variants = [mapProductToVariantItem(initialData)];
    }

    const supplierLink = (initialData as any).supplier;

    return {
      name: initialData.name,
      description: initialData.description || '',
      brand: initialData.brand || '',
      hasVariations: isParent, // Define flag com base na existência de variantes
      ncm: initialData.ncm,
      cest: initialData.cest || '',
      cfop: initialData.cfop || '',
      origin: initialData.origin,
      taxProfileId: initialData.taxProfileId || '',
      costPrice: Number(initialData.costPrice),
      expenses: Number(initialData.expenses),
      markup: Number(initialData.markup),
      supplierId: supplierLink?.supplierId || '',
      supplierProductCode: supplierLink?.supplierProductCode || '',
      variants: variants,
    };
  };

  const form = useForm({
    initialValues: getInitialValues(),
    validate: {
      name: (val) => (val.length < 3 ? 'Nome obrigatório' : null),
      ncm: (val) => (active === 1 && val.length < 4 ? 'NCM obrigatório' : null),
      variants: (val) => (active === 2 && val.length === 0 ? 'Adicione pelo menos um item.' : null),
    },
  });

  const nextStep = () => {
    const validation = form.validate();
    if (validation.hasErrors) return;
    setActive((current) => (current < 3 ? current + 1 : current));
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  // --- LÓGICA DE MUTAÇÃO CORRIGIDA ---
  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {

      // 1. Prepara dados comuns do fornecedor
      const baseSupplierData = values.supplierId ? {
        supplierId: values.supplierId,
        supplierProductCode: values.supplierProductCode,
      } : undefined;

      // 2. Prepara o array de variantes formatado para o Backend
      // Isso é usado tanto no Create quanto no Update para evitar loops de requisição
      const variantsPayload = values.variants.map((variant) => {

        let finalName = values.name;

        if (values.hasVariations) {
          const pName = values.name.trim();
          const vName = variant.name.trim();

          // Lógica para evitar duplicação do nome (ex: "Mega Repair Mega Repair 250ml")
          // Se o nome da variante já começar com o nome do produto pai (case insensitive),
          // assumimos que é o nome completo e não concatenamos.
          if (vName.toLowerCase().startsWith(pName.toLowerCase())) {
            finalName = vName;
          } else {
            finalName = `${pName} ${vName}`;
          }
        }

        // Tenta extrair apenas o sufixo para o variantName se for o caso
        const variantNameShort = values.hasVariations
          ? (variant.name.toLowerCase().startsWith(values.name.toLowerCase())
            ? variant.name.slice(values.name.length).trim()
            : variant.name)
          : null;

        return {
          // Se tiver ID (edição), envia. Se for nova variante na edição, vai undefined.
          id: (isEditMode && variant.id && variant.id.length > 5) ? variant.id : undefined,

          name: finalName,
          variantName: variantNameShort || variant.name, // Salva o nome curto da variação (Ex: 250ml)
          sku: variant.sku,
          unit: variant.unit,

          // Herda fiscais do pai/form principal
          ncm: values.ncm,
          cest: values.cest,
          cfop: values.cfop,
          origin: Number(values.origin),
          taxProfileId: values.taxProfileId,

          // Financeiro
          costPrice: variant.costPrice,
          expenses: variant.expenses,
          markup: variant.markup,
          prices: variant.prices,

          // Midia
          images: variant.images,

          // Estoque (Backend deve tratar create/update do saldo)
          stock: {
            quantity: variant.initialStock, // Usado na criação
            minStock: variant.minStock,
            maxStock: 0,
            warehouseId: variant.warehouseId,
          },

          // Fornecedor
          supplier: baseSupplierData ? {
            ...baseSupplierData,
            lastPrice: variant.costPrice,
          } : undefined,
        };
      });

      // === CENÁRIO 1: CRIAÇÃO (POST) ===
      if (!isEditMode) {
        const batchPayload = {
          // Dados do Produto "Pai" (Agrupador) - null se for produto simples
          parentData: values.hasVariations ? {
            name: values.name,
            description: values.description,
            brand: values.brand,
            ncm: values.ncm,
            cest: values.cest,
            cfop: values.cfop,
            origin: Number(values.origin),
            taxProfileId: values.taxProfileId,
          } : null,

          // Lista de produtos (variantes ou item único)
          variants: variantsPayload
        };

        // Envia tudo em UM request
        return await createProductBatch(batchPayload);
      }

      // === CENÁRIO 2: EDIÇÃO (PUT/PATCH) ===
      else {
        // No modo edição, enviamos os dados do pai + a lista de variantes (novas e existentes)
        // O backend deve ser capaz de iterar sobre 'variants':
        // - Se tiver ID: Atualiza
        // - Se não tiver ID: Cria e vincula ao pai

        const updatePayload = {
          id: initialData!.id, // ID do Pai
          name: values.name,
          description: values.description,
          brand: values.brand,

          // Dados fiscais globais
          ncm: values.ncm,
          cest: values.cest,
          cfop: values.cfop,
          origin: Number(values.origin),
          taxProfileId: values.taxProfileId,

          // Enviamos as variantes dentro do payload de update do pai
          // O Backend precisa tratar esse array
          variants: variantsPayload
        };

        // Chamada ÚNICA para atualizar Pai e Filhos
        return await updateProduct(initialData!.id, updatePayload);
      }
    },
    onSuccess: () => {
      const msg = isEditMode
        ? 'Produto atualizado com sucesso!'
        : 'Produtos cadastrados com sucesso!';

      notifications.show({ title: 'Sucesso', message: msg, color: 'green' });

      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/registrations/products');
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao processar solicitação.',
        color: 'red',
      });
      console.error('Erro no wizard:', err);
    },
  });

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <div>
          <Title order={3}>
            {isEditMode ? 'Editar Produto' : 'Cadastro de Produto'}
          </Title>
          <Text c="dimmed" size="sm">
            {isEditMode
              ? 'Atualize as informações do produto e suas variações.'
              : 'Siga os passos para cadastrar um produto simples ou com grade.'}
          </Text>
        </div>
      </Group>

      <Stepper
        active={active}
        onStepClick={setActive}
        allowNextStepsSelect={isEditMode}
      >
        <Stepper.Step
          label="Básico"
          description="Identificação"
          icon={<IconBox size={18} />}
        >
          <StepBasic form={form} />
        </Stepper.Step>

        <Stepper.Step
          label="Fiscal"
          description="Impostos"
          icon={<IconReceiptTax size={18} />}
        >
          <StepFiscal form={form} />
        </Stepper.Step>

        <Stepper.Step
          label="Variações"
          description="Preços e Detalhes"
          icon={<IconVersions size={18} />}
        >
          <StepVariations form={form} />
        </Stepper.Step>

        <Stepper.Step
          label="Estoque"
          description="Saldo Inicial"
          icon={<IconPackages size={18} />}
        >
          <StepStock form={form} />
        </Stepper.Step>

        <Stepper.Completed>
          <Paper p="xl" withBorder bg="green.0">
            <Stack align="center">
              <IconCheck size={40} color="green" />
              <Title order={4}>Tudo Pronto!</Title>
              <Text>Revise os dados e clique em salvar para processar.</Text>
            </Stack>
          </Paper>
        </Stepper.Completed>
      </Stepper>

      <Group justify="flex-end" mt="xl">
        {active > 0 && (
          <Button variant="default" onClick={prevStep}>
            Voltar
          </Button>
        )}

        {active < 3 ? (
          <Button onClick={nextStep}>Próximo</Button>
        ) : (
          <Button
            color="green"
            onClick={() => mutation.mutate(form.values)}
            loading={mutation.isPending}
            disabled={mutation.isPending}
          >
            {isEditMode ? 'Salvar Alterações' : 'Finalizar Cadastro'}
          </Button>
        )}
      </Group>
    </Stack>
  );
}