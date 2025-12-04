'use client';

import { useState, useEffect } from 'react';
import { Grid, Stack, Center, Loader } from '@mantine/core';
import { SalesHeader } from './components/sales-header';
import { ProductSearch } from './components/product-search';
import { CartList } from './components/cart-list';
import { OrderSummary } from './components/order-summary';
import { PageHeader } from '@/components/page-header/page-header';


export function Sales() {
  // Fix para Hydration do Zustand persist
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Center h="100vh"><Loader /></Center>
    );
  }

  return (
    <Stack gap="md" p="md">
      <PageHeader
        title="Nova Venda"
        description="Ponto de Venda (POS)"
        breadcrumbs={[{ title: 'Dashboard', href: '/backoffice' }, { title: 'Vendas', href: '/backoffice/sales' }]}
      />

      <SalesHeader />

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <ProductSearch />
            <CartList />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <OrderSummary />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}