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
  // Rate Limit & Traffic Shaping Controls
  rateLimitEnabled?: boolean;
  rateLimitPps?: number; // Packets Per Second threshold
  rateLimitBurst?: number; // Burst tolerance
  rateLimitAction?: 'REJECT_ESME_RTHROTTLED' | 'LEAKY_BUCKET_QUEUE' | 'SILENT_DROP' | 'LCR_FAILOVER';
  throttledPackets?: number; // Count of throttled frames
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
  prefix: string;
  country: string;
  destination: string;
  primaryCarrier: string;
  secondaryCarrier: string;
  costPerSms: number;
  weight: number;
  status: 'ACTIVE' | 'HOT_RELOAD_PENDING' | 'SUSPENDED';
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'warning' | 'critical';
  read: boolean;
}
