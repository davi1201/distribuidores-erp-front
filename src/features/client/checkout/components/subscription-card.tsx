'use client';

import { useEffect, useState } from 'react';
import { Paper, Title, Text, Button, Badge, Group, Loader, Stack } from '@mantine/core';
import { useApiClient } from '@/shared/hooks/use-api-client';
import { IconExternalLink } from '@tabler/icons-react';


interface SubscriptionData {
  planName: string;
  status: string;
  amount: string;
  nextBillingDate: string;
}

export function SubscriptionCard() {
  const api = useApiClient();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  // 1. Busca dados do plano atual
  useEffect(() => {
    api.get('/payment/subscription')
      .then((res) => setData(res.data))
      .catch(() => setData(null)) // Tratar erro ou usuário sem plano
      .finally(() => setLoading(false));
  }, [api]);

  // 2. Redireciona para o Stripe Portal
  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await api.post('/payment/portal');
      // Redirecionamento total para a URL do Stripe
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erro ao abrir portal', error);
      setPortalLoading(false);
    }
  };

  if (loading) return <Loader size="sm" />;

  if (!data) {
    return (
      <Paper p="md" withBorder>
        <Text>Você ainda não possui uma assinatura ativa.</Text>
        <Button mt="sm" variant="light">Ver Planos</Button>
      </Paper>
    );
  }

  const isActive = data.status === 'active' || data.status === 'trialing';

  return (
    <Paper shadow="xs" p="xl" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
            Plano Atual
          </Text>
          <Title order={3}>{data.planName}</Title>
        </div>
        <Badge
          color={isActive ? 'green' : 'red'}
          size="lg"
          variant="light"
        >
          {data.status === 'trialing' ? 'Em Teste' : isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </Group>

      <Stack gap="xs" mb="xl">
        <Text size="sm">
          Próxima renovação: <b>{new Date(data.nextBillingDate).toLocaleDateString('pt-BR')}</b>
        </Text>
        <Text size="sm" c="dimmed">
          Gerencie métodos de pagamento, faça upgrade ou cancele sua assinatura através do portal seguro.
        </Text>
      </Stack>

      <Button
        onClick={handleManageSubscription}
        loading={portalLoading}
        rightSection={<IconExternalLink size={16} />}
        variant="outline"
        fullWidth
      >
        Gerenciar Assinatura / Cancelar
      </Button>
    </Paper>
  );
}