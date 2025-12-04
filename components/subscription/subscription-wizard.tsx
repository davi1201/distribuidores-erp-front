'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stepper, Button, Group, TextInput, PasswordInput,
  Title, Text, SimpleGrid, Card, Badge,
  LoadingOverlay, Center, ThemeIcon, InputBase, Divider, Modal, Switch, Paper, Alert, List, Stack
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IMaskInput } from 'react-imask';
import {
  IconRocket, IconUser, IconMail, IconPhone, IconLock,
  IconCreditCard, IconAlertCircle, IconCheck, IconCalendar, IconBuildingSkyscraper, IconShieldCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { addMonths, addYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import api from '@/lib/api';
import { useAuthStore } from '@/store/auth/use-auth';
import { useAppStore } from '@/store/app/use-app-store';
import { CompleteProfileForm } from '../ui/forms/complete-profile-form';
import { createCardToken, subscribe } from '@/shared/pagarme-service';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string;
  yearlyPrice?: string;
  isActive: boolean;
}

export function SubscriptionWizardModal() {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null);

  const { isSubscriptionWizardOpen, closeSubscriptionWizard } = useAppStore();
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true);
        const { data } = await api.get('/plans');
        setPlans(data.filter((p: any) => p.isActive !== false));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (isSubscriptionWizardOpen) {
      fetchPlans();
      setActive(0);
      setSelectedPlanSlug(null);
    }
  }, [isSubscriptionWizardOpen]);

  const paymentForm = useForm({
    initialValues: {
      number: '',
      holder_name: '',
      exp_month: '',
      exp_year: '',
      cvv: '',
    },
    validate: {
      number: (val) => (val.replace(/\D/g, '').length < 15 ? 'Cartão inválido' : null),
      holder_name: (val) => (val.length < 3 ? 'Nome inválido' : null),
      exp_month: (val) => (val.length !== 2 ? 'Mês inválido' : null),
      exp_year: (val) => (val.length !== 2 && val.length !== 4 ? 'Ano inválido' : null),
      cvv: (val) => (val.length < 3 ? 'CVV inválido' : null),
    },
  });

  const nextStep = () => setActive((current) => current + 1);
  const prevStep = () => setActive((current) => current - 1);

  const handleSelectPlan = (slug: string) => {
    const plan = plans.find(p => p.slug === slug);
    if (billingCycle === 'yearly' && !plan?.yearlyPrice) {
      notifications.show({ message: 'Este plano não possui opção anual.', color: 'orange' });
      return;
    }
    setSelectedPlanSlug(slug);
    nextStep();
  };

  const handlePaymentSubmit = () => {
    if (paymentForm.validate().hasErrors) return;
    nextStep();
  };

  const handleFinalizeSubscription = async () => {
    if (!selectedPlanSlug) return;

    setLoading(true);

    try {
      const cardToken = await createCardToken(paymentForm.values);

      const payload = {
        planSlug: selectedPlanSlug,
        cardToken: cardToken,
        cycle: billingCycle,
      };

      const { data } = await subscribe(payload);

      setUser(data.user);

      notifications.show({
        title: 'Assinatura Confirmada! 🚀',
        message: 'Obrigado por assinar.',
        color: 'green'
      });

      closeSubscriptionWizard();
      router.refresh();

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Erro ao criar assinatura.';
      notifications.show({ title: 'Erro', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.slug === selectedPlanSlug);

  const displayPrice = selectedPlan
    ? (billingCycle === 'monthly'
      ? Number(selectedPlan.price).toFixed(2)
      : (Number(selectedPlan.yearlyPrice) / 12).toFixed(2))
    : '0.00';

  const totalPrice = selectedPlan
    ? (billingCycle === 'monthly'
      ? Number(selectedPlan.price).toFixed(2)
      : Number(selectedPlan.yearlyPrice).toFixed(2))
    : '0.00';

  const today = new Date();
  const billingDay = today.getDate();
  const nextBillingDate = billingCycle === 'monthly' ? addMonths(today, 1) : addYears(today, 1);
  const formattedNextDate = format(nextBillingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const steps = [
    { label: 'Plano', description: 'Escolha o ideal' },
    ...(user?.isProfileComplete === false ? [{ label: 'Dados', description: 'Endereço Fiscal' }] : []),
    { label: 'Pagamento', description: 'Informações' },
    { label: 'Confirmação', description: 'Revisar e finalizar' },
  ];

  return (
    <Modal
      opened={isSubscriptionWizardOpen}
      onClose={closeSubscriptionWizard}
      size="xl"
      padding="xl"
      centered
      closeOnClickOutside={false}
      title={<Title order={3}>Assine Agora</Title>}
    >
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

      <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false} size="sm">

        <Stepper.Step label="Plano" description="Escolha o ideal">
          <Center mb="md">
            <Group>
              <Text fw={500} c={billingCycle === 'monthly' ? 'blue' : 'dimmed'}>Mensal</Text>
              <Switch
                size="md"
                checked={billingCycle === 'yearly'}
                onChange={(event) => setBillingCycle(event.currentTarget.checked ? 'yearly' : 'monthly')}
              />
              <Text fw={500} c={billingCycle === 'yearly' ? 'blue' : 'dimmed'}>
                Anual <Badge color="green" size="xs">Desconto</Badge>
              </Text>
            </Group>
          </Center>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {plans.map((plan) => (
              <Card
                key={plan.id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                  cursor: 'pointer',
                  borderColor: selectedPlanSlug === plan.slug ? 'var(--mantine-color-blue-6)' : undefined,
                  backgroundColor: selectedPlanSlug === plan.slug ? 'var(--mantine-color-blue-0)' : undefined,
                  transition: 'all 0.2s'
                }}
                onClick={() => handleSelectPlan(plan.slug)}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={700} size="lg">{plan.name}</Text>
                  {plan.slug === 'pro' && <Badge color="pink">Popular</Badge>}
                </Group>
                <Text size="xl" fw={800} my="sm">
                  R$ {billingCycle === 'monthly'
                    ? Number(plan.price).toFixed(2)
                    : (Number(plan.yearlyPrice) / 12).toFixed(2)}
                  <Text span size="sm" fw={400} c="dimmed">/mês</Text>
                </Text>
                {billingCycle === 'yearly' && (
                  <Text size="xs" c="dimmed">
                    Total anual: R$ {Number(plan.yearlyPrice).toFixed(2)}
                  </Text>
                )}

                <Button fullWidth mt="md" variant={selectedPlanSlug === plan.slug ? "filled" : "light"}>
                  Selecionar
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </Stepper.Step>

        {user?.isProfileComplete === false && (
          <Stepper.Step label="Dados" description="Endereço Fiscal">
            <CompleteProfileForm
              onSuccess={() => {
                nextStep();
              }}
            />
            <Button variant="default" mt="md" onClick={prevStep}>Voltar</Button>
          </Stepper.Step>
        )}

        <Stepper.Step label="Pagamento" description="Informações">
          <Alert icon={<IconAlertCircle size={16} />} title="Ambiente Seguro" color="green" mb="md">
            Pagamento processado via Pagar.me. Seus dados estão protegidos.
          </Alert>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <InputBase
              label="Número do Cartão"
              component={IMaskInput}
              mask="0000 0000 0000 0000"
              placeholder="0000 0000 0000 0000"
              required
              {...paymentForm.getInputProps('number')}
            />
            <TextInput
              label="Nome no Cartão"
              placeholder="Como impresso no cartão"
              required
              {...paymentForm.getInputProps('holder_name')}
            />
            <Group grow>
              <InputBase
                label="Mês"
                component={IMaskInput}
                mask="00"
                placeholder="MM"
                required
                {...paymentForm.getInputProps('exp_month')}
              />
              <InputBase
                label="Ano"
                component={IMaskInput}
                mask="00"
                placeholder="AA"
                required
                {...paymentForm.getInputProps('exp_year')}
              />
            </Group>
            <InputBase
              label="CVV"
              component={IMaskInput}
              mask="000"
              placeholder="123"
              required
              {...paymentForm.getInputProps('cvv')}
            />
          </SimpleGrid>

          <Group justify="space-between" mt="xl">
            <Button variant="default" onClick={prevStep}>Voltar</Button>
            <Button onClick={handlePaymentSubmit} rightSection={<IconCheck size={18} />}>
              Continuar
            </Button>
          </Group>
        </Stepper.Step>

        <Stepper.Step label="Confirmação" description="Revisar e finalizar">
          <Stack gap="lg">
            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Resumo da Assinatura</Title>
                <Badge size="lg" variant="light" color="blue">{billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</Badge>
              </Group>

              <Divider my="md" />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                <div>
                  <Text size="sm" c="dimmed" mb={4}>Plano Selecionado</Text>
                  <Text fw={700} size="xl">{selectedPlan?.name}</Text>
                  <Text fw={600} size="lg" c="green" mt={8}>
                    R$ {displayPrice}<Text span size="sm" c="dimmed">/mês</Text>
                  </Text>
                  {billingCycle === 'yearly' && (
                    <Text size="xs" c="dimmed" mt={4}>
                      Cobrado anualmente: R$ {totalPrice}
                    </Text>
                  )}
                </div>

                <div>
                  <Text size="sm" c="dimmed" mb={4}>Ciclo de Cobrança</Text>
                  <Group gap={8}>
                    <IconCalendar size={20} />
                    <Text fw={600}>Todo dia {billingDay}</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mt={8}>
                    Próxima cobrança: {formattedNextDate}
                  </Text>
                </div>
              </SimpleGrid>

              <Divider my="md" />

              <Group gap="sm">
                <ThemeIcon color="blue" variant="light" size="lg">
                  <IconBuildingSkyscraper size={20} />
                </ThemeIcon>
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={600}>Dados de Faturamento</Text>
                  <Text size="xs" c="dimmed">
                    Fatura será emitida para o CNPJ/CPF cadastrado
                  </Text>
                </div>
              </Group>
            </Paper>

            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Forma de Pagamento</Title>
                <ThemeIcon color="green" variant="light" size="lg">
                  <IconCreditCard size={20} />
                </ThemeIcon>
              </Group>

              <Divider my="md" />

              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Cartão</Text>
                  <Text fw={500}>**** **** **** {paymentForm.values.number.slice(-4)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Titular</Text>
                  <Text fw={500}>{paymentForm.values.holder_name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Validade</Text>
                  <Text fw={500}>{paymentForm.values.exp_month}/{paymentForm.values.exp_year}</Text>
                </Group>
              </Stack>
            </Paper>

            <Alert icon={<IconShieldCheck size={18} />} color="blue" variant="light">
              <Text size="sm" fw={500} mb={4}>Termos e Condições</Text>
              <Text size="xs">
                Ao confirmar, você concorda com nossos termos de serviço e autoriza a cobrança recorrente no cartão informado.
                Você pode cancelar sua assinatura a qualquer momento.
              </Text>
            </Alert>

            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={prevStep}>Voltar</Button>
              <Button
                size="lg"
                leftSection={<IconCheck size={20} />}
                onClick={handleFinalizeSubscription}
                loading={loading}
              >
                Confirmar Assinatura
              </Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Completed>
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius="xl" color="green" variant="light">
                <IconCheck size={32} />
              </ThemeIcon>
              <Text size="lg" fw={600}>Processando pagamento...</Text>
              <Text size="sm" c="dimmed">Aguarde enquanto confirmamos sua assinatura</Text>
            </Stack>
          </Center>
        </Stepper.Completed>
      </Stepper>
    </Modal>
  );
}