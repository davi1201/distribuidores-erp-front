'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Paper, Group, Text, Button, Avatar, Badge, ActionIcon,
  Modal, TextInput, Select, Stack, Alert, Progress,
  Menu
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconMail, IconUserPlus, IconAlertCircle, IconDots, IconPencil, IconDeviceFloppy, IconShieldLock } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';

import { useAuthStore } from '@/store/auth/use-auth';
import api from '@/lib/api';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { UserPermissionsModal } from '../../user/components/user-permissions-modal';
import { updateMemberRole } from '../../team/team-service';

// Interface auxiliar para tipar o membro
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | 'SUPPORT';
  isActive: boolean;
  permissions: string[]; // Adicionado para o modal de permissões
}

export function TeamList() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);
  const [userToEdit, setUserToEdit] = useState<TeamMember | null>(null);
  const [userToPermissions, setUserToPermissions] = useState<TeamMember | null>(null); // Estado para modal de permissões

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data } = await api.get('/team');
      return data as TeamMember[];
    }
  });

  // --- FORM DE CONVITE ---
  const inviteForm = useForm({
    initialValues: { email: '', role: 'SELLER' },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Email inválido'),
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (values: typeof inviteForm.values) => {
      await api.post('/team/invite', values);
    },
    onSuccess: () => {
      notifications.show({ message: 'Convite enviado!', color: 'green' });
      setInviteModalOpen(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao convidar',
        color: 'red'
      });
    }
  });

  // --- FORM DE EDIÇÃO DE ROLE ---
  const editForm = useForm({
    initialValues: { role: '' },
    validate: {
      role: (val) => (!val ? 'Permissão obrigatória' : null),
    }
  });

  useEffect(() => {
    if (userToEdit) {
      editForm.setValues({ role: userToEdit.role });
    }
  }, [userToEdit]);

  const updateRoleMutation = useMutation({
    mutationFn: async (values: { id: string, role: string }) => {
      await updateMemberRole(values.id, values.role)
    },
    onSuccess: () => {
      notifications.show({ message: 'Permissão atualizada!', color: 'green' });
      setUserToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao atualizar',
        color: 'red'
      });
    }
  });

  // --- DELETE ---
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/team/${userId}`);
    },
    onSuccess: () => {
      notifications.show({ message: 'Usuário removido com sucesso.', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setUserToDelete(null);
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao remover usuário',
        color: 'red'
      });
    }
  });

  // --- HANDLERS ---
  const handleEditClick = (member: TeamMember) => setUserToEdit(member);
  const handleDeleteClick = (member: TeamMember) => setUserToDelete(member);
  const handlePermissionsClick = (member: TeamMember) => setUserToPermissions(member);

  const columns = useMemo<ColumnDef<TeamMember>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Usuário',
        cell: ({ row }) => (
          <Group gap="sm">
            <Avatar color="blue" radius="xl">{row.original.name?.charAt(0)}</Avatar>
            <div>
              <Text size="sm" fw={500}>{row.original.name}</Text>
              <Text size="xs" c="dimmed">{row.original.email}</Text>
            </div>
          </Group>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Papel',
        cell: ({ getValue }) => (
          <Badge variant="light" color={getValue() === 'OWNER' ? 'orange' : 'blue'}>
            {getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => (
          getValue()
            ? <Badge color="green" variant="outline">Ativo</Badge>
            : <Badge color="gray" variant="outline">Inativo</Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const member = row.original;
          if (user?.id === member.id) return null;
          if (member.role === 'OWNER') return null;

          return (
            <Group gap={0} justify="flex-end">
              <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom-end" withinPortal>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray">
                    <IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconPencil size={16} />} onClick={() => handleEditClick(member)}>
                    Alterar Função
                  </Menu.Item>
                  <Menu.Item leftSection={<IconShieldLock size={16} />} onClick={() => handlePermissionsClick(member)}>
                    Permissões
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrash size={16} />}
                    color="red"
                    onClick={() => handleDeleteClick(member)}
                  >
                    Excluir
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      },
    ],
    [user]
  );

  const maxUsers = user?.planMaxUsers ?? 1;
  const usagePercent = (members.length / maxUsers) * 100;

  return (
    <Stack gap="lg">
      <Paper p="md" withBorder bg="var(--mantine-color-default)">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Licenças Utilizadas</Text>
          <Text size="sm" fw={700}>{members.length} / {maxUsers} usuários</Text>
        </Group>
        <Progress value={usagePercent} color={usagePercent >= 100 ? 'red' : 'blue'} size="lg" radius="xl" />
      </Paper>

      <Group justify="space-between">
        <div>
          <Text size="lg" fw={700}>Membros da Equipe</Text>
          <Text size="sm" c="dimmed">Gerencie quem tem acesso à sua empresa.</Text>
        </div>
        <Button
          leftSection={<IconUserPlus size={16} />}
          onClick={() => setInviteModalOpen(true)}
          disabled={members.length >= maxUsers}
        >
          Convidar Membro
        </Button>
      </Group>

      <DataGrid
        data={members}
        columns={columns}
      />

      {/* Modal de Convite */}
      <Modal opened={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Convidar Novo Usuário">
        <form onSubmit={inviteForm.onSubmit((v) => inviteMutation.mutate(v))}>
          <Stack>
            <Alert color="blue" icon={<IconAlertCircle />}>
              O usuário receberá um e-mail para criar a senha.
            </Alert>
            <TextInput
              label="E-mail"
              placeholder="exemplo@email.com"
              leftSection={<IconMail size={16} />}
              required
              {...inviteForm.getInputProps('email')}
            />
            <Select
              label="Função"
              data={[
                { value: 'SELLER', label: 'Vendedor' },
                { value: 'ADMIN', label: 'Administrador' },
              ]}
              required
              {...inviteForm.getInputProps('role')}
            />
            <Button type="submit" loading={inviteMutation.isPending} fullWidth>
              Enviar Convite
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Edição de Role */}
      <Modal
        opened={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        title={`Editar: ${userToEdit?.name}`}
        centered
      >
        <form onSubmit={editForm.onSubmit((values) => {
          if (userToEdit) {
            updateRoleMutation.mutate({ id: userToEdit.id, role: values.role });
          }
        })}>
          <Stack>
            <Select
              label="Nova Função"
              data={[
                { value: 'SELLER', label: 'Vendedor' },
                { value: 'ADMIN', label: 'Administrador' },
              ]}
              allowDeselect={false}
              {...editForm.getInputProps('role')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setUserToEdit(null)}>Cancelar</Button>
              <Button type="submit" loading={updateRoleMutation.isPending}>Salvar</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Permissões Granulares */}
      <UserPermissionsModal
        opened={!!userToPermissions}
        onClose={() => setUserToPermissions(null)}
        user={userToPermissions as any}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['team-members'] });
          setUserToPermissions(null);
        }}
      />

      {/* Modal de Exclusão */}
      <Modal
        opened={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Exclusão"
        centered
      >
        <Stack>
          <Text size="sm">
            Tem certeza que deseja remover <b>{userToDelete?.name}</b>?
            <br />
            O acesso será revogado imediatamente.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUserToDelete(null)}>Cancelar</Button>
            <Button
              color="red"
              onClick={() => userToDelete && removeMutation.mutate(userToDelete.id)}
              loading={removeMutation.isPending}
            >
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}