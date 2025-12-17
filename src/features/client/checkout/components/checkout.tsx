'use client';

import { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { Container, Paper, Title, Text, Alert } from '@mantine/core';
import { useApiClient } from '@/shared/hooks/use-api-client';
import { getSecret } from '../api/checkout.api';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeCheckout({ planSlug, cycle }: StripeCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const response = await getSecret({ planSlug, cycle });

      return response.data.clientSecret;

    } catch (err: any) {
      console.error("Erro no checkout:", err);
      const msg = err.response?.data?.message || err.message || 'Erro ao processar pagamento';
      setError(msg);
      throw err;
    }
  }, [planSlug, cycle]);

  const options = { fetchClientSecret };

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" title="Erro no Pagamento">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" radius="md" p="md" withBorder>
        <Title order={2} mb="md" ta="center">
          Finalizar Assinatura
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Complete seus dados abaixo para iniciar o período de teste.
        </Text>

        <div id="checkout" style={{ minHeight: '600px' }}>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={options}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </Paper>
    </Container>
  );
}