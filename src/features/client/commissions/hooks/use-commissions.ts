import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as commissionApi from '../api/commission.api';
import { CreateCommissionRuleDTO } from '../types';

// --- HOOKS PARA O VENDEDOR ---

export function useMyMetrics() {
  return useQuery({
    queryKey: ['commissions', 'metrics', 'me'],
    queryFn: commissionApi.getMyMetrics,
    staleTime: 1000 * 60 * 5, // Cache de 5 min (Financeiro não muda a cada segundo)
  });
}

export function useMyStatement(page: number) {
  return useQuery({
    queryKey: ['commissions', 'statement', 'me', page],
    queryFn: () => commissionApi.getMyStatement(page),
    placeholderData: (previousData) => previousData, // Mantém dados antigos enquanto carrega nova página
  });
}

// --- HOOKS PARA O ADMIN ---

export function useCommissionRules() {
  return useQuery({
    queryKey: ['commissions', 'rules'],
    queryFn: commissionApi.getCommissionRules,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommissionRuleDTO) => commissionApi.createCommissionRule(data),
    onSuccess: () => {
      notifications.show({ message: 'Regra criada com sucesso!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['commissions', 'rules'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Erro',
        message: error.response?.data?.message || 'Falha ao criar regra',
        color: 'red',
      });
    },
  });
}

export function useSellerMetricsAdmin(sellerId: string) {
  return useQuery({
    queryKey: ['commissions', 'metrics', sellerId],
    queryFn: () => commissionApi.getSellerMetricsAsAdmin(sellerId),
    enabled: !!sellerId, // Só busca se tiver ID selecionado
  });
}
