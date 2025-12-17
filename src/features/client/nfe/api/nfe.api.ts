import api from '@/lib/api';
import { NfeInboxItem } from '../types';

// Listar a Inbox
export const getNfeInbox = async (): Promise<NfeInboxItem[]> => {
  const { data } = await api.get('/nfe/inbox');
  return data;
};

// Processar (Aprovar/Importar)
// Retorna os dados parseados (produtos, fornecedor) para o wizard de conferência
export const processNfeInboxItem = async (id: string) => {
  const { data } = await api.post(`/nfe/inbox/${id}/process`);
  return data;
};

// Ignorar (Arquivar)
export const ignoreNfeInboxItem = async (id: string) => {
  await api.post(`/nfe/inbox/${id}/ignore`);
};

export const completeInboxImport = async (id: string) => {
  await api.patch(`/nfe/inbox/${id}/complete`);
};

export const getPendingNfeCount = async () => {
  const { data } = await api.get('/nfe/pending-count');
  return data.count;
};
