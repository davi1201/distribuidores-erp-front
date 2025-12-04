'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconBrandGoogle } from '@tabler/icons-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth/use-auth';

function GoogleLoginButton() {
  const handleLogin = () => {
    // Ajuste a URL conforme sua porta do backend (3333, 5555, etc)
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <Button
      leftSection={<IconBrandGoogle size={20} />}
      variant="default"
      color="gray"
      onClick={handleLogin}
      fullWidth
    >
      Entrar com Google
    </Button>
  );
}

export default function LoginPage() {
  // Estado para alternar entre Login e Cadastro
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  // Alterna o modo e limpa erros
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let response;

      if (isRegister) {
        // --- FLUXO DE CADASTRO ---
        response = await api.post('/auth/register-simple', {
          name,
          email,
          password,
          planSlug: 'pro', // Define um plano padrão para o trial
        });
      } else {
        // --- FLUXO DE LOGIN ---
        response = await api.post('/auth/login', {
          email,
          password
        });
      }

      const { data } = response;

      // Salva usuário no estado global
      setUser(data.user);

      // Opcional: Salvar token manualmente se não usar cookie httpOnly
      // localStorage.setItem('token', data.access_token);

      router.push('/backoffice/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Ocorreu um erro inesperado.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
      <Paper withBorder shadow="xl" p={30} radius="md" style={{ width: 420 }}>

        <Title order={2} ta="center" mb="md">
          {isRegister ? 'Crie sua conta' : 'Bem-vindo de volta!'}
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack>
            {isRegister && (
              <TextInput
                label="Nome Completo"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
                data-autofocus
              />
            )}

            <TextInput
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              type="email"
            />

            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              minLength={6}
            />

            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="light">
                {error}
              </Alert>
            )}

            <Button type="submit" loading={isLoading} fullWidth size="md">
              {isRegister ? 'Cadastrar Grátis' : 'Entrar'}
            </Button>
          </Stack>
        </form>

        <Divider label="Ou continue com" labelPosition="center" my="lg" />

        <GoogleLoginButton />

        <Group justify="center" mt="xl">
          <Text size="sm" c="dimmed">
            {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          </Text>
          <Anchor size="sm" component="button" type="button" onClick={toggleMode}>
            {isRegister ? 'Fazer Login' : 'Cadastre-se'}
          </Anchor>
        </Group>

      </Paper>
    </Center>
  );
}