export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}

export interface ApiError {
  status: 'error';
  message: string;
  code?: string;
}

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
  sentiment: string | null;
  sentimentScore: number | null;
  metadata: Record<string, any> | null;
  apiKeyId: string | null;
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
  organizationId: string | null;
  contactListId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  apiKeyId: string;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  attributes: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  organizationId: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  pdfUrl: string | null;
  excelUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  balance: number;
  maxDailySpend: number;
  allowedCountries: string[];
  ratePlanId: string | null;
  customDomain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  companyName: string | null;
  billingEmail: string | null;
  billingCycle: string;
  invoiceFormat: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  active: boolean;
  allowedIps: string[];
  rateLimit: number;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SenderId {
  id: string;
  name: string;
  type: string;
  organizationId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  updatedAt: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  prefix: string | null;
  mcc: string | null;
  mnc: string | null;
  organizationId: string | null;
  providerId: string;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
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

export interface Alert {
  id: string;
  name: string;
  type: string;
  threshold: number;
  status: string;
  notificationEmail: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatePlan {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  smsLimit: number;
  validityDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BundleSubscription {
  id: string;
  organizationId: string;
  bundleId: string;
  smsRemaining: number;
  expiresAt: string;
  status: string;
  createdAt: string;
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

export interface AnalyticsTrend {
  hour: number;
  count: number;
  success: number;
}

export interface FinancialStats {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  messageCount: number;
  profileBreakdown: Array<{ profile: string; revenue: number }>;
}

export interface LiveTrafficItem {
  id: string;
  recipient: string;
  status: string;
  provider: string | null;
  createdAt: string;
  cost: number;
  price: number;
  sentiment: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  organization: Organization;
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
}

export interface SessionInfo {
  id: string;
  node: string;
  cluster: string;
  authMethod: string;
  ip: string;
  location: string;
  status: string;
  isCurrent?: boolean;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'warning' | 'critical';
  read: boolean;
}

export interface OtpSendRequest {
  recipient: string;
  ttl?: number;
  length?: number;
}

export interface OtpVerifyRequest {
  recipient: string;
  code: string;
}

export interface SendMessageRequest {
  recipient: string;
  content: string;
  scheduledAt?: string;
  metadata?: Record<string, any>;
}

export interface LookupRequest {
  phone: string;
}

export interface HlrConfig {
  id: string;
  name: string;
  baseUrl: string;
  method: string;
  active: boolean;
  mapping: Record<string, string> | null;
}

export interface DashboardStats {
  totalMessages: number;
  activeTrunks: number;
  mps: number;
  latencyMs: number;
  successRate: number;
}

export interface RateLimitConfig {
  rateLimitEnabled: boolean;
  rateLimitPps: number;
  rateLimitBurst: number;
  rateLimitAction: string;
  throttledPackets: number;
}

export interface SmppTrunk {
  id: string;
  name: string;
  carrier: string;
  systemId: string;
  mode: string;
  status: string;
  tpsLimit: number;
  currentMps: number;
  latencyMs: number;
  windowSize: number;
  windowUtilization: number;
  enquireLinkStatus: string;
  ipAddress: string;
  region: string;
  rateLimitEnabled?: boolean;
  rateLimitPps?: number;
  rateLimitBurst?: number;
  rateLimitAction?: string;
  throttledPackets?: number;
}

export interface ClusterSession {
  id: string;
  node: string;
  cluster: string;
  authMethod: string;
  ip: string;
  location: string;
  asOrigin: string;
  timestamp: string;
  status: string;
  isCurrent?: boolean;
}

export interface PaginationParams {
  skip?: number;
  take?: number;
  status?: string;
  profile?: string;
  startDate?: string;
  endDate?: string;
}

export interface ScreenMetadata {
  id: ScreenId;
  label: string;
  icon: string;
  section: string;
  requiresAuth: boolean;
  permissions: string[];
}

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
