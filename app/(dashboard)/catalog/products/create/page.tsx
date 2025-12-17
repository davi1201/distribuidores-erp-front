
import { ProductWizard } from '@/features/client/products';
import { PageHeader } from '../../../../../src/shared/components/page-header/page-header';

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