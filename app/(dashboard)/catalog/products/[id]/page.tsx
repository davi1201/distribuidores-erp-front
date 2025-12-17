'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Center, Loader, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { PageHeader } from '../../../../../src/shared/components/page-header/page-header';
import { getProductById } from '@/features/client/products/api/product.api';
import { ProductWizard } from '@/features/client/products';


export default function EditProductPage() {
  const { id } = useParams();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (error || !product) {
    return (
      <Stack p="md">
        <Alert color="red" icon={<IconAlertCircle />}>
          Produto não encontrado ou erro ao carregar.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" p="md">
      <PageHeader
        title={`Editar: ${product.name}`}
        breadcrumbs={[
          { title: 'Produtos', href: '/backoffice/products' },
          { title: product.sku, href: '#' },
        ]}
      />

      <ProductWizard initialData={product} />
    </Stack>
  );
}