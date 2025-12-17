import { Group, Select, Paper, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../stores/use-cart-store';
import { getCustomers } from '@/features/client/customers/api/customers.api'
import { getPriceLists } from '@/features/client/price-lists/api/price-lists.api'

export function SalesHeader() {
  const { customerId, setCustomer, priceListId, setPriceList, items } = useCartStore();
  const hasItems = items.length > 0;

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const { data: priceLists = [] } = useQuery({
    queryKey: ['price-lists'],
    queryFn: getPriceLists,
  });

  return (
    <Paper p="md" withBorder bg="var(--mantine-color-default)">
      <Group grow>
        <Select
          label="Cliente"
          placeholder="Selecione o cliente"
          searchable
          data={customers.map((c) => ({ value: c.id, label: c.name }))}
          value={customerId}
          onChange={setCustomer}
          disabled={hasItems} // Bloqueia troca se já tiver itens (opcional, mas seguro)
        />
        <Select
          label="Tabela de Preço"
          placeholder="Selecione a tabela"
          data={priceLists.map((pl: any) => ({ value: pl.id, label: pl.name }))}
          value={priceListId}
          onChange={setPriceList}
          disabled={hasItems} // Importante bloquear para não gerar inconsistência de preço
          description={hasItems ? "Esvazie o carrinho para trocar a tabela" : undefined}
        />
      </Group>
    </Paper>
  );
}