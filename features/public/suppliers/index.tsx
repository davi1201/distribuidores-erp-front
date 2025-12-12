import { PageHeader } from '@/components/page-header/page-header';
import { Stack } from '@mantine/core';
import { SupplierList } from './components/suppliers-list';

export default function Suppliers() {
  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title="Fornecedores"
        description="Gerencie seus parceiros de negócio e compras."
        breadcrumbs={[
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'Cadastros', href: '#' },
          { title: 'Fornecedores', href: '/registrations/suppliers' },
        ]}
      />

      <SupplierList />
    </Stack>
  );
}