import { getSuppliers } from '@/features/public/suppliers/suppliers-service';
import { Paper, TextInput, Textarea, Switch, SimpleGrid, Alert, Select, Divider, NumberInput, Text } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconInfoCircle, IconTruckDelivery } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';


export function StepBasic({ form }: { form: UseFormReturnType<any> }) {
  // Busca fornecedores para o Select
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

  return (
    <Paper withBorder p="md" radius="md">
      <SimpleGrid cols={2} spacing="lg">
        {/* Identificação */}
        <TextInput
          label="Nome do Produto (Base)"
          description="Ex: Shampoo Seda (Não coloque o tamanho aqui se for variar)"
          placeholder="Digite o nome principal"
          required
          data-autofocus
          {...form.getInputProps('name')}
        />
        <TextInput
          label="Marca"
          description="Ex: Rienza, Absolut..."
          placeholder="Digite a marca"
          {...form.getInputProps('brand')}
        />
      </SimpleGrid>

      <Textarea
        mt="md"
        label="Descrição"
        placeholder="Detalhes técnicos, benefícios..."
        minRows={3}
        {...form.getInputProps('description')}
      />

      <Divider label="Fornecedor Padrão" labelPosition="left" my="lg" />

      <SimpleGrid cols={3} spacing="lg">
        <Select
          label="Fornecedor Exclusivo"
          description="Fabricante ou distribuidor principal deste produto"
          placeholder="Selecione..."
          data={supplierOptions}
          searchable
          clearable
          leftSection={<IconTruckDelivery size={16} />}
          {...form.getInputProps('supplierId')}
        />

        <TextInput
          label="Cód. no Fornecedor"
          placeholder="Ref. ou SKU deles"
          description="Para importação de XML"
          disabled={!form.values.supplierId}
          {...form.getInputProps('supplierProductCode')}
        />

        <NumberInput
          label="Preço de Custo (Compra)"
          prefix="R$ "
          fixedDecimalScale
          min={0}
          description="Define o custo base para precificação"
          {...form.getInputProps('costPrice')}
        />
      </SimpleGrid>

      <Paper bg="var(--mantine-color-default)" p="md" radius="md" mt="xl">
        <Switch
          label="Este produto possui variações?"
          description="Marque se você vende este produto em diferentes tamanhos, cores ou pesos (Grade)."
          size="md"
          checked={form.values.hasVariations}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            form.setFieldValue('hasVariations', checked);
            form.setFieldValue('variants', []);
          }}
        />
        {form.values.hasVariations && (
          <Alert color="blue" mt="sm" icon={<IconInfoCircle />}>
            No passo 3 você poderá adicionar cada variação (Ex: 300ml, 500ml) individualmente.
          </Alert>
        )}
      </Paper>
    </Paper>
  );
}