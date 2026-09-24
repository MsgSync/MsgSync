import React, { useState, useEffect } from 'react';
import { LivePacket } from '../types';
import { SAMPLE_PACKETS } from '../data/mockData';

interface LiveMonitorScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const LiveMonitorScreen: React.FC<LiveMonitorScreenProps> = ({ onShowToast }) => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [packets, setPackets] = useState<LivePacket[]>([
    {
      id: 'pkt-100',
      timestamp: new Date().toISOString().substring(11, 23),
      ...SAMPLE_PACKETS[0],
    },
    {
      id: 'pkt-101',
      timestamp: new Date().toISOString().substring(11, 23),
      ...SAMPLE_PACKETS[1],
    },
    {
      id: 'pkt-102',
      timestamp: new Date().toISOString().substring(11, 23),
      ...SAMPLE_PACKETS[2],
    },
    {
      id: 'pkt-103',
      timestamp: new Date().toISOString().substring(11, 23),
      ...SAMPLE_PACKETS[3],
    },
  ]);
  const [selectedPacket, setSelectedPacket] = useState<LivePacket | null>(packets[0]);
  const [filterProtocol, setFilterProtocol] = useState<string>('ALL');

  // Simulated live packet generation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const template = SAMPLE_PACKETS[Math.floor(Math.random() * SAMPLE_PACKETS.length)];
      const randomMsisdn = `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`;
      const randomDest = `+44${Math.floor(7000000000 + Math.random() * 900000000)}`;

      const newPkt: LivePacket = {
        id: `pkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString().substring(11, 23),
        protocol: template.protocol,
        command: template.command,
        source: template.command.includes('SM') ? randomMsisdn : template.source,
        destination: template.command.includes('SM') ? randomDest : template.destination,
        status: template.status,
        bytes: template.bytes + Math.floor(Math.random() * 20) - 10,
        latencyMs: template.latencyMs + Math.floor(Math.random() * 6) - 3,
        hexDump: template.hexDump,
        asciiDump: template.asciiDump,
      };

      setPackets((prev) => [newPkt, ...prev.slice(0, 49)]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const filtered = filterProtocol === 'ALL'
    ? packets
    : packets.filter((p) => p.protocol.toLowerCase().includes(filterProtocol.toLowerCase()));

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">OVERVIEW</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">LIVE PACKET SNIFFER &amp; PROTOCOL TRACE</span>
        </div>

        <div className="flex items-center gap-2 font-code-metric text-[12px]">
          <button
            onClick={() => {
              setIsStreaming(!isStreaming);
              onShowToast(isStreaming ? 'Packet sniffer paused.' : 'Packet sniffer resumed.', 'info');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-colors ${
              isStreaming
                ? 'bg-[#262a33] text-[#4edea3] border border-[#4edea3]/40'
                : 'bg-[#06b6d4] text-[#00424f]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isStreaming ? 'pause' : 'play_arrow'}
            </span>
            <span>{isStreaming ? 'Streaming LIVE' : 'Resume Capture'}</span>
          </button>

          <button
            onClick={() => {
              setPackets([]);
              setSelectedPacket(null);
              onShowToast('Capture buffer cleared.', 'info');
            }}
            className="px-2.5 py-1 rounded bg-[#1c2028] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee]"
          >
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Protocol filter tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[11px] font-code-metric">
          {['ALL', 'SMPP', 'M3UA', 'MAP', 'REST'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterProtocol(p)}
              className={`px-3 py-1 rounded transition-colors ${
                filterProtocol === p
                  ? 'bg-[#06b6d4] text-[#00424f] font-bold'
                  : 'text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#1c2028]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-code-metric text-[#869397]">
          Buffer: <span className="text-[#4cd7f6]">{packets.length}</span> PDUs captured
        </div>
      </div>

      {/* Main Split View: Stream Table & Split Hex / ASCII Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Packet Stream Table (7 cols) */}
        <div className="xl:col-span-7 rounded bg-[#1c2028] border border-[#3d494c] p-3 shadow-sm flex flex-col h-[520px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#869397] pb-2 mb-2 border-b border-[#3d494c] flex justify-between">
            <span>Captured Telecom PDUs</span>
            <span className="text-[#4edea3] font-code-metric">TAP: ingress-eth0</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-code-metric text-[11px]">
              <thead className="sticky top-0 bg-[#1c2028] border-b border-[#3d494c] text-[#869397]">
                <tr>
                  <th className="pb-1.5">Time</th>
                  <th className="pb-1.5">Protocol</th>
                  <th className="pb-1.5">Command</th>
                  <th className="pb-1.5">Source → Dest</th>
                  <th className="pb-1.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d494c]/50">
                {filtered.map((pkt) => (
                  <tr
                    key={pkt.id}
                    onClick={() => setSelectedPacket(pkt)}
                    className={`cursor-pointer transition-colors ${
                      selectedPacket?.id === pkt.id
                        ? 'bg-[#06b6d4]/15 text-[#4cd7f6]'
                        : 'hover:bg-[#262a33] text-[#dfe2ee]'
                    }`}
                  >
                    <td className="py-2 pr-2 text-[#869397] tabular-nums">{pkt.timestamp}</td>
                    <td className="py-2 pr-2 font-semibold text-[#d0bcff]">{pkt.protocol}</td>
                    <td className="py-2 pr-2 font-medium">{pkt.command}</td>
                    <td className="py-2 pr-2 truncate max-w-[140px] text-[#bcc9cd]">
                      {pkt.source} → {pkt.destination}
                    </td>
                    <td className="py-2 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px]">
                        {pkt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packet Inspector (5 cols) */}
        <div className="xl:col-span-5 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col justify-between h-[520px]">
          {selectedPacket ? (
            <div className="space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-[#3d494c]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">data_object</span>
                  <span className="text-[14px] font-semibold text-[#dfe2ee]">
                    PDU Inspector: {selectedPacket.command}
                  </span>
                </div>
                <span className="font-code-metric text-[11px] text-[#4edea3]">
                  {selectedPacket.latencyMs}ms RTT
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[11px]">
                <div>
                  <span className="text-[#869397] block">Protocol Layer:</span>
                  <span className="text-[#dfe2ee] font-semibold">{selectedPacket.protocol}</span>
                </div>
                <div>
                  <span className="text-[#869397] block">Packet Size:</span>
                  <span className="text-[#dfe2ee]">{selectedPacket.bytes} bytes</span>
                </div>
                <div>
                  <span className="text-[#869397] block">Origin MSISDN:</span>
                  <span className="text-[#4cd7f6] truncate block">{selectedPacket.source}</span>
                </div>
                <div>
                  <span className="text-[#869397] block">Destination / GTT:</span>
                  <span className="text-[#4edea3] truncate block">{selectedPacket.destination}</span>
                </div>
              </div>

              {/* Split Hex & ASCII View */}
              <div>
                <div className="text-[10px] uppercase font-semibold text-[#869397] tracking-wider mb-1">
                  Raw Hex Stream Payload (Offset 0x0000 - 0x0020)
                </div>
                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[11px] text-[#4cd7f6] overflow-x-auto select-all leading-relaxed">
                  {selectedPacket.hexDump}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-[#869397] tracking-wider mb-1">
                  ASCII Decoded Representation
                </div>
                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[11px] text-[#4edea3] select-all leading-relaxed">
                  {selectedPacket.asciiDump}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#869397] text-[13px]">
              <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">troubleshoot</span>
              <span>Select a captured PDU packet from the left stream to inspect hex traces.</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#3d494c] flex justify-between items-center text-[11px] font-code-metric text-[#869397]">
            <span>Enclave WireGuard Sniffer v2.1</span>
            <button
              onClick={() => onShowToast('Full PCAP dump exported for active session.', 'success')}
              className="text-[#4cd7f6] hover:underline"
            >
              Export PCAP file ↓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
