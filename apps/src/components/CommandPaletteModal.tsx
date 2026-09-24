import React, { useState, useEffect } from 'react';
import { ScreenId } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  onAction: (actionKey: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onAction,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    {
      category: 'Screens & Console Views',
      list: [
        { id: 'iam-security', title: 'IAM & Security (Marcus Vance)', icon: 'security', type: 'nav' },
        { id: 'dashboard', title: 'Core Operations Dashboard (Latency Map & SMPP Heatmap)', icon: 'public', type: 'nav' },
        { id: 'live-monitor', title: 'Live Packet Telemetry & Sniffer', icon: 'monitoring', type: 'nav' },
        { id: 'smpp-connections', title: 'SMPP Connections (12 Active Trunks)', icon: 'settings_ethernet', type: 'nav' },
        { id: 'ss7-sigtran', title: 'SS7 / SIGTRAN & M3UA Gateways', icon: 'hub', type: 'nav' },
        { id: 'intelligent-routing', title: 'Intelligent Routing & LCR Engine', icon: 'alt_route', type: 'nav' },
        { id: 'message-center', title: 'Message Center & Query Terminal', icon: 'chat', type: 'nav' },
        { id: 'hlr-mnp-lookup', title: 'HLR / MNP Mobile Number Lookup', icon: 'find_in_page', type: 'nav' },
        { id: 'billing-and-credit-ledger', title: 'Billing & Carrier Credit Ledger', icon: 'account_balance_wallet', type: 'nav' },
        { id: 'developer-portal-and-apis', title: 'Developer Portal & HMAC Webhooks', icon: 'api', type: 'nav' },
      ],
    },
    {
      category: 'Operator Quick Actions',
      list: [
        { id: 'action-audit', title: 'Download Cryptographic Audit Log (JSON)', icon: 'download', type: 'action' },
        { id: 'action-breakglass', title: 'Generate Emergency Break-Glass Token', icon: 'emergency', type: 'action' },
        { id: 'action-revoke', title: 'Revoke All Remote SSH & mTLS Sessions', icon: 'logout', type: 'action' },
        { id: 'action-fido', title: 'Attest New FIDO2 / WebAuthn Hardware Key', icon: 'key', type: 'action' },
        { id: 'action-hotreload', title: 'Hot-Reload LCR Carrier Weights Table', icon: 'sync', type: 'action' },
      ],
    },
  ];

  const filteredItems = items
    .map((group) => ({
      ...group,
      list: group.list.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((group) => group.list.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#0f131c]/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-lg bg-[#1c2028] border border-[#3d494c] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-[#3d494c] bg-[#181c24]">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[20px] mr-2.5">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a screen name, MSISDN, command, or carrier point code..."
            className="w-full bg-transparent text-[#dfe2ee] placeholder:text-[#869397] text-[14px] focus:outline-none font-body-md"
          />
          <kbd className="px-2 py-0.5 rounded bg-[#0a0e16] text-[#869397] text-[11px] font-code-metric border border-[#3d494c]">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-[#869397] text-[13px]">
              No matching carrier resources found for <span className="text-[#4cd7f6]">"{query}"</span>.
            </div>
          ) : (
            filteredItems.map((group) => (
              <div key={group.category}>
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-[#869397] tracking-wider">
                  {group.category}
                </div>
                <div className="space-y-0.5 mt-1">
                  {group.list.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'nav') {
                          onNavigate(item.id as ScreenId);
                        } else {
                          onAction(item.id);
                        }
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-[#262a33] text-[#dfe2ee] hover:text-[#4cd7f6] flex items-center justify-between transition-colors group text-[13px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-[#869397] group-hover:text-[#4cd7f6]">
                          {item.icon}
                        </span>
                        <span>{item.title}</span>
                      </div>
                      <span className="text-[11px] text-[#869397] font-code-metric opacity-60 group-hover:opacity-100">
                        {item.type === 'nav' ? 'Jump to view' : 'Execute'} ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-[#0a0e16] border-t border-[#3d494c] flex items-center justify-between text-[11px] text-[#869397] font-code-metric">
          <span>Navigation Quick-Dial</span>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>esc Exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
