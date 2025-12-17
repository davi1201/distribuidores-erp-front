import api from '@/lib/api';
import { User } from '../types';

export const updateUserPermissions = async (
  userId: string,
  permissions: string[]
): Promise<User> => {
  const { data } = await api.patch(`/users/${userId}/permissions`, {
    permissions,
  });
  return data;
};
