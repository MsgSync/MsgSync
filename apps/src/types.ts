export type ScreenId =
  | 'iam-security'
  | 'dashboard'
  | 'live-monitor'
  | 'message-center'
  | 'otp-service'
  | 'campaigns'
  | 'contacts-and-segments'
  | 'sender-ids'
  | 'smpp-connections'
  | 'ss7-sigtran'
  | 'providers'
  | 'intelligent-routing'
  | 'hlr-mnp-lookup'
  | 'billing-and-credit-ledger'
  | 'organizations-and-tenants'
  | 'developer-portal-and-apis'
  | 'security-center'
  | 'observability-and-queues';

export interface ClusterSession {
  id: string;
  node: string;
  cluster: string;
  authMethod: string;
  ip: string;
  vpn: string;
  location: string;
  asOrigin: string;
  timestamp: string;
  status: 'PRIMARY' | 'TERMINATED' | 'EXPIRED' | 'ACTIVE';
  isCurrent?: boolean;
}

export interface SmppTrunk {
  id: string;
  name: string;
  carrier: string;
  systemId: string;
  mode: 'TX' | 'RX' | 'TRX';
  status: 'BOUND' | 'CONNECTING' | 'THROTTLED' | 'UNBOUND';
  tpsLimit: number;
  currentMps: number;
  latencyMs: number;
  windowSize: number;
  windowUtilization: number;
  enquireLinkStatus: 'NOMINAL' | 'DEGRADED' | 'TIMEOUT';
  ipAddress: string;
  region: string;
  rateLimitEnabled?: boolean;
  rateLimitPps?: number;
  rateLimitBurst?: number;
  rateLimitAction?: 'REJECT_ESME_RTHROTTLED' | 'LEAKY_BUCKET_QUEUE' | 'SILENT_DROP' | 'LCR_FAILOVER';
  throttledPackets?: number;
}

export interface LivePacket {
  id: string;
  timestamp: string;
  protocol: 'SMPP 3.4' | 'M3UA' | 'SCCP' | 'MAP' | 'REST';
  command: 'SUBMIT_SM' | 'DELIVER_SM' | 'ENQUIRE_LINK' | 'SRI_FOR_SM' | 'MT_FORWARD_SM' | 'SUBMIT_SM_RESP';
  source: string;
  destination: string;
  status: '200 OK' | 'DELIVRD' | 'ROUTED' | 'REJECTED' | 'QUEUED';
  bytes: number;
  latencyMs: number;
  hexDump: string;
  asciiDump: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  prefix: string | null;
  mcc: string | null;
  mnc: string | null;
  country: string | null;
  destination: string | null;
  primaryCarrier: string | null;
  secondaryCarrier: string | null;
  weight: number;
  costPerSms: number;
  status: string;
  organizationId: string | null;
  providerId: string;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'warning' | 'critical';
  read: boolean;
}

// API Model Types
export interface Message {
  id: string;
  recipient: string;
  content: string;
  provider: string | null;
  status: string;
  externalId: string | null;
  error: string | null;
  scheduledAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  cost: number;
  price: number;
  profile: string;
  metadata: Record<string, any> | null;
  campaignId: string | null;
  organizationId: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  template: string;
  senderId: string | null;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  enableTracking: boolean;
  enableWebhooks: boolean;
  apiKeyId: string;
  contactListId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  apiKeyId: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  attributes: Record<string, any> | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  pdfUrl: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  balance: number;
  maxDailySpend: number;
  allowedCountries: string[];
  customDomain: string | null;
  companyName: string | null;
  billingEmail: string | null;
  billingCycle: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  active: boolean;
  allowedIps: string[];
  rateLimit: number;
  organizationId: string | null;
  createdAt: string;
}

export interface SenderId {
  id: string;
  name: string;
  type: string;
  status: string;
  organizationId: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  active: boolean;
  priority: number;
  weight: number;
  costPerSms: number;
  supportedPrefixes: string[];
  createdAt: string;
}

