'use client';

import { useState } from 'react';
import {
  Paper,
  Text,
  Group,
  Avatar,
  Badge,
  Button,
  Grid,
  ThemeIcon,
  Divider,
  Stack,
  Card,
  Alert,
  ActionIcon,
  TextInput,
  Collapse,
  SimpleGrid,
  InputBase
} from '@mantine/core';
import {
  IconBuildingSkyscraper,
  IconMail,
  IconCalendar,
  IconCreditCard,
  IconCrown,
  IconUserCircle,
  IconEdit,
  IconCheck,
  IconX,
  IconPhone,
  IconMapPin,
  IconDeviceFloppy
} from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth/use-auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IMaskInput } from 'react-imask';
import api from '@/lib/api';
import { formatDocumentNumber, formatPhoneNumber } from '@/utils/formatter';
import { AddressFormFields } from '@/components/ui/forms/address-form-fields';

export function UserAccountDisplay() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- FORMULÁRIO DE PERFIL (USUÁRIO) ---
  const profileForm = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
    },
    validate: {
      name: (val) => (val.length < 3 ? 'Nome deve ter ao menos 3 caracteres' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Email inválido'),
    },
  });

  // --- FORMULÁRIO DA EMPRESA (DADOS FISCAIS) ---
  const companyForm = useForm({
    initialValues: {
      companyName: '',
      document: '',
      billingEmail: '',
      billingPhone: '',
      address: {
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      }
    },
    validate: {
      companyName: (val) => val.length < 2 ? 'Nome obrigatório' : null,
      document: (val) => val.length < 11 ? 'Documento inválido' : null,
    }
  });

  if (!user) return null;

  // --- HELPERS ---
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Indefinido';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isTrial = user.isTrial === true || user.status === 'TRIAL';
  const isActive = user.status === 'ACTIVE';

  let statusColor = 'gray';
  let statusLabel = 'Inativo';

  if (isActive) {
    statusColor = 'green';
    statusLabel = 'Assinatura Ativa';
  } else if (isTrial) {
    statusColor = 'blue';
    statusLabel = 'Período de Teste';
  } else {
    statusColor = 'red';
    statusLabel = 'Expirado / Cancelado';
  }

  const relevantDate = isActive ? user.subscriptionEndsAt : user.trialEndsAt;
  const dateLabel = isActive ? 'Próxima renovação:' : 'Expira em:';
  const displayPlanName = user.planName || user.planSlug || 'Plano Grátis';

  // --- FUNÇÕES DE INÍCIO DE EDIÇÃO (PREENCHIMENTO) ---
  const startEditingProfile = () => {
    profileForm.setValues({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setIsEditingProfile(true);
  };

  const startEditingCompany = () => {
    companyForm.setValues({
      companyName: user.companyName || user.tenantName || '',
      document: user.document || '',
      billingEmail: user.billingEmail || '',
      billingPhone: user.billingPhone || '',
      address: {
        zipCode: user.zipCode || '',
        street: user.street || '',
        number: user.number || '',
        complement: user.complement || '',
        neighborhood: user.neighborhood || '',
        city: user.city.id || '',
        state: user.state.id || '',
      }
    });
    setIsEditingCompany(true);
  };

  // --- AÇÕES ---

  const handleSaveProfile = async () => {
    if (profileForm.validate().hasErrors) return;
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', profileForm.values);
      setUser({ ...user, ...data }); // Atualiza store local
      notifications.show({ title: 'Sucesso', message: 'Perfil atualizado.', color: 'green' });
      setIsEditingProfile(false);
    } catch (error: any) {
      notifications.show({ title: 'Erro', message: 'Erro ao atualizar perfil.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (companyForm.validate().hasErrors) return;
    setLoading(true);
    try {
      const { data } = await api.patch('/users/company', companyForm.values);
      setUser(data);
      notifications.show({ title: 'Sucesso', message: 'Dados da empresa atualizados.', color: 'green' });
      setIsEditingCompany(false);
    } catch (error: any) {
      notifications.show({ title: 'Erro', message: 'Erro ao atualizar empresa.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Restaura valores ao cancelar
  const handleCancelCompany = () => {
    companyForm.reset();
    setIsEditingCompany(false);
  };

  return (
    <Stack gap="lg">
      {/* 1. USUÁRIO */}
      <Paper withBorder p="lg" radius="md" shadow="sm">
        <Group justify="space-between" align="flex-start" mb="md">
          <Group>
            <Avatar size={80} radius={120} color="blue" src={user.avatarUrl}>
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text fz="lg" fw={700} tt="capitalize">{user.name}</Text>
              <Group gap="xs" c="dimmed" mb={4}>
                <IconMail size={16} />
                <Text size="sm">{user.email}</Text>
              </Group>
              <Group gap="xs">
                <Badge variant="light" color="gray" tt="uppercase">
                  {user.role}
                </Badge>
              </Group>
            </div>
          </Group>

          {!isEditingProfile ? (
            <ActionIcon variant="light" color="blue" onClick={startEditingProfile}>
              <IconEdit size={18} />
            </ActionIcon>
          ) : (
            <Group gap="xs">
              <ActionIcon variant="light" color="green" onClick={handleSaveProfile} loading={loading}>
                <IconCheck size={18} />
              </ActionIcon>
              <ActionIcon variant="light" color="gray" onClick={() => setIsEditingProfile(false)} disabled={loading}>
                <IconX size={18} />
              </ActionIcon>
            </Group>
          )}
        </Group>

        <Collapse in={isEditingProfile}>
          <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default)">
            <SimpleGrid cols={2}>
              <TextInput label="Nome" {...profileForm.getInputProps('name')} />
              <TextInput label="Email" {...profileForm.getInputProps('email')} />
            </SimpleGrid>
          </Paper>
        </Collapse>
      </Paper>

      <Grid>
        {/* 2. EMPRESA */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="md" h="100%">
            <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-default)">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="gray" size="sm">
                    <IconBuildingSkyscraper size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" tt="uppercase" c="dimmed">Dados da Empresa</Text>
                </Group>

                {!isEditingCompany ? (
                  <ActionIcon variant="subtle" color="gray" size="sm" onClick={startEditingCompany}>
                    <IconEdit size={16} />
                  </ActionIcon>
                ) : (
                  <Group gap={4}>
                    <ActionIcon variant="subtle" color="green" size="sm" onClick={handleSaveCompany} loading={loading}>
                      <IconDeviceFloppy size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleCancelCompany} disabled={loading}>
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </Card.Section>

            <Stack mt="md" gap="md">
              {!isEditingCompany ? (
                <>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Razão Social / Nome</Text>
                    <Text fw={500} size="lg">{user.companyName || user.tenantName}</Text>
                  </div>

                  <SimpleGrid cols={2}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>CNPJ/CPF</Text>
                      <Text fw={500}>{formatDocumentNumber(user.document) || '-'}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Telefone Fiscal</Text>
                      <Text fw={500}>{formatPhoneNumber(user.billingPhone) || '-'}</Text>
                    </div>
                  </SimpleGrid>

                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Endereço Fiscal</Text>
                    {user.street ? (
                      <Group gap={4} align="flex-start">
                        <ThemeIcon variant="transparent" c="dimmed" size="xs" mt={2}><IconMapPin /></ThemeIcon>
                        <Text size="sm" lh={1.4}>
                          {user.street}, {user.number} {user.complement && `- ${user.complement}`}<br />
                          {user.neighborhood} - {user.city.name}/{user.state.uf}<br />
                          CEP: {user.zipCode}
                        </Text>
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed" fs="italic">Endereço não cadastrado</Text>
                    )}
                  </div>

                  {!user.isProfileComplete && (
                    <Alert color="orange" variant="light" mt="xs" title="Cadastro Pendente">
                      <Text size="xs" mb="xs">Dados incompletos impedem a emissão de notas.</Text>
                      <Button variant="white" color="orange" size="xs" onClick={startEditingCompany}>
                        Completar
                      </Button>
                    </Alert>
                  )}
                </>
              ) : (
                <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default)">
                  <Stack gap="xs">
                    <TextInput label="Razão Social" {...companyForm.getInputProps('companyName')} />

                    <SimpleGrid cols={2}>
                      <InputBase
                        label="Documento"
                        component={IMaskInput} mask={[{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]}
                        {...companyForm.getInputProps('document')}
                      />
                      <InputBase
                        label="Telefone"
                        component={IMaskInput} mask="(00) 00000-0000"
                        {...companyForm.getInputProps('billingPhone')}
                      />
                    </SimpleGrid>

                    <TextInput label="Email Financeiro" {...companyForm.getInputProps('billingEmail')} />

                    <Divider label="Endereço" labelPosition="center" my="xs" />

                    <AddressFormFields
                      form={companyForm}
                      path='address'
                    />
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* 3. ASSINATURA */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card
            withBorder
            radius="md"
            p="md"
            h="100%"
            style={{ borderColor: isTrial ? 'bg="var(--mantine-color-default)"' : undefined }}
          >
            <Card.Section withBorder inheritPadding py="xs" bg={isTrial ? 'blue.0' : isActive ? 'green.0' : 'gray.0'}>
              <Group justify="space-between">
                <Group gap="xs">
                  <IconCrown size={18} color={isTrial ? '#228be6' : isActive ? 'green' : 'gray'} />
                  <Text fw={600} size="sm" c={isTrial ? 'blue.9' : isActive ? 'green.9' : 'gray.9'}>
                    Plano Atual
                  </Text>
                </Group>
                <Badge color={statusColor} variant="filled">{statusLabel}</Badge>
              </Group>
            </Card.Section>

            <Stack mt="md" gap="sm">
              <Group align="flex-end" justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Pacote</Text>
                  <Text size="xl" fw={800} lh={1} tt="uppercase" c="dark">
                    {displayPlanName}
                  </Text>
                </div>
              </Group>

              {isActive && (
                <Group gap={6}>
                  <IconCreditCard size={16} color="gray" />
                  <Text size="sm" c="dimmed">
                    Ciclo: {user.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                  </Text>
                </Group>
              )}

              <Divider />

              <Group>
                <ThemeIcon variant="light" color={statusColor}><IconCalendar size={18} /></ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>{dateLabel}</Text>
                  <Text size="sm" c="dimmed">
                    {formatDate(relevantDate)}
                  </Text>
                </div>
              </Group>

              <Button
                fullWidth
                mt="md"
                size="md"
                variant={isActive ? 'outline' : 'gradient'}
                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                leftSection={!isActive && <IconCreditCard size={18} />}
                onClick={() => router.push('/settings/subscription')}
              >
                {isActive ? 'Gerenciar Assinatura / Upgrade' : 'Assinar Agora'}
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}