import { useCallback } from 'react';
import { useMutation, useQuery } from './useApi';
import { apiClient } from '../lib/api/client';
import { AuditLog } from '../lib/api/types';

export function useSecurity() {
  const auditQuery = useQuery<AuditLog[]>(
    () => apiClient.getAuditLogs().then((r) => r.data || []),
    []
  );

  const setup2faMutation = useMutation();
  const enable2faMutation = useMutation();
  const disable2faMutation = useMutation();

  const setup2FA = useCallback(
    async () => {
      const result = await setup2faMutation.execute(() => apiClient.setup2FA());
      return result.data;
    },
    [setup2faMutation]
  );

  const enable2FA = useCallback(
    async (data: any) => {
      await enable2faMutation.execute(() => apiClient.enable2FA(data));
      return true;
    },
    [enable2faMutation]
  );

  const disable2FA = useCallback(
    async () => {
      await disable2faMutation.execute(() => apiClient.disable2FA());
      return true;
    },
    [disable2faMutation]
  );

  return {
    auditLogs: auditQuery.data,
    loading: auditQuery.loading,
    setup2FA,
    enable2FA,
    disable2FA,
    refetchAudit: auditQuery.refetch,
  };
}
