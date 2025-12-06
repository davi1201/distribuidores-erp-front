'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Paper, Title, Text, TextInput, PasswordInput, Button,
  Stack, Alert, LoadingOverlay, Center, ThemeIcon, Group, Skeleton
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconBuildingSkyscraper, IconMail } from '@tabler/icons-react';
import api from '@/lib/api';

// Componente interno que usa useSearchParams
function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Valida o token assim que a tela abre
  const { data: inviteData, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: ['validate-invite', token],
    queryFn: async () => {
      if (!token) throw new Error('Token não fornecido');
      const { data } = await api.get(`/team/invite/validate?token=${token}`);
      return data; // Espera: { valid: true, email: '...', companyName: '...', role: '...' }
    },
    enabled: !!token,
    retry: false, // Não tenta de novo se der 404/400
  });

  const form = useForm({
    initialValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (val) => (val.length < 3 ? 'Nome deve ter pelo menos 3 caracteres' : null),
      password: (val) => (val.length < 6 ? 'A senha deve ter no mínimo 6 caracteres' : null),
      confirmPassword: (val, values) => (val !== values.password ? 'As senhas não conferem' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      await api.post('/team/invite/accept', {
        token,
        name: values.name,
        password: values.password,
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Bem-vindo! 🚀',
        message: 'Sua conta foi criada com sucesso. Faça login para continuar.',
        color: 'green'
      });
      router.push('/login');
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao criar conta.',
        color: 'red'
      });
    }
  });

  // --- ESTADOS DE LOADING E ERRO ---

  if (!token) {
    return (
      <Alert color="red" title="Link Inválido" icon={<IconAlertCircle />}>
        O link de convite parece estar quebrado ou incompleto. Solicite um novo link ao administrador.
      </Alert>
    );
  }

  if (isValidating) {
    return (
      <Center h={300}>
        <Stack align="center" gap="xs">
          <LoadingOverlay visible={true} zIndex={0} overlayProps={{ radius: "sm", blur: 2 }} />
          <Text>Verificando convite...</Text>
        </Stack>
      </Center>
    );
  }

  if (validationError) {
    return (
      <Alert color="red" title="Convite Expirado ou Inválido" icon={<IconAlertCircle />}>
        {(validationError as any).response?.data?.message || 'Não foi possível validar este convite.'}
        <br />
        Por favor, entre em contato com o administrador da empresa para solicitar um novo acesso.
      </Alert>
    );
  }

  // --- FORMULÁRIO DE CADASTRO ---

  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ maxWidth: 450, width: '100%' }}>
      <Title order={2} ta="center" mt="md" mb="xs">
        Junte-se à Equipe
      </Title>

      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Você foi convidado para acessar o sistema.
      </Text>

      <Paper bg="var(--mantine-color-default)" p="md" radius="md" mb="lg">
        <Stack gap="xs">
          <Group>
            <ThemeIcon variant="light" color="blue"><IconBuildingSkyscraper size={16} /></ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Empresa</Text>
              <Text fw={600}>{inviteData?.companyName}</Text>
            </div>
          </Group>
          <Group>
            <ThemeIcon variant="light" color="blue"><IconMail size={16} /></ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Seu Email</Text>
              <Text fw={600}>{inviteData?.email}</Text>
            </div>
          </Group>
        </Stack>
      </Paper>

      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <TextInput
            label="Seu Nome Completo"
            placeholder="Como você quer ser chamado"
            required
            data-autofocus
            {...form.getInputProps('name')}
          />

          <PasswordInput
            label="Crie sua Senha"
            placeholder="Mínimo 6 caracteres"
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label="Confirme a Senha"
            placeholder="Repita a senha"
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Button
            fullWidth
            mt="xl"
            size="md"
            type="submit"
            loading={mutation.isPending}
            leftSection={<IconCheck size={18} />}
          >
            Criar Conta e Acessar
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

// Componente de fallback durante o carregamento do Suspense
function LoadingFallback() {
  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ maxWidth: 450, width: '100%' }}>
      <Stack gap="md">
        <Skeleton height={30} width="70%" mx="auto" />
        <Skeleton height={20} width="50%" mx="auto" />
        <Skeleton height={100} />
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={50} />
      </Stack>
    </Paper>
  );
}

// Componente principal exportado com Suspense
export function AcceptInviteForm() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInviteContent />
    </Suspense>
  );
}