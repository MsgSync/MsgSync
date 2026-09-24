/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ScreenId } from './types';
import { apiClient } from './lib/api/client';
import { useNotifications } from './hooks/useNotifications';
import { useSession } from './hooks/useNotifications';
import { useBilling } from './hooks/useBilling';
import { useMessages } from './hooks/useMessages';
import { useLookup } from './hooks/useLookup';
import { useCampaigns } from './hooks/useCampaigns';
import { useRouting } from './hooks/useRouting';
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
import { OtpServiceScreen } from './screens/OtpServiceScreen';
import { CampaignsScreen } from './screens/CampaignsScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { ContactsSegmentsScreen } from './screens/ContactsSegmentsScreen';
import { SenderIdsScreen } from './screens/SenderIdsScreen';
import { ProvidersScreen } from './screens/ProvidersScreen';
import { OrganizationsScreen } from './screens/OrganizationsScreen';
import { SecurityCenterScreen } from './screens/SecurityCenterScreen';
import { ObservabilityScreen } from './screens/ObservabilityScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('iam-security');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  const { notifications, unreadCount, markAllRead, clearAll, markAsRead } = useNotifications();
  const { currentUser, revokeSessions, loading: sessionLoading } = useSession();
  const { invoices: billingInvoices, loading: billingLoading } = useBilling('root');
  const { messages: messagesData, refetch: refetchMessages } = useMessages();
  const { performLookup } = useLookup();
  const { campaigns, refetch: refetchCampaigns } = useCampaigns();
  const { rules, providers, refetch: refetchRouting } = useRouting();

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast((curr) => (curr?.message === message ? null : curr)), 3600);
  }, []);

  useEffect(() => {
    const token = apiClient.getToken();
    if (!token) {
      const storedToken = localStorage.getItem('msgsync_auth_token');
      if (storedToken) {
        apiClient.setToken(storedToken);
      }
    }
  }, []);

  const handleRevokeSessions = useCallback(() => {
    revokeSessions();
    showToast('All remote sessions revoked across cluster nodes.', 'warning');
  }, [revokeSessions, showToast]);

  const handleActionExecute = useCallback((actionKey: string) => {
    if (actionKey === 'action-audit') {
      try {
        const auditPayload = {
          operator: currentUser?.name || 'Unknown',
          uid: currentUser?.id || 'unknown',
          timestamp: new Date().toISOString(),
          carrier: 'GlobalTel Direct (Tier-1)',
          recordsExported: 489,
          integrityHash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        };
        const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Security Audit Log (JSON) generated and downloaded.', 'success');
      } catch (err) {
        showToast('Failed to generate audit log.', 'error');
      }
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
  }, [currentUser, handleRevokeSessions, showToast]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
    showToast('All alerts marked as read.', 'info');
  }, [markAllRead, showToast]);

  const handleClearNotifications = useCallback(() => {
    clearAll();
    showToast('Notification alert history cleared.', 'info');
  }, [clearAll, showToast]);

  const handleNavigate = useCallback((screen: ScreenId) => {
    setCurrentScreen(screen);
  }, []);

  const renderScreen = useCallback(() => {
    switch (currentScreen) {
      case 'iam-security':
        return <OperatorProfileScreen sessions={[]} currentUser={currentUser} onRevokeSessions={handleRevokeSessions} onShowToast={showToast} />;
      case 'dashboard':
        return <DashboardScreen onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'live-monitor':
        return <LiveMonitorScreen onShowToast={showToast} />;
      case 'smpp-connections':
        return <SmppScreen trunks={[]} onShowToast={showToast} />;
      case 'ss7-sigtran':
        return <Ss7Screen onShowToast={showToast} />;
      case 'intelligent-routing':
        return <RoutingScreen onShowToast={showToast} />;
      case 'message-center':
        return <MessageCenterScreen onShowToast={showToast} />;
      case 'hlr-mnp-lookup':
        return <HlrLookupScreen onShowToast={showToast} />;
      case 'billing-and-credit-ledger':
        return <BillingScreen onShowToast={showToast} />;
      case 'developer-portal-and-apis':
        return <DeveloperPortalScreen onShowToast={showToast} />;
      case 'otp-service':
        return <OtpServiceScreen onShowToast={showToast} />;
      case 'campaigns':
        return <CampaignsScreen onShowToast={showToast} />;
      case 'contacts-and-segments':
        return <ContactsSegmentsScreen onShowToast={showToast} />;
      case 'sender-ids':
        return <SenderIdsScreen onShowToast={showToast} />;
      case 'providers':
        return <ProvidersScreen onShowToast={showToast} />;
      case 'organizations-and-tenants':
        return <OrganizationsScreen onShowToast={showToast} />;
      case 'security-center':
        return <SecurityCenterScreen onShowToast={showToast} />;
      case 'observability-and-queues':
        return <ObservabilityScreen onShowToast={showToast} />;
      default:
        return null;
    }
  }, [currentScreen, handleNavigate, handleRevokeSessions, showToast]);

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] font-body-md selection:bg-[#06b6d4]/30 selection:text-[#4cd7f6]">
      <Toast message={toast?.message || null} type={toast?.type} onClose={() => setToast(null)} />

      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(s) => { setCurrentScreen(s); setIsSearchOpen(false); }}
        onAction={handleActionExecute}
      />

      <TerminalDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onExecuteAction={handleActionExecute}
      />

      <NotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onClear={handleClearNotifications}
      />

      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        unreadCount={unreadCount}
      />

      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        activeSmppCount={8}
      />

      <div className="pl-64">
        <main className="w-full pt-16 pb-12 min-h-screen bg-[#0f131c] px-5">
          {renderScreen()}
        </main>
      </div>

      <Footer />
    </div>
  );
}
