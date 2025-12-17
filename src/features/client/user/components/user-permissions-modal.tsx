'use client';

import { useEffect, useState } from 'react';
import {
  Modal, Button, Group, Stack, Text, Switch,
  Paper, Divider, Badge, LoadingOverlay,
  Flex
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShieldLock } from '@tabler/icons-react';
import { User, AVAILABLE_PERMISSIONS } from '../types';
import { updateUserPermissions } from '../api/users.api';


interface UserPermissionsModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void; // Para recarregar a lista de usuários após salvar
}

export function UserPermissionsModal({ opened, onClose, user, onSuccess }: UserPermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega as permissões atuais quando o usuário muda
  useEffect(() => {
    if (user) {
      setSelectedPermissions(user.permissions || []);
    }
  }, [user]);

  const handleTogglePermission = (value: string) => {
    setSelectedPermissions((current) =>
      current.includes(value)
        ? current.filter((p) => p !== value) // Remove
        : [...current, value] // Adiciona
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserPermissions(user.id, selectedPermissions);
      notifications.show({ message: 'Permissões atualizadas com sucesso!', color: 'green' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erro', message: 'Falha ao salvar permissões.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Agrupa permissões por categoria para exibir organizado
  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Group><IconShieldLock size={20} /><Text fw={700}>Gerenciar Permissões</Text></Group>}
      size="lg"
    >
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        <Paper p="sm" bg="var(--mantine-color-default)" withBorder>
          <Flex direction="column" gap={6} justify="center">
            <Text size="sm">
              Editando acesso de: <b>{user?.name}</b>
            </Text>
            <Text size="xs" c="dimmed">PERFIL: <Badge size="xs">{user?.role}</Badge></Text>
          </Flex>
        </Paper>

        <Divider />

        <Stack gap="xl">
          {Object.entries(groupedPermissions).map(([group, permissions]) => (
            <div key={group}>
              <Text fw={600} size="sm" mb="xs" c="dimmed" tt="uppercase">{group}</Text>
              <Stack gap="sm">
                {permissions.map((perm) => (
                  <Group key={perm.value} justify="space-between">
                    <div>
                      <Text size="sm">{perm.label}</Text>
                      {/* <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>{perm.value}</Text> */}
                    </div>
                    <Switch
                      checked={selectedPermissions.includes(perm.value)}
                      onChange={() => handleTogglePermission(perm.value)}
                      color="blue"
                      disabled={user?.role === 'OWNER'} // Owner tem tudo, não edita
                    />
                  </Group>
                ))}
              </Stack>
            </div>
          ))}
        </Stack>

        <Divider mt="md" />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={user?.role === 'OWNER'}>
            Salvar Alterações
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}