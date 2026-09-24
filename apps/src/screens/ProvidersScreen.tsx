import React, { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery } from '../hooks/useApi';
import { Provider } from '../lib/api/types';

interface ProvidersScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ProvidersScreen: React.FC<ProvidersScreenProps> = ({ onShowToast }) => {
  const { data: providers, loading, error, refetch } = useQuery<Provider[]>(
    () => apiClient.getProviders().then((r) => r.data || []),
    []
  );

  const handleToggle = useCallback(async (provider: Provider) => {
    try {
      await apiClient.patch(`/api/providers/${provider.id}`, { active: !provider.active });
      onShowToast(`Provider ${provider.name} ${!provider.active ? 'enabled' : 'disabled'}`, 'info');
      refetch();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to toggle provider', 'error');
    }
  }, [onShowToast, refetch]);

  const handleHealthCheck = useCallback(async (provider: Provider) => {
    try {
      onShowToast(`Health check initiated for ${provider.name}...`, 'info');
      await apiClient.post(`/api/providers/${provider.id}/health`);
      onShowToast(`Health check passed for ${provider.name}`, 'success');
    } catch (err: any) {
      onShowToast(`Health check failed for ${provider.name}: ${err.message}`, 'error');
    }
  }, [onShowToast]);

  const handleTestMessage = useCallback(async (provider: Provider) => {
    try {
      onShowToast(`Test message sent to ${provider.name}...`, 'info');
      await apiClient.post(`/api/providers/${provider.id}/test`, { recipient: '+12025550194' });
      onShowToast(`Test message delivered via ${provider.name}`, 'success');
    } catch (err: any) {
      onShowToast(`Test message failed for ${provider.name}: ${err.message}`, 'error');
    }
  }, [onShowToast]);

  if (loading) return <div className="text-center py-8 text-[#869397]">Loading providers...</div>;

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">TELECOM &amp; ROUTING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">PROVIDERS</span>
        </div>
      </div>

      <div className="rounded bg-[#1c2028] border border-[#3d494c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-code-metric text-[12px]">
            <thead className="bg-[#181c24] border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
              <tr>
                <th className="p-3">Provider</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Cost/SMS</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3d494c]">
              {providers?.map((p: Provider) => (
                <tr key={p.id} className="hover:bg-[#262a33]/60 transition-colors">
                  <td className="py-3 text-[#dfe2ee] font-semibold">{p.name}</td>
                  <td className="py-3 text-[#bcc9cd]">{p.type}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${
                      p.active ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30' : 'bg-[#31353e] text-[#869397] border-[#3d494c]'
                    }`}>{p.active ? 'ACTIVE' : 'DISABLED'}</span>
                  </td>
                  <td className="py-3 text-[#dfe2ee]">{p.priority}</td>
                  <td className="py-3 text-[#4edea3]">${p.costPerSms.toFixed(4)}</td>
                  <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleHealthCheck(p)} className="px-2 py-1 rounded bg-[#262a33] text-[#4cd7f6] text-[10px] hover:bg-[#353942]">Health</button>
                      <button onClick={() => handleTestMessage(p)} className="px-2 py-1 rounded bg-[#262a33] text-[#4edea3] text-[10px] hover:bg-[#353942]">Test</button>
                      <button onClick={() => handleToggle(p)} className="px-2 py-1 rounded bg-[#262a33] text-[#ffb4ab] text-[10px] hover:bg-[#353942]">
                        {p.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
