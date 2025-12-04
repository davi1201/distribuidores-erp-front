import { useState } from 'react';
import { Select, Group, Text, Badge, Avatar, ComboboxItem, OptionsFilter } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { useCartStore } from '../stores/use-cart-store';
import { IconSearch } from '@tabler/icons-react';
import { getProducts } from '../../products/product-service';

export function ProductSearch() {
  const { priceListId, addItem } = useCartStore();
  const [searchValue, setSearchValue] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const handleProductSelect = (productId: string | null) => {
    if (!productId) return;

    if (!priceListId) {
      notifications.show({
        message: 'Selecione uma Tabela de Preço antes de adicionar produtos.',
        color: 'red'
      });
      setSearchValue(''); // Limpa seleção
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
      // Encontra o preço na tabela selecionada
      const priceObj = product.prices?.find(p => p.priceListId === priceListId);
      const price = priceObj ? Number(priceObj.price) : 0;

      if (price <= 0) {
        notifications.show({ message: 'Este produto não tem preço na tabela selecionada.', color: 'orange' });
        // Opcional: Bloquear adição
      }

      addItem(product, price);
      setSearchValue(''); // Limpa para próxima busca
      notifications.show({ message: 'Produto adicionado!', color: 'green', position: 'bottom-center' });
    }
  };

  // Filtro customizado para buscar por Nome ou SKU
  const filter: OptionsFilter = ({ options, search }) => {
    const splittedSearch = search.toLowerCase().trim().split(' ');
    return (options as ComboboxItem[]).filter((option) => {
      const words = option.label.toLowerCase().trim().split(' ');
      const sku = (option as any).sku?.toLowerCase();

      return splittedSearch.every((searchWord) =>
        words.some((word) => word.includes(searchWord)) || (sku && sku.includes(searchWord))
      );
    });
  };

  const selectData = products.map(p => ({
    value: p.id,
    label: p.name,
    sku: p.sku,
    image: p.images?.[0]?.url,
    stock: p.stock?.quantity || 0 // Assumindo que o service retorna stock objeto
  }));

  return (
    <Select
      label="Adicionar Produto"
      placeholder="Busque por nome ou SKU (Enter para selecionar)"
      data={selectData}
      searchable
      clearable
      filter={filter}
      value={searchValue}
      onChange={handleProductSelect}
      leftSection={<IconSearch size={16} />}
      size="md"
      nothingFoundMessage="Nenhum produto encontrado"
      renderOption={({ option, checked }) => (
        <Group flex="1" gap="sm">
          <Avatar src={(option as any).image} size="sm" radius="sm" />
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500}>{(option as any).label}</Text>
            <Text size="xs" c="dimmed">SKU: {(option as any).sku}</Text>
          </div>
          <Badge variant="light" color={(option as any).stock > 0 ? 'green' : 'red'}>
            {(option as any).stock} un
          </Badge>
        </Group>
      )}
    />
  );
}