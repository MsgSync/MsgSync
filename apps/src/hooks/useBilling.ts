import { useCallback } from 'react';
import { useQuery, useMutation } from './useApi';
import { apiClient } from '../lib/api/client';
import { Invoice, Transaction, Organization } from '../lib/api/types';

export function useBilling(organizationId: string) {
  const { data: invoices, loading, error, refetch } = useQuery<Invoice[]>(
    () => apiClient.getInvoices(organizationId).then((r) => r.data || []),
    [organizationId]
  );

  const { data: transactions, loading: txLoading } = useQuery<Transaction[]>(
    () => apiClient.getTransactions(organizationId).then((r) => r.data || []),
    [organizationId]
  );

  const updateStatusMutation = useMutation();

  const updateInvoiceStatus = useCallback(
    async (id: string, status: string) => {
      await updateStatusMutation.execute(() => apiClient.updateInvoiceStatus(id, status));
      await refetch();
    },
    [updateStatusMutation, refetch]
  );

  const orgQuery = useQuery<Organization>(
    () => apiClient.getOrganization(organizationId).then((r) => r.data),
    [organizationId]
  );

  return {
    invoices,
    transactions,
    organization: orgQuery.data,
    loading,
    txLoading,
    error,
    updateInvoiceStatus,
    refetch,
  };
}
