import { Paper, Table, NumberInput, Text, Group, Select } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';

import { VariationItem } from './step-3-variations';
import { getWarehouses } from '@/features/public/stock/stock-service';

export function StepStock({ form }: { form: UseFormReturnType<any> }) {
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name }));

  const updateVariantStock = (index: number, field: string, value: any) => {
    form.setFieldValue(`variants.${index}.${field}`, value);
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed" mb="md">
        Defina o saldo inicial para os produtos que você acabou de criar.
      </Text>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Produto / Variação</Table.Th>
            <Table.Th>Depósito de Entrada</Table.Th>
            <Table.Th>Saldo Inicial</Table.Th>
            <Table.Th>Estoque Mínimo</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {form.values.variants.map((v: VariationItem, index: number) => (
            <Table.Tr key={v.id}>
              <Table.Td fw={500}>
                {form.values.name} {form.values.hasVariations ? `- ${v.name}` : ''}
              </Table.Td>
              <Table.Td>
                <Select
                  data={warehouseOptions}
                  placeholder="Padrão (Matriz)"
                  value={v.warehouseId}
                  onChange={(val) => updateVariantStock(index, 'warehouseId', val)}
                  size="xs"
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  min={0}
                  value={v.initialStock}
                  onChange={(val) => updateVariantStock(index, 'initialStock', val)}
                  size="xs"
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  min={0}
                  value={v.minStock}
                  onChange={(val) => updateVariantStock(index, 'minStock', val)}
                  size="xs"
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}