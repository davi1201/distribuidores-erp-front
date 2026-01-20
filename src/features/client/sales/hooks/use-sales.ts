import { useQuery } from '@tanstack/react-query';
import { getSaleById, getSales } from '../api/sales.api';

// Hook para Listagem Geral
export function useSalesList() {
  return useQuery({
    queryKey: ['sales-list'],
    queryFn: getSales,
    staleTime: 1000 * 60 * 1, // Cache de 1 minuto (Vendas acontecem rápido)
  });
}

// Hook para Detalhes de uma Venda
export function useSaleDetails(saleId: string | null) {
  return useQuery({
    queryKey: ['sale-details', saleId],
    queryFn: () => getSaleById(saleId!),
    enabled: !!saleId, // Só busca se tiver um ID
    staleTime: 1000 * 60 * 5, // Detalhes de venda fechada mudam pouco
  });
}
