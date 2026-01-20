import api from '@/lib/api'; // Sua instância configurada do Axios
import { CommissionRecord, CommissionRule, CreateCommissionRuleDTO, SellerMetrics } from '../types';

const BASE_URL = '/commissions';

// ============================================================================
// ADMIN / OWNER (Gestão de Regras)
// ============================================================================

export const createCommissionRule = async (
  data: CreateCommissionRuleDTO
): Promise<CommissionRule> => {
  const response = await api.post(`${BASE_URL}/rules`, data);
  return response.data;
};

export const getCommissionRules = async (): Promise<CommissionRule[]> => {
  const response = await api.get(`${BASE_URL}/rules`);
  return response.data;
};

// ============================================================================
// SELLER (Visão do Vendedor)
// ============================================================================

export const getMyMetrics = async (): Promise<SellerMetrics> => {
  const response = await api.get(`${BASE_URL}/my-metrics`);
  return response.data;
};

export const getMyStatement = async (page = 1): Promise<CommissionRecord[]> => {
  const response = await api.get(`${BASE_URL}/my-statement`, {
    params: { page },
  });
  return response.data;
};

// ============================================================================
// ADMIN (Visão Gerencial sobre Vendedores)
// ============================================================================

export const getSellerMetricsAsAdmin = async (sellerId: string): Promise<SellerMetrics> => {
  const response = await api.get(`${BASE_URL}/admin/seller/${sellerId}/metrics`);
  return response.data;
};

export const getSellerStatementAsAdmin = async (
  sellerId: string,
  page = 1
): Promise<CommissionRecord[]> => {
  const response = await api.get(`${BASE_URL}/admin/seller/${sellerId}/statement`, {
    params: { page },
  });
  return response.data;
};
