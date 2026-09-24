import React, { useState } from 'react';
import { RoutingRule } from '../types';
import { INITIAL_ROUTING_RULES } from '../data/mockData';

interface RoutingScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const RoutingScreen: React.FC<RoutingScreenProps> = ({ onShowToast }) => {
  const [rules, setRules] = useState<RoutingRule[]>(INITIAL_ROUTING_RULES);
  const [isHotReloading, setIsHotReloading] = useState(false);

  const handleWeightChange = (id: string, newWeight: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, weight: newWeight } : r))
    );
  };

  const handleHotReload = () => {
    setIsHotReloading(true);
    onShowToast('Dual-Authorization verified. Pushing hot-reload routing tables to cluster...', 'info');
    setTimeout(() => {
      setIsHotReloading(false);
      onShowToast('LCR weights hot-reloaded across all 12 SMPP edge nodes in 84ms.', 'success');
    }, 900);
  };

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">TELECOM &amp; ROUTING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">INTELLIGENT ROUTING &amp; LCR ENGINE</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={isHotReloading}
            onClick={handleHotReload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isHotReloading ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isHotReloading ? 'Hot-Reloading...' : 'Hot-Reload LCR Tables'}</span>
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Prefix Weighting &amp; Carrier Cost Arbitrage</h2>
            <p className="text-[11px] text-[#bcc9cd]">
              Real-time Least Cost Routing (LCR) with dynamic failover thresholds
            </p>
          </div>
          <span className="text-[10px] font-code-metric px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
            DUAL-AUTH COMPLIANT
          </span>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col md:flex-row md:items-center justify-between gap-4 font-code-metric text-[12px]"
            >
              <div className="w-64">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold text-[#4cd7f6]">{rule.prefix}</span>
                  <span className="text-[#dfe2ee] font-body-md font-semibold text-[13px]">
                    {rule.country}
                  </span>
                </div>
                <div className="text-[10px] text-[#869397] font-body-md truncate">{rule.destination}</div>
              </div>

              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#4cd7f6] font-semibold">Primary: {rule.primaryCarrier}</span>
                    <span className="text-[#dfe2ee]">{rule.weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={rule.weight}
                    onChange={(e) => handleWeightChange(rule.id, Number(e.target.value))}
                    className="w-full accent-[#06b6d4] h-1.5 bg-[#0a0e16] rounded cursor-pointer"
                  />
                  <div className="text-[10px] text-[#869397] mt-0.5">
                    Fallback: {rule.secondaryCarrier} ({100 - rule.weight}%)
                  </div>
                </div>

                <div className="text-right w-28">
                  <div className="text-[10px] text-[#869397]">Rate / SMS</div>
                  <div className="text-[14px] font-bold text-[#4edea3]">${rule.costPerSms.toFixed(4)}</div>
                </div>
              </div>

              <div className="self-end md:self-auto">
                <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 text-[10px] font-semibold">
                  {rule.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
