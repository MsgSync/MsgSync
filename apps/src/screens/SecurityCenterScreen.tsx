import React, { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useSecurity } from '../hooks/useSecurity';
import { useNotifications } from '../hooks/useNotifications';

interface SecurityCenterScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SecurityCenterScreen: React.FC<SecurityCenterScreenProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'policies' | 'api-keys' | 'sessions' | 'mfa'>('events');
  const { auditLogs, loading, setup2FA, enable2FA, disable2FA, refetchAudit } = useSecurity();
  const { notifications } = useNotifications();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ipAllowlist, setIpAllowlist] = useState(true);
  const [selectedApiKey, setSelectedApiKey] = useState<string | null>(null);

  const handleToggleMfa = useCallback(async () => {
    if (twoFactorEnabled) {
      await disable2FA();
      onShowToast('2FA disabled', 'warning');
    } else {
      await enable2FA({});
      onShowToast('2FA enabled', 'success');
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  }, [twoFactorEnabled, enable2FA, disable2FA, onShowToast]);

  const handleRotateKey = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/rotate-key');
      onShowToast('API key rotated successfully', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to rotate API key', 'error');
    }
  }, [onShowToast]);

  const handleRevokeSession = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/revoke-sessions');
      onShowToast('All remote sessions revoked', 'warning');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to revoke sessions', 'error');
    }
  }, [onShowToast]);

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">SECURITY</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">SECURITY CENTER</span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[#3d494c] pb-2 text-[12px] font-code-metric">
        {[
          { id: 'events', label: 'Fraud & Risk Events' },
          { id: 'policies', label: 'Policies' },
          { id: 'api-keys', label: 'API Keys' },
          { id: 'sessions', label: 'Sessions' },
          { id: 'mfa', label: 'MFA & Break-Glass' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === tab.id ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#bcc9cd] hover:bg-[#262a33]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'events' && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <h3 className="text-[15px] font-semibold text-[#dfe2ee]">Security Events & Audit Trail</h3>
            <button onClick={refetchAudit} className="px-2 py-1 rounded bg-[#262a33] text-[#4cd7f6] text-[10px] hover:bg-[#353942]">Refresh</button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-[#869397]">Loading security events...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-code-metric text-[12px]">
                <thead className="border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                  <tr>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3d494c]">
                  {auditLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#262a33]/60 transition-colors">
                      <td className="py-3 text-[#4cd7f6]">{log.action}</td>
                      <td className="py-3 text-[#bcc9cd]">{log.entity}</td>
                      <td className="py-3 text-[#869397]">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3 text-[#bcc9cd]">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mfa' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-6 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <h3 className="text-[15px] font-semibold text-[#dfe2ee]">Multi-Factor Authentication</h3>
              <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] border border-[#4edea3]/30">
                {twoFactorEnabled ? 'ENFORCED' : 'DISABLED'}
              </span>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded bg-[#181c24] border border-[#3d494c] cursor-pointer">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-semibold">FIDO2 / WebAuthn Hardware Keys</div>
                  <div className="text-[10px] text-[#bcc9cd]">Require hardware token for all operations</div>
                </div>
                <input type="checkbox" checked={twoFactorEnabled} onChange={handleToggleMfa} className="rounded border-[#3d494c] text-[#4cd7f6]" />
              </label>
              <label className="flex items-center justify-between p-3 rounded bg-[#181c24] border border-[#3d494c] cursor-pointer">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-semibold">IP Allowlist &amp; Carrier CIDR Guard</div>
                  <div className="text-[10px] text-[#bcc9cd]">Restrict auth to /24 corporate MPLS &amp; WireGuard</div>
                </div>
                <input type="checkbox" checked={ipAllowlist} onChange={(e) => { setIpAllowlist(e.target.checked); onShowToast(e.target.checked ? 'IP allowlist enabled' : 'IP allowlist disabled', 'info'); }} className="rounded border-[#3d494c] text-[#4cd7f6]" />
              </label>
            </div>
            <div className="mt-4 pt-3 border-t border-[#3d494c] flex items-center justify-between">
              <button onClick={handleRevokeSession} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffb4ab] text-[11px] hover:bg-[#93000a]/40">
                <span className="material-symbols-outlined text-[14px]">logout</span>
                Revoke All Remote Sessions
              </button>
            </div>
          </div>

          <div className="xl:col-span-6 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <h3 className="text-[15px] font-semibold text-[#dfe2ee]">Break-Glass Controls</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    await setup2FA();
                    onShowToast('Break-glass token generated. CISO notified.', 'warning');
                  } catch (err: any) {
                    onShowToast(err.message || 'Failed to generate break-glass token', 'error');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-[#93000a]/30 border border-[#ffb4ab]/50 text-[#ffb4ab] font-semibold text-[13px] hover:bg-[#93000a]/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">crisis_alert</span>
                Issue Break-Glass Token
              </button>
              <div className="p-3 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[11px] text-[#bcc9cd] space-y-1.5">
                <div className="flex justify-between"><span className="text-[#869397]">Break-Glass PGP Key:</span><span className="text-[#4edea3]">8F4E 3A91 C029 4118 732D BB01 44F9 8812</span></div>
                <div className="flex justify-between"><span className="text-[#869397]">Status:</span><span className="text-[#4edea3]">VERIFIED</span></div>
                <div className="flex justify-between"><span className="text-[#869397]">Last Used:</span><span className="text-[#bcc9cd]">2026-09-24 08:32:14 UTC</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <h3 className="text-[15px] font-semibold text-[#dfe2ee]">API Keys Management</h3>
            <button onClick={handleRotateKey} className="px-3 py-1.5 rounded bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] text-[11px] font-semibold hover:bg-[#4cd7f6]/20">
              Rotate Key
            </button>
          </div>
          <div className="space-y-2">
            {[
              { id: 'key-prod-01', name: 'Carrier Gateway Ingress Token', prefix: 'msg_live_7f3b...', scope: 'REST + SMPP 3.4', active: true },
              { id: 'key-prod-02', name: 'FinTech High-TPS OTP Webhook', prefix: 'msg_live_c029...', scope: 'REST v2.4 (Strict)', active: true },
            ].map((k) => (
              <div key={k.id} className="p-3 rounded bg-[#181c24] border border-[#3d494c] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-semibold">{k.name}</div>
                  <div className="text-[10px] text-[#4cd7f6]">{k.prefix}••••••••</div>
                  <div className="text-[10px] text-[#869397]">{k.scope}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${k.active ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30' : 'bg-[#31353e] text-[#869397] border-[#3d494c]'}`}>
                  {k.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
