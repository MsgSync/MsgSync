import React, { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery, useMutation } from '../hooks/useApi';
import { Organization, Invoice, Transaction } from '../lib/api/types';

interface OrganizationsScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const OrganizationsScreen: React.FC<OrganizationsScreenProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'orgs' | 'billing' | 'clients' | 'members' | 'invoices' | 'tenants'>('orgs');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [billingPolicy, setBillingPolicy] = useState('ON_SUBMISSION');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [invoiceFormat, setInvoiceFormat] = useState('BOTH');
  const [ratePlanId, setRatePlanId] = useState('');
  const [profileRates, setProfileRates] = useState<Record<string, string>>({ TRANSACTIONAL: '', PROMOTIONAL: '', OTP: '' });
  const { data: org, loading: orgLoading } = useQuery<Organization>(
    () => apiClient.getOrganization('root').then((r) => r.data),
    []
  );
  const { data: childOrganizations } = useQuery<any[]>(() => org?.id ? apiClient.getSubOrganizations(org.id).then(r => r.data || []) : Promise.resolve([]), [org?.id]);
  const { data: clientReport } = useQuery<any>(() => selectedClientId ? apiClient.getOrganizationReporting(selectedClientId).then(r => r.data) : Promise.resolve(null), [selectedClientId]);
  const { data: ratePlans } = useQuery<any[]>(() => apiClient.getRatePlans().then((r) => r.data || []), []);
  const { data: rates } = useQuery<any[]>(() => org?.ratePlanId ? apiClient.getRates(org.ratePlanId).then((r) => r.data || []) : Promise.resolve([]), [org?.ratePlanId]);
  const billingMutation = useMutation();
  const invoiceCycleMutation = useMutation();

  useEffect(() => {
    if (org) {
      setBillingPolicy(org.billingPolicy || 'ON_SUBMISSION');
      setBillingEmail(org.billingEmail || '');
      setBillingCycle(org.billingCycle || 'MONTHLY');
      setInvoiceFormat(org.invoiceFormat || 'BOTH');
      setRatePlanId(org.ratePlanId || '');
    }
  }, [org]);

  useEffect(() => {
    if (!rates) return;
    setProfileRates(current => {
      const next = { ...current };
      rates.forEach((rate: any) => { if (rate.profile in next) next[rate.profile] = String(rate.pricePerSms ?? ''); });
      return next;
    });
  }, [rates]);

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

  const handleSaveBilling = useCallback(async () => {
    if (!org) return;
    try {
      await billingMutation.execute(() => apiClient.updateOrganizationBillingSettings(org.id, { billingPolicy, billingEmail, billingCycle, invoiceFormat, ratePlanId: ratePlanId || null }));
      onShowToast('Billing policy saved.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save billing policy', 'error');
    }
  }, [org, billingPolicy, billingEmail, billingCycle, invoiceFormat, ratePlanId, billingMutation, onShowToast]);

  const handleRunBillingCycle = useCallback(async () => {
    try {
      await invoiceCycleMutation.execute(() => apiClient.runInvoiceBillingCycle());
      onShowToast('Invoice billing cycle completed.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to run billing cycle', 'error');
    }
  }, [invoiceCycleMutation, onShowToast]);

  const handleRecordPayment = useCallback(async () => {
    if (!selectedClientId || !paymentAmount) return;
    try {
      await apiClient.addOrganizationBalance(selectedClientId, Number(paymentAmount), 'Online payment received');
      setPaymentAmount('');
      onShowToast('Payment recorded and client balance updated.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to record payment.', 'error');
    }
  }, [selectedClientId, paymentAmount, onShowToast]);  const handleSaveProfileRate = useCallback(async (profile: string) => {
    if (!org?.ratePlanId || !profileRates[profile]) return;
    const existing = rates?.find((rate: any) => rate.profile === profile);
    try {
      await apiClient.saveRate(org.ratePlanId, {
        country: existing?.country || 'GLOBAL',
        prefix: existing?.prefix || '0',
        mcc: existing?.mcc || null,
        mnc: existing?.mnc || null,
        networkName: existing?.networkName || 'Default',
        pricePerSms: Number(profileRates[profile]),
        profile
      });
      onShowToast(`${profile} rate saved.`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save profile rate', 'error');
    }
  }, [org, rates, profileRates, onShowToast]);
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
          { id: 'billing', label: 'Billing Logic' },
          { id: 'clients', label: 'Clients & Resellers' },
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

      {activeTab === 'clients' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <section className="rounded border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[15px] font-semibold text-[#dfe2ee]">Client &amp; reseller hierarchy</h2><p className="mt-1 text-[10px] text-[#869397]">Manage downstream organizations and drill into client performance.</p></div><div className="space-y-2">{(childOrganizations || []).map((client: any) => <button key={client.id} type="button" onClick={() => setSelectedClientId(client.id)} className={`flex w-full items-center justify-between rounded border p-3 text-left ${selectedClientId === client.id ? 'border-[#06b6d4]/50 bg-[#06b6d4]/10' : 'border-[#293240] bg-[#0a0e16] hover:border-[#536066]'}`}><div><div className="text-[12px] font-semibold text-[#dfe2ee]">{client.name}</div><div className="mt-1 text-[10px] text-[#869397]">{client.type} · {client._count?.subOrgs || 0} downstream organizations</div></div><div className="text-right"><div className="font-code-metric text-[14px] text-[#4edea3]">${Number(client.balance || 0).toLocaleString()}</div><div className="text-[9px] text-[#68767b]">BALANCE</div></div></button>)}{!childOrganizations?.length && <div className="py-8 text-center text-[11px] text-[#869397]">No downstream clients found.</div>}</div></section>
          <section className="rounded border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[15px] font-semibold text-[#dfe2ee]">Client reporting &amp; payment</h2><p className="mt-1 text-[10px] text-[#869397]">{selectedClientId ? 'Selected downstream client' : 'Select a client to begin'}</p></div>{selectedClientId ? <><div className="grid grid-cols-2 gap-2"><div className="rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="text-[10px] uppercase text-[#869397]">Message health</div><div className="mt-1 font-code-metric text-[18px] text-[#4edea3]">{clientReport?.stats?.reduce((sum: number, item: any) => sum + Number(item._count || 0), 0) || 0}</div><div className="text-[9px] text-[#68767b]">messages in scope</div></div><div className="rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="text-[10px] uppercase text-[#869397]">Balance</div><div className="mt-1 font-code-metric text-[18px] text-[#4cd7f6]">${Number(clientReport?.balance || 0).toLocaleString()}</div><div className="text-[9px] text-[#68767b]">available credit</div></div></div><div className="mt-4 rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="mb-2 text-[10px] uppercase tracking-wider text-[#869397]">Online payment</div><div className="flex gap-2"><input type="number" min="0" step="0.01" value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} placeholder="Payment amount" className="min-w-0 flex-1 rounded border border-[#3d494c] bg-[#12161f] px-2 py-1.5 text-[11px] text-[#4edea3] outline-none" /><button type="button" onClick={handleRecordPayment} disabled={!paymentAmount} className="rounded bg-[#06b6d4] px-3 text-[10px] font-semibold text-[#00424f] disabled:opacity-40">Record payment</button></div><div className="mt-2 text-[9px] text-[#68767b]">Payment provider webhooks can be connected to this balance action.</div></div></> : <div className="py-12 text-center text-[11px] text-[#869397]">Select a client from the hierarchy.</div>}</section>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="rounded border border-[#3d494c] bg-[#1c2028] p-4">
            <div className="mb-4 flex items-start justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[15px] font-semibold text-[#dfe2ee]">Multiple billing logic</h2><p className="mt-1 text-[10px] text-[#869397]">Choose when customers are charged and assign profile-specific pricing.</p></div><span className="material-symbols-outlined text-[24px] text-[#4cd7f6]">account_balance_wallet</span></div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div><label className="mb-2 block text-[10px] uppercase tracking-wider text-[#869397]">Billing policy</label><select value={billingPolicy} onChange={event => setBillingPolicy(event.target.value)} className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[12px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]"><option value="ON_ATTEMPT">On attempt — charge after delivery attempt</option><option value="ON_SUBMISSION">On submission — charge after provider acceptance</option><option value="ON_DELIVERY">On delivery — charge after delivery receipt</option></select><p className="mt-2 text-[10px] leading-4 text-[#869397]">The selected policy is applied to new message billing events.</p></div>
              <div><label className="mb-2 block text-[10px] uppercase tracking-wider text-[#869397]">Rate plan</label><select value={ratePlanId} onChange={event => setRatePlanId(event.target.value)} className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[12px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]"><option value="">No plan assigned</option>{(ratePlans || []).map((plan: any) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select><p className="mt-2 text-[10px] leading-4 text-[#869397]">Assign a plan before editing transactional and promotional rates.</p></div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3"><div><label className="mb-2 block text-[10px] uppercase tracking-wider text-[#869397]">Billing cycle</label><select value={billingCycle} onChange={event => setBillingCycle(event.target.value)} className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[12px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]"><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="ANNUAL">Annual</option></select></div><div><label className="mb-2 block text-[10px] uppercase tracking-wider text-[#869397]">Invoice format</label><select value={invoiceFormat} onChange={event => setInvoiceFormat(event.target.value)} className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[12px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]"><option value="PDF">PDF</option><option value="EXCEL">Excel</option><option value="BOTH">PDF + Excel</option></select></div><div><label className="mb-2 block text-[10px] uppercase tracking-wider text-[#869397]">Invoice email</label><input type="email" value={billingEmail} onChange={event => setBillingEmail(event.target.value)} placeholder="billing@company.com" className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[12px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /></div></div>
            <p className="mt-3 text-[10px] text-[#869397]">New invoices automatically use this cycle and format, then email the configured recipient when the email integration is connected.</p>
            <div className="mt-4 flex justify-end"><button type="button" onClick={handleSaveBilling} disabled={billingMutation.loading || !org} className="rounded bg-[#06b6d4] px-4 py-2 text-[11px] font-semibold text-[#00424f] disabled:cursor-not-allowed disabled:opacity-40">{billingMutation.loading ? 'Saving...' : 'Save invoice settings'}</button></div>
          </div>
          <div className="rounded border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[15px] font-semibold text-[#dfe2ee]">Profile rates</h2><p className="mt-1 text-[10px] text-[#869397]">Keep rates precise for different messaging use cases.</p></div><div className="grid gap-3 md:grid-cols-3">{[['TRANSACTIONAL', 'Transactional', 'Alerts, OTPs, and service messages'], ['PROMOTIONAL', 'Promotional', 'Marketing and bulk campaigns'], ['OTP', 'OTP', 'One-time passcode traffic']].map(([key, label, description]) => <div key={key} className="rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="flex items-center justify-between"><span className="text-[12px] font-semibold text-[#dfe2ee]">{label}</span><span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">payments</span></div><p className="mt-1 min-h-7 text-[10px] leading-4 text-[#869397]">{description}</p><div className="mt-3 flex gap-2"><div className="relative flex-1"><span className="absolute left-2.5 top-2 text-[11px] text-[#68767b]">$</span><input type="number" min="0" step="0.0001" value={profileRates[key] || ''} onChange={event => setProfileRates(current => ({ ...current, [key]: event.target.value }))} placeholder="0.0250" className="w-full rounded border border-[#3d494c] bg-[#12161f] py-1.5 pl-6 pr-2 font-code-metric text-[11px] text-[#4cd7f6] outline-none focus:border-[#4cd7f6]" /></div><button type="button" onClick={() => handleSaveProfileRate(key)} disabled={!org?.ratePlanId || !profileRates[key]} className="rounded border border-[#06b6d4]/40 px-2.5 text-[10px] font-semibold text-[#4cd7f6] disabled:cursor-not-allowed disabled:opacity-30">Save</button></div><div className="mt-2 text-[9px] text-[#68767b]">Price per SMS</div></div>)}</div></div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#3d494c] px-3 py-2"><span className="text-[10px] text-[#869397]">{invoices?.length || 0} invoices · automated delivery enabled</span><button type="button" onClick={handleRunBillingCycle} disabled={invoiceCycleMutation.loading} className="rounded border border-[#06b6d4]/40 px-2.5 py-1 text-[10px] font-semibold text-[#4cd7f6] disabled:opacity-40">{invoiceCycleMutation.loading ? 'Running...' : 'Run billing cycle'}</button></div>
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
                        {inv.pdfUrl && <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="mr-1 inline-block rounded bg-[#262a33] px-2 py-1 text-[#4cd7f6] text-[10px] hover:bg-[#353942]">PDF</a>}
                        {inv.excelUrl && <a href={inv.excelUrl} target="_blank" rel="noreferrer" className="inline-block rounded bg-[#262a33] px-2 py-1 text-[#4edea3] text-[10px] hover:bg-[#353942]">Excel</a>}
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
