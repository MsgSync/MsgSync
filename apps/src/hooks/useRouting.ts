import { useCallback } from 'react';
import { useQuery, useMutation } from './useApi';
import { apiClient } from '../lib/api/client';
import { RoutingRule, Provider } from '../lib/api/types';

export function useRouting() {
  const { data: rules, loading, error, refetch } = useQuery<RoutingRule[]>(
    () => apiClient.getRoutingRules().then((r) => r.data || []),
    []
  );

  const createMutation = useMutation();
  const updateMutation = useMutation();
  const deleteMutation = useMutation();

  const createRule = useCallback(
    async (data: any) => {
      const result = await createMutation.execute(() => apiClient.createRoutingRule(data));
      await refetch();
      return result;
    },
    [createMutation, refetch]
  );

  const updateRule = useCallback(
    async (id: string, data: any) => {
      const result = await updateMutation.execute(() => apiClient.updateRoutingRule(id, data));
      await refetch();
      return result;
    },
    [updateMutation, refetch]
  );

  const deleteRule = useCallback(
    async (id: string) => {
      await deleteMutation.execute(() => apiClient.deleteRoutingRule(id));
      await refetch();
    },
    [deleteMutation, refetch]
  );

  const { data: providers, loading: providersLoading } = useQuery<Provider[]>(
    () => apiClient.getProviders().then((r) => r.data || []),
    []
  );

  return {
    rules,
    providers,
    loading,
    providersLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    refetch,
  };
}
