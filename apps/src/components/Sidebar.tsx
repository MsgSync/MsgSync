import React from 'react';
import { ScreenId } from '../types';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  activeSmppCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, activeSmppCount }) => {
  const isNavActive = (id: ScreenId) => currentScreen === id;

  const getLinkClasses = (active: boolean) =>
    `flex items-center justify-between px-2.5 py-1.5 rounded transition-all text-[12px] ${
      active
        ? 'bg-[#06b6d4] text-[#00424f] font-semibold shadow-[0_0_8px_rgba(6,182,212,0.25)]'
        : 'text-[#bcc9cd] hover:bg-[#262a33] hover:text-[#dfe2ee]'
    }`;

  return (
    <aside className="fixed left-0 top-14 bottom-8 w-64 bg-[#181c24] border-r border-[#3d494c] z-40 flex flex-col justify-between overflow-y-auto select-none">
      <div className="p-2 space-y-3">
        {/* OVERVIEW */}
        <div>
          <div className="px-2 py-1">
            <span className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold">OVERVIEW</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className={getLinkClasses(isNavActive('dashboard'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                  isNavActive('dashboard')
                    ? 'bg-[#00424f] text-[#4cd7f6] border-[#00424f]'
                    : 'bg-[#262a33] text-[#4cd7f6] border-[#3d494c]'
                }`}
              >
                CORE
              </span>
            </button>

            <button
              onClick={() => onNavigate('live-monitor')}
              className={getLinkClasses(isNavActive('live-monitor'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span>Live Monitor</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 font-code-metric">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                LIVE
              </span>
            </button>
          </nav>
        </div>

        {/* MESSAGING */}
        <div>
          <div className="px-2 py-1">
            <span className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold">MESSAGING</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            <button
              onClick={() => onNavigate('message-center')}
              className={getLinkClasses(isNavActive('message-center'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Message Center</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('otp-service')}
              className={getLinkClasses(isNavActive('otp-service'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">key</span>
                <span>OTP Service</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('campaigns')}
              className={getLinkClasses(isNavActive('campaigns'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                <span>Campaigns</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('contacts-and-segments')}
              className={getLinkClasses(isNavActive('contacts-and-segments'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>Contacts &amp; Segments</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('sender-ids')}
              className={getLinkClasses(isNavActive('sender-ids'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>Sender IDs</span>
              </div>
            </button>
          </nav>
        </div>

        {/* TELECOM & ROUTING */}
        <div>
          <div className="px-2 py-1">
            <span className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold">TELECOM &amp; ROUTING</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            <button
              onClick={() => onNavigate('smpp-connections')}
              className={getLinkClasses(isNavActive('smpp-connections'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">settings_ethernet</span>
                <span>SMPP Connections</span>
              </div>
              <span
                className={`font-code-metric text-[10px] px-1.5 py-0.5 rounded border ${
                  isNavActive('smpp-connections')
                    ? 'bg-[#00424f] text-[#4edea3] border-[#00424f]'
                    : 'bg-[#1c2028] text-[#4edea3] border-[#3d494c]'
                }`}
              >
                {activeSmppCount} active
              </span>
            </button>

            <button
              onClick={() => onNavigate('ss7-sigtran')}
              className={getLinkClasses(isNavActive('ss7-sigtran'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">hub</span>
                <span>SS7 / SIGTRAN</span>
              </div>
              <span
                className={`font-code-metric text-[10px] px-1.5 py-0.5 rounded border ${
                  isNavActive('ss7-sigtran')
                    ? 'bg-[#00424f] text-[#4cd7f6] border-[#00424f]'
                    : 'bg-[#1c2028] text-[#4cd7f6] border-[#3d494c]'
                }`}
              >
                6 linksets
              </span>
            </button>

            <button
              onClick={() => onNavigate('providers')}
              className={getLinkClasses(isNavActive('providers'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">lan</span>
                <span>Providers</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('intelligent-routing')}
              className={getLinkClasses(isNavActive('intelligent-routing'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">alt_route</span>
                <span>Intelligent Routing</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('hlr-mnp-lookup')}
              className={getLinkClasses(isNavActive('hlr-mnp-lookup'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">find_in_page</span>
                <span>HLR / MNP Lookup</span>
              </div>
            </button>
          </nav>
        </div>

        {/* MANAGEMENT & BILLING */}
        <div>
          <div className="px-2 py-1">
            <span className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold">MANAGEMENT &amp; BILLING</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            <button
              onClick={() => onNavigate('billing-and-credit-ledger')}
              className={getLinkClasses(isNavActive('billing-and-credit-ledger'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>Billing &amp; Credit Ledger</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('organizations-and-tenants')}
              className={getLinkClasses(isNavActive('organizations-and-tenants'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                <span>Organizations &amp; Tenants</span>
              </div>
            </button>
          </nav>
        </div>

        {/* DEVELOPER & PLATFORM */}
        <div>
          <div className="px-2 py-1">
            <span className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold">DEVELOPER &amp; PLATFORM</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            <button
              onClick={() => onNavigate('developer-portal-and-apis')}
              className={getLinkClasses(isNavActive('developer-portal-and-apis'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">api</span>
                <span>Developer Portal &amp; APIs</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('iam-security')}
              className={getLinkClasses(isNavActive('iam-security'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">security</span>
                <span>Security Center</span>
              </div>
              <span
                className={`text-[9px] px-1 py-0.5 rounded font-code-metric border ${
                  isNavActive('iam-security')
                    ? 'bg-[#00424f] text-[#4cd7f6] border-[#00424f]'
                    : 'bg-[#262a33] text-[#bcc9cd] border-[#3d494c]'
                }`}
              >
                HSM
              </span>
            </button>

            <button
              onClick={() => onNavigate('observability-and-queues')}
              className={getLinkClasses(isNavActive('observability-and-queues'))}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                <span>Observability &amp; Queues</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* BOTTOM FOOTER STATUS */}
      <div className="p-3 border-t border-[#3d494c] bg-[#0a0e16]">
        <div className="flex items-center justify-between text-[10px] text-[#869397]">
          <span className="uppercase tracking-wider font-semibold">NOC ENGINE V4.8.2</span>
          <span className="text-[#4edea3] font-code-metric flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]"></span>
            ALL NODES UP
          </span>
        </div>
      </div>
    </aside>
  );
};
