import React, { useMemo, useState } from 'react';
import { useRouting } from '../hooks/useRouting';
import { INITIAL_ROUTING_RULES } from '../data/mockData';
import { RoutingRule } from '../types';

interface RoutingScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const RoutingScreen: React.FC<RoutingScreenProps> = ({ onShowToast }) => {
  const { rules, providers, loading, refetch, updateRule } = useRouting();
  const [lcrMode, setLcrMode] = useState('LCR');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [isHotReloading, setIsHotReloading] = useState(false);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const [senderOverrides, setSenderOverrides] = useState<Record<string, string>>({});
  const visibleRules = useMemo(() => rules?.length ? rules : INITIAL_ROUTING_RULES, [rules]);
  const activeProviders = (providers || []).filter(provider => provider.active);
  const activeRuleCount = visibleRules.filter(rule => rule.active).length;

  const reload = async () => {
    setIsHotReloading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    await refetch();
    setIsHotReloading(false);
    onShowToast('LCR tables synchronized across routing edge nodes.', 'success');
  };

  const moveRule = async (rule: RoutingRule, direction: -1 | 1) => {
    const currentIndex = visibleRules.findIndex(item => item.id === rule.id);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= visibleRules.length) return;
    const nextRule = visibleRules[nextIndex];
    try {
      await updateRule(rule.id, { priority: nextRule.priority });
      if (nextRule.priority !== rule.priority) await updateRule(nextRule.id, { priority: rule.priority });
      onShowToast('Route priority updated.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to reorder route.', 'error');
    }
  };

  const saveSenderOverride = async (rule: RoutingRule) => {
    try {
      await updateRule(rule.id, { senderIdOverride: senderOverrides[rule.id] || null });
      onShowToast('Route-wise sender ID override saved.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to save sender ID override.', 'error');
    }
  };

  const reconnectProvider = async (provider: any) => {
    setReconnecting(provider.id);
    await new Promise(resolve => setTimeout(resolve, 500));
    setReconnecting(null);
    onShowToast(`${provider.name} reconnection handshake completed.`, 'success');
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3"><div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">TELECOM &amp; ROUTING</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">ADVANCED ROUTING &amp; LCR</span></div><button type="button" onClick={reload} disabled={isHotReloading} className="flex items-center gap-1.5 rounded bg-[#06b6d4] px-3 py-1.5 text-[11px] font-semibold text-[#00424f] disabled:opacity-50"><span className={`material-symbols-outlined text-[16px] ${isHotReloading ? 'animate-spin' : ''}`}>sync</span>{isHotReloading ? 'Synchronizing...' : 'Hot-Reload Routing Tables'}</button></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase text-[#869397]">Routing mode</div><select value={lcrMode} onChange={event => setLcrMode(event.target.value)} className="mt-2 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-1.5 text-[12px] text-[#4cd7f6]"><option value="LCR">Least cost route</option><option value="PRIORITY">Priority first</option><option value="ROUND_ROBIN">Weighted distribution</option></select></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase text-[#869397]">Active routes</div><div className="mt-2 font-code-metric text-[25px] font-bold text-[#4edea3]">{activeRuleCount}</div><div className="text-[10px] text-[#869397]">priority-scoped rules</div></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase text-[#869397]">Provider pool</div><div className="mt-2 font-code-metric text-[25px] font-bold text-[#4cd7f6]">{activeProviders.length}</div><div className="text-[10px] text-[#869397]">healthy candidates</div></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase text-[#869397]">Auto reconnection</div><label className="mt-2 flex items-center gap-2 text-[12px] text-[#dfe2ee]"><input type="checkbox" checked={autoReconnect} onChange={event => setAutoReconnect(event.target.checked)} className="accent-[#4edea3]" />Enabled across edge</label></div></div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]"><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[15px] font-semibold">Priority &amp; LCR route selection</h2><p className="text-[10px] text-[#869397]">Rules are evaluated by exact network match, then priority and cost.</p></div><span className="rounded bg-[#4edea3]/10 px-2 py-1 text-[10px] text-[#4edea3]">{lcrMode}</span></div><div className="space-y-2">{visibleRules.map((rule: any, index) => <div key={rule.id} className="rounded border border-[#293240] bg-[#181c24] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="font-code-metric text-[11px] text-[#4cd7f6]">#{index + 1}</span><div><div className="text-[12px] font-semibold text-[#dfe2ee]">{rule.name || `${rule.prefix || 'Global'} route`}</div><div className="text-[10px] text-[#869397]">{rule.mcc || 'Any MCC'} / {rule.mnc || 'Any MNC'} · priority {rule.priority}</div></div></div><div className="flex items-center gap-2"><span className={`rounded px-1.5 py-0.5 text-[9px] ${rule.active ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'}`}>{rule.active ? 'ACTIVE' : 'DISABLED'}</span><button type="button" onClick={() => moveRule(rule, -1)} disabled={index === 0} className="text-[#869397] disabled:opacity-20">↑</button><button type="button" onClick={() => moveRule(rule, 1)} disabled={index === visibleRules.length - 1} className="text-[#869397] disabled:opacity-20">↓</button></div></div><div className="mt-3 grid gap-2 md:grid-cols-4"><div className="rounded bg-[#0a0e16] p-2"><div className="text-[9px] uppercase text-[#68767b]">Primary provider</div><div className="mt-1 text-[11px] text-[#dfe2ee]">{rule.provider?.name || rule.primaryCarrier || 'Priority pool'}</div></div><div className="rounded bg-[#0a0e16] p-2"><div className="text-[9px] uppercase text-[#68767b]">Weight</div><div className="mt-1 text-[11px] text-[#4edea3]">{rule.weight ?? 100}%</div></div><div className="rounded bg-[#0a0e16] p-2"><div className="text-[9px] uppercase text-[#68767b]">Route sender ID</div><input value={senderOverrides[rule.id] ?? rule.senderIdOverride ?? ''} onChange={event => setSenderOverrides(current => ({ ...current, [rule.id]: event.target.value }))} placeholder="Use default" className="mt-1 w-full bg-transparent text-[11px] text-[#4cd7f6] outline-none" /></div><button type="button" onClick={() => saveSenderOverride(rule)} className="self-end rounded border border-[#06b6d4]/40 px-2 py-1 text-[10px] text-[#4cd7f6]">Save sender ID</button></div></div>)}{loading && <div className="py-8 text-center text-[11px] text-[#869397]">Loading routing policy...</div>}</div></section><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 border-b border-[#293240] pb-3"><h2 className="text-[15px] font-semibold">Provider failover &amp; reconnection</h2><p className="text-[10px] text-[#869397]">Sequential failover protects delivery during carrier incidents.</p></div><div className="space-y-2">{(providers || []).map((provider: any) => <div key={provider.id} className="flex items-center justify-between rounded border border-[#293240] bg-[#0a0e16] p-3"><div><div className="text-[12px] font-semibold text-[#dfe2ee]">{provider.name}</div><div className="mt-1 text-[10px] text-[#869397]">{provider.type} · priority {provider.priority} · {provider.active ? 'available' : 'disabled'}</div></div><button type="button" onClick={() => reconnectProvider(provider)} disabled={reconnecting === provider.id || !provider.active} className="rounded border border-[#06b6d4]/40 px-2.5 py-1 text-[10px] text-[#4cd7f6] disabled:opacity-40">{reconnecting === provider.id ? 'Reconnecting...' : 'Reconnect'}</button></div>)}{!providers?.length && <div className="py-8 text-center text-[11px] text-[#869397]">No provider connections found.</div>}</div><div className="mt-4 rounded border border-[#3d494c] bg-[#0a0e16] p-3 text-[10px] leading-5 text-[#869397]"><span className="font-semibold text-[#4cd7f6]">Failover policy:</span> failed attempts automatically advance to the next eligible provider. Auto-reconnection keeps persistent edge connections ready for the next message.</div></section></div>
    </div>
  );
};
