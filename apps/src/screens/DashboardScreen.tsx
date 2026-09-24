import React, { useState } from 'react';
import { ScreenId } from '../types';
import { TrafficHeatmap } from '../components/TrafficHeatmap';
import { GlobalLatencyMap } from '../components/GlobalLatencyMap';
import { SmppThroughputStress } from '../components/SmppThroughputStress';
import { TrafficAnomaliesPanel } from '../components/TrafficAnomaliesPanel';
import { SmppPduInspector } from '../components/SmppPduInspector';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, onShowToast }) => {
  const [isAnomaliesOpen, setIsAnomaliesOpen] = useState(false);

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Top Header Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">OVERVIEW</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">CARRIER CORE DASHBOARD</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Traffic Anomalies Side Panel Trigger */}
          <button
            onClick={() => setIsAnomaliesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ffb4ab] font-code-metric font-semibold text-[12px] hover:bg-[#ef4444]/25 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)]"
            title="Open Historical Trend Traffic Anomalies Side-Panel"
          >
            <span className="h-2 w-2 rounded-full bg-[#ef4444] animate-ping"></span>
            <span className="material-symbols-outlined text-[16px] text-[#ef4444]">crisis_alert</span>
            <span>Traffic Anomalies (2 Active)</span>
          </button>

          <button
            onClick={() => onNavigate('ss7-sigtran')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#262a33] border border-[#3d494c] text-[#4cd7f6] font-code-metric font-semibold text-[12px] hover:bg-[#353942] transition-all"
            title="Inspect SS7 Linksets and Point Code Grid"
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            <span>SS7 Links (6 Bound)</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('smpp-pdu-inspector');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#262a33] border border-[#3d494c] text-[#4edea3] font-code-metric font-semibold text-[12px] hover:bg-[#353942] transition-all"
            title="Inspect Real-Time SMPP Protocol Data Units"
          >
            <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
            <span>PDU Inspector (Live)</span>
          </button>

          <button
            onClick={() => onNavigate('live-monitor')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">monitoring</span>
            <span>Launch Live Sniffer</span>
          </button>
        </div>
      </div>

      {/* Real-Time Anomaly Attention Banner */}
      <div className="rounded bg-[#2a1b1e] border border-[#ef4444]/40 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded bg-[#ef4444]/20 text-[#ef4444] material-symbols-outlined text-[18px]">
            warning
          </span>
          <div>
            <span className="font-semibold text-[#ffb4ab]">
              Z-Score Trend Anomaly Detected:
            </span>{' '}
            <span className="text-[#dfe2ee]">
              <strong>Twilio Direct US</strong> is experiencing a +137.8% throughput surge ($Z=+3.8\sigma$ deviation above 24h diurnal baseline).
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnomaliesOpen(true)}
            className="px-2.5 py-1 rounded bg-[#ef4444] text-[#410002] font-bold text-[11px] hover:brightness-110 transition-all flex items-center gap-1"
          >
            <span>Open Anomaly Side-Panel</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c] shadow-sm">
          <div className="flex items-center justify-between text-[#869397] text-[10px] uppercase font-semibold tracking-wider mb-1">
            <span>Global Message Throughput</span>
            <span className="text-[#4edea3] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]"></span>
              NOMINAL
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-code-metric text-[26px] font-bold text-[#4cd7f6] tabular-nums">1,287</span>
            <span className="font-code-metric text-[12px] text-[#bcc9cd]">MPS</span>
          </div>
          <div className="mt-2 text-[11px] text-[#bcc9cd] flex items-center justify-between">
            <span>Peak 24h: 2,410 MPS</span>
            <span className="text-[#4edea3]">+8.4% surge</span>
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c] shadow-sm">
          <div className="flex items-center justify-between text-[#869397] text-[10px] uppercase font-semibold tracking-wider mb-1">
            <span>DLR Conversion Rate</span>
            <span className="text-[#4edea3]">TIER-1 SLA</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-code-metric text-[26px] font-bold text-[#4edea3] tabular-nums">99.98%</span>
            <span className="font-code-metric text-[12px] text-[#bcc9cd]">SUCCESS</span>
          </div>
          <div className="mt-2 text-[11px] text-[#bcc9cd] flex items-center justify-between">
            <span>Undelivered: 0.02%</span>
            <span className="text-[#869397]">Within tolerance</span>
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c] shadow-sm">
          <div className="flex items-center justify-between text-[#869397] text-[10px] uppercase font-semibold tracking-wider mb-1">
            <span>Active SMPP Binds</span>
            <span className="text-[#4cd7f6]">12 / 12 UP</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-code-metric text-[26px] font-bold text-[#dfe2ee] tabular-nums">12</span>
            <span className="font-code-metric text-[12px] text-[#bcc9cd]">Trunks Bound</span>
          </div>
          <div className="mt-2 text-[11px] text-[#bcc9cd] flex items-center justify-between">
            <span>Zero Bind Drops (48h)</span>
            <button
              onClick={() => onNavigate('smpp-connections')}
              className="text-[#4cd7f6] hover:underline"
            >
              View Trunks →
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c] shadow-sm">
          <div className="flex items-center justify-between text-[#869397] text-[10px] uppercase font-semibold tracking-wider mb-1">
            <span>Latency &amp; Queue Lag</span>
            <span className="text-[#4edea3]">0 LAG</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-code-metric text-[26px] font-bold text-[#4edea3] tabular-nums">14ms</span>
            <span className="font-code-metric text-[12px] text-[#bcc9cd]">P99 E2E</span>
          </div>
          <div className="mt-2 text-[11px] text-[#bcc9cd] flex items-center justify-between">
            <span>BullMQ: 0 delayed</span>
            <span className="text-[#869397]">Redis Cluster OK</span>
          </div>
        </div>
      </div>

      {/* D3.js Real-Time Global Packet Latency Mesh Map */}
      <GlobalLatencyMap
        onShowToast={onShowToast}
        onNavigateToTrunk={() => onNavigate('smpp-connections')}
      />

      {/* Real-Time Regional SMPP Traffic Heatmap (D3.js) */}
      <TrafficHeatmap
        onShowToast={onShowToast}
        onNavigateToTrunk={() => onNavigate('smpp-connections')}
      />

      {/* SMPP Throughput Stress & TPS Saturation Gauge Chart */}
      <SmppThroughputStress
        onShowToast={onShowToast}
        onNavigateToTrunks={() => onNavigate('smpp-connections')}
      />

      {/* Real-Time SMPP Protocol Data Unit (PDU) Inspector */}
      <div id="smpp-pdu-inspector">
        <SmppPduInspector
          onShowToast={onShowToast}
          onNavigateToTrunks={() => onNavigate('smpp-connections')}
        />
      </div>

      {/* Regional Ingress Grid & Carrier Interconnect Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Region Ingress Nodes (7 cols) */}
        <div className="xl:col-span-7 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">public</span>
              <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Active Carrier Edge Ingress Clusters</h2>
            </div>
            <span className="text-[10px] font-code-metric px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
              ACTIVE-ACTIVE MESH
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                region: 'AWS us-east-1a (Ashburn)',
                ip: '198.51.100.44',
                mps: '680 MPS',
                load: '53%',
                status: 'PRIMARY',
                latency: '12ms',
                nodes: '4 pods (M3UA + SMPP)',
              },
              {
                region: 'EU-Central-1 (Frankfurt)',
                ip: '80.12.99.12',
                mps: '390 MPS',
                load: '31%',
                status: 'SECONDARY',
                latency: '24ms',
                nodes: '3 pods (SIGTRAN Gateway)',
              },
              {
                region: 'AP-Southeast-1 (Singapore)',
                ip: '103.22.44.18',
                mps: '217 MPS',
                load: '16%',
                status: 'SECONDARY',
                latency: '42ms',
                nodes: '2 pods (LCR Demux)',
              },
            ].map((node) => (
              <div
                key={node.region}
                className="p-3 rounded bg-[#181c24] border border-[#3d494c] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4edea3] mt-1.5 animate-pulse"></span>
                  <div>
                    <div className="text-[13px] font-semibold text-[#dfe2ee]">{node.region}</div>
                    <div className="text-[10px] text-[#bcc9cd] font-code-metric">
                      {node.ip} • {node.nodes}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right self-end sm:self-auto font-code-metric">
                  <div>
                    <div className="text-[13px] font-bold text-[#4cd7f6]">{node.mps}</div>
                    <div className="text-[10px] text-[#869397]">Load share: {node.load}</div>
                  </div>
                  <div className="text-[11px] px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
                    {node.latency}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#3d494c] flex flex-wrap items-center justify-between gap-2 text-[11px] font-code-metric text-[#869397]">
            <span>Inter-region WireGuard tunnels: 100% encrypted (ChaCha20-Poly1305)</span>
            <button
              onClick={() => onShowToast('Inter-region synthetic probe triggered: RTT 38ms', 'info')}
              className="text-[#4cd7f6] hover:underline"
            >
              Test Interconnect Mesh →
            </button>
          </div>
        </div>

        {/* Carrier Interconnect Share (5 cols) */}
        <div className="xl:col-span-5 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">donut_small</span>
                <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Carrier Traffic Distribution</h2>
              </div>
              <button
                onClick={() => onNavigate('intelligent-routing')}
                className="text-[11px] text-[#4cd7f6] hover:underline"
              >
                LCR Weights →
              </button>
            </div>

            <div className="space-y-3 font-code-metric text-[12px]">
              {[
                { carrier: 'Twilio Direct US', share: 32, mps: 412, color: 'bg-[#4cd7f6]' },
                { carrier: 'Sinch Global Route', share: 24, mps: 388, color: 'bg-[#4edea3]' },
                { carrier: 'BICS Global Transit', share: 18, mps: 289, color: 'bg-[#d0bcff]' },
                { carrier: 'Deutsche Telekom D1', share: 14, mps: 240, color: 'bg-[#06b6d4]' },
                { carrier: 'Tata Comm Asia', share: 12, mps: 184, color: 'bg-[#ffb4ab]' },
              ].map((c) => (
                <div key={c.carrier} className="space-y-1">
                  <div className="flex justify-between text-[#dfe2ee]">
                    <span className="font-body-md font-medium text-[12px]">{c.carrier}</span>
                    <span>{c.mps} MPS ({c.share}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0a0e16] overflow-hidden">
                    <div className={`h-full ${c.color}`} style={{ width: `${c.share}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#3d494c] bg-[#0a0e16] p-2.5 rounded text-[11px] text-[#bcc9cd] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3] text-[16px]">verified</span>
              <span>All Tier-1 carrier contracts within SLA commitment</span>
            </span>
            <button
              onClick={() => onNavigate('billing-and-credit-ledger')}
              className="text-[#4cd7f6] hover:underline font-code-metric"
            >
              Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Traffic Anomalies & Trend Analysis Side-Panel Component */}
      <TrafficAnomaliesPanel
        isOpen={isAnomaliesOpen}
        onClose={() => setIsAnomaliesOpen(false)}
        onShowToast={onShowToast}
        onNavigateToScreen={onNavigate}
      />
    </div>
  );
};
