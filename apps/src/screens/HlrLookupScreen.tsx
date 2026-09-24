import React, { useState } from 'react';

interface HlrLookupScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const HlrLookupScreen: React.FC<HlrLookupScreenProps> = ({ onShowToast }) => {
  const [msisdn, setMsisdn] = useState('+12025550194');
  const [isQuerying, setIsQuerying] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>({
    msisdn: '+12025550194',
    valid: true,
    imsi: '310410884920194',
    mcc: '310 (United States)',
    mnc: '410 (AT&T Mobility)',
    originalNetwork: 'AT&T Mobility LLC',
    ported: false,
    currentNetwork: 'AT&T Mobility LLC',
    roamingStatus: 'NOT_ROAMING',
    hlrPointCode: '3-042-1',
    cacheTtl: '86400s',
  });

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuerying(true);
    onShowToast(`Executing SS7 MAP SRI_FOR_SM query for ${msisdn}...`, 'info');

    setTimeout(() => {
      setIsQuerying(false);
      setLookupResult({
        msisdn,
        valid: true,
        imsi: `310${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        mcc: msisdn.startsWith('+44') ? '234 (United Kingdom)' : msisdn.startsWith('+49') ? '262 (Germany)' : '310 (United States)',
        mnc: msisdn.startsWith('+44') ? '15 (Vodafone UK)' : msisdn.startsWith('+49') ? '01 (Telekom Deutschland)' : '410 (AT&T Mobility)',
        originalNetwork: msisdn.startsWith('+44') ? 'Vodafone UK' : msisdn.startsWith('+49') ? 'Telekom DE' : 'Verizon Wireless',
        ported: true,
        currentNetwork: msisdn.startsWith('+44') ? 'EE UK Ltd' : msisdn.startsWith('+49') ? 'Telekom DE' : 'AT&T Mobility LLC',
        roamingStatus: 'NOT_ROAMING',
        hlrPointCode: '3-042-1',
        cacheTtl: '86400s',
      });
      onShowToast(`HLR/MNP record resolved via Tier-1 SS7 link in 19ms.`, 'success');
    }, 600);
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
          <span className="text-[#4cd7f6] font-semibold">HLR / MNP REAL-TIME LOOKUP TOOL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Query Input (4 cols) */}
        <div className="xl:col-span-4 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#3d494c]">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">find_in_page</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Query Mobile Number Portability</h2>
          </div>

          <form onSubmit={handleQuery} className="space-y-3 text-[12px]">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                Target MSISDN
              </label>
              <input
                required
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                placeholder="+1..."
              />
            </div>

            <p className="text-[11px] text-[#bcc9cd] leading-relaxed">
              Issues a direct Send-Routing-Info (SRI) SS7 MAP probe against authoritative carrier Home Location Registers to determine ported carrier IMSI without sending an SMS.
            </p>

            <button
              type="submit"
              disabled={isQuerying}
              className="w-full py-2 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[13px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className={`material-symbols-outlined text-[16px] ${isQuerying ? 'animate-spin' : ''}`}>
                search
              </span>
              <span>{isQuerying ? 'Querying HLR Gateway...' : 'Execute HLR Query'}</span>
            </button>
          </form>
        </div>

        {/* Results Card (8 cols) */}
        <div className="xl:col-span-8 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[20px]">check_circle</span>
              <h2 className="text-[15px] font-semibold text-[#dfe2ee]">
                HLR Record Details for {lookupResult?.msisdn}
              </h2>
            </div>
            <span className="text-[10px] font-code-metric px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40">
              STATUS: VALID &amp; REACHABLE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-code-metric text-[12px]">
            <div className="p-3 rounded bg-[#181c24] border border-[#3d494c]">
              <span className="text-[10px] text-[#869397] uppercase block mb-1">Subscriber IMSI</span>
              <span className="text-[#4cd7f6] font-bold text-[14px]">{lookupResult?.imsi}</span>
            </div>

            <div className="p-3 rounded bg-[#181c24] border border-[#3d494c]">
              <span className="text-[10px] text-[#869397] uppercase block mb-1">Current Serving Network</span>
              <span className="text-[#dfe2ee] font-bold text-[14px]">{lookupResult?.currentNetwork}</span>
            </div>

            <div className="p-3 rounded bg-[#181c24] border border-[#3d494c]">
              <span className="text-[10px] text-[#869397] uppercase block mb-1">Mobile Country Code (MCC)</span>
              <span className="text-[#dfe2ee]">{lookupResult?.mcc}</span>
            </div>

            <div className="p-3 rounded bg-[#181c24] border border-[#3d494c]">
              <span className="text-[10px] text-[#869397] uppercase block mb-1">Mobile Network Code (MNC)</span>
              <span className="text-[#dfe2ee]">{lookupResult?.mnc}</span>
            </div>

            <div className="p-3 rounded bg-[#181c24] border border-[#3d494c]">
              <span className="text-[10px] text-[#869397] uppercase block mb-1">Original Donor Network</span>
              <span className="text-[#869397]">{lookupResult?.originalNetwork}</span>
            </div>

            <div className="p-3 rounded bg-[#181c24] border border-[#3d494c]">
              <span className="text-[10px] text-[#869397] uppercase block mb-1">Ported Status</span>
              <span className={lookupResult?.ported ? 'text-[#4cd7f6] font-bold' : 'text-[#4edea3]'}>
                {lookupResult?.ported ? 'PORTED (MNP ACTIVE)' : 'NOT PORTED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
