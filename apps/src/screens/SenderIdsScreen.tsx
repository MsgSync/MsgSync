import React, { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery, useMutation } from '../hooks/useApi';
import { SenderId } from '../lib/api/types';

interface SenderIdsScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SenderIdsScreen: React.FC<SenderIdsScreenProps> = ({ onShowToast }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('ALPHANUMERIC');
  const { data: senderIds, loading, error, refetch } = useQuery<SenderId[]>(
    () => apiClient.getSenderIds('root').then((r) => r.data || []),
    []
  );
  const registerMutation = useMutation();

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.execute(() => apiClient.requestSenderId({ name, type, organizationId: 'root' }));
      onShowToast(`Sender ID "${name}" registered successfully`, 'success');
      setName('');
      refetch();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to register sender ID', 'error');
    }
  }, [name, type, registerMutation, onShowToast, refetch]);

  const handleApprove = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/api/network/sender-ids/${id}/approve`);
      onShowToast('Sender ID approved', 'success');
      refetch();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to approve sender ID', 'error');
    }
  }, [onShowToast, refetch]);

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">MESSAGING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">SENDER IDs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#3d494c]">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">badge</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Register Sender ID</h2>
          </div>
          <form onSubmit={handleRegister} className="space-y-3 text-[12px]">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Sender ID Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={11} className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]" placeholder="e.g. BRAND" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]">
                <option value="ALPHANUMERIC">Alphanumeric</option>
                <option value="NUMERIC">Numeric</option>
              </select>
            </div>
            <button type="submit" disabled={registerMutation.loading} className="w-full py-2 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[13px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50">
              {registerMutation.loading ? 'Registering...' : 'Register Sender ID'}
            </button>
          </form>
        </div>

        <div className="xl:col-span-8 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Registered Sender IDs</h2>
            <span className="text-[10px] font-code-metric text-[#4edea3]">{senderIds?.length || 0} registered</span>
          </div>
          {loading ? (
            <div className="text-center py-8 text-[#869397]">Loading sender IDs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-code-metric text-[12px]">
                <thead className="border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3d494c]">
                  {senderIds?.map((s: SenderId) => (
                    <tr key={s.id} className="hover:bg-[#262a33]/60 transition-colors">
                      <td className="py-3 text-[#dfe2ee] font-semibold">{s.name}</td>
                      <td className="py-3 text-[#bcc9cd]">{s.type}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${
                          s.status === 'APPROVED' ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30' :
                          s.status === 'PENDING' ? 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30' :
                          'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-3 text-right">
                        {s.status === 'PENDING' && (
                          <button onClick={() => handleApprove(s.id)} className="px-2 py-1 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] hover:bg-[#4edea3]/25">Approve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
