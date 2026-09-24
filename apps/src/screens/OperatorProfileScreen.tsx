import React, { useState } from 'react';
import { ClusterSession } from '../types';

interface OperatorProfileScreenProps {
  sessions: ClusterSession[];
  currentUser?: any;
  onRevokeSessions: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const OperatorProfileScreen: React.FC<OperatorProfileScreenProps> = ({
  sessions,
  currentUser,
  onRevokeSessions,
  onShowToast,
}) => {
  const [profileName, setProfileName] = useState(currentUser?.name || 'Marcus Vance');
  const [profileTitle, setProfileTitle] = useState('VP Infrastructure & Principal Telecom Systems Architect');
  const [profileMsisdn, setProfileMsisdn] = useState('+1 (202) 555-0194');

  // Modal states
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [breakGlassTicket, setBreakGlassTicket] = useState('');

  // Security toggles
  const [ipAllowlist, setIpAllowlist] = useState(true);
  const [dualAuth, setDualAuth] = useState(true);
  const [idleTimeout, setIdleTimeout] = useState('30 Minutes (Policy)');
  const [refreshRate, setRefreshRate] = useState('1s (Default)');
  const [hexSniffer, setHexSniffer] = useState(true);

  // Audio alarms
  const [alarmSctp, setAlarmSctp] = useState(true);
  const [alarmSmpp, setAlarmSmpp] = useState(true);
  const [alarmLatency, setAlarmLatency] = useState(false);

  // Download cryptographic audit log
  const handleDownloadAudit = () => {
    const auditPayload = {
      operator: profileName,
      uid: 'UID-OP-9842-CORP',
      timestamp: new Date().toISOString(),
      clearance: 'LEVEL_4_TOP_SECRET',
      carrier: 'GlobalTel Direct (Tier-1)',
      activeSessions: sessions.length,
      fidoKeysEnforced: ['YubiKey 5C NFC (Primary Core)', 'YubiKey Bio Corp Vault'],
      securityPolicies: {
        ipAllowlistMpls: ipAllowlist,
        dualAuthRouting: dualAuth,
        idleTimeoutPolicy: idleTimeout,
      },
      recordsExported: 489,
      integrityHash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };
    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-vance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Security Audit Log (JSON) downloaded successfully.', 'success');
  };

  const handleBreakGlassConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBreakGlassOpen(false);
    onShowToast(
      `ALERT: Emergency Break-Glass Token Generated for ${breakGlassTicket || 'SEV0-INC-88912'}. CISO Hotline Notified.`,
      'error'
    );
    setBreakGlassTicket('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditProfileOpen(false);
    onShowToast('Operator Profile metadata successfully updated.', 'success');
  };

  const handleAddFidoKey = () => {
    onShowToast('Insert FIDO2/WebAuthn hardware key and touch capacitive sensor...', 'info');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Breadcrumb & Status Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">IAM &amp; SECURITY</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">{profileName.toUpperCase()} [UID-OP-9842]</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[10px] text-[#bcc9cd]">
            <span className="h-2 w-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span>VAULT ENCLAVE: SEALED (HARDWARE HSM)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[10px] text-[#4cd7f6]">
            <span>SECURITY CLEARANCE: TIER-1 CORE</span>
          </div>
        </div>
      </div>

      {/* 1. Top Section / User Identity Banner */}
      <section className="rounded bg-[#1c2028] p-4 mb-4 border border-[#3d494c] shadow-sm relative overflow-hidden">
        {/* Ambient Energy Glow */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#4cd7f6]/5 pointer-events-none blur-3xl"></div>

        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 relative z-10">
          {/* Left: User Identity Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <img
                alt="Marcus Vance Headshot"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover border-2 border-[#4cd7f6]/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WaLh_MJPJCdZ7WMBb8vtS5i_mTePoU2dzQw09cMywh6RTqev999JV8SwFZ3fyK_srhgJ0axT7WXiziu59k3iQd31sSNLmmmNMr5_viOnTiPSEwM5iGDG5F0M1juHaf6-8ko6sl44botuHBT5Ism1MdXv8Trt5HZVpJiPx6ftZdQ4H9-YZbgOM5SrzDL6H2AAOiThmOVQ-Uqvcz9KtG7gRoNsdMp41pGu2yC4LAveXw"
              />
              <span
                className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4edea3] text-[#0a0e16] font-bold text-[10px]"
                title="Hardware Token FIDO2 Active"
              >
                <span className="material-symbols-outlined text-[12px]">key</span>
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-[28px] text-[#dfe2ee] font-semibold tracking-tight leading-tight">
                  {profileName}
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] font-code-metric text-[10px] font-semibold tracking-wide">
                  SUPERADMIN / INFRA OWNER
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#31353e] border border-[#3d494c] text-[#bcc9cd] font-code-metric text-[10px]">
                  UID-OP-9842-CORP
                </span>
              </div>
              <p className="text-[13px] text-[#bcc9cd] mb-2">
                {profileTitle} •{' '}
                <span className="text-[#dfe2ee] font-medium">GlobalTel Direct</span> (Tier-1 Carrier License)
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#bcc9cd] font-code-metric text-[12px]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#869397] text-[16px]">mail</span>
                  <span className="text-[#dfe2ee]">m.vance@globaltel.carrier.net</span>
                </div>
                <span className="text-[#3d494c]">•</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#869397] text-[16px]">call</span>
                  <span className="text-[#dfe2ee]">{profileMsisdn}</span>
                  <span className="text-[#4edea3] font-code-metric text-[10px]">(Hardware Bound)</span>
                </div>
                <span className="text-[#3d494c]">•</span>
                <div className="flex items-center gap-1 text-[#869397]">
                  <span className="material-symbols-outlined text-[16px]">event_available</span>
                  <span>Member since March 2021</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Triggers & Session Status Pills */}
          <div className="flex flex-col items-start xl:items-end gap-2 w-full xl:w-auto">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] font-code-metric text-[10px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]"></span>
                SESSION ACTIVE (4H 12M)
              </span>
              <span className="px-2.5 py-1 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] font-code-metric text-[10px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[14px]">shield</span>
                FIDO2 ENFORCED
              </span>
              <span className="px-2.5 py-1 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] font-code-metric text-[10px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[#4edea3] text-[14px]">token</span>
                CLUSTER ROOT AUTHORIZED
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1 w-full xl:w-auto">
              <button
                onClick={handleDownloadAudit}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] hover:bg-[#353942] transition-colors text-[12px]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">download</span>
                <span>Audit Log (JSON)</span>
              </button>
              <button
                onClick={() => setIsBreakGlassOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#93000a]/40 border border-[#ffb4ab]/50 text-[#ffb4ab] hover:bg-[#93000a] transition-colors text-[12px] font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">emergency</span>
                <span>Break-Glass Token</span>
              </button>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all text-[12px] font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-column Grid Layout (7 cols / 5 cols layout on desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* ==================== COLUMN A (7 COLS): RBAC & CLUSTER SESSIONS ==================== */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* CARD 1: Role & Granular Team RBAC Matrix */}
          <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">admin_panel_settings</span>
                <h2 className="text-[15px] text-[#dfe2ee] font-semibold">RBAC &amp; Carrier Core Authorization Matrix</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] font-code-metric text-[10px] font-semibold">
                LEVEL 4 TOP-SECRET
              </span>
            </div>

            {/* Role Summary Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-[#262a33] text-[#4cd7f6]">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-semibold">Telecom Infrastructure Architect (Tier-1 Root)</div>
                  <div className="font-code-metric text-[10px] text-[#869397]">
                    POLICY ID: iam-carrier-spec-v4.2.1 • ATTESTATION VALID
                  </div>
                </div>
              </div>
              <span className="font-code-metric text-[10px] px-2 py-0.5 rounded bg-[#1c2028] text-[#bcc9cd] border border-[#3d494c]">
                Full Granular Scope
              </span>
            </div>

            {/* Permissions Granular Domain Breakdown */}
            <div className="space-y-1.5">
              {/* Item 1 */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 hover:border-[#4cd7f6]/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] mt-0.5">hub</span>
                  <div>
                    <div className="text-[12px] text-[#dfe2ee] font-medium">Signaling &amp; SS7/SIGTRAN Gateways</div>
                    <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                      Full Read/Write/Deploy (M3UA, SCCP, GTT Point Codes 3-042-1)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 font-code-metric text-[10px]">
                    DEPLOY_CAPABLE
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2028] text-[#bcc9cd] border border-[#3d494c] font-code-metric text-[10px]">
                    ROOT
                  </span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 hover:border-[#4cd7f6]/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] mt-0.5">settings_ethernet</span>
                  <div>
                    <div className="text-[12px] text-[#dfe2ee] font-medium">SMPP Transceiver Trunks</div>
                    <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                      Master Admin (Bind/Unbind, Window Scaling, Rate Shaping)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <span className="px-1.5 py-0.5 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 font-code-metric text-[10px]">
                    TRUNK_OVERRIDE
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2028] text-[#bcc9cd] border border-[#3d494c] font-code-metric text-[10px]">
                    ALL_REGIONS
                  </span>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 hover:border-[#4cd7f6]/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] mt-0.5">alt_route</span>
                  <div>
                    <div className="text-[12px] text-[#dfe2ee] font-medium">LCR &amp; Carrier Routing Engine</div>
                    <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                      Authorizer (Can push hot-reload routing tables &amp; cost weights)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 font-code-metric text-[10px]">
                    HOT_RELOAD
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2028] text-[#bcc9cd] border border-[#3d494c] font-code-metric text-[10px]">
                    DUAL_APPROVAL
                  </span>
                </div>
              </div>

              {/* Item 4 */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 hover:border-[#4cd7f6]/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] mt-0.5">account_balance_wallet</span>
                  <div>
                    <div className="text-[12px] text-[#dfe2ee] font-medium">Financial &amp; Billing Ledger</div>
                    <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                      Billing Approver (Credit adjustments up to $500,000/day)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <span className="px-1.5 py-0.5 rounded bg-[#d0bcff]/15 text-[#d0bcff] border border-[#d0bcff]/30 font-code-metric text-[10px]">
                    $500K_DAILY
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2028] text-[#bcc9cd] border border-[#3d494c] font-code-metric text-[10px]">
                    AUDITED
                  </span>
                </div>
              </div>

              {/* Item 5 */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 hover:border-[#4cd7f6]/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] mt-0.5">vpn_key</span>
                  <div>
                    <div className="text-[12px] text-[#dfe2ee] font-medium">Developer APIs &amp; HMAC Webhooks</div>
                    <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                      Key Administrator (Rotate cluster signing certs, mTLS CA)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <span className="px-1.5 py-0.5 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 font-code-metric text-[10px]">
                    CA_SIGNER
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2028] text-[#bcc9cd] border border-[#3d494c] font-code-metric text-[10px]">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Item 6 */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 hover:border-[#4cd7f6]/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] mt-0.5">fact_check</span>
                  <div>
                    <div className="text-[12px] text-[#dfe2ee] font-medium">Audit &amp; Compliance</div>
                    <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                      Unrestricted Log Access (PCAP packet traces, DLR records, PII scrubbed view)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 font-code-metric text-[10px]">
                    PCAP_DUMP
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2028] text-[#bcc9cd] border border-[#3d494c] font-code-metric text-[10px]">
                    UNRESTRICTED
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Teams & Groups */}
            <div className="mt-4 pt-3 border-t border-[#3d494c]">
              <div className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold mb-2">
                Assigned Tactical Operations Teams
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#dfe2ee] font-semibold">NOC Core Ops</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-code-metric text-[10px]">
                      TEAM LEAD
                    </span>
                  </div>
                  <span className="text-[11px] text-[#bcc9cd]">14 Members • 24/7 Shift Escalation</span>
                </div>

                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#dfe2ee] font-semibold">Carrier SIGTRAN SIG</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#31353e] text-[#bcc9cd] font-code-metric text-[10px]">
                      STEERING
                    </span>
                  </div>
                  <span className="text-[11px] text-[#bcc9cd]">Global ITU-T &amp; 3GPP Routing Body</span>
                </div>

                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#ffb4ab] font-semibold">Sev-0 PagerDuty</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#93000a]/30 text-[#ffb4ab] font-code-metric text-[10px]">
                      PRIMARY
                    </span>
                  </div>
                  <span className="text-[11px] text-[#bcc9cd]">SLA &lt;3 min response • Direct SMS/Voice</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Recent Infrastructure Cluster Login & Session Activity */}
          <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 mb-3 border-b border-[#3d494c] gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">history</span>
                  <h2 className="text-[15px] text-[#dfe2ee] font-semibold">Cluster Authentications &amp; Global Session Stream</h2>
                </div>
                <p className="text-[11px] text-[#bcc9cd] mt-0.5">
                  Real-time audit log across edge ingress nodes and control planes
                </p>
              </div>
              <button
                onClick={onRevokeSessions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#93000a]/40 transition-colors text-[12px] font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Revoke Remote Sessions</span>
              </button>
            </div>

            {/* High-density stream table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#3d494c] text-[10px] uppercase tracking-wider text-[#869397]">
                    <th className="pb-2 font-semibold">Target Node / Cluster</th>
                    <th className="pb-2 font-semibold">Auth Method &amp; IP</th>
                    <th className="pb-2 font-semibold">Location / Origin</th>
                    <th className="pb-2 font-semibold">Timestamp</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3d494c] font-code-metric text-[12px]">
                  {sessions.map((sess) => (
                    <tr
                      key={sess.id}
                      className={`hover:bg-[#262a33]/60 transition-colors ${
                        sess.status === 'TERMINATED' || sess.status === 'EXPIRED' ? 'opacity-80' : ''
                      }`}
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              sess.isCurrent ? 'bg-[#4edea3]' : 'bg-[#869397]'
                            }`}
                          ></span>
                          <span className={`font-bold ${sess.isCurrent ? 'text-[#dfe2ee]' : 'text-[#dfe2ee]/90'}`}>
                            {sess.cluster}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#869397]">{sess.node}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className={sess.isCurrent ? 'text-[#4cd7f6] font-medium' : 'text-[#dfe2ee]'}>
                          {sess.authMethod}
                        </div>
                        <div className="text-[10px] text-[#bcc9cd]">
                          {sess.ip} • {sess.vpn}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="text-[#dfe2ee]">{sess.location}</div>
                        <div className="text-[10px] text-[#869397]">{sess.asOrigin}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-[#bcc9cd]">
                        {sess.timestamp.split('•')[0]}
                        <div
                          className={`text-[10px] ${
                            sess.isCurrent ? 'text-[#4edea3]' : 'text-[#869397]'
                          }`}
                        >
                          {sess.timestamp.split('•')[1] || ''}
                        </div>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {sess.isCurrent ? (
                          <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 text-[10px] font-semibold">
                            PRIMARY CONSOLE
                          </span>
                        ) : sess.status === 'TERMINATED' ? (
                          <span className="px-2 py-0.5 rounded bg-[#31353e] text-[#bcc9cd] border border-[#3d494c] text-[10px]">
                            TERMINATED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#31353e] text-[#869397] border border-[#3d494c] text-[10px]">
                            EXPIRED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#bcc9cd] font-code-metric text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-[16px]">security</span>
                <span>Zero-Trust Enclave verification enforced on all inbound carrier control packets.</span>
              </div>
              <span className="text-[#869397]">POLICY ENFORCEMENT: 100% OK</span>
            </div>
          </div>
        </div>

        {/* ==================== COLUMN B (5 COLS): SECURITY TOGGLES & NOC PREFERENCES ==================== */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* CARD 3: Account Security & Authentication Toggles */}
          <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">security</span>
                <h2 className="text-[15px] text-[#dfe2ee] font-semibold">Security Credential Enclave</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[10px] text-[#4edea3]">
                MFA STRICT
              </span>
            </div>

            <div className="space-y-3">
              {/* Hardware Security Keys */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">key</span>
                    <span className="text-[12px] font-semibold text-[#dfe2ee]">FIDO2 / WebAuthn Hardware Keys</span>
                  </div>
                  <button
                    onClick={handleAddFidoKey}
                    className="px-2 py-0.5 rounded bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] hover:bg-[#4cd7f6]/20 transition-colors font-code-metric text-[10px] font-semibold"
                  >
                    + Add FIDO Key
                  </button>
                </div>
                <div className="flex flex-col gap-1 pl-6">
                  <div className="flex items-center justify-between text-[#bcc9cd] font-code-metric text-[10px]">
                    <span>1. YubiKey 5C NFC (Primary Core)</span>
                    <span className="text-[#4edea3]">ACTIVE • SL-1</span>
                  </div>
                  <div className="flex items-center justify-between text-[#bcc9cd] font-code-metric text-[10px]">
                    <span>2. YubiKey Bio Corp Vault (Backup)</span>
                    <span className="text-[#4edea3]">ACTIVE • SL-2</span>
                  </div>
                </div>
              </div>

              {/* Multi-Factor Authentication */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-medium">Multi-Factor Authentication (Strict)</div>
                  <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                    FIDO2 Hardware Key required + TOTP fallback enabled
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 font-code-metric text-[10px]">
                  ENFORCED
                </span>
              </div>

              {/* Terminal / CLI Public Keys */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">terminal</span>
                    <span className="text-[12px] font-semibold text-[#dfe2ee]">CLI SSH &amp; mTLS Passkeys</span>
                  </div>
                  <span className="font-code-metric text-[10px] text-[#bcc9cd]">2 Registered</span>
                </div>
                <div className="space-y-1 font-code-metric text-[10px] text-[#869397] pl-6">
                  <div className="flex items-center justify-between text-[#bcc9cd]">
                    <span>id_ed25519_noc_prod</span>
                    <span className="text-[#4cd7f6] font-semibold">SHA256:7f3b...9a41</span>
                  </div>
                  <div className="flex items-center justify-between text-[#bcc9cd]">
                    <span>rsa4096_corp_jump</span>
                    <span className="text-[#dfe2ee] font-semibold">SHA256:c029...e412</span>
                  </div>
                </div>
              </div>

              {/* Break-Glass PGP Key */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-[12px] text-[#dfe2ee] font-medium">Emergency Break-Glass PGP Key</div>
                  <div className="font-code-metric text-[10px] text-[#bcc9cd] truncate">
                    8F4E 3A91 C029 4118 732D BB01 44F9 8812
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 font-code-metric text-[10px] whitespace-nowrap">
                  VERIFIED
                </span>
              </div>

              {/* IP Allowlist Toggle */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-medium">IP Allowlist &amp; Carrier CIDR Guard</div>
                  <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                    Restrict auth to /24 corporate MPLS &amp; WireGuard
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ipAllowlist}
                    onChange={(e) => {
                      setIpAllowlist(e.target.checked);
                      onShowToast(
                        e.target.checked
                          ? 'IP Allowlist Guard enforced (/24 MPLS enabled).'
                          : 'IP Allowlist relaxed to global trusted subnets.',
                        'info'
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#262a33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0f131c] peer-checked:bg-[#4edea3] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0f131c] after:border-[#0f131c] after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>

              {/* Dual-Authorization Routing Safety */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-medium">Dual-Authorization Routing Safety</div>
                  <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                    Require second NOC operator signoff for LCR changes
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dualAuth}
                    onChange={(e) => {
                      setDualAuth(e.target.checked);
                      onShowToast(
                        e.target.checked
                          ? 'Dual-Authorization requirement activated.'
                          : 'Dual-Authorization requirement bypassed (Audit recorded).',
                        'warning'
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#262a33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0f131c] peer-checked:bg-[#06b6d4] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0f131c] after:border-[#0f131c] after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>

              {/* Idle Session Timeout */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-medium">Idle Session Inactivity Lockout</div>
                  <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                    Automatic console lock on inactive terminal
                  </div>
                </div>
                <select
                  value={idleTimeout}
                  onChange={(e) => {
                    setIdleTimeout(e.target.value);
                    onShowToast(`Session idle lock set to ${e.target.value}.`, 'info');
                  }}
                  className="bg-[#0a0e16] border border-[#3d494c] rounded px-2 py-1 font-code-metric text-[11px] text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                >
                  <option>30 Minutes (Policy)</option>
                  <option>15 Minutes</option>
                  <option>10 Minutes</option>
                  <option>60 Minutes (Requires VP signoff)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CARD 4: Personal Operational Preferences */}
          <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">tune</span>
                <h2 className="text-[15px] text-[#dfe2ee] font-semibold">Console Preferences &amp; Telemetry Tuning</h2>
              </div>
              <span className="font-code-metric text-[10px] text-[#869397]">NOC OPERATOR ENV</span>
            </div>

            <div className="space-y-3">
              {/* Telemetry Stream Refresh Rate */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#dfe2ee]">Telemetry Stream Refresh Rate</span>
                  <span className="font-code-metric text-[10px] text-[#4cd7f6] font-bold">
                    {refreshRate}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-0.5 rounded bg-[#0a0e16] border border-[#3d494c]">
                  {['250ms', '500ms', '1s (Default)', '5s'].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setRefreshRate(rate);
                        onShowToast(`Telemetry polling frequency adjusted to ${rate}`, 'info');
                      }}
                      className={`py-1 rounded text-center font-code-metric text-[10px] transition-colors ${
                        refreshRate === rate
                          ? 'bg-[#06b6d4] text-[#00424f] font-semibold shadow-sm'
                          : 'text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#1c2028]'
                      }`}
                    >
                      {rate.replace(' (Default)', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Alarms */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[#dfe2ee] mb-0.5">Critical Incident NOC Audio Alarms</span>
                
                <label className="flex items-center justify-between text-[12px] cursor-pointer">
                  <div className="flex items-center gap-1.5 font-code-metric text-[10px] text-[#bcc9cd]">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[16px]">volume_up</span>
                    <span>SS7 Association CRC Breach</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alarmSctp}
                    onChange={(e) => {
                      setAlarmSctp(e.target.checked);
                      onShowToast(e.target.checked ? 'SS7 CRC Alarm enabled.' : 'SS7 CRC Alarm muted.', 'info');
                    }}
                    className="rounded border-[#3d494c] text-[#4cd7f6] focus:ring-0 bg-[#0a0e16]"
                  />
                </label>

                <label className="flex items-center justify-between text-[12px] cursor-pointer">
                  <div className="flex items-center gap-1.5 font-code-metric text-[10px] text-[#bcc9cd]">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[16px]">volume_up</span>
                    <span>SMPP Error Rate &gt; 1% (Drop Spike)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alarmSmpp}
                    onChange={(e) => {
                      setAlarmSmpp(e.target.checked);
                      onShowToast(e.target.checked ? 'SMPP Error Spike Alarm enabled.' : 'SMPP Error Spike Alarm muted.', 'info');
                    }}
                    className="rounded border-[#3d494c] text-[#4cd7f6] focus:ring-0 bg-[#0a0e16]"
                  />
                </label>

                <label className="flex items-center justify-between text-[12px] cursor-pointer">
                  <div className="flex items-center gap-1.5 font-code-metric text-[10px] text-[#869397]">
                    <span className={`material-symbols-outlined text-[16px] ${alarmLatency ? 'text-[#ffb4ab]' : 'text-[#869397]'}`}>
                      {alarmLatency ? 'volume_up' : 'volume_off'}
                    </span>
                    <span>SLA Latency Drift &gt; 150ms</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alarmLatency}
                    onChange={(e) => {
                      setAlarmLatency(e.target.checked);
                      onShowToast(e.target.checked ? 'Latency Drift Alarm armed.' : 'Latency Drift Alarm disabled.', 'info');
                    }}
                    className="rounded border-[#3d494c] text-[#4cd7f6] focus:ring-0 bg-[#0a0e16]"
                  />
                </label>
              </div>

              {/* Default Routing Region & Timezone */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#dfe2ee]">
                  Default Cluster Routing Region &amp; Timezone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-[#0a0e16] border border-[#3d494c] rounded px-2 py-1 font-code-metric text-[11px] text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]">
                    <option defaultValue="UTC">UTC (Coordinated Universal Time)</option>
                    <option>EST / EDT (UTC-5)</option>
                    <option>CET / CEST (UTC+1)</option>
                    <option>SGT (UTC+8)</option>
                  </select>
                  <select className="bg-[#0a0e16] border border-[#3d494c] rounded px-2 py-1 font-code-metric text-[11px] text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]">
                    <option defaultValue="AWS us-east-1">AWS us-east-1 (Primary)</option>
                    <option>EU-West-1 (Frankfurt)</option>
                    <option>AP-Southeast-1 (Singapore)</option>
                  </select>
                </div>
              </div>

              {/* Packet Sniffer Hex View Format */}
              <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#dfe2ee] font-medium">SS7 / SMPP Packet Sniffer Hex View</div>
                  <div className="font-code-metric text-[10px] text-[#bcc9cd]">
                    Split Hex &amp; ASCII with syntax color highlighting
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hexSniffer}
                    onChange={(e) => {
                      setHexSniffer(e.target.checked);
                      onShowToast(
                        e.target.checked
                          ? 'Hex sniffer split mode enabled.'
                          : 'Hex sniffer simplified format enabled.',
                        'info'
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#262a33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0f131c] peer-checked:bg-[#4edea3] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0f131c] after:border-[#0f131c] after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Break-Glass Emergency Token Generator */}
      {isBreakGlassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f131c]/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg bg-[#1c2028] border border-[#ffb4ab]/50 p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2 text-[#ffb4ab] text-[18px] font-semibold">
                <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
                <span>Break-Glass Token Issuance</span>
              </div>
              <button
                onClick={() => setIsBreakGlassOpen(false)}
                className="text-[#869397] hover:text-[#dfe2ee]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-[13px] text-[#bcc9cd] mb-3 leading-relaxed">
              Generating an emergency break-glass token bypasses secondary IAM quorum checks and grants raw root level socket access for 60 minutes. This action is permanently logged to immutable regulatory WORM storage.
            </p>

            <div className="p-2.5 rounded bg-[#0a0e16] border border-[#ffb4ab]/30 font-code-metric text-[11px] text-[#ffb4ab] mb-4">
              WARNING: An automated high-priority alert will be sent to the GlobalTel direct carrier security board and CISO hotline upon confirmation.
            </div>

            <form onSubmit={handleBreakGlassConfirm}>
              <div className="flex flex-col gap-1 mb-5">
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold">
                  Incident Ticket Reference (Jira / ServiceNow / PagerDuty)
                </label>
                <input
                  required
                  value={breakGlassTicket}
                  onChange={(e) => setBreakGlassTicket(e.target.value)}
                  className="px-3 py-2 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[12px] text-[#dfe2ee] focus:outline-none focus:border-[#ffb4ab]"
                  placeholder="e.g. SEV0-INC-88912"
                  type="text"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBreakGlassOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] hover:bg-[#353942] text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#93000a] text-[#ffb4ab] text-[12px] font-semibold hover:bg-[#93000a]/80 transition-colors"
                >
                  Issue Root Token (FIDO Touch Required)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Operator Profile */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f131c]/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg bg-[#1c2028] border border-[#3d494c] p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2 text-[#dfe2ee] text-[18px] font-semibold">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[24px]">manage_accounts</span>
                <span>Edit Operator Profile</span>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#869397] hover:text-[#dfe2ee]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-[12px]">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                  Display Name
                </label>
                <input
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                  type="text"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                  Operational Role Title
                </label>
                <input
                  required
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                  type="text"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                  Emergency Escalation MSISDN
                </label>
                <input
                  required
                  value={profileMsisdn}
                  onChange={(e) => setProfileMsisdn(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[12px] text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                  type="text"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] hover:bg-[#353942] text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
