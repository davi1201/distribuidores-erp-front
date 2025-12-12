'use client';

import { useState } from 'react';
import {
  TextInput, PasswordInput, NumberInput, Button, Group,
  Paper, Title, Text, Alert, Stack, LoadingOverlay, Divider
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconPlugConnected, IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getTenantEmailConfig, saveTenantEmailConfig, testTenantEmailConnection } from '../tenant-service';

export function TenantEmailConfigForm() {
  const [testing, setTesting] = useState(false);

  const form = useForm({
    initialValues: {
      host: 'imap.gmail.com',
      port: 993,
      user: '',
      password: '',
    },
    validate: {
      host: (value) => (value.length < 3 ? 'Host inválido' : null),
      user: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (value.length < 1 ? 'Senha obrigatória' : null),
    },
  });

  // Carrega configuração existente ao montar o componente
  const { isLoading: isLoadingConfig } = useQuery({
    queryKey: ['tenant-email-config'],
    queryFn: async () => {
      const data = await getTenantEmailConfig();
      if (data) {
        form.setValues({
          host: data.host,
          port: data.port,
          user: data.user,
          password: data.password || '',
        });
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });

  // Mutação para Salvar
  const saveMutation = useMutation({
    mutationFn: saveTenantEmailConfig,
    onSuccess: () => {
      notifications.show({ message: 'Configurações salvas com sucesso!', color: 'green' });
    },
    onError: () => notifications.show({ message: 'Erro ao salvar configurações.', color: 'red' })
  });

  // Função de Teste de Conexão
  const handleTestConnection = async () => {
    // Valida o form antes de testar
    if (form.validate().hasErrors) return;

    setTesting(true);
    try {
      // 1. Salva primeiro para garantir que o backend use os dados mais recentes
      await saveMutation.mutateAsync(form.values);

      // 2. Chama o endpoint de debug do watcher
      const result = await testTenantEmailConnection();

      if (result.status === 'success') {
        notifications.show({
          title: 'Conexão Bem-sucedida',
          message: `Conectado! ${result.totalMessages} mensagens encontradas na caixa de entrada.`,
          color: 'green'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      notifications.show({
        title: 'Falha na Conexão',
        message: error.message || 'Verifique suas credenciais (host, porta, senha).',
        color: 'red'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Paper p="md" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={isLoadingConfig} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Title order={4} mb="xs">Configuração de Recebimento de Notas</Title>
      <Text size="sm" c="dimmed" mb="lg">
        Configure a conta de e-mail (IMAP) onde seus fornecedores enviam os XMLs das notas.
      </Text>

      <Alert icon={<IconInfoCircle size={16} />} title="Atenção" color="blue" mb="md">
        Se você usa <b>Gmail</b> ou <b>Zoho</b> com autenticação de dois fatores (2FA),
        é necessário gerar uma <b>Senha de Aplicativo</b> específica para este sistema.
      </Alert>

      <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Servidor IMAP"
              placeholder="ex: imap.gmail.com"
              required
              {...form.getInputProps('host')}
            />
            <NumberInput
              label="Porta"
              placeholder="993"
              required
              max={65535}
              {...form.getInputProps('port')}
            />
          </Group>

          <TextInput
            label="E-mail"
            placeholder="notas@suaempresa.com"
            required
            {...form.getInputProps('user')}
          />

          <PasswordInput
            label="Senha (ou Senha de App)"
            placeholder="••••••••"
            required
            {...form.getInputProps('password')}
          />

          <Divider my="sm" />

          <Group justify="flex-end">
            <Button
              variant="default"
              leftSection={<IconPlugConnected size={16} />}
              onClick={handleTestConnection}
              loading={testing}
            >
              Testar Conexão
            </Button>

            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saveMutation.isPending}
            >
              Salvar Configuração
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}