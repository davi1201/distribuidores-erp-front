import { useState, useMemo, useCallback } from 'react';
import {
  Select, Group, Text, Badge, Avatar, ComboboxItem,
  OptionsFilter, Stack, Loader, ComboboxOptionProps
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconAlertCircle } from '@tabler/icons-react';

import { useCartStore } from '../stores/use-cart-store';
import { getSellableProducts } from '@/features/client/products/api/product.api';
// Ajuste o caminho de importação conforme sua estrutura


// --- Tipos Auxiliares ---
interface ProductOption extends ComboboxItem {
  sku: string;
  image?: string;
  totalStock: number;
  matrixStock: number;
  price: number | null;
  originalProduct: any;
}

// --- Formatador de Moeda ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ProductSearch() {
  const { priceListId, addItem } = useCartStore();
  const [searchValue, setSearchValue] = useState('');

  // 1. Busca de Dados (Cacheada pelo React Query)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getSellableProducts,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // 2. Preparação dos Dados (Memoizado para Performance)
  // Calcula o preço correto baseado na tabela selecionada APENAS quando necessário
  const selectData = useMemo(() => {
    return products.map((p: any): ProductOption => {
      // Encontra o preço na tabela selecionada
      const priceObj = p.prices?.find((pr: any) => pr.priceListId === priceListId);
      const price = priceObj ? Number(priceObj.price) : null;

      return {
        value: p.id,
        label: p.name,
        sku: p.sku,
        image: p.images?.[0]?.url,
        totalStock: Number(p.totalStock || 0),
        matrixStock: Number(p.matrixStock || 0),
        price: price, // Preço já resolvido para renderização rápida
        originalProduct: p,
        disabled: !priceListId || (price === null || price <= 0) // Desabilita se sem preço ou sem tabela
      };
    });
  }, [products, priceListId]);

  // 3. Handler de Seleção Otimizado
  const handleProductSelect = useCallback((productId: string | null, option: ComboboxItem) => {
    if (!productId) return;

    if (!priceListId) {
      notifications.show({
        title: 'Atenção',
        message: 'Selecione uma Tabela de Preço antes de adicionar produtos.',
        color: 'red',
        icon: <IconAlertCircle size={18} />
      });
      setSearchValue('');
      return;
    }

    const selectedOption = option as ProductOption;

    if (!selectedOption.price || selectedOption.price <= 0) {
      notifications.show({
        message: 'Este produto não possui preço cadastrado nesta tabela.',
        color: 'orange'
      });
      return;
    }

    // Adiciona ao carrinho usando os dados já processados
    addItem(selectedOption.originalProduct, selectedOption.price);

    // Feedback sutil e limpeza
    notifications.show({ message: 'Produto adicionado!', color: 'green', position: 'bottom-center' });
    setSearchValue('');
  }, [priceListId, addItem]);

  // 4. Filtro Customizado (Busca por Nome ou SKU)
  const filter: OptionsFilter = useCallback(({ options, search }) => {
    const splittedSearch = search.toLowerCase().trim().split(' ');
    return (options as unknown as ProductOption[]).filter((option) => {
      const words = option.label.toLowerCase().trim().split(' ');
      const sku = option.sku?.toLowerCase() || '';

      return splittedSearch.every((searchWord) =>
        words.some((word) => word.includes(searchWord)) || sku.includes(searchWord)
      );
    });
  }, []);

  // 5. Renderização Customizada do Item
  const renderOption = ({ option }: any) => {
    const item = option as unknown as ProductOption;
    const hasPrice = item.price !== null && item.price > 0;

    return (
      <Group wrap="nowrap" w="100%">
        <Avatar src={item.image} size="md" radius="sm" color="blue">
          {item.label.substring(0, 2).toUpperCase()}
        </Avatar>

        <Stack gap={2} style={{ flex: 1, overflow: 'hidden' }}>
          <Text size="sm" fw={500} truncate title={item.label}>
            {item.label}
          </Text>
          <Group gap="xs">
            <Badge size="xs" variant="outline" color="gray" style={{ textTransform: 'none' }}>
              {item.sku}
            </Badge>
            {item.totalStock <= 0 ? (
              <Badge size="xs" color="red" variant="light">Esgotado</Badge>
            ) : (
              <Text size="xs" c="dimmed">Estoque: {item.totalStock}</Text>
            )}
          </Group>
        </Stack>

        <Stack gap={2} align="flex-end" style={{ minWidth: 80 }}>
          {hasPrice ? (
            <Text fw={700} c="blue" size="sm">
              {formatCurrency(item.price!)}
            </Text>
          ) : (
            <Text size="xs" c="red" fs="italic">Sem Preço</Text>
          )}

          {item.matrixStock > 0 && (
            <Badge size="xs" variant="dot" color="cyan">
              Matriz: {item.matrixStock}
            </Badge>
          )}
        </Stack>
      </Group>
    );
  };

  return (
    <Select
      label="Adicionar Produto"
      placeholder={priceListId ? "Busque por nome ou SKU..." : "Selecione uma tabela de preço primeiro"}
      data={selectData}
      searchable
      clearable
      filter={filter}
      value={searchValue}
      onChange={(_val, option) => handleProductSelect(_val, option)}
      onSearchChange={setSearchValue}
      leftSection={isLoading ? <Loader size={16} /> : <IconSearch size={16} />}
      size="md"
      nothingFoundMessage={
        products.length === 0
          ? "Carregando catálogo..."
          : "Nenhum produto encontrado com este termo."
      }
      maxDropdownHeight={300}
      //@ts-ignore
      renderOption={renderOption}
      styles={{
        option: { padding: '8px 12px' }
      }}
      disabled={!priceListId && products.length > 0}
    />
  );
}