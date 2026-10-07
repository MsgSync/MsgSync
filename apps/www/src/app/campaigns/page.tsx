'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authService } from '@/lib/auth';
import { DashboardLayout } from '@/lib/layout';
import { Plus, Search, Filter, Edit, Trash2, Play, Pause, MoreVertical, Loader2, Send, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  template: string;
  contactListId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';
  scheduledAt?: string;
  createdAt: string;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  totalContacts: number;
}

interface ContactList {
  id: string;
  name: string;
  contactCount: number;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  const handleDelete = async () => {
    if (!deletingCampaign) return;
    try {
      await api.delete(`/api/bulk/campaigns/${deletingCampaign.id}`);
      setCampaigns(campaigns.filter(c => c.id !== deletingCampaign.id));
      setDeletingCampaign(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template: '',
      contactListId: '',
      scheduledAt: '',
    });
    setEditingCampaign(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await api.put(`/api/bulk/campaigns/${editingCampaign.id}`, formData);
      } else {
        await api.post('/api/bulk/campaigns', formData);
      }
      setShowCreateModal(false);
      resetForm();
      // Refresh campaigns list
      const updatedCampaigns = await api.get<Campaign[]>('/api/bulk/campaigns');
      setCampaigns(updatedCampaigns);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    template: '',
    contactListId: '',
    scheduledAt: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [campaignsData, listsData] = await Promise.all([
          api.get<Campaign[]>('/api/bulk/campaigns'),
          api.get<ContactList[]>('/api/bulk/contact-lists'),
        ]);
        setCampaigns(campaignsData);
        setContactLists(listsData);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authService.isAuthenticated()) {
      fetchData();
    }
  }, []);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCampaign = await api.post<Campaign>('/api/bulk/campaigns', formData);
      setCampaigns([newCampaign, ...campaigns]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    try {
      const updated = await api.put<Campaign>(`/api/bulk/campaigns/${editingCampaign.id}`, formData);
      setCampaigns(campaigns.map((c) => (c.id === editingCampaign.id ? updated : c)));
      setEditingCampaign(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update campaign:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingCampaign) return;
    try {
      await api.delete(`/api/bulk/campaigns/${deletingCampaign.id}`);
      setCampaigns(campaigns.filter((c) => c.id !== deletingCampaign.id));
      setDeletingCampaign(null);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const handleStart = async (campaign: Campaign) => {
    try {
      await api.post(`/api/bulk/campaigns/${campaign.id}/start`);
      setCampaigns(campaigns.map((c) => (c.id === campaign.id ? { ...c, status: 'sending' as const } : c)));
    } catch (error) {
      console.error('Failed to start campaign:', error);
    }
  };

  const handlePause = async (campaign: Campaign) => {
    try {
      await api.post(`/api/bulk/campaigns/${campaign.id}/pause`);
      setCampaigns(campaigns.map((c) => (c.id === campaign.id ? { ...c, status: 'paused' as const } : c)));
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  };

  const handleResume = async (campaign: Campaign) => {
    try {
      await api.post(`/api/bulk/campaigns/${campaign.id}/resume`);
      setCampaigns(campaigns.map((c) => (c.id === campaign.id ? { ...c, status: 'sending' as const } : c)));
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template: '',
      contactListId: '',
      scheduledAt: '',
    });
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      template: campaign.template,
      contactListId: campaign.contactListId,
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '',
    });
    setShowCreateModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800 animate-pulse';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <span className="w-2 h-2 rounded-full bg-gray-400" />;
      case 'scheduled': return <span className="w-2 h-2 rounded-full bg-blue-500" />;
      case 'sending': return <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />;
      case 'sent': return <span className="w-2 h-2 rounded-full bg-green-500" />;
      case 'paused': return <span className="w-2 h-2 rounded-full bg-orange-500" />;
      case 'failed': return <span className="w-2 h-2 rounded-full bg-red-500" />;
      default: return <span className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="animate-spin h-8 w-8 text-brand" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-medium text-2xl md:text-3xl">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your messaging campaigns</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingCampaign(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Campaign
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first campaign</p>
              <button
                onClick={() => {
                  resetForm();
                  setEditingCampaign(null);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                            <Send className="h-5 w-5 text-brand" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{campaign.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.template}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full transition-all"
                              style={{ width: `${campaign.totalContacts > 0 ? (campaign.deliveredCount / campaign.totalContacts) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-20 text-right">
                            {campaign.deliveredCount}/{campaign.totalContacts}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {campaign.scheduledAt ? format(new Date(campaign.scheduledAt), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {campaign.status === 'draft' && (
                            <>
                              <button
                                onClick={() => openEditModal(campaign)}
                                className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingCampaign(campaign)}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {campaign.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handlePause(campaign)}
                                className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Pause"
                              >
                                <Pause className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingCampaign(campaign)}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {campaign.status === 'sending' && (
                            <>
                              <button
                                onClick={() => handlePause(campaign)}
                                className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Pause"
                              >
                                <Pause className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {campaign.status === 'paused' && (
                            <>
                              <button
                                onClick={() => handleResume(campaign)}
                                className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                title="Resume"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {campaign.status === 'sent' || campaign.status === 'failed' && (
                            <button
                              onClick={() => setDeletingCampaign(campaign)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowCreateModal(false); resetForm(); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-heading font-medium text-xl">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={editingCampaign ? handleUpdate : handleCreate} className="p-6 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                    Message Template <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="template"
                    name="template"
                    required
                    rows={4}
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                    placeholder="Enter your message template... Use {{name}} for personalization"
                  />
                  <p className="mt-1 text-sm text-gray-500">Use {{name}}, {{phone}}, etc. for personalization</p>
                </div>

                <div>
                  <label htmlFor="contactListId" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact List <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="contactListId"
                    name="contactListId"
                    required
                    value={formData.contactListId}
                    onChange={(e) => setFormData({ ...formData, contactListId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                  >
                    <option value="">Select a contact list</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.contactCount} contacts)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule For (Optional)
                  </label>
                  <input
                    id="scheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                  />
                  <p className="mt-1 text-sm text-gray-500">Leave empty to send immediately</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
                  >
                    {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCampaign && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setDeletingCampaign(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="font-heading font-medium text-lg mb-2">Delete Campaign</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "<strong>{deletingCampaign.name}</strong>"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeletingCampaign(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}