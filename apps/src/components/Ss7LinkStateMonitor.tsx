import React, { useState, useEffect, useMemo } from 'react';

export type Ss7LinkStatus = 
  | 'IN_SERVICE' 
  | 'ALIGNING' 
  | 'CONGESTED' 
  | 'INHIBITED' 
  | 'OUT_OF_SERVICE';

export type SpcAvailability = 
  | 'ACCESSIBLE' 
  | 'RESTRICTED' 
  | 'PROHIBITED';

export interface SignalingLink {
  slc: number; // Signaling Link Code 0..15
  linkName: string;
  status: Ss7LinkStatus;
  msuRate: number; // Message Signal Units / sec
  erlangLoad: number; // 0.00 to 1.00
  retransBufferUtil: number; // percentage
  bitErrorRate: string; // e.g. 1.2e-7
  sctpPathAPing: number; // ms
  sctpPathBPing: number; // ms
  activePath: 'PATH_A' | 'PATH_B';
  changeoverActive?: boolean;
}

export interface Ss7Linkset {
  id: string;
  linksetName: string;
  localSpc: string; // e.g. "3-042-1"
  remoteSpc: string; // e.g. "3-042-2"
  remoteNodeName: string;
  carrier: string;
  nodeType: 'STP' | 'SMSC_GW' | 'HLR_HSS' | 'MSC_VLR';
  protocolVariant: 'ITU-T (14-bit)' | 'ANSI (24-bit)' | 'TTC (16-bit)';
  spcAvailability: SpcAvailability;
  routingContext: string;
  combinedCapacityMsu: number;
  currentMsuRate: number;
  links: SignalingLink[];
}

