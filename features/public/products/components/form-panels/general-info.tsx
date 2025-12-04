import { SimpleGrid, TextInput, Select, Textarea, Switch, Group, Tooltip, ActionIcon } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconRefresh } from '@tabler/icons-react';

export function GeneralInfoPanel({ form }: { form: UseFormReturnType<any> }) {
  const generateRandomSku = () => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    form.setFieldValue('sku', `PRD-${randomPart}`);
  };

  return (
    <>
      <Group justify="flex-end" mb="md">
        <Switch
          label="Produto Ativo"
          {...form.getInputProps('isActive', { type: 'checkbox' })}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <TextInput
          label="Nome do Produto"
          placeholder="Ex: Camiseta Básica Algodão"
          required
          style={{ gridColumn: 'span 2' }} // Ocupa 2 colunas
          {...form.getInputProps('name')}
        />

        <TextInput
          label="SKU (Código Interno)"
          placeholder="Deixe vazio para gerar auto"
          {...form.getInputProps('sku')}
          rightSection={
            <Tooltip label="Gerar código aleatório">
              <ActionIcon variant="light" size="sm" onClick={generateRandomSku}>
                <IconRefresh size={12} />
              </ActionIcon>
            </Tooltip>
          }
        />
        <TextInput
          label="Código de Barras (EAN/GTIN)"
          placeholder="789..."
          {...form.getInputProps('ean')}
        />

        <TextInput
          label="Marca"
          placeholder="Ex: Nike, Própria..."
          {...form.getInputProps('brand')}
        />

        <Select
          label="Unidade"
          data={['UN', 'KG', 'LT', 'CX', 'PC', 'MT']}
          {...form.getInputProps('unit')}
          searchable
        />
      </SimpleGrid>

      <Textarea
        mt="lg"
        label="Descrição Detalhada"
        placeholder="Informações adicionais para o site ou proposta comercial..."
        autosize
        minRows={4}
        {...form.getInputProps('description')}
      />
    </>
  );
}