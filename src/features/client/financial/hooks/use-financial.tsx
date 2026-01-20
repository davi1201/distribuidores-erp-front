import { useQuery } from "@tanstack/react-query";
import * as financialApi from "../api/financial.api";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['financial', 'payment-methods'],
    queryFn: financialApi.getPaymentMethods,
  });
}