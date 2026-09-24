/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useCallback } from 'react';
import { ScreenId } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useNotifications, useSession } from './hooks/useNotifications';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { TerminalDrawer } from './components/TerminalDrawer';
import { NotificationsPopover } from './components/NotificationsPopover';
import { LoginScreen } from './screens/LoginScreen';

const OperatorProfileScreen = lazy(() => import('./screens/OperatorProfileScreen').then(module => ({ default: module.OperatorProfileScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then(module => ({ default: module.DashboardScreen })));
const LiveMonitorScreen = lazy(() => import('./screens/LiveMonitorScreen').then(module => ({ default: module.LiveMonitorScreen })));
const SmppScreen = lazy(() => import('./screens/SmppScreen').then(module => ({ default: module.SmppScreen })));
const Ss7Screen = lazy(() => import('./screens/Ss7Screen').then(module => ({ default: module.Ss7Screen })));
const RoutingScreen = lazy(() => import('./screens/RoutingScreen').then(module => ({ default: module.RoutingScreen })));
const MessageCenterScreen = lazy(() => import('./screens/MessageCenterScreen').then(module => ({ default: module.MessageCenterScreen })));
const HlrLookupScreen = lazy(() => import('./screens/HlrLookupScreen').then(module => ({ default: module.HlrLookupScreen })));
const BillingScreen = lazy(() => import('./screens/BillingScreen').then(module => ({ default: module.BillingScreen })));
const DeveloperPortalScreen = lazy(() => import('./screens/DeveloperPortalScreen').then(module => ({ default: module.DeveloperPortalScreen })));
const OtpServiceScreen = lazy(() => import('./screens/OtpServiceScreen').then(module => ({ default: module.OtpServiceScreen })));
const CampaignsScreen = lazy(() => import('./screens/CampaignsScreen').then(module => ({ default: module.CampaignsScreen })));
const ContactsSegmentsScreen = lazy(() => import('./screens/ContactsSegmentsScreen').then(module => ({ default: module.ContactsSegmentsScreen })));
const SenderIdsScreen = lazy(() => import('./screens/SenderIdsScreen').then(module => ({ default: module.SenderIdsScreen })));
const ProvidersScreen = lazy(() => import('./screens/ProvidersScreen').then(module => ({ default: module.ProvidersScreen })));
const OrganizationsScreen = lazy(() => import('./screens/OrganizationsScreen').then(module => ({ default: module.OrganizationsScreen })));
const SecurityCenterScreen = lazy(() => import('./screens/SecurityCenterScreen').then(module => ({ default: module.SecurityCenterScreen })));
const ObservabilityScreen = lazy(() => import('./screens/ObservabilityScreen').then(module => ({ default: module.ObservabilityScreen })));

type AuthenticatedUser = NonNullable<ReturnType<typeof useAuth>['user']>;

function AuthenticatedApp({ user }: { user: AuthenticatedUser }) {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  const { logout } = useAuth();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const { revokeSessions } = useSession();

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
          <Suspense fallback={<div className="flex justify-center py-12 text-[#869397] font-code-metric text-[13px]">Loading module...</div>}>
            {renderScreen()}
          </Suspense>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f131c' }}>
        <div className="text-[#869397] font-code-metric text-[14px]">Initializing NOC Engine...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen onLoginSuccess={() => undefined} />;
  }

  return <AuthenticatedApp user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
