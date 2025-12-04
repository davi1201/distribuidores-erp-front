import { Stack } from '@mantine/core';
import PriceLists from "@/features/public/price-lists";
import { PageHeader } from '@/components/page-header/page-header';


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

      <PriceLists />
    </Stack>
  );
}