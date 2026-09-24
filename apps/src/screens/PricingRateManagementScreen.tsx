import React, { useMemo, useRef, useState } from 'react';
import { apiClient } from '../lib/api/client';
import { usePolling, useQuery } from '../hooks/useApi';

interface PricingRateManagementScreenProps {
  onShowToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

interface RateRow {
  id: string;
  country: string;
  prefix: string;
  mcc?: string;
  mnc?: string;
  networkName?: string;
  pricePerSms: number;
  profile: string;
  status: string;
  updatedAt: string;
}

const profiles = [
  { id: 'ALL', label: 'All profiles' },
  { id: 'TRANSACTIONAL', label: 'Transactional' },
  { id: 'PROMOTIONAL', label: 'Promotional' },
  { id: 'OTP', label: 'OTP' }
];

const money = (value: number) => `$${Number(value || 0).toFixed(4)}`;

export const PricingRateManagementScreen: React.FC<PricingRateManagementScreenProps> = ({ onShowToast }) => {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [profile, setProfile] = useState('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: plansData, loading: plansLoading } = useQuery<any[]>(() => apiClient.getRatePlans().then(response => (response as any).data || (response as any) || []), []);
  const plans = plansData || [];
  const activePlanId = selectedPlanId || plans[0]?.id || '';
  const { data: ratesData, loading: ratesLoading, error: ratesError } = usePolling<any[]>(() => apiClient.getRates(activePlanId).then(response => {
    setLastSynced(new Date());
    return (response as any).data || (response as any) || [];
  }), 10000, { enabled: !!activePlanId });
  const rates = (ratesData || []) as RateRow[];
  const visibleRates = useMemo(() => profile === 'ALL' ? rates : rates.filter(rate => rate.profile === profile), [profile, rates]);
  const activePlan = plans.find(plan => plan.id === activePlanId);
  const averageRate = visibleRates.length ? visibleRates.reduce((sum, rate) => sum + Number(rate.pricePerSms || 0), 0) / visibleRates.length : 0;
  const lastUpdated = rates.reduce((latest, rate) => !latest || new Date(rate.updatedAt) > latest ? new Date(rate.updatedAt) : latest, null as Date | null);

  const beginEdit = (rate: RateRow) => {
    setEditingId(rate.id);
    setEditingValue(String(rate.pricePerSms));
  };

  const saveRate = async (rate: RateRow) => {
    try {
      await apiClient.saveRate(activePlanId, { ...rate, pricePerSms: Number(editingValue) });
      setEditingId(null);
      onShowToast(`${rate.profile} rate updated.`, 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to save rate.', 'error');
    }
  };

  const importRates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activePlanId) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported)) throw new Error('Import file must contain an array of rates.');
      await apiClient.importRates(activePlanId, imported);
      onShowToast(`${imported.length} rates imported.`, 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to import rates.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3"><div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">MANAGEMENT &amp; BILLING</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">PRICING &amp; RATE MANAGEMENT</span></div><div className="flex items-center gap-2"><span className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] ${ratesError ? 'border-[#ffb4ab]/30 text-[#ffb4ab]' : 'border-[#4edea3]/30 text-[#4edea3]'}`}><span className={`h-1.5 w-1.5 rounded-full ${ratesError ? 'bg-[#ffb4ab]' : 'animate-pulse bg-[#4edea3]'}`} />{ratesError ? 'SYNC ERROR' : lastSynced ? `SYNCED ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'LIVE SYNC'}</span><input ref={fileInput} type="file" accept=".json,application/json" onChange={importRates} className="hidden" /><button type="button" onClick={() => fileInput.current?.click()} disabled={!activePlanId} className="rounded border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-3 py-1.5 text-[10px] font-semibold text-[#4cd7f6] disabled:opacity-40">Import JSON</button></div></div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase tracking-wider text-[#869397]">Active plan</div><div className="mt-2 text-[20px] font-semibold text-[#4cd7f6]">{activePlan?.name || 'No plan'}</div><div className="mt-1 text-[10px] text-[#869397]">{activePlan?.currency || 'USD'} billing currency</div></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase tracking-wider text-[#869397]">Rate records</div><div className="mt-2 font-code-metric text-[25px] font-bold text-[#dfe2ee]">{rates.length}</div><div className="mt-1 text-[10px] text-[#869397]">Across all profiles</div></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase tracking-wider text-[#869397]">Average price</div><div className="mt-2 font-code-metric text-[25px] font-bold text-[#4edea3]">{money(averageRate)}</div><div className="mt-1 text-[10px] text-[#869397]">Per SMS in current view</div></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase tracking-wider text-[#869397]">Last rate update</div><div className="mt-2 font-code-metric text-[16px] font-bold text-[#d0bcff]">{lastUpdated ? lastUpdated.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No data'}</div><div className="mt-1 text-[10px] text-[#869397]">Changes sync automatically</div></div></div>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr]"><aside className="rounded-lg border border-[#3d494c] bg-[#181c24] p-3"><div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#869397]">Rate plans</div><div className="space-y-1">{plansLoading ? <div className="py-5 text-center text-[11px] text-[#869397]">Loading plans...</div> : plans.map(plan => <button key={plan.id} type="button" onClick={() => { setSelectedPlanId(plan.id); setProfile('ALL'); }} className={`w-full rounded p-3 text-left ${plan.id === activePlanId ? 'border border-[#06b6d4]/50 bg-[#06b6d4]/10' : 'border border-transparent hover:bg-[#262a33]'}`}><div className={`text-[12px] font-semibold ${plan.id === activePlanId ? 'text-[#4cd7f6]' : 'text-[#dfe2ee]'}`}>{plan.name}</div><div className="mt-1 text-[10px] text-[#869397]">{plan.isPublic ? 'Public plan' : 'Private plan'} · {plan.currency}</div></button>)}</div>{!plansLoading && !plans.length && <div className="py-5 text-center text-[11px] text-[#869397]">No rate plans available.</div>}</aside>
        <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold text-[#dfe2ee]">Live rate cards</h2><p className="mt-1 text-[10px] text-[#869397]">Manage wholesale and retail prices by network and profile.</p></div><select value={profile} onChange={event => setProfile(event.target.value)} className="rounded border border-[#3d494c] bg-[#0a0e16] px-2.5 py-1.5 text-[10px] text-[#bcc9cd]">{profiles.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-[#293240] text-[10px] uppercase tracking-wider text-[#68767b]"><th className="px-2 py-2">Country / network</th><th className="px-2 py-2">Prefix</th><th className="px-2 py-2">Profile</th><th className="px-2 py-2">Status</th><th className="px-2 py-2 text-right">Price / SMS</th><th className="px-2 py-2 text-right">Action</th></tr></thead><tbody>{visibleRates.map(rate => <tr key={rate.id} className="border-b border-[#293240]/60 text-[11px] text-[#bcc9cd]"><td className="px-2 py-2.5"><div className="font-semibold text-[#dfe2ee]">{rate.country}</div><div className="text-[9px] text-[#68767b]">{rate.networkName || 'Generic network'} {rate.mcc ? `· MCC ${rate.mcc}` : ''}</div></td><td className="px-2 py-2.5 font-code-metric text-[#4cd7f6]">+{rate.prefix}</td><td className="px-2 py-2.5"><span className="rounded bg-[#06b6d4]/10 px-1.5 py-0.5 text-[9px] text-[#4cd7f6]">{rate.profile}</span></td><td className="px-2 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[9px] ${rate.status === 'ACTIVE' ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'}`}>{rate.status}</span></td><td className="px-2 py-2.5 text-right font-code-metric text-[#4edea3]">{editingId === rate.id ? <input autoFocus type="number" min="0" step="0.0001" value={editingValue} onChange={event => setEditingValue(event.target.value)} className="w-24 rounded border border-[#4cd7f6] bg-[#0a0e16] px-2 py-1 text-right text-[#4cd7f6] outline-none" /> : money(rate.pricePerSms)}</td><td className="px-2 py-2.5 text-right">{editingId === rate.id ? <button type="button" onClick={() => saveRate(rate)} className="mr-1 text-[10px] text-[#4edea3]">Save</button> : <button type="button" onClick={() => beginEdit(rate)} className="text-[10px] text-[#4cd7f6]">Edit</button>}</td></tr>)}</tbody></table></div>{ratesLoading && <div className="py-8 text-center text-[11px] text-[#869397]">Loading live rates...</div>}{!ratesLoading && !visibleRates.length && <div className="py-8 text-center text-[11px] text-[#869397]">No rates match this profile.</div>}<div className="mt-4 flex items-center gap-2 rounded border border-[#3d494c] bg-[#0a0e16] p-3 text-[10px] text-[#869397]"><span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">bolt</span>Rates refresh every 10 seconds. Import accepts an array of rate records matching the API schema.</div></section></div>
    </div>
  );
};
