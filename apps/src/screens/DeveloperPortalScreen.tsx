import React, { useState } from 'react';

interface DeveloperPortalScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DeveloperPortalScreen: React.FC<DeveloperPortalScreenProps> = ({ onShowToast }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const apiKeys = [
    { id: 'key-prod-01', name: 'Carrier Gateway Ingress Token', prefix: 'msg_live_7f3b...', scope: 'REST + SMPP 3.4', created: '2026-01-15' },
    { id: 'key-prod-02', name: 'FinTech High-TPS OTP Webhook', prefix: 'msg_live_c029...', scope: 'REST v2.4 (Strict)', created: '2026-03-02' },
  ];

  const handleCopy = (prefix: string) => {
    navigator.clipboard.writeText(`${prefix}748192837482`);
    setCopiedKey(prefix);
    onShowToast('API Key copied to clipboard.', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotateCert = () => {
    onShowToast('CA_SIGNER root certificate rotation verified with HSM token.', 'success');
  };

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">DEVELOPER &amp; PLATFORM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">DEVELOPER PORTAL &amp; MTLS ENCLAVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* API Credentials (7 cols) */}
        <div className="xl:col-span-7 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">vpn_key</span>
              <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Production API Keys &amp; Tokens</h2>
            </div>
            <button
              onClick={() => onShowToast('New API key generated and bound to Marcus Vance IAM.', 'success')}
              className="px-2.5 py-1 rounded bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] text-[11px] font-semibold"
            >
              + Generate Key
            </button>
          </div>

          <div className="space-y-2.5 font-code-metric text-[12px]">
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className="p-3 rounded bg-[#181c24] border border-[#3d494c] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-[#dfe2ee] font-body-md text-[13px]">{k.name}</div>
                  <div className="text-[11px] text-[#4cd7f6]">{k.prefix}••••••••</div>
                  <div className="text-[10px] text-[#869397]">Scope: {k.scope} • Issued {k.created}</div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleCopy(k.prefix)}
                    className="px-2.5 py-1 rounded bg-[#262a33] text-[#dfe2ee] hover:bg-[#353942] text-[11px]"
                  >
                    {copiedKey === k.prefix ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* mTLS Certificate Status (5 cols) */}
        <div className="xl:col-span-5 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">verified</span>
                <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Cluster mTLS CA Root</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-code-metric text-[10px]">
                VALID (418 DAYS)
              </span>
            </div>

            <div className="p-3 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[11px] space-y-1.5">
              <div>
                <span className="text-[#869397] block">Issuer Common Name (CN):</span>
                <span className="text-[#dfe2ee]">GlobalTel Direct Carrier Internal CA Root v4</span>
              </div>
              <div>
                <span className="text-[#869397] block">Fingerprint (SHA-256):</span>
                <span className="text-[#4cd7f6] break-all">E8:12:4A:91:BB:02:44:88:F1:C9:22:98:AA:77</span>
              </div>
              <div>
                <span className="text-[#869397] block">Key Spec:</span>
                <span className="text-[#dfe2ee]">ECDSA NIST P-384 / Hardware HSM Bound</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#3d494c] flex justify-between items-center text-[12px]">
            <span className="text-[10px] text-[#869397] font-code-metric">Marcus Vance [CA_SIGNER]</span>
            <button
              onClick={handleRotateCert}
              className="px-3 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] hover:bg-[#353942] text-[11px]"
            >
              Rotate Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
