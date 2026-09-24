/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ScreenId } from './types';
import { apiClient } from './lib/api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { LoginScreen } from './screens/LoginScreen';

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

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, clearAll, markAsRead } = useNotifications();
  const { revokeSessions } = useSession();
  const { invoices: billingInvoices, loading: billingLoading } = useBilling('root');
  const { messages: messagesData } = useMessages();
  const { performLookup } = useLookup();
  const { campaigns } = useCampaigns();
  const { rules, providers } = useRouting();

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast((curr) => (curr?.message === message ? null : curr)), 3600);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setCurrentScreen('dashboard');
    showToast('Logged out successfully.', 'info');
  }, [logout, showToast]);

  const handleNavigate = useCallback((screen: ScreenId) => {
    setCurrentScreen(screen);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f131c' }}>
        <div className="text-[#869397] font-code-metric text-[14px]">Initializing NOC Engine...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen onLoginSuccess={() => setCurrentScreen('dashboard')} />;
  }

  const handleRevokeSessions = useCallback(() => {
    revokeSessions();
    showToast('All remote sessions revoked across cluster nodes.', 'warning');
  }, [revokeSessions, showToast]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
    showToast('All alerts marked as read.', 'info');
  }, [markAllRead, showToast]);

  const handleClearNotifications = useCallback(() => {
    clearAll();
    showToast('Notification alert history cleared.', 'info');
  }, [clearAll, showToast]);

  const handleActionExecute = useCallback((actionKey: string) => {
    if (actionKey === 'action-revoke') {
      handleRevokeSessions();
    } else if (actionKey === 'action-hotreload') {
      setCurrentScreen('intelligent-routing');
      showToast('Navigated to Intelligent Routing LCR weights engine.', 'info');
    } else if (actionKey === 'action-breakglass') {
      setCurrentScreen('iam-security');
      showToast('Open Break-Glass Token dialog on IAM & Security screen.', 'warning');
    }
  }, [handleRevokeSessions, showToast]);

  const renderScreen = useCallback(() => {
    switch (currentScreen) {
      case 'dashboard': return <DashboardScreen onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'live-monitor': return <LiveMonitorScreen onShowToast={showToast} />;
      case 'smpp-connections': return <SmppScreen trunks={[]} onShowToast={showToast} />;
      case 'ss7-sigtran': return <Ss7Screen onShowToast={showToast} />;
      case 'intelligent-routing': return <RoutingScreen onShowToast={showToast} />;
      case 'message-center': return <MessageCenterScreen onShowToast={showToast} />;
      case 'hlr-mnp-lookup': return <HlrLookupScreen onShowToast={showToast} />;
      case 'billing-and-credit-ledger': return <BillingScreen onShowToast={showToast} />;
      case 'developer-portal-and-apis': return <DeveloperPortalScreen onShowToast={showToast} />;
      case 'otp-service': return <OtpServiceScreen onShowToast={showToast} />;
      case 'campaigns': return <CampaignsScreen onShowToast={showToast} />;
      case 'contacts-and-segments': return <ContactsSegmentsScreen onShowToast={showToast} />;
      case 'sender-ids': return <SenderIdsScreen onShowToast={showToast} />;
      case 'providers': return <ProvidersScreen onShowToast={showToast} />;
      case 'organizations-and-tenants': return <OrganizationsScreen onShowToast={showToast} />;
      case 'iam-security': return <OperatorProfileScreen sessions={[]} currentUser={user} onRevokeSessions={handleRevokeSessions} onShowToast={showToast} />;
      case 'security-center': return <SecurityCenterScreen onShowToast={showToast} />;
      case 'observability-and-queues': return <ObservabilityScreen onShowToast={showToast} />;
      default: return null;
    }
  }, [currentScreen, handleNavigate, handleRevokeSessions, showToast, user]);

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
        userName={user.name}
        onLogout={handleLogout}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
