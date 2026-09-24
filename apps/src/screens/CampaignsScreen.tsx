import React, { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign, ContactList } from '../lib/api/types';

interface CampaignsScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const CampaignsScreen: React.FC<CampaignsScreenProps> = ({ onShowToast }) => {
  const { campaigns, loading, createCampaign, startCampaign, pauseCampaign, resumeCampaign, deleteCampaign, contactLists, refetch } = useCampaigns();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({ name: '', template: '', contactListId: '', senderId: '', scheduledAt: '' });

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign(formData);
      onShowToast('Campaign created successfully', 'success');
      setShowCreate(false);
      setFormData({ name: '', template: '', contactListId: '', senderId: '', scheduledAt: '' });
      refetch();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create campaign', 'error');
    }
  }, [formData, createCampaign, onShowToast, refetch]);

  const handleStatusChange = useCallback(async (campaign: Campaign, action: 'start' | 'pause' | 'resume' | 'delete') => {
    try {
      if (action === 'start') await startCampaign(campaign.id);
      else if (action === 'pause') await pauseCampaign(campaign.id);
      else if (action === 'resume') await resumeCampaign(campaign.id);
      else if (action === 'delete') {
        if (!window.confirm(`Delete campaign "${campaign.name}"?`)) return;
        await deleteCampaign(campaign.id);
      }
      onShowToast(`Campaign ${action}d: ${campaign.name}`, 'info');
      refetch();
    } catch (err: any) {
      onShowToast(err.message || `Failed to ${action} campaign`, 'error');
    }
  }, [startCampaign, pauseCampaign, resumeCampaign, deleteCampaign, onShowToast, refetch]);

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">MESSAGING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">CAMPAIGNS</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Create Campaign</span>
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f131c]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg bg-[#1c2028] border border-[#3d494c] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3d494c]">
              <h3 className="text-[15px] font-semibold text-[#dfe2ee]">Create New Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#869397] hover:text-[#dfe2ee]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-[12px]">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Campaign Name</label>
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Template</label>
                <textarea required rows={3} value={formData.template} onChange={(e) => setFormData({...formData, template: e.target.value})} className="w-full p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Contact List</label>
                <select value={formData.contactListId} onChange={(e) => setFormData({...formData, contactListId: e.target.value})} className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]">
                  <option value="">Select a list</option>
                  {contactLists?.map((l: ContactList) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Sender ID</label>
                <input value={formData.senderId} onChange={(e) => setFormData({...formData, senderId: e.target.value})} className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]" placeholder="Optional" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-3.5 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] text-[12px]">Cancel</button>
                <button type="submit" disabled={loading} className="px-3.5 py-1.5 rounded bg-[#06b6d4] text-[#00424f] text-[12px] font-semibold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-[#869397]">Loading campaigns...</div>
      ) : (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-code-metric text-[12px]">
              <thead className="bg-[#181c24] border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                <tr>
                  <th className="p-3">Campaign Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Scheduled</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d494c]">
                {campaigns?.map((c: Campaign) => (
                  <tr key={c.id} className="hover:bg-[#262a33]/60 transition-colors">
                    <td className="py-3">
                      <span className="text-[#dfe2ee] font-semibold">{c.name}</span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        c.status === 'running' ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30' :
                        c.status === 'paused' ? 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30' :
                        c.status === 'draft' ? 'bg-[#869397]/15 text-[#869397] border-[#869397]/30' :
                        'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30'
                      }`}>{c.status}</span>
                    </td>
                    <td className="py-3 text-[#bcc9cd] text-[11px] max-w-xs truncate">{c.template}</td>
                    <td className="py-3 text-[#869397]">{c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString() : '—'}</td>
                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === 'draft' && (
                          <button onClick={() => handleStatusChange(c, 'start')} className="px-2 py-1 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] hover:bg-[#4edea3]/25">Start</button>
                        )}
                        {c.status === 'running' && (
                          <>
                            <button onClick={() => handleStatusChange(c, 'pause')} className="px-2 py-1 rounded bg-[#fbbf24]/15 text-[#fbbf24] text-[10px] hover:bg-[#fbbf24]/25">Pause</button>
                            <button onClick={() => handleStatusChange(c, 'resume')} className="px-2 py-1 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] text-[10px] hover:bg-[#4cd7f6]/25">Resume</button>
                          </>
                        )}
                        {c.status === 'paused' && (
                          <button onClick={() => handleStatusChange(c, 'resume')} className="px-2 py-1 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] text-[10px] hover:bg-[#4cd7f6]/25">Resume</button>
                        )}
                        <button onClick={() => handleStatusChange(c, 'delete')} className="px-2 py-1 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] text-[10px] hover:bg-[#ffb4ab]/25">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!campaigns || campaigns.length === 0) && (
            <div className="text-center py-8 text-[#869397]">No campaigns found. Create one to get started.</div>
          )}
        </div>
      )}
    </div>
  );
};
