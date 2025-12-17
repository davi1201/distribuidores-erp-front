'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleGrid, Card, Text, Button, Group, Switch, Badge, Center, Loader, List, ThemeIcon, Container, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconCheck } from '@tabler/icons-react';
import api from '@/lib/api'; // Seu cliente axios configurado
import { notifications } from '@mantine/notifications';

export default function Page() {
  return (
    <Container size="lg" py="xl">
      <PricingTable />
    </Container>
  );
}

export function PricingTable() {
  const router = useRouter();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  // Busca planos do seu banco
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/plans')).data
  });

  const handleSubscribe = (planSlug: string) => {
    // Validação básica
    if (!planSlug) {
      notifications.show({
        title: 'Erro',
        message: 'Plano inválido.',
        color: 'red'
      });
      return;
    }

    setLoadingSlug(planSlug);

    // CORREÇÃO: Enviamos 'plan' (slug) e 'cycle' para a URL.
    // Isso permitirá que a página de checkout envie o payload correto: { planSlug, cycle }
    router.push(`/checkout?plan=${planSlug}&cycle=${cycle}`);
  };

  if (isLoading) return <Center h={300}><Loader color="blue" /></Center>;

  return (
    <div>
      <Title order={1} ta="center" mt="sm" mb={40}>
        Escolha seu plano
      </Title>

      <Center mb={40}>
        <Group>
          <Text fw={500} c={cycle === 'monthly' ? 'blue' : 'dimmed'}>Mensal</Text>
          <Switch
            checked={cycle === 'yearly'}
            onChange={(e) => setCycle(e.currentTarget.checked ? 'yearly' : 'monthly')}
            size="lg"
            color="blue"
            thumbIcon={
              cycle === 'yearly' ? (
                <IconCheck size="0.8rem" color="var(--mantine-color-blue-6)" stroke={3} />
              ) : null
            }
          />
          <Text fw={500} c={cycle === 'yearly' ? 'blue' : 'dimmed'}>
            Anual <Badge color="green" size="sm" variant="light">Economize 20%</Badge>
          </Text>
        </Group>
      </Center>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {plans.map((plan: any) => {
          const price = cycle === 'monthly' ? Number(plan.price) : Number(plan.yearlyPrice);
          const isPopular = plan.slug === 'pro';

          return (
            <Card
              key={plan.id}
              padding="xl"
              radius="md"
              withBorder
              style={{
                borderColor: isPopular ? 'var(--mantine-color-blue-4)' : undefined,
                boxShadow: isPopular ? '0 0 20px rgba(0,0,0,0.05)' : undefined,
                borderWidth: isPopular ? 2 : 1
              }}
            >
              {isPopular && (
                <Badge
                  variant="filled" color="blue"
                  style={{ position: 'absolute', top: 10, right: 10 }}
                >
                  Mais Popular
                </Badge>
              )}

              <Text fw={700} size="xl" mt="xs">{plan.name}</Text>
              <Text size="sm" c="dimmed" mt={5}>
                Ideal para empresas em crescimento.
              </Text>

              <Group align="flex-end" mt="lg" mb="lg">
                <Text fz={32} fw={800} lh={1}>
                  R$ {price.toFixed(2).replace('.', ',')}
                </Text>
                <Text c="dimmed" mb={4} fw={500}>/{cycle === 'monthly' ? 'mês' : 'ano'}</Text>
              </Group>

              <Button
                fullWidth
                size="md"
                variant={isPopular ? 'filled' : 'light'}
                // Passamos o SLUG do plano, não o ID do preço
                onClick={() => handleSubscribe(plan.slug)}
                loading={loadingSlug === plan.slug}
                color="blue"
              >
                Escolher Plano {cycle === 'monthly' ? 'Mensal' : 'Anual'}
              </Button>

              <List
                mt="xl"
                spacing="sm"
                size="sm"
                center
                icon={
                  <ThemeIcon color="teal" size={20} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                {plan.features ? (
                  Array.isArray(plan.features) ? plan.features.map((f: string, i: number) => <List.Item key={i}>{f}</List.Item>) :
                    <List.Item>Recursos completos</List.Item>
                ) : (
                  <>
                    <List.Item>{plan.maxUsers || 1} Usuário(s) incluído(s)</List.Item>
                    <List.Item>Suporte prioritário</List.Item>
                    <List.Item>Acesso ao sistema</List.Item>
                  </>
                )}
              </List>
            </Card>
          );
        })}
      </SimpleGrid>
    </div>
  );
}