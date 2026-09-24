import { useCallback } from 'react';
import { useMutation, useQuery } from './useApi';
import { apiClient } from '../lib/api/client';
import { Organization } from '../lib/api/types';

export function useOrganizations() {
  const orgQuery = useQuery<Organization>(
    () => apiClient.getOrganization('root').then((r) => r.data),
    []
  );

  const createMutation = useMutation();

  const createOrg = useCallback(
    async (data: any) => {
      const result = await createMutation.execute(() => apiClient.createOrganization(data));
      return result.data;
    },
    [createMutation]
  );

  return {
    organization: orgQuery.data,
    loading: orgQuery.loading,
    createOrg,
    refetch: orgQuery.refetch,
  };
}
