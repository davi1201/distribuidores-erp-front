'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Container, Center, Loader, Text, Stack } from '@mantine/core';
import { Suspense } from 'react';
import { StripeCheckout } from '@/features/client/checkout';


function CheckoutContent() {
  const searchParams = useSearchParams();
  const planSlug = searchParams.get('plan');
  const cycle = searchParams.get('cycle') || 'monthly';
  const router = useRouter();

  if (!planSlug) {
    return (
      <Center h={400}>
        <Stack align="center">
          <Text>Nenhum plano selecionado.</Text>
          <Button onClick={() => router.push('/settings/billing')}>Voltar para Planos</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <StripeCheckout planSlug={planSlug} cycle={cycle} />
  );
}

// É necessário envolver em Suspense ao usar useSearchParams no Next App Router
export default function CheckoutPage() {
  return (
    <Container size="md" py="xl">
      <Suspense fallback={<Center h={400}><Loader /></Center>}>
        <CheckoutContent />
      </Suspense>
    </Container>
  );
}