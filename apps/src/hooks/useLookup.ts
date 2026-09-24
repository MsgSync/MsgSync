import { useCallback } from 'react';
import { useMutation, useQuery } from './useApi';
import { apiClient } from '../lib/api/client';
import { Lookup, HlrConfig } from '../lib/api/types';

export function useLookup() {
  const lookupMutation = useMutation<Lookup, [string]>();
  const recentQuery = useQuery<Lookup[]>(
    () => apiClient.getRecentLookups().then((r) => r.data || []),
    []
  );

  const performLookup = useCallback(
    async (phone: string) => {
      const result = await lookupMutation.execute(() => apiClient.getLookup(phone));
      return result.data;
    },
    [lookupMutation]
  );

  const hlrConfigQuery = useQuery<HlrConfig[]>(
    () => apiClient.getHlrConfigs().then((r) => r.data || []),
    []
  );

  return {
    performLookup,
    recentLookups: recentQuery.data,
    hlrConfigs: hlrConfigQuery.data,
    loading: lookupMutation.loading,
    error: lookupMutation.error,
    refetchRecent: recentQuery.refetch,
  };
}
