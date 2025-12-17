import { FinancialReceivableList } from '@/features/client/financial';
import { PageHeader } from '../../../../src/shared/components/page-header/page-header';

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

      <FinancialReceivableList />
    </Stack>
  );
}