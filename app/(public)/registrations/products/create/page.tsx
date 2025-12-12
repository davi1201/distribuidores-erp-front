
import { PageHeader } from '@/components/page-header/page-header';
import { ProductForm } from '@/features/public/products/components/product-form';
import { ProductWizard } from '@/features/public/products/components/product-wizard';
import { Stack } from '@mantine/core';


export default function CreateProductPage() {
  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title="Novo Produto"
        breadcrumbs={[
          { title: 'Produtos', href: '/backoffice/products' },
          { title: 'Novo', href: '/backoffice/products/create' },
        ]}
      />

      <ProductWizard />
    </Stack>
  );
}