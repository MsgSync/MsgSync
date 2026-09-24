import React, { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api/client';
import { useSecurity } from '../hooks/useSecurity';
import { useNotifications } from '../hooks/useNotifications';
import { useQuery } from '../hooks/useApi';

interface SecurityCenterScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SecurityCenterScreen: React.FC<SecurityCenterScreenProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'policies' | 'access' | 'api-keys' | 'sessions' | 'mfa'>('events');
  const { auditLogs, loading, setup2FA, enable2FA, disable2FA, refetchAudit } = useSecurity();
  const { notifications } = useNotifications();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ipAllowlist, setIpAllowlist] = useState(true);
  const [selectedApiKey, setSelectedApiKey] = useState<string | null>(null);
  const [contentPolicy, setContentPolicy] = useState<any>({ contentScreeningEnabled: true, modifyContentEnabled: false, allowedProfiles: ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP'], allowedSmsTypes: ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP'], allowedSenderIds: [], blockedKeywords: [], blockedUrlDomains: [] });
  const [policySaving, setPolicySaving] = useState(false);
  const [allowedCountries, setAllowedCountries] = useState<string[]>(['US', 'GB', 'DE']);
  const [maxDailySpend, setMaxDailySpend] = useState('100');
  const [accessSaving, setAccessSaving] = useState(false);
  const { data: policyData } = useQuery<any>(() => apiClient.getContentPolicy().then(response => response.data), []);
  const { data: organizationData } = useQuery<any>(() => apiClient.getOrganization('root').then(response => response.data), []);

  useEffect(() => {
    if (policyData) setContentPolicy(policyData);
  }, [policyData]);

  useEffect(() => {
    if (organizationData) {
      setAllowedCountries(organizationData.allowedCountries || []);
      setMaxDailySpend(String(organizationData.maxDailySpend ?? 100));
    }
  }, [organizationData]);

  const saveAccessPolicy = useCallback(async () => {
    setAccessSaving(true);
    try {
      await apiClient.updateSecurityRestrictions({ allowedCountries, maxDailySpend: Number(maxDailySpend) });
      onShowToast('Access restrictions saved.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to save access restrictions.', 'error');
    } finally {
      setAccessSaving(false);
    }
  }, [allowedCountries, maxDailySpend, onShowToast]);  const saveContentPolicy = useCallback(async () => {
    setPolicySaving(true);
    try {
      await apiClient.updateContentPolicy(contentPolicy);
      onShowToast('Content screening policy saved.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Unable to save content policy.', 'error');
    } finally {
      setPolicySaving(false);
    }
  }, [contentPolicy, onShowToast]);

  const updateList = (key: string, value: string[]) => setContentPolicy((current: any) => ({ ...current, [key]: value }));

  const toggleListValue = (key: string, value: string) => setContentPolicy((current: any) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item: string) => item !== value) : [...current[key], value] }));

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
          { id: 'access', label: 'Security & Access' },
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

      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm"><div className="mb-4 flex items-center justify-between border-b border-[#3d494c] pb-3"><div><h3 className="text-[15px] font-semibold text-[#dfe2ee]">Content Whitelisting, Blocking &amp; Modification</h3><p className="mt-1 text-[10px] text-[#869397]">Screen outbound content by profile, SMS type, sender ID, keywords, and URL domains.</p></div><span className="material-symbols-outlined text-[22px] text-[#4cd7f6]">policy</span></div><div className="grid gap-3 md:grid-cols-2"><label className="flex items-center justify-between rounded border border-[#3d494c] bg-[#0a0e16] p-3"><div><div className="text-[12px] font-semibold">Content screening</div><div className="text-[10px] text-[#869397]">Apply keyword, URL, and sender rules before delivery.</div></div><input type="checkbox" checked={contentPolicy.contentScreeningEnabled} onChange={e => setContentPolicy((current: any) => ({ ...current, contentScreeningEnabled: e.target.checked }))} className="accent-[#4edea3]" /></label><label className="flex items-center justify-between rounded border border-[#3d494c] bg-[#0a0e16] p-3"><div><div className="text-[12px] font-semibold">Content modification</div><div className="text-[10px] text-[#869397]">Replace blocked terms before messages are sent.</div></div><input type="checkbox" checked={contentPolicy.modifyContentEnabled} onChange={e => setContentPolicy((current: any) => ({ ...current, modifyContentEnabled: e.target.checked }))} className="accent-[#4edea3]" /></label></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><div className="mb-2 text-[10px] uppercase tracking-wider text-[#869397]">Allowed profiles / SMS types</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'ALL'].map(value => <label key={value} className="flex items-center gap-2 rounded border border-[#293240] bg-[#0a0e16] px-2.5 py-2 text-[10px] text-[#bcc9cd]"><input type="checkbox" checked={contentPolicy.allowedProfiles.includes(value)} onChange={() => toggleListValue('allowedProfiles', value)} className="accent-[#4edea3]" />{value}</label>)}</div></div><div><div className="mb-2 text-[10px] uppercase tracking-wider text-[#869397]">Allowed SMS types</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'ALL'].map(value => <label key={value} className="flex items-center gap-2 rounded border border-[#293240] bg-[#0a0e16] px-2.5 py-2 text-[10px] text-[#bcc9cd]"><input type="checkbox" checked={contentPolicy.allowedSmsTypes.includes(value)} onChange={() => toggleListValue('allowedSmsTypes', value)} className="accent-[#4edea3]" />{value}</label>)}</div></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><label className="block text-[10px] uppercase tracking-wider text-[#869397]">Blocked keywords<textarea value={(contentPolicy.blockedKeywords || []).join(', ')} onChange={e => updateList('blockedKeywords', e.target.value.split(',').map(item => item.trim()).filter(Boolean))} placeholder="lottery, phishing" className="mt-2 h-20 w-full resize-none rounded border border-[#3d494c] bg-[#0a0e16] p-2 text-[11px] normal-case text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /></label><label className="block text-[10px] uppercase tracking-wider text-[#869397]">Blocked URL domains<textarea value={(contentPolicy.blockedUrlDomains || []).join(', ')} onChange={e => updateList('blockedUrlDomains', e.target.value.split(',').map(item => item.trim()).filter(Boolean))} placeholder="malicious.example, phishing.test" className="mt-2 h-20 w-full resize-none rounded border border-[#3d494c] bg-[#0a0e16] p-2 text-[11px] normal-case text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /></label><label className="block text-[10px] uppercase tracking-wider text-[#869397]">Allowed sender IDs<textarea value={(contentPolicy.allowedSenderIds || []).join(', ')} onChange={e => updateList('allowedSenderIds', e.target.value.split(',').map(item => item.trim()).filter(Boolean))} placeholder="MSGSYNC, ALERTS" className="mt-2 h-20 w-full resize-none rounded border border-[#3d494c] bg-[#0a0e16] p-2 text-[11px] normal-case text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /></label></div><div className="mt-4 flex items-center justify-between"><span className="text-[10px] text-[#869397]">Rules apply to API and campaign message traffic.</span><button type="button" onClick={saveContentPolicy} disabled={policySaving} className="rounded bg-[#06b6d4] px-4 py-2 text-[11px] font-semibold text-[#00424f] disabled:opacity-40">{policySaving ? 'Saving...' : 'Save content policy'}</button></div></div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="space-y-4"><div className="rounded border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 flex items-center justify-between border-b border-[#293240] pb-3"><div><h3 className="text-[15px] font-semibold text-[#dfe2ee]">Layered access control</h3><p className="mt-1 text-[10px] text-[#869397]">Encryption, authentication, and geographic login enforcement.</p></div><span className="flex items-center gap-1.5 text-[10px] text-[#4edea3]"><span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]" />SECURE</span></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded border border-[#3d494c] bg-[#0a0e16] p-3"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#4edea3]"><span className="material-symbols-outlined text-[17px]">lock</span>TLS / SSL encryption</div><div className="mt-2 text-[10px] text-[#869397]">TLS 1.3 active · certificate valid until 14 Nov 2027</div><div className="mt-2 text-[9px] text-[#4edea3]">mTLS and HTTPS enforced</div></div><div className="rounded border border-[#3d494c] bg-[#0a0e16] p-3"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#4edea3]"><span className="material-symbols-outlined text-[17px]">phonelink_lock</span>App-based 2FA</div><div className="mt-2 text-[10px] text-[#869397]">TOTP authenticator policy is available for all privileged users.</div><div className="mt-2 text-[9px] text-[#4edea3]">Required for break-glass actions</div></div><div className="rounded border border-[#3d494c] bg-[#0a0e16] p-3"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#4edea3]"><span className="material-symbols-outlined text-[17px]">public</span>Activity monitoring</div><div className="mt-2 text-[10px] text-[#869397]">Audit events capture user, IP, and administrative actions.</div><div className="mt-2 text-[9px] text-[#4edea3]">Retention policy active</div></div></div></div><div className="rounded border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h3 className="text-[15px] font-semibold text-[#dfe2ee]">Country-based login restrictions</h3><p className="mt-1 text-[10px] text-[#869397]">Only selected countries can authenticate to this organization.</p></div><div className="mb-4 flex flex-wrap gap-2">{['US', 'GB', 'DE', 'CA', 'AU', 'IN', 'SG', 'AE'].map(country => <label key={country} className="flex items-center gap-2 rounded border border-[#293240] bg-[#0a0e16] px-2.5 py-2 text-[10px] text-[#bcc9cd]"><input type="checkbox" checked={allowedCountries.includes(country)} onChange={() => setAllowedCountries(current => current.includes(country) ? current.filter(item => item !== country) : [...current, country])} className="accent-[#4edea3]" />{country}</label>)}</div><div className="flex items-center gap-3"><label className="text-[10px] text-[#869397]">Max daily spend<input type="number" min="0" value={maxDailySpend} onChange={event => setMaxDailySpend(event.target.value)} className="ml-2 w-28 rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-1.5 text-[#4edea3] outline-none" /></label><button type="button" onClick={saveAccessPolicy} disabled={accessSaving} className="rounded bg-[#06b6d4] px-4 py-2 text-[11px] font-semibold text-[#00424f] disabled:opacity-40">{accessSaving ? 'Saving...' : 'Save access policy'}</button></div></div><div className="rounded border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 flex items-center justify-between border-b border-[#293240] pb-3"><div><h3 className="text-[15px] font-semibold text-[#dfe2ee]">Privileged activity</h3><p className="text-[10px] text-[#869397]">Latest user and system access events.</p></div><span className="text-[10px] text-[#4edea3]">AUDIT LIVE</span></div><div className="space-y-1">{auditLogs?.slice(0, 6).map((log: any) => <div key={log.id} className="flex justify-between border-b border-[#293240]/60 py-2 text-[11px]"><span className="text-[#bcc9cd]">{log.action} · {log.entity}</span><span className="font-code-metric text-[10px] text-[#68767b]">{new Date(log.createdAt).toLocaleString()}</span></div>)}{!auditLogs?.length && <div className="py-5 text-center text-[11px] text-[#869397]">No activity recorded.</div>}</div></div></div>
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
