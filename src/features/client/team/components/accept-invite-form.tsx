'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Paper, Title, Text, PasswordInput, Button,
  Stack, Alert, LoadingOverlay, Center, ThemeIcon, Group, Skeleton, Avatar
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconBuildingSkyscraper, IconMail, IconUser } from '@tabler/icons-react';
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
      // O backend agora retorna { valid: true, name: '...', email: '...', companyName: '...' }
      const { data } = await api.get(`/team/invite/validate?token=${token}`);
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (val) => (val.length < 6 ? 'A senha deve ter no mínimo 6 caracteres' : null),
      confirmPassword: (val, values) => (val !== values.password ? 'As senhas não conferem' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      // Não precisamos enviar o nome, pois já foi definido no pré-provisionamento
      await api.post('/team/invite/accept', {
        token,
        password: values.password,
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Bem-vindo! 🚀',
        message: 'Sua conta foi ativada com sucesso. Faça login para continuar.',
        color: 'green'
      });
      router.push('/login');
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao ativar conta.',
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
          <Text>Validando credenciais...</Text>
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

  // --- FORMULÁRIO DE ATIVAÇÃO ---

  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ maxWidth: 450, width: '100%' }}>

      {/* Cabeçalho Personalizado */}
      <Stack align="center" gap={5} mb="xl">
        <Avatar size="lg" color="blue" radius="xl">
          {inviteData?.name?.charAt(0)}
        </Avatar>
        <Title order={2} ta="center">
          Olá, {inviteData?.name?.split(' ')[0]}!
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Defina sua senha para acessar o sistema da <b>{inviteData?.companyName}</b>.
        </Text>
      </Stack>

      {/* Resumo dos Dados */}
      <Paper bg="var(--mantine-color-default)" p="md" radius="md" mb="lg">
        <Stack gap="xs">
          <Group>
            <ThemeIcon variant="light" color="blue" size="sm"><IconUser size={14} /></ThemeIcon>
            <Text size="sm" fw={500}>{inviteData?.name}</Text>
          </Group>
          <Group>
            <ThemeIcon variant="light" color="blue" size="sm"><IconMail size={14} /></ThemeIcon>
            <Text size="sm" fw={500}>{inviteData?.email}</Text>
          </Group>
          <Group>
            <ThemeIcon variant="light" color="blue" size="sm"><IconBuildingSkyscraper size={14} /></ThemeIcon>
            <Text size="sm" fw={500}>{inviteData?.companyName}</Text>
          </Group>
        </Stack>
      </Paper>

      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <PasswordInput
            label="Crie sua Senha"
            placeholder="Mínimo 6 caracteres"
            required
            size="md"
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label="Confirme a Senha"
            placeholder="Repita a senha"
            required
            size="md"
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
            Ativar Minha Conta
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
      <Stack gap="md" align="center">
        <Skeleton height={80} circle mb="md" />
        <Skeleton height={30} width="70%" />
        <Skeleton height={20} width="50%" />
        <Skeleton height={100} width="100%" mt="md" />
        <Skeleton height={40} width="100%" />
        <Skeleton height={40} width="100%" />
        <Skeleton height={50} width="100%" mt="lg" />
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