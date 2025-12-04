import { PageHeader } from '@/components/page-header/page-header';
import { FinancialList } from '@/features/public/financial/components/financial-list';
import { Stack } from '@mantine/core';


export default function FinancialPage() {
  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title="Financeiro"
        description="Contas a Receber e Fluxo de Caixa."
        breadcrumbs={[
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'Financeiro', href: '/financial' },
        ]}
      />

      <FinancialList />
    </Stack>
  );
}