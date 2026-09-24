import { useCallback } from 'react';
import { useQuery, useMutation } from './useApi';
import { apiClient } from '../lib/api/client';
import { Message } from '../lib/api/types';

export function useMessages() {
  const {
    data: messages,
    loading,
    error,
    refetch,
  } = useQuery<Message[]>(
    () => apiClient.listMessages().then((r) => r.data || []),
    []
  );

  const sendMutation = useMutation<Message, [any]>();
  const cancelMutation = useMutation<Message, [string]>();

  const sendMessage = useCallback(
    async (data: any) => {
      const result = await sendMutation.execute(
        () => apiClient.sendMessage(data)
      );
      await refetch();
      return result;
    },
    [sendMutation, refetch]
  );

  const cancelMessage = useCallback(
    async (id: string) => {
      await cancelMutation.execute(() => apiClient.cancelMessage(id));
      await refetch();
    },
    [cancelMutation, refetch]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    cancelMessage,
    refetch,
  };
}

export function useMessageDetail(id: string) {
  const { data, loading, error } = useQuery(
    () => apiClient.getMessageStatus(id).then((r) => r.data),
    [id]
  );

  return { message: data, loading, error };
}
