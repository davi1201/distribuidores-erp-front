import { useState } from 'react';
import {
  Paper, Button, Group, Text, Table, Modal, Stack, TextInput,
  SimpleGrid, NumberInput, ActionIcon, Select, Badge, Divider, Alert
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconEdit, IconInfoCircle } from '@tabler/icons-react';
import { PricingPanel } from '../form-panels/pricing-panel';
import { FilesManager } from '@/components/ui/files-manager/files-manager';

export interface VariationItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  expenses: number;
  markup: number;
  prices: any[];
  images: any[];
  // Dados de Estoque (Step 4 usa isso)
  initialStock: number;
  minStock: number;
  warehouseId: string;
}

export function StepVariations({ form }: { form: UseFormReturnType<any> }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulário Local do Modal de Variação
  const varForm = useForm<VariationItem>({
    initialValues: {
      id: '',
      name: '',
      sku: '',
      unit: 'UN',
      costPrice: form.values.costPrice || 0, // Herda o custo do Passo 1
      expenses: 0,
      markup: 0,
      prices: [],
      images: [],
      initialStock: 0,
      minStock: 0,
      warehouseId: ''
    },
    validate: {
      name: (val) => (val.length < 1 ? 'Nome da variação obrigatório' : null),
      sku: (val) => (val.length < 1 ? 'SKU obrigatório' : null),
    }
  });

  const handleOpenModal = (item?: VariationItem) => {
    if (item) {
      varForm.setValues(item);
      setEditingId(item.id);
    } else {
      varForm.reset();
      // Gera ID temporário para controle da lista no front
      varForm.setFieldValue('id', Math.random().toString(36).substr(2, 9));
      // Garante que o custo venha atualizado do pai (definido no Step 1)
      varForm.setFieldValue('costPrice', form.values.costPrice || 0);

      // Se não tem variações ativadas no Step 1, o nome pode ser fixo
      if (!form.values.hasVariations) {
        varForm.setFieldValue('name', 'Padrão');
      }
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const handleSaveVariant = () => {
    if (varForm.validate().hasErrors) return;

    const currentVariants = [...form.values.variants];

    if (editingId) {
      const index = currentVariants.findIndex(v => v.id === editingId);
      if (index !== -1) currentVariants[index] = varForm.values;
    } else {
      currentVariants.push(varForm.values);
    }

    form.setFieldValue('variants', currentVariants);
    setModalOpen(false);
  };

  const removeVariant = (id: string) => {
    const filtered = form.values.variants.filter((v: any) => v.id !== id);
    form.setFieldValue('variants', filtered);
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={700}>Itens do Produto</Text>
          <Text size="sm" c="dimmed">
            {form.values.hasVariations
              ? 'Adicione as variações (tamanhos, cores) abaixo.'
              : 'Defina os detalhes do produto único.'}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpenModal()}>
          {form.values.hasVariations ? 'Adicionar Variação' : 'Editar Detalhes do Produto'}
        </Button>
      </Group>

      {form.values.variants.length > 0 ? (
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Variação</Table.Th>
              <Table.Th>SKU</Table.Th>
              <Table.Th>Custo Base</Table.Th>
              <Table.Th>Preços</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {form.values.variants.map((item: VariationItem) => (
              <Table.Tr key={item.id}>
                <Table.Td fw={500}>{item.name}</Table.Td>
                <Table.Td><Badge color="gray" variant="outline">{item.sku}</Badge></Table.Td>
                <Table.Td>R$ {Number(item.costPrice).toFixed(2)}</Table.Td>
                <Table.Td>
                  {item.prices.length > 0 ? 'Definidos' : 'Pendente'}
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" onClick={() => handleOpenModal(item)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => removeVariant(item.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" fs="italic" ta="center" py="xl" bg="gray.0">
          Nenhum item adicionado ainda.
        </Text>
      )}

      {/* MODAL DE DETALHES DA VARIAÇÃO */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={<Text fw={700} size="lg">Detalhes da Variação</Text>}
        size="auto"
        closeOnClickOutside={false}
      >
        <Stack gap="xl">
          {/* 1. Identificação */}
          <SimpleGrid cols={3}>
            <TextInput
              label={form.values.hasVariations ? "Nome da Variação (Ex: 500ml)" : "Nome do Produto"}
              required
              {...varForm.getInputProps('name')}
              disabled={!form.values.hasVariations}
            />
            <TextInput
              label="SKU"
              placeholder="Código Único"
              required
              {...varForm.getInputProps('sku')}
            />
            <Select
              label="Unidade"
              data={['UN', 'KG', 'LT', 'CX']}
              {...varForm.getInputProps('unit')}
            />
          </SimpleGrid>

          <Divider label="Precificação" labelPosition="left" />

          {/* 2. Preços */}
          <Alert variant="light" color="gray" title="Custo Base" icon={<IconInfoCircle />} p="xs">
            <Group>
              <Text size="sm">O custo base foi herdado do fornecedor padrão (Passo 1).</Text>
              {/* Permite editar o custo individual desta variação se necessário */}
              <NumberInput
                prefix="R$ "
                size="xs"
                label="Custo Específico desta Variação"
                {...varForm.getInputProps('costPrice')}
              />
            </Group>
          </Alert>

          <PricingPanel
            // Injeta o taxProfileId do pai para o cálculo funcionar corretamente
            form={{
              ...varForm,
              values: { ...varForm.values, taxProfileId: form.values.taxProfileId }
            } as any}
          />

          <Divider label="Mídia" labelPosition="left" />

          {/* 3. Imagens */}
          <FilesManager
            value={varForm.values.images}
            onChange={(files) => varForm.setFieldValue('images', files)}
            description="Fotos específicas desta variação"
          />

          <Button fullWidth onClick={handleSaveVariant} size="md" mt="md">
            Salvar Item na Lista
          </Button>
        </Stack>
      </Modal>
    </Paper>
  );
}