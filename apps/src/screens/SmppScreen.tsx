import React, { useState, useMemo } from 'react';
import { SmppTrunk } from '../types';

interface SmppScreenProps {
  trunks: SmppTrunk[];
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SmppScreen: React.FC<SmppScreenProps> = ({ trunks: initialTrunks, onShowToast }) => {
  const [trunks, setTrunks] = useState<SmppTrunk[]>(initialTrunks);
  const [selectedTrunkId, setSelectedTrunkId] = useState<string>(initialTrunks[0]?.id || 'trunk-01');
  const [search, setSearch] = useState('');
  const [rateLimitFilter, setRateLimitFilter] = useState<'ALL' | 'LIMITED' | 'UNCAPPED' | 'THROTTLED'>('ALL');

  // Rate Limit Modal state
  const [editingTrunk, setEditingTrunk] = useState<SmppTrunk | null>(null);
  const [modalEnabled, setModalEnabled] = useState(false);
  const [modalPps, setModalPps] = useState(300);
  const [modalBurst, setModalBurst] = useState(360);
  const [modalAction, setModalAction] = useState<'REJECT_ESME_RTHROTTLED' | 'LEAKY_BUCKET_QUEUE' | 'SILENT_DROP' | 'LCR_FAILOVER'>('REJECT_ESME_RTHROTTLED');

  const selectedTrunk = useMemo(() => {
    return trunks.find((t) => t.id === selectedTrunkId) || trunks[0] || null;
  }, [trunks, selectedTrunkId]);

  // Toggle Rate Limit for a specific trunk
  const handleToggleRateLimit = (trunkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setTrunks((prev) =>
      prev.map((t) => {
        if (t.id === trunkId) {
          const nextEnabled = !t.rateLimitEnabled;
          const defaultPps = t.rateLimitPps || Math.round(t.tpsLimit * 0.85);
          const defaultBurst = t.rateLimitBurst || Math.round(defaultPps * 1.2);
          const defaultAction = t.rateLimitAction || 'REJECT_ESME_RTHROTTLED';

          return {
            ...t,
            rateLimitEnabled: nextEnabled,
            rateLimitPps: defaultPps,
            rateLimitBurst: defaultBurst,
            rateLimitAction: defaultAction,
          };
        }
        return t;
      })
    );

    const trunk = trunks.find((t) => t.id === trunkId);
    if (trunk) {
      const willBeEnabled = !trunk.rateLimitEnabled;
      const targetPps = trunk.rateLimitPps || Math.round(trunk.tpsLimit * 0.85);
      if (willBeEnabled) {
        onShowToast(`Rate limit ENABLED for ${trunk.name} at ${targetPps} PPS.`, 'success');
      } else {
        onShowToast(`Rate limit DISABLED for ${trunk.name}. Trunk uncapped at ${trunk.tpsLimit} TPS.`, 'warning');
      }
    }
  };

  // Quick adjust PPS (+ / - delta)
  const handleQuickAdjustPps = (trunkId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setTrunks((prev) =>
      prev.map((t) => {
        if (t.id === trunkId) {
          const current = t.rateLimitPps || t.tpsLimit;
          const updated = Math.max(10, Math.min(t.tpsLimit * 2, current + delta));
          return {
            ...t,
            rateLimitEnabled: true,
            rateLimitPps: updated,
            rateLimitBurst: Math.round(updated * 1.2),
          };
        }
        return t;
      })
    );

    const trunk = trunks.find((t) => t.id === trunkId);
    if (trunk) {
      const newPps = Math.max(10, (trunk.rateLimitPps || trunk.tpsLimit) + delta);
      onShowToast(`Adjusted ${trunk.name} PPS threshold to ${newPps} PPS.`, 'info');
    }
  };

  // Open Edit Modal for a specific trunk
  const handleOpenEditModal = (trunk: SmppTrunk, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTrunk(trunk);
    setModalEnabled(trunk.rateLimitEnabled ?? true);
    setModalPps(trunk.rateLimitPps ?? Math.round(trunk.tpsLimit * 0.85));
    setModalBurst(trunk.rateLimitBurst ?? Math.round((trunk.rateLimitPps ?? trunk.tpsLimit) * 1.2));
    setModalAction(trunk.rateLimitAction ?? 'REJECT_ESME_RTHROTTLED');
  };

  // Save Modal Changes
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrunk) return;

    setTrunks((prev) =>
      prev.map((t) => {
        if (t.id === editingTrunk.id) {
          return {
            ...t,
            rateLimitEnabled: modalEnabled,
            rateLimitPps: modalPps,
            rateLimitBurst: modalBurst,
            rateLimitAction: modalAction,
          };
        }
        return t;
      })
    );