export interface Lookup {
  id: string;
  phone: string;
  isValid: boolean;
  carrier: string | null;
  mcc: string | null;
  mnc: string | null;
  type: string | null;
  isPorted: boolean;
  isRoaming: boolean;
  lastCheckedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string | null;
  organizationId: string;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface RatePlan {
  id: string;
  name: string;
  currency: string;
  isPublic: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  price: number;
  smsLimit: number;
  validityDays: number;
  active: boolean;
}

export interface BundleSubscription {
  id: string;
  smsRemaining: number;
  expiresAt: string;
  status: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  createdAt: string;
}

export interface AnalyticsStats {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  sending: number;
  delivered: number;
  successRate: number;
}

export interface FinancialStats {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  messageCount: number;
  profileBreakdown: Array<{ profile: string; revenue: number }>;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  organization: Organization;
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
}

export interface HlrConfig {
  id: string;
  name: string;
  baseUrl: string;
  method: string;
  active: boolean;
}

export interface Alert {
  id: string;
  name: string;
  type: string;
  threshold: number;
  status: string;
  createdAt: string;
}

export type ScreenMetadata = {
  id: ScreenId;
  label: string;
  icon: string;
  section: string;
  requiresAuth: boolean;
  permissions: string[];
};

export const SCREEN_METADATA: ScreenMetadata[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', section: 'OVERVIEW', requiresAuth: false, permissions: [] },
  { id: 'live-monitor', label: 'Live Monitor', icon: 'monitoring', section: 'OVERVIEW', requiresAuth: true, permissions: [] },
  { id: 'message-center', label: 'Message Center', icon: 'chat', section: 'MESSAGING', requiresAuth: true, permissions: [] },
  { id: 'otp-service', label: 'OTP Service', icon: 'key', section: 'MESSAGING', requiresAuth: true, permissions: [] },
  { id: 'campaigns', label: 'Campaigns', icon: 'campaign', section: 'MESSAGING', requiresAuth: true, permissions: [] },
  { id: 'contacts-and-segments', label: 'Contacts & Segments', icon: 'group', section: 'MESSAGING', requiresAuth: true, permissions: [] },
  { id: 'sender-ids', label: 'Sender IDs', icon: 'badge', section: 'MESSAGING', requiresAuth: true, permissions: [] },
  { id: 'smpp-connections', label: 'SMPP Connections', icon: 'settings_ethernet', section: 'TELECOM & ROUTING', requiresAuth: true, permissions: [] },
  { id: 'ss7-sigtran', label: 'SS7 / SIGTRAN', icon: 'hub', section: 'TELECOM & ROUTING', requiresAuth: true, permissions: [] },
  { id: 'providers', label: 'Providers', icon: 'lan', section: 'TELECOM & ROUTING', requiresAuth: true, permissions: [] },
  { id: 'intelligent-routing', label: 'Intelligent Routing', icon: 'alt_route', section: 'TELECOM & ROUTING', requiresAuth: true, permissions: [] },
  { id: 'hlr-mnp-lookup', label: 'HLR / MNP Lookup', icon: 'find_in_page', section: 'TELECOM & ROUTING', requiresAuth: true, permissions: [] },
  { id: 'billing-and-credit-ledger', label: 'Billing & Credit Ledger', icon: 'account_balance_wallet', section: 'MANAGEMENT & BILLING', requiresAuth: true, permissions: [] },
  { id: 'organizations-and-tenants', label: 'Organizations & Tenants', icon: 'corporate_fare', section: 'MANAGEMENT & BILLING', requiresAuth: true, permissions: [] },
  { id: 'developer-portal-and-apis', label: 'Developer Portal & APIs', icon: 'api', section: 'DEVELOPER & PLATFORM', requiresAuth: true, permissions: [] },
  { id: 'iam-security', label: 'IAM & Security', icon: 'security', section: 'DEVELOPER & PLATFORM', requiresAuth: true, permissions: ['LEVEL_4_TOP_SECRET'] },
  { id: 'security-center', label: 'Security Center', icon: 'shield', section: 'DEVELOPER & PLATFORM', requiresAuth: true, permissions: [] },
  { id: 'observability-and-queues', label: 'Observability & Queues', icon: 'bar_chart', section: 'DEVELOPER & PLATFORM', requiresAuth: true, permissions: [] },
];

export function getScreenMetadata(id: ScreenId): ScreenMetadata | undefined {
  return SCREEN_METADATA.find((m) => m.id === id);
}
