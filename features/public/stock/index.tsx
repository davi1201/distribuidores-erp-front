import { PageHeader } from '@/components/page-header/page-header';
import { Stack } from '@mantine/core';
import { StockList } from './components/stock-list';

export default function StockPage() {
  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title="Gestão de Estoque"
        description="Controle de entradas, saídas e rastreabilidade de produtos."
        breadcrumbs={[
          { title: 'Dashboard', href: '/backoffice/dashboard' },
          { title: 'Estoque', href: '/backoffice/stock' },
        ]}
      />

      <StockList />
    </Stack>
  );
}