    onShowToast(
      `Rate limit updated for ${editingTrunk.name}: ${modalEnabled ? `${modalPps} PPS (${modalAction})` : 'Disabled (Uncapped)'}.`,
      'success'
    );
    setEditingTrunk(null);
  };

  // Bulk Fleet Actions
  const handleEnableAllRateLimits = () => {
    setTrunks((prev) =>
      prev.map((t) => ({
        ...t,
        rateLimitEnabled: true,
        rateLimitPps: t.rateLimitPps || Math.round(t.tpsLimit * 0.85),
        rateLimitBurst: t.rateLimitBurst || Math.round((t.rateLimitPps || t.tpsLimit) * 1.2),
        rateLimitAction: t.rateLimitAction || 'REJECT_ESME_RTHROTTLED',
      }))
    );
    onShowToast('Rate limiting enabled across all 12 SMPP transceiver trunks.', 'success');
  };

  const handleApplyConservativeCap = () => {
    setTrunks((prev) =>
      prev.map((t) => {
        const safePps = Math.round(t.tpsLimit * 0.8);
        return {
          ...t,
          rateLimitEnabled: true,
          rateLimitPps: safePps,
          rateLimitBurst: Math.round(safePps * 1.15),
          rateLimitAction: 'REJECT_ESME_RTHROTTLED',
        };
      })
    );
    onShowToast('Applied conservative 80% capacity ceiling across all trunks.', 'info');
  };

  const handleBypassAllRateLimits = () => {
    setTrunks((prev) =>
      prev.map((t) => ({
        ...t,
        rateLimitEnabled: false,
      }))
    );
    onShowToast('Rate limiters bypassed for all trunks. Trunks operating at full carrier capacity.', 'warning');
  };

  // Operational probe and rebind handlers
  const handleEnquireLink = (trunkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTrunks((prev) =>
      prev.map((t) =>
        t.id === trunkId
          ? { ...t, latencyMs: Math.floor(Math.random() * 8) + 10, enquireLinkStatus: 'NOMINAL' }
          : t
      )
    );
    onShowToast(`Enquire_Link probe sent to ${trunkId}. RTT nominal.`, 'success');
  };

  const handleRebind = (trunkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTrunks((prev) =>
      prev.map((t) => (t.id === trunkId ? { ...t, status: 'CONNECTING' } : t))
    );
    onShowToast(`Rebinding SMPP transceiver trunk ${trunkId}...`, 'info');
    setTimeout(() => {
      setTrunks((prev) =>
        prev.map((t) => (t.id === trunkId ? { ...t, status: 'BOUND' } : t))
      );
      onShowToast(`SMPP trunk ${trunkId} successfully re-bound.`, 'success');
    }, 1200);
  };

  const handleScaleWindow = (trunkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTrunks((prev) =>
      prev.map((t) => {
        if (t.id === trunkId) {
          const nextWindow = t.windowSize === 64 ? 32 : t.windowSize === 32 ? 16 : 64;
          return { ...t, windowSize: nextWindow };
        }
        return t;
      })
    );
    onShowToast(`Window size dynamically adjusted for ${trunkId}.`, 'info');
  };

  // Filtered List
  const filtered = trunks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.carrier.toLowerCase().includes(search.toLowerCase()) ||
      t.systemId.toLowerCase().includes(search.toLowerCase()) ||
      (t.rateLimitAction && t.rateLimitAction.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (rateLimitFilter === 'LIMITED') return t.rateLimitEnabled === true;
    if (rateLimitFilter === 'UNCAPPED') return !t.rateLimitEnabled;
    if (rateLimitFilter === 'THROTTLED') {
      return t.rateLimitEnabled && t.rateLimitPps && t.currentMps >= t.rateLimitPps;
    }
    return true;
  });

  // Fleet Statistics
  const totalCurrentMps = trunks.reduce((acc, t) => acc + t.currentMps, 0);
  const totalCapacity = trunks.reduce((acc, t) => acc + t.tpsLimit, 0);
  const activeRateLimitedCount = trunks.filter((t) => t.rateLimitEnabled).length;
  const totalConfiguredPps = trunks
    .filter((t) => t.rateLimitEnabled)
    .reduce((acc, t) => acc + (t.rateLimitPps || t.tpsLimit), 0);
  const totalThrottledPackets = trunks.reduce((acc, t) => acc + (t.throttledPackets || 0), 0);
  const activelyThrottlingCount = trunks.filter(
    (t) => t.rateLimitEnabled && t.rateLimitPps && t.currentMps >= t.rateLimitPps
  ).length;

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">TELECOM &amp; ROUTING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">SMPP TRANSCEIVER TRUNKS &amp; TRAFFIC SHAPING</span>
        </div>

        {/* Fleet Rate Limit Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleApplyConservativeCap}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[11px] font-code-metric text-[#dfe2ee] hover:bg-[#353942] hover:text-[#4cd7f6] transition-all"
            title="Enforce 80% PPS limit on all trunks to prevent carrier SLA breach"
          >
            <span className="material-symbols-outlined text-[15px] text-[#fbbf24]">shield</span>
            <span>80% Safe Cap (All)</span>
          </button>

          <button
            onClick={handleEnableAllRateLimits}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[11px] font-code-metric text-[#dfe2ee] hover:bg-[#353942] hover:text-[#4edea3] transition-all"
            title="Enable rate limiters across all 12 trunks"
          >
            <span className="material-symbols-outlined text-[15px] text-[#4edea3]">toggle_on</span>
            <span>Enable All Limiters</span>
          </button>

          <button
            onClick={handleBypassAllRateLimits}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[11px] font-code-metric text-[#bcc9cd] hover:bg-[#353942] hover:text-[#ffb4ab] transition-all"
            title="Bypass rate limiting on all trunks"
          >
            <span className="material-symbols-outlined text-[15px] text-[#ffb4ab]">lock_open</span>
            <span>Bypass All</span>
          </button>

          <button
            onClick={() => onShowToast('All 12 SMPP Enquire_Links verified in parallel.', 'success')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-bold text-[11px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">network_check</span>
            <span>Check All Links</span>
          </button>
        </div>
      </div>

      {/* Aggregate Capacity & Rate Limiting Telemetry Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-lg bg-[#1c2028] border border-[#3d494c] font-code-metric">
        <div>
          <span className="text-[10px] text-[#869397] uppercase block flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#4cd7f6]">speed</span>
            Aggregate Physical Capacity
          </span>
          <span className="text-[20px] font-bold text-[#4cd7f6]">
            {totalCapacity.toLocaleString()} <span className="text-[12px] font-normal text-[#bcc9cd]">TPS MAX</span>
          </span>
          <div className="text-[10px] text-[#869397] mt-0.5">
            Active Load: <strong className="text-[#4edea3]">{totalCurrentMps.toLocaleString()} MPS</strong> ({Math.round((totalCurrentMps / totalCapacity) * 100)}%)
          </div>
        </div>

        <div>
          <span className="text-[10px] text-[#869397] uppercase block flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#4edea3]">tune</span>
            Active PPS Rate Limiters
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold text-[#4edea3]">
              {activeRateLimitedCount} <span className="text-[12px] font-normal text-[#bcc9cd]">/ 12 Trunks</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30">
              Guarded
            </span>
          </div>
          <div className="text-[10px] text-[#869397] mt-0.5">
            Fleet Clamped Cap: <strong className="text-[#dfe2ee]">{totalConfiguredPps.toLocaleString()} PPS</strong>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-[#869397] uppercase block flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#fbbf24]">traffic</span>
            Throttled Traffic Events
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold text-[#fbbf24]">
              {totalThrottledPackets} <span className="text-[12px] font-normal text-[#bcc9cd]">PDUs</span>
            </span>
            {activelyThrottlingCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30 animate-pulse font-bold">
                {activelyThrottlingCount} Clamping
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30">
                0 Clamping
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#869397] mt-0.5">
            Action: ESME_RTHROTTLED &amp; Leaky Queue
          </div>
        </div>

        <div>
          <span className="text-[10px] text-[#869397] uppercase block flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#dfe2ee]">layers</span>
            Cluster Window Saturation
          </span>
          <div className="flex items-center justify-between">
            <span className="text-[20px] font-bold text-[#dfe2ee]">
              52.4% <span className="text-[12px] font-normal text-[#4edea3]">HEALTHY</span>
            </span>
          </div>
          <div className="w-full bg-[#0a0e16] rounded-full h-1.5 mt-1 overflow-hidden">
            <div className="h-full bg-[#4edea3] transition-all" style={{ width: '52.4%' }}></div>
          </div>
        </div>
      </div>

      {/* Search, Rate Limit Filters & Live Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-[#12161f] border border-[#293240] text-[11px] font-code-metric">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[15px] text-[#869397]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by trunk, carrier, system_id, or policy..."
              className="w-full h-8 pl-8 pr-3 rounded bg-[#0a0e16] border border-[#3d494c] text-[11px] text-[#dfe2ee] placeholder:text-[#869397] focus:outline-none focus:border-[#4cd7f6]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-[#869397] hover:text-[#dfe2ee]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded border border-[#3d494c] overflow-hidden text-[10.5px]">
            <button
              onClick={() => setRateLimitFilter('ALL')}
              className={`px-2.5 py-1 ${rateLimitFilter === 'ALL' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#181c24] text-[#bcc9cd] hover:text-[#dfe2ee]'}`}
            >
              All Trunks ({trunks.length})
            </button>
            <button
              onClick={() => setRateLimitFilter('LIMITED')}
              className={`px-2.5 py-1 border-l border-[#3d494c] ${rateLimitFilter === 'LIMITED' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#181c24] text-[#bcc9cd] hover:text-[#dfe2ee]'}`}
            >
              Rate Limited ({activeRateLimitedCount})
            </button>
            <button
              onClick={() => setRateLimitFilter('THROTTLED')}
              className={`px-2.5 py-1 border-l border-[#3d494c] ${rateLimitFilter === 'THROTTLED' ? 'bg-[#ffb4ab] text-[#4f0009] font-bold' : 'bg-[#181c24] text-[#bcc9cd] hover:text-[#dfe2ee]'}`}
            >
              Active Throttles ({activelyThrottlingCount})
            </button>
            <button
              onClick={() => setRateLimitFilter('UNCAPPED')}
              className={`px-2.5 py-1 border-l border-[#3d494c] ${rateLimitFilter === 'UNCAPPED' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#181c24] text-[#bcc9cd] hover:text-[#dfe2ee]'}`}
            >
              Uncapped ({trunks.length - activeRateLimitedCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#869397]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#4edea3]"></span> Nominal Under Limit
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#fbbf24]"></span> &gt;85% of Limit
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#ffb4ab]"></span> Active Clamping
          </span>
        </div>
      </div>

      {/* Main Trunks Table with Interactive Rate Limit Toggle & PPS Controls */}
      <div className="rounded-lg bg-[#1c2028] border border-[#3d494c] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#181c24] border-b border-[#3d494c] text-[10px] uppercase font-semibold text-[#869397] tracking-wider">
              <tr>
                <th className="p-3">Trunk / Carrier</th>
                <th className="p-3">System ID &amp; Mode</th>
                <th className="p-3">Throughput (MPS / Cap)</th>
                {/* Rate Limit Control Column */}
                <th className="p-3 bg-[#131b26] border-x border-[#293240] min-w-[250px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[#4cd7f6]">
                      <span className="material-symbols-outlined text-[14px]">tune</span>
                      Rate Limit Control (PPS)
                    </span>
                    <span className="text-[9px] text-[#869397] font-normal lowercase">toggle / set threshold</span>
                  </div>
                </th>
                <th className="p-3">Window</th>
                <th className="p-3">Ping</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3d494c] font-code-metric text-[12px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#869397] text-[12px]">
                    No carrier trunks match the selected search or rate limit filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isSelected = selectedTrunk?.id === t.id;
                  const isLimited = Boolean(t.rateLimitEnabled);
                  const ppsLimit = t.rateLimitPps || t.tpsLimit;
                  const isThrottling = isLimited && t.currentMps >= ppsLimit;
                  const isNearCap = isLimited && !isThrottling && t.currentMps >= ppsLimit * 0.85;
                  const headroom = Math.max(0, ppsLimit - t.currentMps);

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTrunkId(t.id)}
                      className={`hover:bg-[#262a33]/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#06b6d4]/10' : ''
                      }`}
                    >
                      {/* Trunk Name & Carrier */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isThrottling
                                ? 'bg-[#ffb4ab] animate-ping'
                                : t.status === 'BOUND'
                                ? 'bg-[#4edea3]'
                                : 'bg-[#fbbf24]'
                            }`}
                          ></span>
                          <span className="font-semibold text-[#dfe2ee]">{t.name}</span>
                        </div>
                        <div className="text-[10px] text-[#869397] font-body-md pl-4 flex items-center gap-2">
                          <span>{t.carrier}</span>
                          <span className="text-[#3d494c]">•</span>
                          <span>{t.region}</span>
                        </div>
                      </td>

                      {/* System ID & Mode */}
                      <td className="p-3">
                        <div className="text-[#4cd7f6]">{t.systemId}</div>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-[#0a0e16] border border-[#3d494c] text-[#bcc9cd]">
                          {t.mode}
                        </span>
                      </td>

                      {/* Throughput */}
                      <td className="p-3">
                        <div className="text-[#dfe2ee]">
                          <span className={`font-bold ${isThrottling ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                            {t.currentMps}
                          </span>{' '}
                          / {t.tpsLimit} TPS
                        </div>
                        <div className="w-24 h-1 rounded-full bg-[#0a0e16] mt-1 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isThrottling
                                ? 'bg-[#ffb4ab]'
                                : (t.currentMps / t.tpsLimit) > 0.85
                                ? 'bg-[#fbbf24]'
                                : 'bg-[#4edea3]'
                            }`}
                            style={{ width: `${Math.min(100, (t.currentMps / t.tpsLimit) * 100)}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Rate Limit Control Column (Toggle + Dynamic PPS Threshold + Quick Adjusters) */}
                      <td
                        className={`p-3 bg-[#131b26]/80 border-x border-[#293240] ${
                          isLimited ? 'border-l-[#4cd7f6]/40' : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isLimited}
                                onClick={(e) => handleToggleRateLimit(t.id, e)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isLimited ? 'bg-[#06b6d4] shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-[#262a33]'
                                }`}
                                title={isLimited ? 'Click to disable rate limiting' : 'Click to enable rate limiting'}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isLimited ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <span
                                className={`text-[10px] font-bold ${
                                  isLimited ? 'text-[#4cd7f6]' : 'text-[#869397]'
                                }`}
                              >
                                {isLimited ? 'ACTIVE' : 'OFF'}
                              </span>
                            </div>

                            {/* Configured Threshold Pill / Quick Edit */}
                            {isLimited ? (
                              <button
                                onClick={(e) => handleOpenEditModal(t, e)}
                                className="group flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a0e16] border border-[#4cd7f6]/40 text-[#4cd7f6] hover:bg-[#06b6d4]/15 hover:border-[#4cd7f6] transition-all text-[11px]"
                                title="Click to open PPS threshold configuration modal"
                              >
                                <span className="font-bold">{ppsLimit}</span>
                                <span className="text-[9.5px] text-[#bcc9cd]">PPS</span>
                                <span className="material-symbols-outlined text-[13px] opacity-70 group-hover:opacity-100">
                                  edit
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleOpenEditModal(t, e)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#869397] hover:text-[#dfe2ee] hover:border-[#869397] text-[10px]"
                                title="Configure rate limiter"
                              >
                                <span>Uncapped</span>
                                <span className="material-symbols-outlined text-[12px]">tune</span>
                              </button>
                            )}
                          </div>

                          {/* Rate Limit Status Bar & Headroom / Throttling telemetry */}
                          {isLimited ? (
                            <div className="flex items-center justify-between text-[9.5px]">
                              <div className="flex items-center gap-1.5">
                                {isThrottling ? (
                                  <span className="px-1.5 py-0.2 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30 font-bold animate-pulse">
                                    THROTTLED (+{t.currentMps - ppsLimit} PPS)
                                  </span>
                                ) : isNearCap ? (
                                  <span className="px-1.5 py-0.2 rounded bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30 font-bold">
                                    NEAR CAP ({headroom} PPS room)
                                  </span>
                                ) : (
                                  <span className="text-[#4edea3]">
                                    Nominal ({headroom} PPS headroom)
                                  </span>
                                )}
                              </div>

                              {/* Stepper Buttons for Quick +/- 25 PPS */}
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={(e) => handleQuickAdjustPps(t.id, -25, e)}
                                  className="h-4 w-4 flex items-center justify-center rounded bg-[#181c24] hover:bg-[#353942] text-[#bcc9cd] hover:text-[#dfe2ee] border border-[#3d494c] text-[10px]"
                                  title="Decrease limit by 25 PPS"
                                >
                                  -
                                </button>
                                <button
                                  onClick={(e) => handleQuickAdjustPps(t.id, 25, e)}
                                  className="h-4 w-4 flex items-center justify-center rounded bg-[#181c24] hover:bg-[#353942] text-[#bcc9cd] hover:text-[#dfe2ee] border border-[#3d494c] text-[10px]"
                                  title="Increase limit by 25 PPS"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[9.5px] text-[#869397] flex items-center justify-between">
                              <span>Full Line-Rate ({t.tpsLimit} TPS)</span>
                              <button
                                onClick={(e) => handleToggleRateLimit(t.id, e)}
                                className="text-[#4cd7f6] hover:underline"
                              >
                                Enable Limit
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Window */}
                      <td className="p-3">
                        <div className="text-[#dfe2ee]">{t.windowSize} slots</div>
                        <div className="text-[10px] text-[#869397]">{t.windowUtilization}% util</div>
                      </td>

                      {/* Ping */}
                      <td className="p-3">
                        <span className="text-[#4edea3]">{t.latencyMs}ms</span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Configure Rate Limit"
                            onClick={(e) => handleOpenEditModal(t, e)}
                            className="p-1 rounded hover:bg-[#353942] text-[#4cd7f6]"
                          >
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                          </button>
                          <button
                            title="Send Enquire_Link"
                            onClick={(e) => handleEnquireLink(t.id, e)}
                            className="p-1 rounded hover:bg-[#353942] text-[#4edea3]"
                          >
                            <span className="material-symbols-outlined text-[16px]">sync</span>
                          </button>
                          <button
                            title="Cycle Window Size"
                            onClick={(e) => handleScaleWindow(t.id, e)}
                            className="p-1 rounded hover:bg-[#353942] text-[#bcc9cd]"
                          >
                            <span className="material-symbols-outlined text-[16px]">view_carousel</span>
                          </button>
                          <button
                            title="Re-bind Trunk"
                            onClick={(e) => handleRebind(t.id, e)}
                            className="p-1 rounded hover:bg-[#353942] text-[#ffb4ab]"
                          >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Trunk Deep Telemetry & Traffic Shaping Inspector */}
      {selectedTrunk && (
        <div className="rounded-lg bg-[#141820] border border-[#3d494c] p-4 shadow-sm font-code-metric space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#293240] gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">traffic</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-[#dfe2ee]">
                    Traffic Shaper &amp; Rate Limit Telemetry: <span className="text-[#4cd7f6]">{selectedTrunk.name}</span>
                  </h3>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold border ${
                      selectedTrunk.rateLimitEnabled
                        ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                        : 'bg-[#262a33] text-[#869397] border-[#3d494c]'
                    }`}
                  >
                    {selectedTrunk.rateLimitEnabled ? 'LIMITER ENFORCED' : 'UNCAPPED (LINE RATE)'}
                  </span>
                </div>
                <div className="text-[10px] text-[#869397]">
                  Carrier: {selectedTrunk.carrier} • Ingress IP: {selectedTrunk.ipAddress} • System ID: {selectedTrunk.systemId}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleRateLimit(selectedTrunk.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold border transition-all ${
                  selectedTrunk.rateLimitEnabled
                    ? 'bg-[#ffb4ab]/15 border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/25'
                    : 'bg-[#06b6d4]/15 border-[#06b6d4]/30 text-[#4cd7f6] hover:bg-[#06b6d4]/25'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {selectedTrunk.rateLimitEnabled ? 'power_settings_new' : 'bolt'}
                </span>
                <span>{selectedTrunk.rateLimitEnabled ? 'Disable Rate Limit' : 'Enable Rate Limit'}</span>
              </button>

              <button
                onClick={() => handleOpenEditModal(selectedTrunk)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-bold text-[11px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">tune</span>
                <span>Configure PPS &amp; Policy</span>
              </button>
            </div>
          </div>

          {/* Real-Time Rate Limiter Gauge Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
            {/* Gauge 1: Current MPS vs PPS Threshold */}
            <div className="p-3 rounded bg-[#0a0e16] border border-[#293240] space-y-1">
              <span className="text-[#869397] text-[10px] uppercase block">Current Load vs PPS Threshold</span>
              <div className="flex items-baseline justify-between">
                <span className="text-[18px] font-bold text-[#dfe2ee]">
                  {selectedTrunk.currentMps} <span className="text-[11px] font-normal text-[#869397]">MPS</span>
                </span>
                <span className="text-[#4cd7f6] font-bold text-[13px]">
                  {selectedTrunk.rateLimitEnabled ? `${selectedTrunk.rateLimitPps || selectedTrunk.tpsLimit} PPS CAP` : `${selectedTrunk.tpsLimit} TPS MAX`}
                </span>
              </div>
              <div className="w-full bg-[#181c24] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    selectedTrunk.rateLimitEnabled && selectedTrunk.currentMps >= (selectedTrunk.rateLimitPps || selectedTrunk.tpsLimit)
                      ? 'bg-[#ffb4ab]'
                      : (selectedTrunk.currentMps / (selectedTrunk.rateLimitPps || selectedTrunk.tpsLimit)) > 0.85
                      ? 'bg-[#fbbf24]'
                      : 'bg-[#4edea3]'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedTrunk.currentMps / (selectedTrunk.rateLimitPps || selectedTrunk.tpsLimit)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Gauge 2: Rate Limit Policy */}
            <div className="p-3 rounded bg-[#0a0e16] border border-[#293240] space-y-1">
              <span className="text-[#869397] text-[10px] uppercase block">Overflow Action Policy</span>
              <div className="text-[13px] font-bold text-[#dfe2ee] truncate" title={selectedTrunk.rateLimitAction || 'REJECT_ESME_RTHROTTLED'}>
                {selectedTrunk.rateLimitAction === 'LEAKY_BUCKET_QUEUE'
                  ? 'Leaky Bucket Delay'
                  : selectedTrunk.rateLimitAction === 'SILENT_DROP'
                  ? 'Silent Packet Drop'
                  : selectedTrunk.rateLimitAction === 'LCR_FAILOVER'
                  ? 'LCR Dynamic Re-Route'
                  : 'ESME_RTHROTTLED (0x58)'}
              </div>
              <div className="text-[10px] text-[#869397]">
                Burst Allowance: <strong className="text-[#dfe2ee]">+{Math.max(0, (selectedTrunk.rateLimitBurst || 360) - (selectedTrunk.rateLimitPps || 300))} PPS</strong>
              </div>
            </div>

            {/* Gauge 3: Dynamic Threshold Quick Adjuster */}
            <div className="p-3 rounded bg-[#0a0e16] border border-[#293240] space-y-1">
              <span className="text-[#869397] text-[10px] uppercase block">Quick Threshold Stepper</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={() => handleQuickAdjustPps(selectedTrunk.id, -50)}
                  className="px-2 py-0.5 rounded bg-[#181c24] hover:bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] border border-[#3d494c] text-[10px]"
                >
                  -50
                </button>
                <button
                  onClick={() => handleQuickAdjustPps(selectedTrunk.id, -10)}
                  className="px-2 py-0.5 rounded bg-[#181c24] hover:bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] border border-[#3d494c] text-[10px]"
                >
                  -10
                </button>
                <button
                  onClick={() => handleQuickAdjustPps(selectedTrunk.id, 10)}
                  className="px-2 py-0.5 rounded bg-[#181c24] hover:bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] border border-[#3d494c] text-[10px]"
                >
                  +10
                </button>
                <button
                  onClick={() => handleQuickAdjustPps(selectedTrunk.id, 50)}
                  className="px-2 py-0.5 rounded bg-[#181c24] hover:bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] border border-[#3d494c] text-[10px]"
                >
                  +50
                </button>
              </div>
              <div className="text-[10px] text-[#869397]">
                Step limit without modal reload
              </div>
            </div>

            {/* Gauge 4: Cumulative Enforcement Stat */}
            <div className="p-3 rounded bg-[#0a0e16] border border-[#293240] space-y-1">
              <span className="text-[#869397] text-[10px] uppercase block">Enforcement Counter</span>
              <div className="text-[18px] font-bold text-[#fbbf24]">
                {selectedTrunk.throttledPackets || 0} <span className="text-[11px] font-normal text-[#bcc9cd]">PDUs Held / Clamped</span>
              </div>
              <div className="text-[10px] text-[#869397]">
                Window: {selectedTrunk.windowSize} slots ({selectedTrunk.windowUtilization}% util)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Rate Limit Configuration Modal */}
      {editingTrunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-lg bg-[#181c24] border border-[#3d494c] p-5 shadow-2xl space-y-4 font-code-metric">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[24px]">tune</span>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#dfe2ee]">
                    Configure SMPP Rate Limit (PPS)
                  </h3>
                  <div className="text-[11px] text-[#869397]">
                    Trunk: <strong className="text-[#dfe2ee]">{editingTrunk.name}</strong> ({editingTrunk.carrier})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingTrunk(null)}
                className="text-[#869397] hover:text-[#dfe2ee] text-[18px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Master Toggle */}
              <div className="p-3 rounded bg-[#12161f] border border-[#293240] flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-[#dfe2ee] flex items-center gap-1.5">
                    <span>Enable Dynamic PPS Limiter</span>
                    {modalEnabled ? (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#262a33] text-[#869397] border border-[#3d494c]">
                        DISABLED (UNCAPPED)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#869397] mt-0.5">
                    Clamp outbound submit_sm and enquire_link throughput to avoid upstream SMSC throttling.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={modalEnabled}
                  onClick={() => setModalEnabled(!modalEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    modalEnabled ? 'bg-[#06b6d4]' : 'bg-[#262a33]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      modalEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* PPS Threshold Slider & Input */}
              <div className={`space-y-2 transition-opacity ${modalEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center justify-between text-[11px]">
                  <label className="text-[#dfe2ee] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#4cd7f6]">speed</span>
                    Packets Per Second (PPS) Threshold:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={10}
                      max={editingTrunk.tpsLimit * 2}
                      value={modalPps}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setModalPps(val);
                        setModalBurst(Math.round(val * 1.2));
                      }}
                      className="w-20 bg-[#0a0e16] border border-[#3d494c] rounded px-2 py-0.5 text-right font-bold text-[#4cd7f6] outline-none text-[12px] focus:border-[#4cd7f6]"
                    />
                    <span className="text-[#869397] text-[11px]">PPS</span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={10}
                  max={Math.max(editingTrunk.tpsLimit * 1.5, 600)}
                  step={5}
                  value={modalPps}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setModalPps(val);
                    setModalBurst(Math.round(val * 1.2));
                  }}
                  className="w-full accent-[#06b6d4] bg-[#0a0e16] h-2 rounded cursor-pointer"
                />

                {/* Preset Quick Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.round(editingTrunk.tpsLimit * 0.5);
                      setModalPps(v);
                      setModalBurst(Math.round(v * 1.2));
                    }}
                    className="p-1 rounded bg-[#0a0e16] hover:bg-[#262a33] border border-[#293240] text-[#bcc9cd] hover:text-[#dfe2ee]"
                  >
                    50% ({Math.round(editingTrunk.tpsLimit * 0.5)} PPS)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.round(editingTrunk.tpsLimit * 0.75);
                      setModalPps(v);
                      setModalBurst(Math.round(v * 1.2));
                    }}
                    className="p-1 rounded bg-[#0a0e16] hover:bg-[#262a33] border border-[#293240] text-[#bcc9cd] hover:text-[#dfe2ee]"
                  >
                    75% ({Math.round(editingTrunk.tpsLimit * 0.75)} PPS)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.round(editingTrunk.tpsLimit * 0.9);
                      setModalPps(v);
                      setModalBurst(Math.round(v * 1.2));
                    }}
                    className="p-1 rounded bg-[#0a0e16] hover:bg-[#262a33] border border-[#4cd7f6]/40 text-[#4cd7f6]"
                  >
                    90% Safe ({Math.round(editingTrunk.tpsLimit * 0.9)} PPS)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const v = editingTrunk.tpsLimit;
                      setModalPps(v);
                      setModalBurst(Math.round(v * 1.2));
                    }}
                    className="p-1 rounded bg-[#0a0e16] hover:bg-[#262a33] border border-[#293240] text-[#bcc9cd] hover:text-[#dfe2ee]"
                  >
                    100% ({editingTrunk.tpsLimit} TPS)
                  </button>
                </div>
              </div>

              {/* Burst Tolerance */}
              <div className={`space-y-1 text-[11px] transition-opacity ${modalEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-[#bcc9cd]">Burst Ceiling Tolerance:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={modalPps}
                      max={modalPps * 2}
                      value={modalBurst}
                      onChange={(e) => setModalBurst(Number(e.target.value))}
                      className="w-20 bg-[#0a0e16] border border-[#3d494c] rounded px-2 py-0.5 text-right font-bold text-[#dfe2ee] outline-none text-[11px]"
                    />
                    <span className="text-[#869397] text-[11px]">PPS Peak</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#869397]">
                  Allows transient micro-bursts up to +{Math.max(0, modalBurst - modalPps)} PPS before dropping or buffering.
                </p>
              </div>

              {/* Overflow Action Policy Selector */}
              <div className={`space-y-1.5 text-[11px] transition-opacity ${modalEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <label className="text-[#dfe2ee] font-semibold block">Overflow / Congestion Policy:</label>
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <label
                    className={`p-2 rounded border cursor-pointer flex flex-col gap-0.5 transition-all ${
                      modalAction === 'REJECT_ESME_RTHROTTLED'
                        ? 'bg-[#06b6d4]/10 border-[#4cd7f6] text-[#dfe2ee]'
                        : 'bg-[#12161f] border-[#293240] text-[#869397] hover:border-[#3d494c]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="policy"
                      value="REJECT_ESME_RTHROTTLED"
                      checked={modalAction === 'REJECT_ESME_RTHROTTLED'}
                      onChange={() => setModalAction('REJECT_ESME_RTHROTTLED')}
                      className="sr-only"
                    />
                    <div className="font-bold text-[#4cd7f6]">ESME_RTHROTTLED</div>
                    <div className="text-[9.5px]">Return standard 0x00000058 status to client</div>
                  </label>

                  <label
                    className={`p-2 rounded border cursor-pointer flex flex-col gap-0.5 transition-all ${
                      modalAction === 'LEAKY_BUCKET_QUEUE'
                        ? 'bg-[#06b6d4]/10 border-[#4cd7f6] text-[#dfe2ee]'
                        : 'bg-[#12161f] border-[#293240] text-[#869397] hover:border-[#3d494c]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="policy"
                      value="LEAKY_BUCKET_QUEUE"
                      checked={modalAction === 'LEAKY_BUCKET_QUEUE'}
                      onChange={() => setModalAction('LEAKY_BUCKET_QUEUE')}
                      className="sr-only"
                    />
                    <div className="font-bold text-[#4edea3]">Leaky Bucket Delay</div>
                    <div className="text-[9.5px]">Queue burst packets (smooth transit &lt;250ms)</div>
                  </label>

                  <label
                    className={`p-2 rounded border cursor-pointer flex flex-col gap-0.5 transition-all ${
                      modalAction === 'LCR_FAILOVER'
                        ? 'bg-[#06b6d4]/10 border-[#4cd7f6] text-[#dfe2ee]'
                        : 'bg-[#12161f] border-[#293240] text-[#869397] hover:border-[#3d494c]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="policy"
                      value="LCR_FAILOVER"
                      checked={modalAction === 'LCR_FAILOVER'}
                      onChange={() => setModalAction('LCR_FAILOVER')}
                      className="sr-only"
                    />
                    <div className="font-bold text-[#fbbf24]">LCR Reroute</div>
                    <div className="text-[9.5px]">Forward overflow to secondary carrier route</div>
                  </label>

                  <label
                    className={`p-2 rounded border cursor-pointer flex flex-col gap-0.5 transition-all ${
                      modalAction === 'SILENT_DROP'
                        ? 'bg-[#06b6d4]/10 border-[#4cd7f6] text-[#dfe2ee]'
                        : 'bg-[#12161f] border-[#293240] text-[#869397] hover:border-[#3d494c]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="policy"
                      value="SILENT_DROP"
                      checked={modalAction === 'SILENT_DROP'}
                      onChange={() => setModalAction('SILENT_DROP')}
                      className="sr-only"
                    />
                    <div className="font-bold text-[#ffb4ab]">Silent Drop</div>
                    <div className="text-[9.5px]">Hard discard to protect downstream links</div>
                  </label>
                </div>
              </div>

              {/* Live Preview Simulation Bar */}
              <div className="p-3 rounded bg-[#0a0e16] border border-[#293240] space-y-1 text-[10.5px]">
                <div className="flex items-center justify-between text-[#869397]">
                  <span>Current Load: <strong className="text-[#dfe2ee]">{editingTrunk.currentMps} MPS</strong></span>
                  <span>Configured Limit: <strong className="text-[#4cd7f6]">{modalEnabled ? `${modalPps} PPS` : 'UNCAPPED'}</strong></span>
                </div>
                {modalEnabled && (
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-[#869397]">Projected Headroom:</span>
                    <span className={editingTrunk.currentMps > modalPps ? 'text-[#ffb4ab] font-bold' : 'text-[#4edea3] font-bold'}>
                      {editingTrunk.currentMps > modalPps
                        ? `Exceeded by +${editingTrunk.currentMps - modalPps} PPS (Clamping Active)`
                        : `+${modalPps - editingTrunk.currentMps} PPS Available`}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3d494c]">
                <button
                  type="button"
                  onClick={() => setEditingTrunk(null)}
                  className="px-3 py-1.5 rounded bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-bold text-[11px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
                >
                  Apply Rate Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
