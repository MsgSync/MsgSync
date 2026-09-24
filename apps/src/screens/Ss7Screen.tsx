import React, { useState } from 'react';
import { Ss7LinkStateMonitor } from '../components/Ss7LinkStateMonitor';
import { Ss7ResourceAllocator } from '../components/Ss7ResourceAllocator';

interface Ss7ScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const Ss7Screen: React.FC<Ss7ScreenProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'allocator' | 'monitor' | 'associations' | 'all'>('allocator');

  const [activeAssociations, setActiveAssociations] = useState([
    {
      id: 'assoc-01',
      name: 'BICS Brussels Primary',
      localPc: '3-042-1',
      remotePc: '3-042-2',
      aspState: 'ASP_ACTIVE',
      sctpStreams: '16 In / 16 Out',
      primaryIp: '194.7.1.18',
      secondaryIp: '194.7.1.19',
      heartbeatMs: 11.4,
      status: 'UP',
    },
    {
      id: 'assoc-02',
      name: 'Syniverse Tampa Direct',
      localPc: '3-042-1',
      remotePc: '3-042-3',
      aspState: 'ASP_ACTIVE',
      sctpStreams: '32 In / 32 Out',
      primaryIp: '206.222.60.10',
      secondaryIp: '206.222.60.11',
      heartbeatMs: 14.8,
      status: 'UP',
    },
    {
      id: 'assoc-03',
      name: 'Tata Communications SG',
      localPc: '3-042-1',
      remotePc: '4-110-1',
      aspState: 'ASP_ACTIVE',
      sctpStreams: '16 In / 16 Out',
      primaryIp: '180.87.10.4',
      secondaryIp: '180.87.10.5',
      heartbeatMs: 42.1,
      status: 'UP',
    },
  ]);

  const handleTestSctp = (id: string) => {
    onShowToast(`Heartbeat ACK verified on association ${id} in 11.2ms.`, 'success');
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
          <span className="text-[#4cd7f6] font-semibold">SS7 / SIGTRAN &amp; M3UA GATEWAYS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-code-metric px-2.5 py-1 rounded bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
            ITU-T Q.700 SPEC COMPLIANT
          </span>
        </div>
      </div>

      {/* Point Code Identity Banner */}
      <div className="p-4 rounded bg-[#1c2028] border border-[#3d494c] flex flex-col md:flex-row md:items-center justify-between gap-3 font-code-metric">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#869397]">Local Signalling Point Code (SPC)</div>
          <div className="text-[24px] font-bold text-[#4cd7f6]">
            3-042-1 <span className="text-[12px] font-normal text-[#bcc9cd]">(14-bit ITU-T Format)</span>
          </div>
          <div className="text-[11px] text-[#bcc9cd] font-body-md">
            Assigned Carrier Enclave: GlobalTel Direct Core STPs
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-[#869397]">Routing Context</div>
            <div className="text-[14px] text-[#dfe2ee] font-semibold">RC: 0x00000001</div>
          </div>
          <button
            onClick={() => onShowToast('M3UA ASP routing context validated across cluster.', 'success')}
            className="px-3 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] hover:bg-[#353942] text-[12px]"
          >
            Audit M3UA Context
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-[#3d494c] pb-2 text-[12px] font-code-metric overflow-x-auto">
        <button
          onClick={() => setActiveTab('allocator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'allocator'
              ? 'bg-[#06b6d4] text-[#00424f] font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">swap_driving_apps_wheel</span>
          <span>Signaling Resource Allocator</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] ${activeTab === 'allocator' ? 'bg-[#00424f] text-[#4cd7f6]' : 'bg-[#181c24] text-[#4cd7f6]'}`}>
            Drag &amp; Drop
          </span>
        </button>

        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'monitor'
              ? 'bg-[#06b6d4] text-[#00424f] font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
          <span>Link State Monitor &amp; SPC Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('associations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'associations'
              ? 'bg-[#06b6d4] text-[#00424f] font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">hub</span>
          <span>SCTP Associations &amp; ASPs</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            activeTab === 'all'
              ? 'bg-[#06b6d4] text-[#00424f] font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">view_agenda</span>
          <span>All Modules</span>
        </button>
      </div>

      {/* Tab Content: SS7 Signaling Resource Allocator */}
      {(activeTab === 'allocator' || activeTab === 'all') && (
        <Ss7ResourceAllocator onShowToast={onShowToast} />
      )}

      {/* Tab Content: SS7 Link State Monitor & Signaling Point Code Grid */}
      {(activeTab === 'monitor' || activeTab === 'all') && (
        <Ss7LinkStateMonitor onShowToast={onShowToast} />
      )}

      {/* Tab Content: SCTP Associations & M3UA ASPs Table */}
      {(activeTab === 'associations' || activeTab === 'all') && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">hub</span>
              <h2 className="text-[15px] font-semibold text-[#dfe2ee]">SCTP Associations &amp; M3UA ASP Status</h2>
            </div>
            <span className="text-[11px] font-code-metric text-[#4edea3]">3 Active Dual-Homed Links</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-code-metric text-[12px]">
              <thead className="border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                <tr>
                  <th className="pb-2">Association Name</th>
                  <th className="pb-2">Point Codes (Local → Remote)</th>
                  <th className="pb-2">ASP State</th>
                  <th className="pb-2">Dual-Homed IP Endpoints</th>
                  <th className="pb-2">Heartbeat RTT</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d494c]">
                {activeAssociations.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-[#262a33]/60 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-[#dfe2ee]">{assoc.name}</div>
                      <div className="text-[10px] text-[#869397]">{assoc.sctpStreams}</div>
                    </td>
                    <td className="py-3">
                      <span className="text-[#4cd7f6] font-bold">{assoc.localPc}</span>
                      <span className="text-[#869397] mx-1">→</span>
                      <span className="text-[#4edea3] font-bold">{assoc.remotePc}</span>
                    </td>
                    <td className="py-3">
                      <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 text-[10px]">
                        {assoc.aspState}
                      </span>
                    </td>
                    <td className="py-3 text-[11px]">
                      <div className="text-[#dfe2ee]">Pri: {assoc.primaryIp}</div>
                      <div className="text-[#869397]">Sec: {assoc.secondaryIp}</div>
                    </td>
                    <td className="py-3">
                      <span className="text-[#4edea3] font-semibold">{assoc.heartbeatMs}ms</span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleTestSctp(assoc.id)}
                        className="px-2.5 py-1 rounded bg-[#262a33] text-[#4cd7f6] hover:bg-[#353942] text-[11px]"
                      >
                        Heartbeat Test
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
