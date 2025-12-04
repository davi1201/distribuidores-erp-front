import { PageHeader } from '@/components/page-header/page-header';
import { ProductList } from '@/features/public/products/components/product-list';
import { Stack } from '@mantine/core';

export default function ProductsPage() {
  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title="Produtos"
        description="Gerencie seu catálogo, preços e estoque."
        breadcrumbs={[
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'Produtos', href: '/products' },
        ]}
      />

      <ProductList />
    </Stack>
  );
}