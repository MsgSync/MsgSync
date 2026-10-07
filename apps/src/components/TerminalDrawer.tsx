import React, { useState, useRef, useEffect } from 'react';

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (cmd: string) => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onClose,
  onExecuteAction,
}) => {
  const [history, setHistory] = useState<Array<{ text: string; type?: 'input' | 'output' | 'error' | 'success' }>>([
    { text: 'MsgSync Telecom Engine CLI [Version 4.8.2-PROD]', type: 'output' },
    { text: 'Authenticated as Marcus Vance (UID-OP-9842) • Session Enclave Sealed', type: 'success' },
    { text: 'Type "help" to list carrier management commands.', type: 'output' },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    const newHistory = [...history, { text: `> ${cmd}`, type: 'input' as const }];
    const lower = cmd.toLowerCase();

    if (lower === 'help') {
      newHistory.push({
        text: `Available carrier commands:
  status         - Show cluster status, active nodes, and HSM seal
  mps            - Show instantaneous system message-per-second telemetry
  stress         - Query SMPP TPS saturation and carrier window stress
  anomalies      - Query active Z-score traffic spikes, drops & historical departures
  pdu            - Dissect last captured SMPP Protocol Data Unit (WireShark format)
  pdu export     - Export current SMPP session logs for offline forensic analysis (CSV/JSON)
  map            - Query real-time global D3 packet latency mesh
  heatmap        - Inspect regional SMPP traffic heatmap telemetry
  trunks         - Inspect 12 active SMPP tranceiver trunks
  ratelimit      - Query active SMPP PPS rate limiting and token bucket enforcement
  ss7            - Query SS7/SIGTRAN M3UA point codes and association health
  ss7 allocate   - View dynamic SS7 signaling resource allocations across STP planes
  audit          - Generate and download compliance audit JSON
  revoke         - Revoke all remote edge node sessions
  clear          - Clear terminal buffer
  exit           - Close terminal drawer`,
        type: 'output',
      });
    } else if (lower === 'status') {
      newHistory.push({
        text: `[OK] Node AWS us-east-1a: ONLINE (12ms)
[OK] Node EU-Central-1: ONLINE (24ms)
[OK] Node AP-Southeast-1: ONLINE (42ms)
[OK] Hardware HSM Enclave: SEALED (Zero-Trust Active)
[OK] DLR Rate: 99.98% • Latency P99: 14ms`,
        type: 'success',
      });
    } else if (lower === 'mps') {
      newHistory.push({
        text: `GLOBAL MPS: 1,287 msg/sec
  - US-East-1 Ingress: 680 MPS
  - EU-West-1 Ingress: 390 MPS
  - AP-SE-1 Ingress:   217 MPS
  - Peak 1-hr:         2,410 MPS
  - Dropped PDU:       0 (0.000%)`,
        type: 'output',
      });
    } else if (lower === 'anomalies' || lower === 'anomaly') {
      newHistory.push({
        text: `[TRAFFIC ANOMALIES] Historical Diurnal Z-Score Analysis:
  Active Threshold: |Z| >= 2.5 sigma (99.3% Confidence Interval)
  [ALERT 1 - SPIKE] Twilio Direct US (AWS us-east-1):
    Current: 980 MPS vs Expected: 412 MPS (+137.8%, Z: +3.8 sigma)
    Classification: OTP Authentication Storm / Credential Stuffing
    Remediation: Adaptive Token Bucket Pacing ENGAGED
  [ALERT 2 - DROP]  BICS Global Transit (EU-Central Frankfurt):
    Current: 72 MPS vs Expected: 289 MPS (-75.1%, Z: -3.4 sigma)
    Classification: Upstream DE-CIX Interconnect / SCTP Loss
    Remediation: LCR Failover to Sinch Global RECOMMENDED`,
        type: 'error',
      });
    } else if (lower.startsWith('pdu export') || lower === 'export pdu') {
      const isJson = lower.includes('json');
      newHistory.push({
        text: `[SMPP PDU FORENSIC EXPORT]
  Target Format : ${isJson ? 'Forensic JSON (.json) [Hierarchical Dissector + TLVs]' : 'RFC 4180 CSV (.csv) [Tabular SIEM / Excel Stream]'}
  Status        : EXPORT ENGINE READY
  Buffer Target : 80 in-memory ring buffer frames (Ingress RX + Egress TX)
  SIEM Envelope : SHA-256 Authenticated Compliance Header Included
  To download offline capture files immediately:
    1. Click "Export Logs" button in the SMPP PDU Inspector panel on Dashboard.
    2. Or use the quick ".CSV" or ".JSON" badges in the Stream Buffer title bar.`,
        type: 'output',
      });
    } else if (lower === 'pdu' || lower === 'dissect' || lower === 'packet') {
      newHistory.push({
        text: `[SMPP PDU DISSECTOR] Last Captured Ingress Frame:
  Frame: Length 104 octets • Protocol: SMPP v3.4 over TCP:2775
  Trunk: Twilio Direct US (trunk-01) • Mode: TRX
  Header:
    command_length : 104 (0x00000068)
    command_id     : submit_sm (0x00000004)
    command_status : ESME_ROK (0x00000000 - No Error)
    sequence_number: 104928 (0x000199e0)
  Mandatory Body:
    service_type   : "OTP"
    source_addr    : "VERIFY" (TON: 5 Alphanumeric, NPI: 0)
    dest_addr      : "+12025550199" (TON: 1 International, NPI: 1 ISDN/E.164)
    esm_class      : 0x00 (Default SMS)
    registered_dlr : 0x01 (SMSC Delivery Receipt Requested)
    data_coding    : 0x00 (GSM 7-bit default alphabet)
    short_message  : "Your GlobalTel security PIN is 849201. Valid 5m." (48 octets)
  Optional TLVs:
    sar_msg_ref_num: 0x002B (Ref: 43) • sar_total_segments: 1 • sar_segment_seqnum: 1`,
        type: 'output',
      });
    } else if (lower === 'stress' || lower === 'tps') {
      newHistory.push({
        text: `[SMPP STRESS] Real-Time TPS Saturation Gauge:
  Total Fleet Ingress Load: 2,840 / 3,500 TPS (81.1% Saturation)
  Buffer Available Headroom: 660 TPS Remaining
  Average Window Queuing : 48% Buffer Utilization
  Throttled Trunks (0x58): 0 Active (All 12 Binds Flowing)
  Token Bucket Flow Ctrl : NOMINAL • Burst Allowance: 120%`,
        type: 'success',
      });
    } else if (lower === 'heatmap' || lower === 'traffic') {
      newHistory.push({
        text: `[HEATMAP] Real-Time Regional SMPP Volume Matrix:
  US-East (Ashburn)   : 680 MPS [Twilio Direct US]  - NOMINAL
  EU-Central (FRA)    : 390 MPS [Deutsche Telekom]   - NOMINAL
  EU-West (London)    : 260 MPS [Vodafone Transit]   - NOMINAL
  AP-East (Singapore) : 217 MPS [Tata Comm Asia]     - NOMINAL
  AP-South (Mumbai)   : 185 MPS [Airtel Enterprise]  - NOMINAL
  US-West (Oregon)    : 195 MPS [Telnyx Backbone]    - NOMINAL
  SA-East (São Paulo) : 142 MPS [Claro Carrier BR]   - NOMINAL
  ME-Central (Dubai)  : 118 MPS [Etisalat Direct]    - NOMINAL
  Total Fleet Volume  : 2,187 MPS • P99: 14ms • SLA: 99.98%`,
        type: 'success',
      });
    } else if (lower === 'map' || lower === 'latency' || lower === 'mesh') {
      newHistory.push({
        text: `[D3 GEOMESH] Tier-1 SMS Gateway Packet Latency:
  Ashburn VA (Twilio Direct)    : 12ms (±0.8ms) [OPTIMAL]
  Frankfurt (Deutsche Telekom)  : 18ms (±0.9ms) [OPTIMAL]
  London (Vodafone Transit)     : 16ms (±1.1ms) [OPTIMAL]
  Oregon (Telnyx Backbone)      : 24ms (±1.2ms) [OPTIMAL]
  Stockholm (Sinch Global)      : 22ms (±1.0ms) [OPTIMAL]
  Dubai (Etisalat Direct)       : 38ms (±1.8ms) [NORMAL]
  Singapore (Tata Comm)         : 42ms (±2.1ms) [NORMAL]
  Mumbai (Bharti Airtel)        : 48ms (±2.6ms) [NORMAL]
  Tokyo (SoftBank / NTT)        : 54ms (±2.4ms) [NORMAL]
  São Paulo (Claro LATAM)       : 62ms (±3.1ms) [NORMAL]
  Sydney (Telstra Global)       : 78ms (±3.8ms) [ELEVATED]
  Johannesburg (MTN Africa)     : 84ms (±4.2ms) [ELEVATED]
  Global Mesh P99 Latency       : 24.8ms • 0.00% Packet Loss`,
        type: 'success',
      });
    } else if (lower === 'trunks') {
      newHistory.push({
        text: `12 of 12 SMPP Trunks Bound & Active:
  01: Twilio Direct US (TX)      - 412/500 TPS [NOMINAL]
  02: BICS Global Transit (TRX)   - 289/350 TPS [NOMINAL]
  03: Tata Comm Asia (TRX)       - 184/200 TPS [NOMINAL]
  04: Syniverse SS7 (TX)         - 340/400 TPS [NOMINAL]
  05: Vodafone Europe (TRX)      - 265/300 TPS [NOMINAL]
  09: Sinch Global (TRX)         - 388/400 TPS [NOMINAL]`,
        type: 'output',
      });
    } else if (lower === 'ratelimit' || lower === 'pps' || lower === 'shaper' || lower === 'throttle') {
      newHistory.push({
        text: `[SMPP PPS RATE LIMITER & TRAFFIC SHAPER]
  Fleet Enforcement Status: 8 of 12 Trunks Actively Guarded
  Fleet PPS Threshold     : 3,140 PPS Clamped Ceiling
  Active Throttling Events: 1 Trunk Clamping (Sinch Global: 388 MPS vs 385 PPS Cap)
  Configured Thresholds:
    - Twilio Direct US     : 450 PPS [GUARDED] - 412 MPS (ESME_RTHROTTLED 0x58)
    - BICS Global Transit  : 320 PPS [GUARDED] - 289 MPS (Leaky Bucket Delay)
    - Syniverse SS7        : 360 PPS [GUARDED] - 340 MPS (ESME_RTHROTTLED 0x58)
    - Vodafone Europe      : 280 PPS [GUARDED] - 265 MPS (Leaky Bucket Delay)
    - Infobip Enterprise   : 230 PPS [GUARDED] - 215 MPS (ESME_RTHROTTLED 0x58)
    - Sinch Global Route   : 385 PPS [GUARDED] - 388 MPS (ACTIVE THROTTLING: 34 held)
    - NTT DoCoMo Transit   : 110 PPS [GUARDED] -  98 MPS (Leaky Bucket Delay)
    - Deutsche Telekom D1  : 260 PPS [GUARDED] - 240 MPS (ESME_RTHROTTLED 0x58)
  To dynamically adjust PPS thresholds or toggle enforcement, navigate to:
  Telecom & Routing > SMPP Transceiver Trunks.`,
        type: 'output',
      });
    } else if (lower.startsWith('ss7 allocate') || lower.startsWith('ss7 orchestrate')) {
      newHistory.push({
        text: `[SS7 RESOURCE ALLOCATOR] Active STP Routing Planes:
  - STP Plane Alpha (EU Core / FRA)     : 10,310 / 32,000 MSU/s (32% Load) • 3 Linksets (ITU-T)
  - STP Plane Beta (US East / IAD)      : 11,420 / 36,000 MSU/s (32% Load) • 2 Linksets (ANSI)
  - SGW Plane Gamma (APAC Transit / SIN):  6,400 / 28,000 MSU/s (23% Load) • 2 Linksets (ITU-T)
  - SIGTRAN Enclave Delta (HLR/HSS MAP) :  8,940 / 24,000 MSU/s (37% Load) • 1 Core Linkset
  - Hot-Standby & Quarantine Pool       :  1,450 / 50,000 MSU/s ( 3% Load) • 4 Staged Resources
  Drag-and-Drop Orchestration Active: Access via SS7 / SIGTRAN > Signaling Resource Allocator tab.`,
        type: 'output',
      });
    } else if (lower === 'ss7' || lower === 'spc' || lower === 'linksets') {
      newHistory.push({
        text: `[SS7 / SIGTRAN] Signaling Point Code (SPC) & Linkset Status:
  Local Host SPC: 3-042-1 (14-bit ITU-T / GlobalTel Core STP)
  Active Linksets: 6 Bound • 16 Signaling Links (14 In-Service, 1 Congested, 1 Inhibited)
  - LS-BICS-FRA01 (3-042-2 STP)   : ACCESSIBLE • 4/4 SLCs [IS] • 4,180 MSU/s (11.2ms)
  - LS-SYN-TPA02  (3-042-3 STP)   : ACCESSIBLE • 3/4 SLCs [IS], 1 [CONG-1] • 6,320 MSU/s
  - LS-TATA-SIN01 (4-110-1 SMSC)  : ACCESSIBLE • 2/2 SLCs [IS] • 2,840 MSU/s (42.1ms)
  - LS-VODA-LON01 (2-014-5 STP)   : ACCESSIBLE • 2/2 SLCs [IS] • 3,120 MSU/s (16.4ms)
  - LS-DTAG-BON01 (2-068-4 SMSC)  : ACCESSIBLE • 1/2 SLCs [IS], 1 [INHIBITED] • 2,420 MSU/s
  - LS-CLARO-BRA01(6-080-2 HLR)   : ACCESSIBLE • 2/2 SLCs [IS] • 1,450 MSU/s (68.2ms)
  MTP3 Network Status: 100% SPC Accessibility • Combined Load: 20,330 MSU/sec`,
        type: 'success',
      });
    } else if (lower === 'audit') {
      onExecuteAction('action-audit');
      newHistory.push({
        text: 'Initiated cryptographic audit log compilation and download.',
        type: 'success',
      });
    } else if (lower === 'revoke') {
      onExecuteAction('action-revoke');
      newHistory.push({
        text: 'Issued remote session revocation across all edge ingress nodes.',
        type: 'error',
      });
    } else if (lower === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else if (lower === 'exit' || lower === 'quit') {
      onClose();
      return;
    } else {
      newHistory.push({
        text: `Command not recognized: "${cmd}". Type "help" for a list of valid commands.`,
        type: 'error',
      });
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="fixed inset-x-0 bottom-8 z-40 bg-[#0a0e16]/95 border-t border-[#3d494c] shadow-2xl backdrop-blur-md flex flex-col h-72">
      {/* Terminal Bar Header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#181c24] border-b border-[#3d494c] text-[12px] font-code-metric">
        <div className="flex items-center gap-2 text-[#4cd7f6]">
          <span className="material-symbols-outlined text-[16px]">terminal</span>
          <span className="font-semibold">CARRIER NOC TELECOM CLI</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00424f] text-[#4cd7f6] border border-[#06b6d4]/40">
            ROOT INTERACTIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            className="text-[#869397] hover:text-[#dfe2ee] text-[11px] px-2 py-0.5 rounded hover:bg-[#262a33]"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-[#869397] hover:text-[#dfe2ee]"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-3 overflow-y-auto font-code-metric text-[12px] space-y-1">
        {history.map((h, i) => (
          <div
            key={i}
            className={
              h.type === 'input'
                ? 'text-[#4cd7f6] font-semibold'
                : h.type === 'success'
                ? 'text-[#4edea3]'
                : h.type === 'error'
                ? 'text-[#ffb4ab]'
                : 'text-[#dfe2ee] whitespace-pre-wrap'
            }
          >
            {h.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Terminal Input Form */}
      <form onSubmit={handleCommand} className="flex items-center px-3 py-2 bg-[#0a0e16] border-t border-[#3d494c]">
        <span className="text-[#4edea3] font-code-metric text-[14px] font-bold mr-2">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter NOC command (try 'help', 'status', 'mps', 'trunks', 'ss7')..."
          className="flex-1 bg-transparent text-[#dfe2ee] font-code-metric text-[12px] focus:outline-none placeholder:text-[#869397]"
          autoFocus
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-[#262a33] text-[#4cd7f6] text-[11px] font-code-metric hover:bg-[#31353e]"
        >
          Execute
        </button>
      </form>
    </div>
  );
};
