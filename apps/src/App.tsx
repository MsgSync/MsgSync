/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScreenId, ClusterSession, NotificationItem } from './types';
import { INITIAL_SESSIONS, INITIAL_SMPP_TRUNKS, INITIAL_NOTIFICATIONS } from './data/mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { TerminalDrawer } from './components/TerminalDrawer';
import { NotificationsPopover } from './components/NotificationsPopover';

// Screens
import { OperatorProfileScreen } from './screens/OperatorProfileScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { LiveMonitorScreen } from './screens/LiveMonitorScreen';
import { SmppScreen } from './screens/SmppScreen';
import { Ss7Screen } from './screens/Ss7Screen';
import { RoutingScreen } from './screens/RoutingScreen';
import { MessageCenterScreen } from './screens/MessageCenterScreen';
import { HlrLookupScreen } from './screens/HlrLookupScreen';
import { BillingScreen } from './screens/BillingScreen';
import { DeveloperPortalScreen } from './screens/DeveloperPortalScreen';

export default function App() {
  // Default screen is IAM & Security (Marcus Vance) as requested in the screenshot
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('iam-security');
  const [sessions, setSessions] = useState<ClusterSession[]>(INITIAL_SESSIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3600);
  };

  // Revoke remote cluster sessions
  const handleRevokeSessions = () => {
    setSessions((prev) =>
      prev.map((s) => (s.isCurrent ? s : { ...s, status: 'TERMINATED' as const }))
    );
    showToast('All remote sessions revoked across Frankfurt, Singapore, and Oregon.', 'warning');
  };

  // Command palette and CLI execution
  const handleActionExecute = (actionKey: string) => {
    if (actionKey === 'action-audit') {
      const auditPayload = {
        operator: 'Marcus Vance',
        uid: 'UID-OP-9842-CORP',
        timestamp: new Date().toISOString(),
        clearance: 'LEVEL_4_TOP_SECRET',
        carrier: 'GlobalTel Direct (Tier-1)',
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
      showToast('Security Audit Log (JSON) generated and downloaded.', 'success');
    } else if (actionKey === 'action-revoke') {
      handleRevokeSessions();
    } else if (actionKey === 'action-fido') {
      showToast('Insert FIDO2/WebAuthn key into USB-C port and tap sensor...', 'info');
    } else if (actionKey === 'action-hotreload') {
      setCurrentScreen('intelligent-routing');
      showToast('Navigated to Intelligent Routing LCR weights engine.', 'info');
    } else if (actionKey === 'action-breakglass') {
      setCurrentScreen('iam-security');
      showToast('Open Break-Glass Token dialog on IAM & Security screen.', 'warning');
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All alerts marked as read.', 'info');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    showToast('Notification alert history cleared.', 'info');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] font-body-md selection:bg-[#06b6d4]/30 selection:text-[#4cd7f6]">
      {/* Interactive Toast Center */}
      <Toast
        message={toast?.message || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(s) => {
          setCurrentScreen(s);
          setIsSearchOpen(false);
        }}
        onAction={handleActionExecute}
      />

      {/* Interactive Terminal Drawer */}
      <TerminalDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onExecuteAction={handleActionExecute}
      />

      {/* Notification Center Popover */}
      <NotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onClear={handleClearNotifications}
      />

      {/* Top Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        unreadCount={unreadCount}
      />

      {/* Left Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        activeSmppCount={INITIAL_SMPP_TRUNKS.filter((t) => t.status === 'BOUND').length}
      />

      {/* Main Content Viewport */}
      <div className="pl-64">
        <main className="w-full pt-16 pb-12 min-h-screen bg-[#0f131c] px-5">
          {currentScreen === 'iam-security' && (
            <OperatorProfileScreen
              sessions={sessions}
              onRevokeSessions={handleRevokeSessions}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'dashboard' && (
            <DashboardScreen
              onNavigate={setCurrentScreen}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'live-monitor' && (
            <LiveMonitorScreen onShowToast={showToast} />
          )}

          {currentScreen === 'smpp-connections' && (
            <SmppScreen
              trunks={INITIAL_SMPP_TRUNKS}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'ss7-sigtran' && (
            <Ss7Screen onShowToast={showToast} />
          )}

          {currentScreen === 'intelligent-routing' && (
            <RoutingScreen onShowToast={showToast} />
          )}

          {currentScreen === 'message-center' && (
            <MessageCenterScreen onShowToast={showToast} />
          )}

          {currentScreen === 'hlr-mnp-lookup' && (
            <HlrLookupScreen onShowToast={showToast} />
          )}

          {currentScreen === 'billing-and-credit-ledger' && (
            <BillingScreen onShowToast={showToast} />
          )}

          {currentScreen === 'developer-portal-and-apis' && (
            <DeveloperPortalScreen onShowToast={showToast} />
          )}

          {/* Fallback views for secondary routes */}
          {['otp-service', 'campaigns', 'contacts-and-segments', 'sender-ids', 'providers', 'organizations-and-tenants', 'observability-and-queues'].includes(
            currentScreen
          ) && (
            <div className="flex flex-col w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#3d494c]">
                <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
                  <span className="text-[#869397]">SYSTEM</span>
                  <span className="text-[#3d494c]">/</span>
                  <span className="text-[#4cd7f6] font-semibold uppercase">
                    {currentScreen.replace(/-/g, ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentScreen('iam-security')}
                  className="text-[12px] text-[#4cd7f6] hover:underline"
                >
                  ← Return to Operator Profile
                </button>
              </div>

              <div className="rounded bg-[#1c2028] border border-[#3d494c] p-6 text-center space-y-3">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[40px]">
                  {currentScreen === 'otp-service'
                    ? 'key'
                    : currentScreen === 'campaigns'
                    ? 'campaign'
                    : currentScreen === 'sender-ids'
                    ? 'badge'
                    : currentScreen === 'providers'
                    ? 'lan'
                    : currentScreen === 'organizations-and-tenants'
                    ? 'corporate_fare'
                    : 'bar_chart'}
                </span>
                <h2 className="text-[18px] font-semibold text-[#dfe2ee] capitalize">
                  {currentScreen.replace(/-/g, ' ')} Module Active
                </h2>
                <p className="text-[13px] text-[#bcc9cd] max-w-lg mx-auto">
                  Carrier control plane is actively connected to GlobalTel Direct (Tier-1). All parameters are governed by Marcus Vance's Level 4 Top-Secret authorization matrix.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setCurrentScreen('dashboard')}
                    className="px-4 py-2 rounded bg-[#262a33] text-[#dfe2ee] text-[12px] hover:bg-[#353942]"
                  >
                    View Core Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentScreen('live-monitor')}
                    className="px-4 py-2 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px]"
                  >
                    Open Live Packet Sniffer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Fixed Bottom Status Bar */}
      <Footer />
    </div>
  );
}
