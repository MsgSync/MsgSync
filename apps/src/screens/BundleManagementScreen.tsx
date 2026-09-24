import React, { useState } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery } from '../hooks/useApi';

interface BundleManagementScreenProps {
  onShowToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

interface BundleForm {
  name: string;
  description: string;
  price: string;
  smsLimit: string;
  validityDays: string;
  smsType: string;
  senderIdType: string;
}

const emptyForm: BundleForm = { name: '', description: '', price: '', smsLimit: '', validityDays: '30', smsType: 'ALL', senderIdType: 'ALL' };
const unwrap = (response: any) => response?.data ?? response;

export const BundleManagementScreen: React.FC<BundleManagementScreenProps> = ({ onShowToast }) => {
  const [includeInactive, setIncludeInactive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BundleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { data: bundlesData, loading, refetch } = useQuery<any[]>(() => apiClient.getBundles(includeInactive).then(unwrap), [includeInactive]);
  const { data: historyData, refetch: refetchHistory } = useQuery<any[]>(() => apiClient.getBundleHistory('root').then(unwrap), []);
  const bundles = bundlesData || [];
  const history = historyData || [];

  const editBundle = (bundle: any) => {
    setEditingId(bundle.id);
    setForm({ name: bundle.name, description: bundle.description || '', price: String(bundle.price), smsLimit: String(bundle.smsLimit), validityDays: String(bundle.validityDays), smsType: bundle.smsType || 'ALL', senderIdType: bundle.senderIdType || 'ALL' });
  };

  const saveBundle = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price), smsLimit: Number(form.smsLimit), validityDays: Number(form.validityDays) };
    try {
      if (editingId) await apiClient.updateBundle(editingId, payload);
      else await apiClient.createBundle(payload);
      setForm(emptyForm);
      setEditingId(null);
      await refetch();
      onShowToast(editingId ? 'Bundle updated.' : 'Bundle created.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to save bundle.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleBundle = async (bundle: any) => {
    try {
      await apiClient.updateBundle(bundle.id, { active: !bundle.active });
      await refetch();
      onShowToast(`${bundle.name} ${bundle.active ? 'deactivated' : 'activated'}.`, 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to update bundle.', 'error');
    }
  };

  const subscribe = async (bundle: any) => {
    try {
      await apiClient.subscribeToBundle({ organizationId: 'root', bundleId: bundle.id });
      await refetchHistory();
      onShowToast(`${bundle.name} activated for the current organization.`, 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to activate bundle.', 'error');
    }
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3"><div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">MANAGEMENT &amp; BILLING</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">BUNDLE / PACKAGE MANAGEMENT</span></div><label className="flex items-center gap-2 text-[10px] text-[#869397]"><input type="checkbox" checked={includeInactive} onChange={event => setIncludeInactive(event.target.checked)} className="accent-[#4cd7f6]" />Show inactive bundles</label></div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]"><section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">SMS packages</h2><p className="text-[10px] text-[#869397]">Configure, activate, and modify wholesale SMS offers.</p></div><span className="text-[10px] text-[#869397]">{bundles.filter(bundle => bundle.active).length} active</span></div><div className="grid gap-3 md:grid-cols-2">{bundles.map(bundle => <div key={bundle.id} className={`rounded-lg border p-4 ${bundle.active ? 'border-[#3d494c] bg-[#1c2028]' : 'border-[#293240] bg-[#12161f] opacity-70'}`}><div className="flex items-start justify-between gap-2"><div><div className="text-[13px] font-semibold text-[#dfe2ee]">{bundle.name}</div><div className="mt-1 text-[10px] leading-4 text-[#869397]">{bundle.description || 'No description'}</div></div><span className={`rounded px-2 py-0.5 text-[9px] ${bundle.active ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'}`}>{bundle.active ? 'ACTIVE' : 'INACTIVE'}</span></div><div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><div><span className="text-[#68767b]">SMS credits</span><div className="mt-1 font-code-metric text-[16px] text-[#4cd7f6]">{Number(bundle.smsLimit).toLocaleString()}</div></div><div><span className="text-[#68767b]">Subscription fee</span><div className="mt-1 font-code-metric text-[16px] text-[#4edea3]">${Number(bundle.price).toFixed(2)}</div></div><div><span className="text-[#68767b]">SMS type</span><div className="mt-1 text-[#bcc9cd]">{bundle.smsType || 'ALL'}</div></div><div><span className="text-[#68767b]">Sender ID</span><div className="mt-1 text-[#bcc9cd]">{bundle.senderIdType || 'ALL'}</div></div><div><span className="text-[#68767b]">Validity</span><div className="mt-1 text-[#bcc9cd]">{bundle.validityDays} days</div></div></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => editBundle(bundle)} className="flex-1 rounded border border-[#06b6d4]/40 py-1.5 text-[10px] font-semibold text-[#4cd7f6]">Edit</button>{bundle.active && <button type="button" onClick={() => subscribe(bundle)} className="flex-1 rounded bg-[#06b6d4] py-1.5 text-[10px] font-semibold text-[#00424f]">Activate</button>}<button type="button" onClick={() => toggleBundle(bundle)} className="rounded border border-[#3d494c] px-2 text-[10px] text-[#869397]">{bundle.active ? 'Deactivate' : 'Activate'}</button></div></div>)}{!loading && !bundles.length && <div className="rounded border border-[#3d494c] bg-[#1c2028] p-10 text-center text-[12px] text-[#869397]">No bundles configured.</div>}{loading && <div className="p-10 text-center text-[12px] text-[#869397]">Loading bundles...</div>}</div></section>
        <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[15px] font-semibold">{editingId ? 'Modify bundle' : 'Create bundle'}</h2><p className="text-[10px] text-[#869397]">Set package value and routing constraints.</p></div><form onSubmit={saveBundle} className="space-y-3"><input required value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} placeholder="Bundle name" className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[11px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /><textarea value={form.description} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} placeholder="Description" className="h-16 w-full resize-none rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[11px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /><div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-[#869397]">Fee<input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(current => ({ ...current, price: e.target.value }))} className="mt-1 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-2 text-[11px] text-[#4edea3]" /></label><label className="text-[10px] text-[#869397]">SMS quantity<input required type="number" min="1" value={form.smsLimit} onChange={e => setForm(current => ({ ...current, smsLimit: e.target.value }))} className="mt-1 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-2 text-[11px] text-[#4cd7f6]" /></label></div><div className="grid grid-cols-3 gap-2"><label className="text-[10px] text-[#869397]">Period (days)<input required type="number" min="1" value={form.validityDays} onChange={e => setForm(current => ({ ...current, validityDays: e.target.value }))} className="mt-1 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-2 text-[11px] text-[#dfe2ee]" /></label><label className="text-[10px] text-[#869397]">SMS type<select value={form.smsType} onChange={e => setForm(current => ({ ...current, smsType: e.target.value }))} className="mt-1 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-2 text-[11px] text-[#dfe2ee]"><option>ALL</option><option>PROMOTIONAL</option><option>TRANSACTIONAL</option><option>OTP</option></select></label><label className="text-[10px] text-[#869397]">Sender ID<select value={form.senderIdType} onChange={e => setForm(current => ({ ...current, senderIdType: e.target.value }))} className="mt-1 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-2 text-[11px] text-[#dfe2ee]"><option>ALL</option><option>ALPHANUMERIC</option><option>NUMERIC</option><option>SHORTCODE</option></select></label></div><div className="flex gap-2"><button type="submit" disabled={saving} className="flex-1 rounded bg-[#06b6d4] py-2 text-[11px] font-semibold text-[#00424f] disabled:opacity-40">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create bundle'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded border border-[#3d494c] px-3 text-[10px] text-[#869397]">Cancel</button>}</div></form></section></div>
      <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold">Bundle history</h2><p className="text-[10px] text-[#869397]">Subscription activity and performance audit.</p></div><button type="button" onClick={refetchHistory} className="text-[10px] text-[#4cd7f6]">Refresh</button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b border-[#293240] text-[10px] uppercase text-[#68767b]"><th className="px-2 py-2">Bundle</th><th className="px-2 py-2">SMS remaining</th><th className="px-2 py-2">Expires</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Subscribed</th></tr></thead><tbody>{history.map((item: any) => <tr key={item.id} className="border-b border-[#293240]/60 text-[11px] text-[#bcc9cd]"><td className="px-2 py-2.5 text-[#4cd7f6]">{item.bundle?.name || item.bundleId}</td><td className="px-2 py-2.5">{Number(item.smsRemaining).toLocaleString()}</td><td className="px-2 py-2.5">{new Date(item.expiresAt).toLocaleDateString()}</td><td className="px-2 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[9px] ${item.status === 'ACTIVE' ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'}`}>{item.status}</span></td><td className="px-2 py-2.5">{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>{!history.length && <div className="py-6 text-center text-[11px] text-[#869397]">No bundle history available.</div>}</section>
    </div>
  );
};