interface Ss7LinkStateMonitorProps {
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const INITIAL_LINKSETS: Ss7Linkset[] = [
  {
    id: 'ls-bics-fra',
    linksetName: 'LS-BICS-FRA01',
    localSpc: '3-042-1',
    remoteSpc: '3-042-2',
    remoteNodeName: 'BICS STP Frankfurt Hub',
    carrier: 'Belgacom ICS / Deutsche Telekom D1',
    nodeType: 'STP',
    protocolVariant: 'ITU-T (14-bit)',
    spcAvailability: 'ACCESSIBLE',
    routingContext: '0x00000001',
    combinedCapacityMsu: 12000,
    currentMsuRate: 4180,
    links: [
      { slc: 0, linkName: 'SLC-00 (Primary)', status: 'IN_SERVICE', msuRate: 1120, erlangLoad: 0.38, retransBufferUtil: 2, bitErrorRate: '< 1e-9', sctpPathAPing: 11.2, sctpPathBPing: 11.8, activePath: 'PATH_A' },
      { slc: 1, linkName: 'SLC-01 (Secondary)', status: 'IN_SERVICE', msuRate: 1040, erlangLoad: 0.35, retransBufferUtil: 1, bitErrorRate: '< 1e-9', sctpPathAPing: 11.4, sctpPathBPing: 12.0, activePath: 'PATH_A' },
      { slc: 2, linkName: 'SLC-02 (Alternate)', status: 'IN_SERVICE', msuRate: 1010, erlangLoad: 0.34, retransBufferUtil: 3, bitErrorRate: '< 1e-9', sctpPathAPing: 11.3, sctpPathBPing: 11.9, activePath: 'PATH_A' },
      { slc: 3, linkName: 'SLC-03 (Backup)', status: 'IN_SERVICE', msuRate: 1010, erlangLoad: 0.34, retransBufferUtil: 1, bitErrorRate: '< 1e-9', sctpPathAPing: 11.5, sctpPathBPing: 12.1, activePath: 'PATH_B' },
    ],
  },
  {
    id: 'ls-syniverse-tpa',
    linksetName: 'LS-SYN-TPA02',
    localSpc: '3-042-1',
    remoteSpc: '3-042-3',
    remoteNodeName: 'Syniverse STP Tampa East',
    carrier: 'Syniverse Technologies Interconnect',
    nodeType: 'STP',
    protocolVariant: 'ANSI (24-bit)',
    spcAvailability: 'ACCESSIBLE',
    routingContext: '0x00000002',
    combinedCapacityMsu: 16000,
    currentMsuRate: 6320,
    links: [
      { slc: 0, linkName: 'SLC-00 (Main-A)', status: 'IN_SERVICE', msuRate: 1620, erlangLoad: 0.44, retransBufferUtil: 4, bitErrorRate: '< 1e-9', sctpPathAPing: 14.2, sctpPathBPing: 14.8, activePath: 'PATH_A' },
      { slc: 1, linkName: 'SLC-01 (Main-B)', status: 'IN_SERVICE', msuRate: 1580, erlangLoad: 0.42, retransBufferUtil: 2, bitErrorRate: '< 1e-9', sctpPathAPing: 14.5, sctpPathBPing: 15.1, activePath: 'PATH_A' },
      { slc: 2, linkName: 'SLC-02 (Div-A)', status: 'IN_SERVICE', msuRate: 1540, erlangLoad: 0.41, retransBufferUtil: 3, bitErrorRate: '< 1e-9', sctpPathAPing: 14.1, sctpPathBPing: 14.9, activePath: 'PATH_A' },
      { slc: 3, linkName: 'SLC-03 (Div-B)', status: 'CONGESTED', msuRate: 1580, erlangLoad: 0.79, retransBufferUtil: 68, bitErrorRate: '2.1e-7', sctpPathAPing: 38.6, sctpPathBPing: 42.1, activePath: 'PATH_B' },
    ],
  },
  {
    id: 'ls-tata-sg',
    linksetName: 'LS-TATA-SIN01',
    localSpc: '3-042-1',
    remoteSpc: '4-110-1',
    remoteNodeName: 'Tata Communications SG Gateway',
    carrier: 'Tata Comm / Singtel International',
    nodeType: 'SMSC_GW',
    protocolVariant: 'ITU-T (14-bit)',
    spcAvailability: 'ACCESSIBLE',
    routingContext: '0x00000003',
    combinedCapacityMsu: 8000,
    currentMsuRate: 2840,
    links: [
      { slc: 0, linkName: 'SLC-00 (East-A)', status: 'IN_SERVICE', msuRate: 1440, erlangLoad: 0.48, retransBufferUtil: 2, bitErrorRate: '< 1e-9', sctpPathAPing: 42.1, sctpPathBPing: 43.4, activePath: 'PATH_A' },
      { slc: 1, linkName: 'SLC-01 (East-B)', status: 'IN_SERVICE', msuRate: 1400, erlangLoad: 0.46, retransBufferUtil: 3, bitErrorRate: '< 1e-9', sctpPathAPing: 42.5, sctpPathBPing: 44.0, activePath: 'PATH_A' },
    ],
  },
  {
    id: 'ls-vodafone-lon',
    linksetName: 'LS-VODA-LON01',
    localSpc: '3-042-1',
    remoteSpc: '2-014-5',
    remoteNodeName: 'Vodafone UK Core STP',
    carrier: 'Vodafone Enterprise Global',
    nodeType: 'STP',
    protocolVariant: 'ITU-T (14-bit)',
    spcAvailability: 'ACCESSIBLE',
    routingContext: '0x00000004',
    combinedCapacityMsu: 10000,
    currentMsuRate: 3120,
    links: [
      { slc: 0, linkName: 'SLC-00 (LON-1)', status: 'IN_SERVICE', msuRate: 1580, erlangLoad: 0.42, retransBufferUtil: 1, bitErrorRate: '< 1e-9', sctpPathAPing: 16.4, sctpPathBPing: 17.1, activePath: 'PATH_A' },
      { slc: 1, linkName: 'SLC-01 (LON-2)', status: 'IN_SERVICE', msuRate: 1540, erlangLoad: 0.40, retransBufferUtil: 2, bitErrorRate: '< 1e-9', sctpPathAPing: 16.8, sctpPathBPing: 17.5, activePath: 'PATH_A' },
    ],
  },
  {
    id: 'ls-telekom-d1',
    linksetName: 'LS-DTAG-BON01',
    localSpc: '3-042-1',
    remoteSpc: '2-068-4',
    remoteNodeName: 'Deutsche Telekom D1 SMS-C',
    carrier: 'Deutsche Telekom AG',
    nodeType: 'SMSC_GW',
    protocolVariant: 'ITU-T (14-bit)',
    spcAvailability: 'ACCESSIBLE',
    routingContext: '0x00000005',
    combinedCapacityMsu: 8000,
    currentMsuRate: 2420,
    links: [
      { slc: 0, linkName: 'SLC-00 (D1-A)', status: 'IN_SERVICE', msuRate: 1220, erlangLoad: 0.36, retransBufferUtil: 1, bitErrorRate: '< 1e-9', sctpPathAPing: 18.2, sctpPathBPing: 18.9, activePath: 'PATH_A' },
      { slc: 1, linkName: 'SLC-01 (D1-B)', status: 'INHIBITED', msuRate: 1200, erlangLoad: 0.05, retransBufferUtil: 0, bitErrorRate: '< 1e-9', sctpPathAPing: 18.4, sctpPathBPing: 19.1, activePath: 'PATH_B' },
    ],
  },
  {
    id: 'ls-claro-latam',
    linksetName: 'LS-CLARO-BRA01',
    localSpc: '3-042-1',
    remoteSpc: '6-080-2',
    remoteNodeName: 'Claro Brasil HLR Cluster',
    carrier: 'América Móvil / Claro LATAM',
    nodeType: 'HLR_HSS',
    protocolVariant: 'ITU-T (14-bit)',
    spcAvailability: 'ACCESSIBLE',
    routingContext: '0x00000006',
    combinedCapacityMsu: 6000,
    currentMsuRate: 1450,
    links: [
      { slc: 0, linkName: 'SLC-00 (GRU-1)', status: 'IN_SERVICE', msuRate: 740, erlangLoad: 0.28, retransBufferUtil: 2, bitErrorRate: '< 1e-9', sctpPathAPing: 68.2, sctpPathBPing: 70.1, activePath: 'PATH_A' },
      { slc: 1, linkName: 'SLC-01 (GRU-2)', status: 'IN_SERVICE', msuRate: 710, erlangLoad: 0.26, retransBufferUtil: 3, bitErrorRate: '< 1e-9', sctpPathAPing: 68.9, sctpPathBPing: 71.0, activePath: 'PATH_A' },
    ],
  },
];

export const Ss7LinkStateMonitor: React.FC<Ss7LinkStateMonitorProps> = ({ onShowToast }) => {
  const [linksets, setLinksets] = useState<Ss7Linkset[]>(INITIAL_LINKSETS);
  const [selectedLinksetId, setSelectedLinksetId] = useState<string>(INITIAL_LINKSETS[0].id);
  const [selectedSlc, setSelectedSlc] = useState<number | null>(0);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_SERVICE' | 'DEGRADED'>('ALL');

  // Real-time jitter for MSU and SCTP heartbeat pings
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      setLinksets((prev) =>
        prev.map((ls) => {
          const updatedLinks = ls.links.map((link) => {
            if (link.status === 'OUT_OF_SERVICE') return link;

            const msuJitter = Math.round((Math.random() - 0.48) * 35);
            const newMsuRate = Math.max(100, link.msuRate + msuJitter);
            const pingJitter = (Math.random() - 0.5) * 0.8;
            const newPingA = Math.max(5, parseFloat((link.sctpPathAPing + pingJitter).toFixed(1)));
            const newPingB = Math.max(5, parseFloat((link.sctpPathBPing + pingJitter).toFixed(1)));

            return {
              ...link,
              msuRate: newMsuRate,
              sctpPathAPing: newPingA,
              sctpPathBPing: newPingB,
            };
          });

          const totalMsu = updatedLinks.reduce((acc, l) => acc + (l.status === 'OUT_OF_SERVICE' ? 0 : l.msuRate), 0);

          return {
            ...ls,
            currentMsuRate: totalMsu,
            links: updatedLinks,
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Selected linkset object
  const activeLinkset = useMemo(() => {
    return linksets.find((ls) => ls.id === selectedLinksetId) || linksets[0];
  }, [linksets, selectedLinksetId]);

  // Selected link object within selected linkset
  const activeLink = useMemo(() => {
    if (selectedSlc === null) return activeLinkset.links[0];
    return activeLinkset.links.find((l) => l.slc === selectedSlc) || activeLinkset.links[0];
  }, [activeLinkset, selectedSlc]);

  // Overall SS7 Fleet Statistics
  const fleetStats = useMemo(() => {
    const totalLinksets = linksets.length;
    let totalLinks = 0;
    let inServiceLinks = 0;
    let congestedLinks = 0;
    let oosLinks = 0;
    let inhibitedLinks = 0;
    let totalMsu = 0;

    linksets.forEach((ls) => {
      totalMsu += ls.currentMsuRate;
      ls.links.forEach((l) => {
        totalLinks++;
        if (l.status === 'IN_SERVICE') inServiceLinks++;
        else if (l.status === 'CONGESTED') congestedLinks++;
        else if (l.status === 'OUT_OF_SERVICE') oosLinks++;
        else if (l.status === 'INHIBITED') inhibitedLinks++;
      });
    });

    const availabilityPercent = ((inServiceLinks / (totalLinks || 1)) * 100).toFixed(1);

    return {
      totalLinksets,
      totalLinks,
      inServiceLinks,
      congestedLinks,
      oosLinks,
      inhibitedLinks,
      totalMsu,
      availabilityPercent,
    };
  }, [linksets]);

  // Color mapping for link status
  const getStatusBadge = (status: Ss7LinkStatus) => {
    switch (status) {
      case 'IN_SERVICE':
        return {
          label: 'IN SERVICE (IS)',
          color: '#10b981',
          bg: '#10b98115',
          border: '#10b98140',
          dot: 'bg-[#10b981]',
        };
      case 'ALIGNING':
        return {
          label: 'ALIGNING (PROVING)',
          color: '#f59e0b',
          bg: '#f59e0b15',
          border: '#f59e0b40',
          dot: 'bg-[#f59e0b] animate-ping',
        };
      case 'CONGESTED':
        return {
          label: 'CONGESTED (CONG-1)',
          color: '#f97316',
          bg: '#f9731615',
          border: '#f9731640',
          dot: 'bg-[#f97316] animate-pulse',
        };
      case 'INHIBITED':
        return {
          label: 'INHIBITED (MNGMT)',
          color: '#06b6d4',
          bg: '#06b6d415',
          border: '#06b6d440',
          dot: 'bg-[#06b6d4]',
        };
      case 'OUT_OF_SERVICE':
      default:
        return {
          label: 'OUT OF SERVICE (OOS)',
          color: '#ef4444',
          bg: '#ef444415',
          border: '#ef444440',
          dot: 'bg-[#ef4444] animate-ping',
        };
    }
  };

  // Color mapping for Point Code availability
  const getSpcBadge = (avail: SpcAvailability) => {
    switch (avail) {
      case 'ACCESSIBLE':
        return { label: 'ACCESSIBLE (ALLOWED)', color: '#4edea3', bg: '#4edea315', border: '#4edea330' };
      case 'RESTRICTED':
        return { label: 'RESTRICTED (TFR)', color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b30' };
      case 'PROHIBITED':
      default:
        return { label: 'PROHIBITED (TFP)', color: '#ef4444', bg: '#ef444415', border: '#ef444430' };
    }
  };

  // Action: Trigger MTP3 Changeover (Force Link Out of Service)
  const handleSimulateChangeover = (linksetId: string, slc: number) => {
    setLinksets((prev) =>
      prev.map((ls) => {
        if (ls.id === linksetId) {
          const updatedLinks = ls.links.map((link) => {
            if (link.slc === slc) {
              const isCurrentlyOos = link.status === 'OUT_OF_SERVICE';
              return {
                ...link,
                status: isCurrentlyOos ? ('IN_SERVICE' as Ss7LinkStatus) : ('OUT_OF_SERVICE' as Ss7LinkStatus),
                changeoverActive: !isCurrentlyOos,
                retransBufferUtil: isCurrentlyOos ? 2 : 0,
              };
            }
            return link;
          });

          // Check if any link remains in service
          const anyUp = updatedLinks.some((l) => l.status === 'IN_SERVICE');

          return {
            ...ls,
            spcAvailability: anyUp ? 'ACCESSIBLE' : 'PROHIBITED',
            links: updatedLinks,
          };
        }
        return ls;
      })
    );

    if (onShowToast) {
      onShowToast(
        `MTP3 Changeover (COO/COA) executed on ${activeLinkset.linksetName} SLC-${slc}. Buffer drained to alternate link.`,
        'warning'
      );
    }
  };

  // Action: Toggle Link Management Inhibit
  const handleToggleInhibit = (linksetId: string, slc: number) => {
    setLinksets((prev) =>
      prev.map((ls) => {
        if (ls.id === linksetId) {
          return {
            ...ls,
            links: ls.links.map((l) => {
              if (l.slc === slc) {
                const nextStatus: Ss7LinkStatus = l.status === 'INHIBITED' ? 'IN_SERVICE' : 'INHIBITED';
                return { ...l, status: nextStatus };
              }
              return l;
            }),
          };
        }
        return ls;
      })
    );

    if (onShowToast) {
      onShowToast(`MTP3 Management Inhibit status toggled for SLC-${slc}.`, 'info');
    }
  };

  // Action: Send Route Set Test (RST)
  const handleSendRst = (linkset: Ss7Linkset) => {
    if (onShowToast) {
      onShowToast(
        `MTP3 Route Set Test (RST) PDU dispatched to remote SPC ${linkset.remoteSpc}. Received Transfer Allowed (TFA) ACK in 8.4ms.`,
        'success'
      );
    }
  };

  // Action: Recalibrate all links to nominal state
  const handleRecalibrate = () => {
    setLinksets(INITIAL_LINKSETS);
    if (onShowToast) {
      onShowToast('All SS7 signaling point codes and linksets restored to nominal state.', 'info');
    }
  };

  // Filtered Linksets
  const displayedLinksets = useMemo(() => {
    if (statusFilter === 'IN_SERVICE') {
      return linksets.filter((ls) => ls.links.every((l) => l.status === 'IN_SERVICE'));
    }
    if (statusFilter === 'DEGRADED') {
      return linksets.filter((ls) =>
        ls.links.some((l) => l.status !== 'IN_SERVICE') || ls.spcAvailability !== 'ACCESSIBLE'
      );
    }
    return linksets;
  }, [linksets, statusFilter]);

  return (
    <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col w-full relative">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#3d494c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">hub</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">
              SS7 Link State Monitor &amp; Signaling Point Code Grid
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-code-metric bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
              ITU-T Q.704 MTP3 ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-[#bcc9cd] mt-0.5">
            Real-time matrix monitor verifying Signaling Point Code (SPC) accessibility, MTP3 linksets, and SCTP multi-homed path alignments.
          </p>
        </div>

        {/* Action Buttons & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="inline-flex p-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[11px] font-code-metric">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                statusFilter === 'ALL'
                  ? 'bg-[#06b6d4] text-[#00424f] font-semibold'
                  : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              All Linksets ({linksets.length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_SERVICE')}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                statusFilter === 'IN_SERVICE'
                  ? 'bg-[#06b6d4] text-[#00424f] font-semibold'
                  : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              All In-Service
            </button>
            <button
              onClick={() => setStatusFilter('DEGRADED')}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                statusFilter === 'DEGRADED'
                  ? 'bg-[#06b6d4] text-[#00424f] font-semibold'
                  : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              Degraded / Congested
            </button>
          </div>

          {/* Pause / Resume Ticker */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`p-1.5 rounded border text-[13px] flex items-center justify-center transition-all ${
              isLiveActive
                ? 'bg-[#181c24] border-[#3d494c] text-[#4edea3] hover:bg-[#262a33]'
                : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
            }`}
            title={isLiveActive ? 'Pause real-time telemetry' : 'Resume real-time telemetry'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isLiveActive ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Recalibrate / Reset Button */}
          <button
            onClick={handleRecalibrate}
            className="p-1.5 rounded bg-[#181c24] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
            title="Recalibrate all linksets to nominal in-service state"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Fleet KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4 font-code-metric text-[11px]">
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col justify-between">
          <span className="text-[#869397] text-[10px]">LOCAL SPC (HOST)</span>
          <span className="font-bold text-[#4cd7f6] text-[13px]">3-042-1 (14-bit)</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col justify-between">
          <span className="text-[#869397] text-[10px]">TOTAL LINKSETS</span>
          <span className="font-bold text-[#dfe2ee] text-[13px]">{fleetStats.totalLinksets} Linksets Bound</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col justify-between">
          <span className="text-[#869397] text-[10px]">SIGNALING LINKS</span>
          <span className="font-bold text-[#4edea3] text-[13px]">{fleetStats.inServiceLinks} / {fleetStats.totalLinks} In-Service</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col justify-between">
          <span className="text-[#869397] text-[10px]">CONGESTION LEVEL</span>
          <span className={`font-bold text-[13px] ${fleetStats.congestedLinks > 0 ? 'text-[#f97316]' : 'text-[#4edea3]'}`}>
            {fleetStats.congestedLinks} Alerting
          </span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col justify-between">
          <span className="text-[#869397] text-[10px]">OOS / INHIBITED</span>
          <span className={`font-bold text-[13px] ${fleetStats.oosLinks > 0 ? 'text-[#ef4444]' : 'text-[#869397]'}`}>
            {fleetStats.oosLinks} OOS • {fleetStats.inhibitedLinks} Inh
          </span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col justify-between">
          <span className="text-[#869397] text-[10px]">FLEET MSU LOAD</span>
          <span className="font-bold text-[#4cd7f6] text-[13px] tabular-nums">{fleetStats.totalMsu.toLocaleString()} MSU/s</span>
        </div>
      </div>

      {/* Main Grid: Color-Coded Linksets Status Grid (Left) + Focused Linkset & SLC Diagnostics (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Color-Coded Linkset Matrix (7 cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#3d494c]/60 text-[12px]">
            <span className="font-semibold text-[#dfe2ee]">Signaling Point Code &amp; Linkset Status Grid</span>
            <span className="text-[10px] font-code-metric text-[#869397]">
              Click a card to inspect MTP3 link state
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedLinksets.map((ls) => {
              const isSelected = selectedLinksetId === ls.id;
              const spcBadge = getSpcBadge(ls.spcAvailability);
              const anyOos = ls.links.some((l) => l.status === 'OUT_OF_SERVICE');
              const anyCongested = ls.links.some((l) => l.status === 'CONGESTED');

              return (
                <div
                  key={ls.id}
                  onClick={() => {
                    setSelectedLinksetId(ls.id);
                    setSelectedSlc(ls.links[0]?.slc ?? 0);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1e2430] border-[#4cd7f6] shadow-[0_0_15px_rgba(76,215,246,0.15)]'
                      : 'bg-[#151b24] border-[#3d494c] hover:border-[#869397] hover:bg-[#181f2a]'
                  }`}
                >
                  {/* Top Bar: Remote SPC & Type */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#dfe2ee] font-code-metric">
                          {ls.linksetName}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0a0e16] border border-[#3d494c] text-[#4cd7f6] font-code-metric">
                          {ls.nodeType}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#869397] truncate max-w-[200px]" title={ls.remoteNodeName}>
                        {ls.remoteNodeName}
                      </div>
                    </div>

                    <div className="text-right font-code-metric">
                      <div className="text-[12px] font-bold text-[#4cd7f6]">{ls.remoteSpc}</div>
                      <span
                        className="inline-block text-[8.5px] px-1.5 py-0.2 rounded font-bold"
                        style={{
                          backgroundColor: spcBadge.bg,
                          color: spcBadge.color,
                          borderColor: spcBadge.border,
                        }}
                      >
                        {ls.spcAvailability}
                      </span>
                    </div>
                  </div>

                  {/* Route Point Code Flow */}
                  <div className="flex items-center justify-between py-1 px-2 rounded bg-[#0a0e16] border border-[#232d3d] text-[10px] font-code-metric mb-2.5">
                    <span className="text-[#869397]">
                      L: <strong className="text-[#dfe2ee]">{ls.localSpc}</strong>
                    </span>
                    <span className="material-symbols-outlined text-[13px] text-[#4cd7f6]">multiple_stop</span>
                    <span className="text-[#869397]">
                      R: <strong className="text-[#4cd7f6]">{ls.remoteSpc}</strong>
                    </span>
                    <span className="text-[#869397]">
                      RC: <span className="text-[#dfe2ee]">{ls.routingContext}</span>
                    </span>
                  </div>

                  {/* SLC Link State Grid Block */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-code-metric text-[#869397] mb-1">
                      <span>SLIGNALING LINKS ({ls.links.length} SLCs)</span>
                      <span className="text-[#dfe2ee]">{ls.currentMsuRate.toLocaleString()} MSU/s</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {ls.links.map((link) => {
                        const badge = getStatusBadge(link.status);
                        const isLinkSelected = isSelected && selectedSlc === link.slc;

                        return (
                          <div
                            key={link.slc}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLinksetId(ls.id);
                              setSelectedSlc(link.slc);
                            }}
                            className={`p-1.5 rounded border text-center font-code-metric transition-all ${
                              isLinkSelected
                                ? 'border-[#ffffff] ring-1 ring-[#ffffff]'
                                : 'border-[#3d494c]/80'
                            }`}
                            style={{ backgroundColor: badge.bg }}
                            title={`${link.linkName}: ${badge.label} (${link.msuRate} MSU/s)`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}></span>
                              <span className="text-[10px] font-bold" style={{ color: badge.color }}>
                                SLC-{link.slc}
                              </span>
                            </div>
                            <div className="text-[8.5px] text-[#bcc9cd] truncate mt-0.5">
                              {link.status === 'OUT_OF_SERVICE' ? 'OOS' : `${link.msuRate}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Footer Alert if not in service */}
                  {(anyOos || anyCongested) && (
                    <div className="mt-2.5 pt-1.5 border-t border-[#3d494c]/60 flex items-center justify-between text-[9.5px] font-code-metric">
                      <span className="flex items-center gap-1 text-[#f97316]">
                        <span className="material-symbols-outlined text-[13px]">warning</span>
                        <span>{anyOos ? 'MTP3 Changeover Engaged' : 'Buffer Congestion Detected'}</span>
                      </span>
                      <span className="text-[#869397]">Auto-Failover Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="p-3 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-wrap items-center justify-between gap-3 text-[10px] font-code-metric">
            <span className="text-[#869397] uppercase">Link States:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#10b981]">
                <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
                In Service (IS)
              </span>
              <span className="flex items-center gap-1.5 text-[#f59e0b]">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
                Aligning (Proving)
              </span>
              <span className="flex items-center gap-1.5 text-[#f97316]">
                <span className="h-2 w-2 rounded-full bg-[#f97316]"></span>
                Congested (CONG-1)
              </span>
              <span className="flex items-center gap-1.5 text-[#06b6d4]">
                <span className="h-2 w-2 rounded-full bg-[#06b6d4]"></span>
                Inhibited (MNGMT)
              </span>
              <span className="flex items-center gap-1.5 text-[#ef4444]">
                <span className="h-2 w-2 rounded-full bg-[#ef4444]"></span>
                Out of Service (OOS)
              </span>
            </div>
          </div>
        </div>

        {/* Focused Linkset & Signaling Link Diagnostics (5 cols) */}
        <div className="xl:col-span-5 rounded-lg bg-[#151b24] border border-[#3d494c] p-4 flex flex-col justify-between">
          <div>
            {/* Header of Detail Pane */}
            <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#3d494c]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#dfe2ee]">
                    {activeLinkset.linksetName}
                  </span>
                  <span className="text-[10px] font-code-metric px-1.5 py-0.5 rounded bg-[#0a0e16] text-[#4cd7f6] border border-[#3d494c]">
                    {activeLinkset.protocolVariant}
                  </span>
                </div>
                <div className="text-[11px] text-[#bcc9cd] mt-0.5">
                  {activeLinkset.carrier} • {activeLinkset.remoteNodeName}
                </div>
              </div>

              <div className="text-right font-code-metric">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold border"
                  style={{
                    backgroundColor: getSpcBadge(activeLinkset.spcAvailability).bg,
                    borderColor: getSpcBadge(activeLinkset.spcAvailability).border,
                    color: getSpcBadge(activeLinkset.spcAvailability).color,
                  }}
                >
                  {activeLinkset.spcAvailability}
                </span>
              </div>
            </div>

            {/* Selected SLC Link Tabs */}
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
              {activeLinkset.links.map((link) => (
                <button
                  key={link.slc}
                  onClick={() => setSelectedSlc(link.slc)}
                  className={`px-3 py-1 rounded text-[11px] font-code-metric font-semibold transition-all ${
                    selectedSlc === link.slc
                      ? 'bg-[#06b6d4] text-[#00424f]'
                      : 'bg-[#0a0e16] text-[#bcc9cd] hover:text-[#dfe2ee] border border-[#3d494c]'
                  }`}
                >
                  SLC-{link.slc}
                </button>
              ))}
            </div>

            {/* Active Link Deep Dive Telemetry */}
            {activeLink && (
              <div className="space-y-3 font-code-metric text-[11px]">
                {/* State Banner */}
                <div
                  className="p-2.5 rounded border flex items-center justify-between"
                  style={{
                    backgroundColor: getStatusBadge(activeLink.status).bg,
                    borderColor: getStatusBadge(activeLink.status).border,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusBadge(activeLink.status).dot}`}></span>
                    <span className="font-bold text-[12px]" style={{ color: getStatusBadge(activeLink.status).color }}>
                      {getStatusBadge(activeLink.status).label}
                    </span>
                  </div>
                  <span className="text-[#dfe2ee] text-[10px]">
                    Active: <strong>{activeLink.activePath}</strong>
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-[#0a0e16] border border-[#232d3d]">
                    <span className="text-[#869397] text-[10px] block">THROUGHPUT</span>
                    <span className="text-[14px] font-bold text-[#4cd7f6]">{activeLink.msuRate} MSU/s</span>
                  </div>
                  <div className="p-2 rounded bg-[#0a0e16] border border-[#232d3d]">
                    <span className="text-[#869397] text-[10px] block">ERLANG LOAD</span>
                    <span className="text-[14px] font-bold text-[#dfe2ee]">{(activeLink.erlangLoad * 100).toFixed(1)}% ({activeLink.erlangLoad} E)</span>
                  </div>
                  <div className="p-2 rounded bg-[#0a0e16] border border-[#232d3d]">
                    <span className="text-[#869397] text-[10px] block">RETRANS BUFFER</span>
                    <span
                      className={`text-[14px] font-bold ${
                        activeLink.retransBufferUtil > 50 ? 'text-[#ef4444]' : 'text-[#4edea3]'
                      }`}
                    >
                      {activeLink.retransBufferUtil}% Util
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#0a0e16] border border-[#232d3d]">
                    <span className="text-[#869397] text-[10px] block">BIT ERROR RATE</span>
                    <span className="text-[14px] font-bold text-[#4edea3]">{activeLink.bitErrorRate}</span>
                  </div>
                </div>

                {/* Dual-Homed SCTP Path Telemetry */}
                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#232d3d] space-y-1.5">
                  <div className="text-[#869397] text-[10px] flex items-center justify-between">
                    <span>SCTP DUAL-HOMED PATH MONITOR (M3UA)</span>
                    <span className="text-[#4edea3]">Heartbeat NOMINAL</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
                      <span className="text-[#dfe2ee]">Path A (Primary):</span>
                    </div>
                    <span className="font-bold text-[#4cd7f6]">{activeLink.sctpPathAPing}ms RTT</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
                      <span className="text-[#dfe2ee]">Path B (Secondary):</span>
                    </div>
                    <span className="font-bold text-[#bcc9cd]">{activeLink.sctpPathBPing}ms RTT</span>
                  </div>
                </div>

                {/* Point Code Identity Breakdown */}
                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#232d3d] text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Local Point Code:</span>
                    <span className="text-[#dfe2ee] font-bold">{activeLinkset.localSpc} (0x1841)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Destination Point Code:</span>
                    <span className="text-[#4cd7f6] font-bold">{activeLinkset.remoteSpc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Routing Context:</span>
                    <span className="text-[#bcc9cd]">{activeLinkset.routingContext}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Network Indicator (NI):</span>
                    <span className="text-[#bcc9cd]">National Reserve (0x02)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Tools & Operator Interventions */}
          <div className="mt-4 pt-3 border-t border-[#3d494c] space-y-2">
            <div className="text-[10px] font-code-metric text-[#869397] uppercase">
              MTP3 Carrier Operations on SLC-{activeLink?.slc ?? 0}:
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-code-metric">
              {/* Simulate Changeover / OOS */}
              <button
                onClick={() => handleSimulateChangeover(activeLinkset.id, activeLink?.slc ?? 0)}
                className={`px-2.5 py-1.5 rounded border transition-all flex items-center justify-center gap-1 font-semibold ${
                  activeLink?.status === 'OUT_OF_SERVICE'
                    ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]'
                    : 'bg-[#ef4444]/15 border-[#ef4444]/50 text-[#ffb4ab] hover:bg-[#ef4444]/25'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {activeLink?.status === 'OUT_OF_SERVICE' ? 'settings_backup_restore' : 'sync_problem'}
                </span>
                <span>
                  {activeLink?.status === 'OUT_OF_SERVICE' ? 'Restore to Service' : 'Simulate Failover (COO)'}
                </span>
              </button>

              {/* Management Inhibit */}
              <button
                onClick={() => handleToggleInhibit(activeLinkset.id, activeLink?.slc ?? 0)}
                className={`px-2.5 py-1.5 rounded border transition-all flex items-center justify-center gap-1 ${
                  activeLink?.status === 'INHIBITED'
                    ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]'
                    : 'bg-[#262a33] border-[#3d494c] text-[#dfe2ee] hover:bg-[#353942]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">shield</span>
                <span>{activeLink?.status === 'INHIBITED' ? 'Uninhibit Link' : 'Inhibit (MNGMT)'}</span>
              </button>
            </div>

            {/* Route Set Test Action */}
            <button
              onClick={() => handleSendRst(activeLinkset)}
              className="w-full px-3 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#4cd7f6] hover:bg-[#353942] text-[11px] font-code-metric flex items-center justify-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">send</span>
              <span>Send MTP3 Route Set Test (RST) to {activeLinkset.remoteSpc}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
