import React, { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery, useMutation } from '../hooks/useApi';
import { Organization, Invoice, Transaction } from '../lib/api/types';

interface OrganizationsScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const OrganizationsScreen: React.FC<OrganizationsScreenProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'orgs' | 'members' | 'invoices' | 'tenants'>('orgs');
  const { data: org, loading: orgLoading } = useQuery<Organization>(
    () => apiClient.getOrganization('root').then((r) => r.data),
    []
  );
  const { data: invoices } = useQuery<Invoice[]>(
    () => org ? apiClient.getInvoices(org.id).then((r) => r.data || []) : Promise.resolve([]),
    [org?.id]
  );
  const { data: transactions } = useQuery<Transaction[]>(
    () => org ? apiClient.getTransactions(org.id).then((r) => r.data || []) : Promise.resolve([]),
    [org?.id]
  );

  const createMutation = useMutation();

  const handleCreateTenant = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    try {
      await createMutation.execute(() => apiClient.createOrganization({ name, type }));
      onShowToast('Organization created', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create organization', 'error');
    }
  }, [createMutation, onShowToast]);

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">MANAGEMENT</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">ORGANIZATIONS &amp; TENANTS</span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[#3d494c] pb-2 text-[12px] font-code-metric">
        {[
          { id: 'orgs', label: 'Organizations' },
          { id: 'tenants', label: 'Tenants' },
          { id: 'members', label: 'Members & Roles' },
          { id: 'invoices', label: 'Invoices' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === tab.id ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#bcc9cd] hover:bg-[#262a33]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orgs' && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          {orgLoading ? (
            <div className="text-center py-8 text-[#869397]">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded bg-[#0a0e16] border border-[#3d494c]">
                <div className="text-[10px] text-[#869397] uppercase">Name</div>
                <div className="text-[14px] font-bold text-[#dfe2ee]">{org?.name}</div>
              </div>
              <div className="p-3 rounded bg-[#0a0e16] border border-[#3d494c]">
                <div className="text-[10px] text-[#869397] uppercase">Balance</div>
                <div className="text-[14px] font-bold text-[#4edea3]">${(org?.balance || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded bg-[#0a0e16] border border-[#3d494c]">
                <div className="text-[10px] text-[#869397] uppercase">Type</div>
                <div className="text-[14px] font-bold text-[#4cd7f6]">{org?.type}</div>
              </div>
              <div className="p-3 rounded bg-[#0a0e16] border border-[#3d494c]">
                <div className="text-[10px] text-[#869397] uppercase">Max Daily Spend</div>
                <div className="text-[14px] font-bold text-[#dfe2ee]">${(org?.maxDailySpend || 0).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-code-metric text-[12px]">
              <thead className="bg-[#181c24] border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d494c]">
                {invoices?.map((inv: Invoice) => (
                  <tr key={inv.id} className="hover:bg-[#262a33]/60 transition-colors">
                    <td className="py-3 text-[#4cd7f6]">{inv.number}</td>
                    <td className="py-3 text-[#dfe2ee]">${inv.total.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        inv.status === 'PAID' ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30' :
                        inv.status === 'UNPAID' ? 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30' :
                        'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="py-3 text-[#869397]">{new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      {inv.pdfUrl && (
                        <button className="px-2 py-1 rounded bg-[#262a33] text-[#4cd7f6] text-[10px] hover:bg-[#353942]">Download PDF</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <h3 className="text-[15px] font-semibold text-[#dfe2ee]">Create New Organization/Tenant</h3>
          </div>
          <form onSubmit={handleCreateTenant} className="flex gap-3">
            <input name="name" required placeholder="Organization Name" className="flex-1 px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]" />
            <select name="type" className="px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]">
              <option value="CLIENT">Client</option>
              <option value="RESELLER">Reseller</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" disabled={createMutation.loading} className="px-4 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px]">
              {createMutation.loading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
