import { Stack, Paper, Group, Text, SimpleGrid, Switch, Select, Divider, NumberInput, Checkbox } from '@mantine/core';
import { IconReceiptTax } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { getSellerByTenantId } from '@/features/client/user/api/users.api';

interface SettingsPanelProps {
  form: UseFormReturnType<any>;
  priceLists: any[];
}
export function SettingsPanel({ form, priceLists }: SettingsPanelProps) {

  const { data: sellerList = [] } = useQuery({
    queryKey: ['sellers-list'],
    queryFn: async () => {
      const data = await getSellerByTenantId();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Stack gap="lg" mt="md">
      <Paper withBorder p="md">
        <Group mb="md">
          <IconReceiptTax size={20} />
          <Text fw={600} size="sm">Classificação Fiscal</Text>
        </Group>
        <SimpleGrid cols={2}>
          <Switch
            label="Consumidor Final"
            {...form.getInputProps('isFinalConsumer', { type: 'checkbox' })}
          />
          <Switch
            label="Contribuinte ICMS"
            {...form.getInputProps('isICMSContributor', { type: 'checkbox' })}
          />
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md">
        <Text fw={600} size="sm" mb="md">Preferências de Venda & Crédito</Text>
        <SimpleGrid cols={2} spacing="md">
          <Select
            label="Tabela de Preço"
            data={priceLists.map(pl => ({ value: pl.id, label: pl.name }))}
            placeholder="Padrão"
            {...form.getInputProps('priceListId')}
          />
          <Select
            label="Vendedor Responsável"
            data={sellerList.map(seller => ({ value: seller.id, label: seller.name }))}
            placeholder="Selecione"
            {...form.getInputProps('sellerId')}
          />
        </SimpleGrid>

        <Divider my="md" />

        <Group align="flex-end">
          <NumberInput
            label="Limite de Crédito"
            prefix="R$ "
            thousandSeparator="."
            decimalSeparator=","
            fixedDecimalScale
            decimalScale={2}
            style={{ flex: 1 }}
            {...form.getInputProps('creditLimit')}
          />
          <Checkbox
            label="Permitir vendas acima do limite"
            mb={10}
            {...form.getInputProps('allowExceedLimit', { type: 'checkbox' })}
          />
        </Group>
      </Paper>
    </Stack>
  );
}