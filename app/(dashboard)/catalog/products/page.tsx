import { ProductList } from '@/features/client/products';
import { PageHeader } from '../../../../src/shared/components/page-header/page-header';

import { Stack } from '@mantine/core';

export default function ProductsPage() {
  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title="Produtos"
        description="Gerencie seu catálogo, preços e estoque."
        breadcrumbs={[
          { title: 'Dashboard', href: '/' },
          { title: 'Produtos', href: '/products' },
        ]}
      />

      <ProductList />
    </Stack>
  );
}