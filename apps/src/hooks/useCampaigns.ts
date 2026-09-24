import { useCallback } from 'react';
import { useQuery, useMutation } from './useApi';
import { apiClient } from '../lib/api/client';
import { Campaign, ContactList } from '../lib/api/types';

export function useCampaigns() {
  const {
    data: campaigns,
    loading,
    error,
    refetch,
  } = useQuery<Campaign[]>(
    () => apiClient.getCampaigns().then((r) => r.data || []),
    []
  );

  const createMutation = useMutation();
  const startMutation = useMutation();
  const pauseMutation = useMutation();
  const resumeMutation = useMutation();
  const deleteMutation = useMutation();

  const createCampaign = useCallback(
    async (data: any) => {
      const result = await createMutation.execute(() => apiClient.createCampaign(data));
      await refetch();
      return result;
    },
    [createMutation, refetch]
  );

  const startCampaign = useCallback(
    async (id: string) => {
      await startMutation.execute(() => apiClient.startCampaign(id));
      await refetch();
    },
    [startMutation, refetch]
  );

  const pauseCampaign = useCallback(
    async (id: string) => {
      await pauseMutation.execute(() => apiClient.pauseCampaign(id));
      await refetch();
    },
    [pauseMutation, refetch]
  );

  const resumeCampaign = useCallback(
    async (id: string) => {
      await resumeMutation.execute(() => apiClient.resumeCampaign(id));
      await refetch();
    },
    [resumeMutation, refetch]
  );

  const deleteCampaign = useCallback(
    async (id: string) => {
      await deleteMutation.execute(() => apiClient.deleteCampaign(id));
      await refetch();
    },
    [deleteMutation, refetch]
  );

  const contactListsQuery = useQuery<ContactList[]>(
    () => apiClient.getContactLists().then((r) => r.data || []),
    []
  );

  return {
    campaigns,
    loading,
    error,
    contactLists: contactListsQuery.data,
    createCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
    refetch,
  };
}
