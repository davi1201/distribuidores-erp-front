import { Stack } from '@mantine/core';
import { PageHeader } from '../../../../src/shared/components/page-header/page-header';
import { PriceListList } from '@/features/client/price-lists';


export default function Page() {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Cadastros', href: '/dashboard' },
    { title: 'Tabelas de Preço', href: '/price-lists' },
  ];

  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title="Tabelas de Preço"
        description="Gerencie as tabelas de valores para diferentes perfis de clientes."
        breadcrumbs={breadcrumbs}
      />

      <PriceListList />
    </Stack>
  );
}