'use client';

import { useBillingStore } from '@/store/billing/use-billing-store';
import { Modal, Stack, Title, Text, Button, Group, Card, Badge, List, ThemeIcon } from '@mantine/core';
import { IconCheck, IconLock } from '@tabler/icons-react';
import { useState } from 'react';

export function BillingModal() {
  const { isOpen, suggestedPlanId, closeBillingModal } = useBillingStore();
  const [planId, setPlanId] = useState<string | null>(null);

  const handleSubscribe = () => {
    closeBillingModal();
    setPlanId(suggestedPlanId);
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={() => { }} // Bloqueia fechamento
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        size="lg"
        centered
        zIndex={9999}
        overlayProps={{
          backgroundOpacity: 0.8,
          blur: 5,
        }}
      >
        <Stack align="center" gap="md" py="xl">
          <ThemeIcon size={60} radius="xl" color="red" variant="light">
            <IconLock size={32} />
          </ThemeIcon>

          <Title order={2} ta="center">Acesso Bloqueado</Title>

          <Text c="dimmed" ta="center" maw={400}>
            Seu período de teste ou sua assinatura expirou.
            Para continuar gerenciando seus clientes e acessando o sistema,
            escolha um plano abaixo.
          </Text>

          {/* Exemplo visual de um Card de Plano */}
          <Card withBorder padding="lg" radius="md" w="100%" mt="md" style={{ borderColor: 'var(--mantine-color-blue-6)', borderWidth: 2 }}>
            <Group justify="space-between" mb="xs">
              <Badge color="blue" variant="light">RECOMENDADO</Badge>
            </Group>

            <Text fw={700} size="xl">Plano PRO</Text>
            <Text c="dimmed" size="sm" mb="md">Tudo que você precisa para crescer</Text>

            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon color="blue" size={20} radius="xl">
                  <IconCheck size={12} />
                </ThemeIcon>
              }
            >
              <List.Item>Clientes Ilimitados</List.Item>
              <List.Item>Múltiplos Usuários</List.Item>
              <List.Item>Gestão Financeira</List.Item>
            </List>

            <Button fullWidth mt="xl" size="md" onClick={handleSubscribe}>
              Assinar Agora
            </Button>
          </Card>

          <Text size="xs" c="dimmed" mt="sm">
            Precisa de ajuda? <a href="mailto:suporte@seusistema.com">Fale com suporte</a>
          </Text>
        </Stack>
      </Modal>
    </>
  );
}