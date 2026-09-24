import React, { useMemo, useState } from 'react';
import { apiClient } from '../lib/api/client';
import { usePolling, useQuery } from '../hooks/useApi';

interface HlrLookupScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

interface LookupResult {
  phone?: string;
  msisdn?: string;
  valid?: boolean;
  carrier?: string;
  isCarrier?: boolean;
  isValid?: boolean;
  isPorted?: boolean;
  ported?: boolean;
  mcc?: string;
  mnc?: string;
  networkName?: string;
  originalNetwork?: string;
  currentNetwork?: string;
  roaming?: string;
  createdAt?: string;
}

interface HlrConfig {
  id?: string;
  name: string;
  baseUrl: string;
  method: 'GET' | 'POST';
  apiKey?: string;
  apiSecret?: string;
  active: boolean;
  mapping?: Record<string, string>;
}

const unwrap = (response: any) => response?.data ?? response;

export const HlrLookupScreen: React.FC<HlrLookupScreenProps> = ({ onShowToast }) => {
  const [msisdn, setMsisdn] = useState('+12025550194');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'lookup' | 'configuration'>('lookup');
  const [config, setConfig] = useState<HlrConfig>({ name: 'Primary HLR Provider', baseUrl: '', method: 'GET', active: true, mapping: {} });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configs, setConfigs] = useState<any[]>([]);

  const { data: recent } = usePolling<any[]>(() => apiClient.getRecentLookups().then(response => unwrap(response) || []), 10000);
  const { data: configData, loading: configLoading } = useQuery<any[]>(() => apiClient.getHlrConfigs().then(response => unwrap(response) || []), []);
  const resolvedConfigs = configData || configs;
  const activeConfigCount = resolvedConfigs.filter(item => item.active).length;
  const latestResult = useMemo(() => lookupResult || (recent?.[0] as LookupResult), [lookupResult, recent]);

  const loadConfigs = async () => {
    try {
      const response = await apiClient.getHlrConfigs();
      setConfigs(unwrap(response) || []);
    } catch (error: any) {
      onShowToast(error.message || 'Unable to load HLR configuration.', 'error');
    }
  };

  const handleQuery = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsQuerying(true);
    setProgress(15);
    onShowToast(`HLR lookup started for ${msisdn}.`, 'info');
    const stages = [35, 60, 82];
    stages.forEach((value, index) => window.setTimeout(() => setProgress(value), 180 * (index + 1)));
    try {
      const response = await apiClient.getLookup(msisdn);
      setProgress(100);
      setLookupResult(unwrap(response));
      onShowToast('HLR/MNP record resolved successfully.', 'success');
    } catch (error: any) {
      setProgress(0);
      onShowToast(error.message || 'HLR lookup failed.', 'error');
    } finally {
      window.setTimeout(() => setIsQuerying(false), 250);
    }
  };

  const saveConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingConfig(true);
    try {
      const response = await apiClient.saveHlrConfig(config);
      setConfigs(unwrap(response) ? [unwrap(response)] : []);
      onShowToast('HLR configuration saved.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to save HLR configuration.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const toggleConfig = async (item: any) => {
    try {
      const response = await apiClient.saveHlrConfig({ ...item, active: !item.active });
      const updated = unwrap(response);
      setConfigs(current => current.map(entry => entry.id === item.id ? updated : entry));
      onShowToast(`${item.name} ${updated.active ? 'enabled' : 'disabled'}.`, 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to update HLR provider.', 'error');
    }
  };

  const testConfig = async (item: any) => {
    try {
      const response = await apiClient.testHlrConfig({ config: item, phone: msisdn });
      onShowToast(`Provider test completed: ${unwrap(response)?.carrier || 'response received'}.`, 'success');
    } catch (error: any) {
      onShowToast(error.message || 'HLR provider test failed.', 'error');
    }
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3"><div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">TELECOM &amp; ROUTING</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">MNP DIPPING &amp; HLR CONFIGURATION</span></div><div className="flex items-center gap-1.5 rounded border border-[#4edea3]/30 bg-[#4edea3]/5 px-2.5 py-1 text-[10px] text-[#4edea3]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4edea3]" />{activeConfigCount} PROVIDER{activeConfigCount === 1 ? '' : 'S'} ACTIVE</div></div>
      <div className="flex gap-1 border-b border-[#3d494c] pb-2"><button type="button" onClick={() => setActiveTab('lookup')} className={`rounded px-3 py-2 text-[11px] font-semibold ${activeTab === 'lookup' ? 'bg-[#06b6d4] text-[#00424f]' : 'text-[#869397] hover:bg-[#262a33]'}`}>HLR Lookup Console</button><button type="button" onClick={() => setActiveTab('configuration')} className={`rounded px-3 py-2 text-[11px] font-semibold ${activeTab === 'configuration' ? 'bg-[#06b6d4] text-[#00424f]' : 'text-[#869397] hover:bg-[#262a33]'}`}>Provider Configuration</button></div>

      {activeTab === 'lookup' && <><div className="grid gap-4 xl:grid-cols-[360px_1fr]"><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 flex items-center gap-2 border-b border-[#293240] pb-3"><span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">find_in_page</span><h2 className="text-[15px] font-semibold">MNP dipping query</h2></div><form onSubmit={handleQuery} className="space-y-3"><label className="block text-[10px] uppercase tracking-wider text-[#869397]">Target MSISDN<input required value={msisdn} onChange={event => setMsisdn(event.target.value)} className="mt-1 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 font-code-metric text-[12px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" placeholder="+1..." /></label><p className="text-[10px] leading-5 text-[#869397]">Runs an HLR/MNP dip against active providers to identify the current serving network without sending an SMS.</p>{isQuerying && <div><div className="mb-1 flex justify-between text-[10px] text-[#4cd7f6]"><span>{progress < 60 ? 'Selecting provider' : progress < 90 ? 'Awaiting HLR response' : 'Resolving route'}</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded bg-[#293240]"><div className="h-full rounded bg-[#4cd7f6] transition-all" style={{ width: `${progress}%` }} /></div></div>}<button type="submit" disabled={isQuerying} className="flex w-full items-center justify-center gap-2 rounded bg-[#06b6d4] py-2 text-[12px] font-semibold text-[#00424f] disabled:opacity-50"><span className={`material-symbols-outlined text-[16px] ${isQuerying ? 'animate-spin' : ''}`}>search</span>{isQuerying ? 'Looking up...' : 'Execute HLR Query'}</button></form></section><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[15px] font-semibold">Lookup result</h2><p className="mt-1 text-[10px] text-[#869397]">Routing intelligence for the selected number</p></div>{latestResult && <span className="rounded bg-[#4edea3]/10 px-2 py-1 text-[10px] text-[#4edea3]">{latestResult.valid || latestResult.isValid ? 'VALID & REACHABLE' : 'REVIEW'}</span>}</div>{latestResult ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded border border-[#293240] bg-[#0a0e16] p-3 sm:col-span-2"><div className="text-[10px] uppercase text-[#869397]">Current serving network</div><div className="mt-1 text-[16px] font-semibold text-[#dfe2ee]">{latestResult.currentNetwork || latestResult.carrier || latestResult.networkName || 'Unknown network'}</div></div><div className="rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="text-[10px] uppercase text-[#869397]">Portability</div><div className="mt-1 text-[14px] font-semibold text-[#4cd7f6]">{latestResult.ported || latestResult.isPorted ? 'MNP ACTIVE' : 'NOT PORTED'}</div></div><div className="rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="text-[10px] uppercase text-[#869397]">MCC / MNC</div><div className="mt-1 font-code-metric text-[#4edea3]">{latestResult.mcc || '—'} / {latestResult.mnc || '—'}</div></div><div className="rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="text-[10px] uppercase text-[#869397]">Original network</div><div className="mt-1 text-[#dfe2ee]">{latestResult.originalNetwork || '—'}</div></div><div className="rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="text-[10px] uppercase text-[#869397]">Roaming status</div><div className="mt-1 text-[#dfe2ee]">{latestResult.roaming || 'NOT_ROAMING'}</div></div></div> : <div className="flex min-h-48 flex-col items-center justify-center text-center text-[#869397]"><span className="material-symbols-outlined mb-2 text-[28px] text-[#3d494c]">phone_iphone</span><div className="text-[12px]">Run a query to inspect HLR and MNP data.</div></div>}</section></div><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold">Live lookup activity</h2><p className="text-[10px] text-[#869397]">Recent HLR/MNP operations refresh automatically.</p></div><span className="flex items-center gap-1.5 text-[10px] text-[#4edea3]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4edea3]" />REAL-TIME</span></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{(recent || []).slice(0, 8).map((item: any, index: number) => <div key={item.id || item.phone || index} className="rounded border border-[#293240] bg-[#0a0e16] p-2.5"><div className="flex justify-between text-[11px]"><span className="text-[#4cd7f6]">{item.phone || item.msisdn}</span><span className="text-[#4edea3]">{item.carrier || 'resolved'}</span></div><div className="mt-1 text-[9px] text-[#68767b]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'} · {item.ported || item.isPorted ? 'ported' : 'direct'}</div></div>)}{!recent?.length && <div className="col-span-full py-6 text-center text-[11px] text-[#869397]">No recent lookup activity.</div>}</div></section></>}

      {activeTab === 'configuration' && <div className="grid gap-4 xl:grid-cols-[1fr_360px]"><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[15px] font-semibold">HLR providers</h2><p className="text-[10px] text-[#869397]">Enable providers and verify connectivity before enabling production dipping.</p></div><button type="button" onClick={loadConfigs} className="text-[10px] text-[#4cd7f6]">Refresh</button></div><div className="space-y-2">{resolvedConfigs.map((item: any) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${item.active ? 'bg-[#4edea3]' : 'bg-[#68767b]'}`} /><div><div className="text-[12px] font-semibold text-[#dfe2ee]">{item.name}</div><div className="text-[10px] text-[#869397]">{item.method} · {item.baseUrl || 'No endpoint configured'}</div></div></div><div className="flex items-center gap-3"><button type="button" onClick={() => testConfig(item)} className="text-[10px] text-[#4cd7f6]">Test</button><button type="button" role="switch" aria-checked={item.active} onClick={() => toggleConfig(item)} className={`relative h-5 w-9 rounded-full ${item.active ? 'bg-[#4edea3]/30' : 'bg-[#3d494c]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${item.active ? 'right-0.5 bg-[#4edea3]' : 'left-0.5 bg-[#869397]'}`} /></button></div></div>)}{configLoading && <div className="py-8 text-center text-[11px] text-[#869397]">Loading providers...</div>}{!configLoading && !resolvedConfigs.length && <div className="py-8 text-center text-[11px] text-[#869397]">No HLR providers configured.</div>}</div></section><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[15px] font-semibold">Add provider</h2><p className="text-[10px] text-[#869397]">Configure the gateway used for MNP dipping.</p></div><form onSubmit={saveConfig} className="space-y-3"><input required value={config.name} onChange={event => setConfig(current => ({ ...current, name: event.target.value }))} placeholder="Provider name" className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[11px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /><input required type="url" value={config.baseUrl} onChange={event => setConfig(current => ({ ...current, baseUrl: event.target.value }))} placeholder="https://hlr.example.com/lookup" className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[11px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /><div className="grid grid-cols-2 gap-2"><select value={config.method} onChange={event => setConfig(current => ({ ...current, method: event.target.value as 'GET' | 'POST' }))} className="rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[11px] text-[#dfe2ee]"><option value="GET">GET method</option><option value="POST">POST method</option></select><label className="flex items-center gap-2 rounded border border-[#3d494c] bg-[#0a0e16] px-3 text-[11px] text-[#bcc9cd]"><input type="checkbox" checked={config.active} onChange={event => setConfig(current => ({ ...current, active: event.target.checked }))} className="accent-[#4edea3]" />Enabled</label></div><input value={config.apiKey || ''} onChange={event => setConfig(current => ({ ...current, apiKey: event.target.value }))} placeholder="API key (optional)" className="w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-2 text-[11px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /><button type="submit" disabled={isSavingConfig} className="w-full rounded bg-[#06b6d4] py-2 text-[11px] font-semibold text-[#00424f] disabled:opacity-50">{isSavingConfig ? 'Saving...' : 'Save provider'}</button></form></section></div>}
    </div>
  );
};
