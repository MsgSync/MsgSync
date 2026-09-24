import React, { useState, useMemo } from 'react';

export type ResourceType = 'LINKSET' | 'POINT_CODE';

export interface AllocatableResource {
  id: string;
  type: ResourceType;
  name: string;
  code: string; // e.g. "3-042-1 ⇄ 3-042-2" or "3-042-7"
  protocol: 'ITU-T (14-bit)' | 'ANSI (24-bit)' | 'TTC (16-bit)';
  carrier: string;
  serviceType: 'STP Trunk' | 'SMSC Relay' | 'HLR/HSS MAP' | 'Global Title Hub' | 'CAMEL SCP';
  msuRate: number; // current MSU/sec
  capacityMsu: number; // max capability
  linksCount?: number;
  slsMask?: string;
  currentPlaneId: string;
  status: 'IN_SERVICE' | 'STANDBY' | 'MAINTENANCE' | 'CONGESTED';
  routingContext?: string;
  priority: 'TIER-1 CORE' | 'TIER-2 AGGREGATOR' | 'INTERNAL' | 'SPARE';
}

export interface SignalingPlane {
  id: string;
  name: string;
  subTitle: string;
  region: string;
  primarySpc: string;
  protocol: 'ITU-T (14-bit)' | 'ANSI (24-bit)' | 'HYBRID';
  maxCapacityMsu: number;
  trafficMode: 'LOADSHARE' | 'OVERRIDE' | 'BROADCAST' | 'STANDBY';
  status: 'ACTIVE' | 'STANDBY' | 'MAINTENANCE';
  colorTheme: 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';
  description: string;
}

interface OrchestrationLogEntry {
  id: string;
  timestamp: string;
  resourceName: string;
  resourceCode: string;
  fromPlaneName: string;
  toPlaneName: string;
  operator: string;
  status: 'SUCCESS' | 'WARNING' | 'PENDING';
  message: string;
}

interface Ss7ResourceAllocatorProps {
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const INITIAL_PLANES: SignalingPlane[] = [
  {
    id: 'plane-alpha',
    name: 'STP Plane Alpha (EU Core)',
    subTitle: 'Frankfurt DE-CIX Interconnect Hub',
    region: 'Europe (FRA)',
    primarySpc: '3-042-1',
    protocol: 'ITU-T (14-bit)',
    maxCapacityMsu: 32000,
    trafficMode: 'LOADSHARE',
    status: 'ACTIVE',
    colorTheme: 'cyan',
    description: 'Primary European signaling transfer plane serving Tier-1 mobile networks.',
  },
  {
    id: 'plane-beta',
    name: 'STP Plane Beta (US East)',
    subTitle: 'Equinix DC2 Ashburn Carrier Vault',
    region: 'North America (IAD)',
    primarySpc: '244-102-001',
    protocol: 'ANSI (24-bit)',
    maxCapacityMsu: 36000,
    trafficMode: 'LOADSHARE',
    status: 'ACTIVE',
    colorTheme: 'emerald',
    description: 'Transatlantic ANSI gateway plane connecting US/CAN wireless carriers.',
  },
  {
    id: 'plane-gamma',
    name: 'SGW Plane Gamma (APAC Transit)',
    subTitle: 'Global Transit Gateway Singapore',
    region: 'Asia-Pacific (SIN)',
    primarySpc: '4-110-1',
    protocol: 'ITU-T (14-bit)',
    maxCapacityMsu: 28000,
    trafficMode: 'OVERRIDE',
    status: 'ACTIVE',
    colorTheme: 'violet',
    description: 'High-density international roaming hub for ASEAN & Far East carrier routes.',
  },
  {
    id: 'plane-hlr',
    name: 'SIGTRAN Enclave Delta (HLR/HSS MAP)',
    subTitle: 'Encrypted Internal Core Database',
    region: 'Private VPC Enclave',
    primarySpc: '3-042-9',
    protocol: 'ITU-T (14-bit)',
    maxCapacityMsu: 24000,
    trafficMode: 'LOADSHARE',
    status: 'ACTIVE',
    colorTheme: 'amber',
    description: 'Isolated high-security plane dedicated to MAP SRI_FOR_SM subscriber queries.',
  },
  {
    id: 'plane-staging',
    name: 'Hot-Standby & Quarantine Pool',
    subTitle: 'Unassigned Links, Spare Point Codes & Maintenance',
    region: 'Staging Enclave',
    primarySpc: 'UNASSIGNED',
    protocol: 'HYBRID',
    maxCapacityMsu: 50000,
    trafficMode: 'STANDBY',
    status: 'STANDBY',
    colorTheme: 'slate',
    description: 'Staging reservoir for spare point codes, cold linksets, or quarantine routes.',
  },
];

const INITIAL_RESOURCES: AllocatableResource[] = [
  {
    id: 'res-01',
    type: 'LINKSET',
    name: 'LS-BICS-FRA01',
    code: '3-042-1 ⇄ 3-042-2',
    protocol: 'ITU-T (14-bit)',
    carrier: 'Belgacom ICS / Deutsche Telekom',
    serviceType: 'STP Trunk',
    msuRate: 4180,
    capacityMsu: 12000,
    linksCount: 4,
    slsMask: '0x0F (4-bit SLS)',
    currentPlaneId: 'plane-alpha',
    status: 'IN_SERVICE',
    routingContext: '0x00000001',
    priority: 'TIER-1 CORE',
  },
  {
    id: 'res-02',
    type: 'LINKSET',
    name: 'LS-TELIA-STO01',
    code: '3-042-1 ⇄ 2-108-4',
    protocol: 'ITU-T (14-bit)',
    carrier: 'Telia Carrier Nordic Hub',
    serviceType: 'STP Trunk',
    msuRate: 3240,
    capacityMsu: 10000,
    linksCount: 4,
    slsMask: '0x0F (4-bit SLS)',
    currentPlaneId: 'plane-alpha',
    status: 'IN_SERVICE',
    routingContext: '0x00000004',
    priority: 'TIER-1 CORE',
  },
  {
    id: 'res-03',
    type: 'LINKSET',
    name: 'LS-ORANGE-PAR02',
    code: '3-042-1 ⇄ 1-020-5',
    protocol: 'ITU-T (14-bit)',
    carrier: 'Orange Wholesale France',
    serviceType: 'STP Trunk',
    msuRate: 2890,
    capacityMsu: 10000,
    linksCount: 4,
    slsMask: '0x0F (4-bit SLS)',
    currentPlaneId: 'plane-alpha',
    status: 'IN_SERVICE',
    routingContext: '0x00000005',
    priority: 'TIER-2 AGGREGATOR',
  },
  {
    id: 'res-04',
    type: 'LINKSET',
    name: 'LS-SYN-TPA02',
    code: '244-102-001 ⇄ 244-102-003',
    protocol: 'ANSI (24-bit)',
    carrier: 'Syniverse Technologies Interconnect',
    serviceType: 'STP Trunk',
    msuRate: 6320,
    capacityMsu: 16000,
    linksCount: 4,
    slsMask: '0xFF (8-bit SLS)',
    currentPlaneId: 'plane-beta',
    status: 'IN_SERVICE',
    routingContext: '0x00000002',
    priority: 'TIER-1 CORE',
  },
  {
    id: 'res-05',
    type: 'LINKSET',
    name: 'LS-ATT-DAL01',
    code: '244-102-001 ⇄ 244-102-005',
    protocol: 'ANSI (24-bit)',
    carrier: 'AT&T Mobility National Transit',
    serviceType: 'STP Trunk',
    msuRate: 5100,
    capacityMsu: 14000,
    linksCount: 4,
    slsMask: '0xFF (8-bit SLS)',
    currentPlaneId: 'plane-beta',
    status: 'IN_SERVICE',
    routingContext: '0x00000006',
    priority: 'TIER-1 CORE',
  },
  {
    id: 'res-06',
    type: 'LINKSET',
    name: 'LS-TATA-SIN01',
    code: '4-110-1 ⇄ 4-110-2',
    protocol: 'ITU-T (14-bit)',
    carrier: 'Tata Communications SG',
    serviceType: 'SMSC Relay',
    msuRate: 3420,
    capacityMsu: 12000,
    linksCount: 4,
    slsMask: '0x0F (4-bit SLS)',
    currentPlaneId: 'plane-gamma',
    status: 'IN_SERVICE',
    routingContext: '0x00000003',
    priority: 'TIER-1 CORE',
  },
  {
    id: 'res-07',
    type: 'LINKSET',
    name: 'LS-SINGTEL-03',
    code: '4-110-1 ⇄ 4-110-8',
    protocol: 'ITU-T (14-bit)',
    carrier: 'Singtel International Gateway',
    serviceType: 'Global Title Hub',
    msuRate: 2980,
    capacityMsu: 10000,
    linksCount: 4,
    slsMask: '0x0F (4-bit SLS)',
    currentPlaneId: 'plane-gamma',
    status: 'IN_SERVICE',
    routingContext: '0x00000007',
    priority: 'TIER-2 AGGREGATOR',
  },
  {
    id: 'res-08',
    type: 'LINKSET',
    name: 'LS-HLR-HSS-CORE',
    code: '3-042-1 ⇄ 3-042-9',
    protocol: 'ITU-T (14-bit)',
    carrier: 'Internal Core Subscriber DB',
    serviceType: 'HLR/HSS MAP',
    msuRate: 8940,
    capacityMsu: 18000,
    linksCount: 8,
    slsMask: '0x0F (4-bit SLS)',
    currentPlaneId: 'plane-hlr',
    status: 'IN_SERVICE',
    routingContext: '0x00000008',
    priority: 'INTERNAL',
  },
  {
    id: 'res-09',
    type: 'POINT_CODE',
    name: 'SPC-BICS-ALT-07',
    code: '3-042-7',
    protocol: 'ITU-T (14-bit)',
    carrier: 'BICS Global Title Backup',
    serviceType: 'Global Title Hub',
    msuRate: 0,
    capacityMsu: 8000,
    currentPlaneId: 'plane-staging',
    status: 'STANDBY',
    priority: 'SPARE',
  },
  {
    id: 'res-10',
    type: 'POINT_CODE',
    name: 'SPC-TMOB-CROSS-08',
    code: '244-102-008',
    protocol: 'ANSI (24-bit)',
    carrier: 'T-Mobile USA Cross-Connect',
    serviceType: 'STP Trunk',
    msuRate: 0,
    capacityMsu: 12000,
    currentPlaneId: 'plane-staging',
    status: 'STANDBY',
    priority: 'SPARE',
  },
  {
    id: 'res-11',
    type: 'LINKSET',
    name: 'LS-NTT-TYO01',
    code: '440-101-001 ⇄ 440-101-002',
    protocol: 'TTC (16-bit)',
    carrier: 'NTT Communications Tokyo',
    serviceType: 'STP Trunk',
    msuRate: 1450,
    capacityMsu: 8000,
    linksCount: 2,
    slsMask: '0x0F (4-bit SLS)',
    currentPlaneId: 'plane-staging',
    status: 'STANDBY',
    routingContext: '0x00000009',
    priority: 'TIER-2 AGGREGATOR',
  },
  {
    id: 'res-12',
    type: 'POINT_CODE',
    name: 'SPC-VODAFONE-UK-12',
    code: '2-068-3',
    protocol: 'ITU-T (14-bit)',
    carrier: 'Vodafone UK Wholesale',
    serviceType: 'SMSC Relay',
    msuRate: 0,
    capacityMsu: 10000,
    currentPlaneId: 'plane-staging',
    status: 'STANDBY',
    priority: 'SPARE',
  },
];

export const Ss7ResourceAllocator: React.FC<Ss7ResourceAllocatorProps> = ({ onShowToast }) => {
  const [planes] = useState<SignalingPlane[]>(INITIAL_PLANES);
  const [resources, setResources] = useState<AllocatableResource[]>(INITIAL_RESOURCES);
  const [baselineResources, setBaselineResources] = useState<AllocatableResource[]>(INITIAL_RESOURCES);
  
  // Drag and Drop States
  const [draggedResourceId, setDraggedResourceId] = useState<string | null>(null);
  const [hoveredPlaneId, setHoveredPlaneId] = useState<string | null>(null);

  // Inspector & Modals
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LINKSET' | 'POINT_CODE'>('ALL');

  // Provisioning Form
  const [provName, setProvName] = useState('LS-TELEFONICA-MAD01');
  const [provCode, setProvCode] = useState('2-014-1 ⇄ 2-014-5');
  const [provType, setProvType] = useState<ResourceType>('LINKSET');
  const [provProtocol, setProvProtocol] = useState<'ITU-T (14-bit)' | 'ANSI (24-bit)' | 'TTC (16-bit)'>('ITU-T (14-bit)');
  const [provCarrier, setProvCarrier] = useState('Telefonica Movistar Spain');
  const [provService, setProvService] = useState<'STP Trunk' | 'SMSC Relay' | 'HLR/HSS MAP' | 'Global Title Hub'>('STP Trunk');
  const [provPlaneId, setProvPlaneId] = useState('plane-staging');
  const [provMsuRate, setProvMsuRate] = useState(2400);
  const [provCapacity, setProvCapacity] = useState(10000);

  // Orchestration Activity Log
  const [auditLog, setAuditLog] = useState<OrchestrationLogEntry[]>([
    {
      id: 'log-01',
      timestamp: '05:42:18 UTC',
      resourceName: 'LS-BICS-FRA01',
      resourceCode: '3-042-1 ⇄ 3-042-2',
      fromPlaneName: 'Staging & Hot-Standby Pool',
      toPlaneName: 'STP Plane Alpha (EU Core)',
      operator: 'Marcus Vance (SecOps L4)',
      status: 'SUCCESS',
      message: 'M3UA Application Server Process bind confirmed with 4 SCTP associations.',
    },
    {
      id: 'log-02',
      timestamp: '05:40:02 UTC',
      resourceName: 'LS-SYN-TPA02',
      resourceCode: '244-102-001 ⇄ 244-102-003',
      fromPlaneName: 'Staging & Hot-Standby Pool',
      toPlaneName: 'STP Plane Beta (US East)',
      operator: 'Marcus Vance (SecOps L4)',
      status: 'SUCCESS',
      message: 'ANSI 24-bit linkset allocated with 8-bit SLS distribution matrix.',
    },
  ]);

  // Selected Resource
  const selectedResource = useMemo(() => {
    return resources.find((r) => r.id === selectedResourceId) || null;
  }, [resources, selectedResourceId]);

  // Track pending orchestration changes
  const pendingChangesCount = useMemo(() => {
    let count = 0;
    resources.forEach((res) => {
      const base = baselineResources.find((b) => b.id === res.id);
      if (!base || base.currentPlaneId !== res.currentPlaneId) {
        count++;
      }
    });
    return count;
  }, [resources, baselineResources]);

  // Compute Plane Telemetry (Total MSU, Load %, Erlang)
  const planeTelemetry = useMemo(() => {
    const stats: Record<string, { totalMsu: number; loadPercent: number; count: number; erlang: number }> = {};
    planes.forEach((plane) => {
      const assigned = resources.filter((r) => r.currentPlaneId === plane.id);
      const totalMsu = assigned.reduce((sum, r) => sum + r.msuRate, 0);
      const loadPercent = Math.min(100, Math.round((totalMsu / plane.maxCapacityMsu) * 100));
      const erlang = Number(((totalMsu / 4000) * 0.72).toFixed(2));
      stats[plane.id] = { totalMsu, loadPercent, count: assigned.length, erlang };
    });
    return stats;
  }, [planes, resources]);

  // Filtered Resources
  const filterResource = (res: AllocatableResource) => {
    if (typeFilter !== 'ALL' && res.type !== typeFilter) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      res.name.toLowerCase().includes(q) ||
      res.code.toLowerCase().includes(q) ||
      res.carrier.toLowerCase().includes(q) ||
      res.serviceType.toLowerCase().includes(q)
    );
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, resourceId: string) => {
    setDraggedResourceId(resourceId);
    e.dataTransfer.setData('text/plain', resourceId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, planeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredPlaneId !== planeId) {
      setHoveredPlaneId(planeId);
    }
  };

  const handleDragLeave = (planeId: string) => {
    if (hoveredPlaneId === planeId) {
      setHoveredPlaneId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPlaneId: string) => {
    e.preventDefault();
    setHoveredPlaneId(null);
    const resourceId = draggedResourceId || e.dataTransfer.getData('text/plain');
    if (!resourceId) return;

    reassignResourceToPlane(resourceId, targetPlaneId);
    setDraggedResourceId(null);
  };

  // Reassignment logic
  const reassignResourceToPlane = (resourceId: string, targetPlaneId: string) => {
    const resource = resources.find((r) => r.id === resourceId);
    const targetPlane = planes.find((p) => p.id === targetPlaneId);
    if (!resource || !targetPlane) return;

    if (resource.currentPlaneId === targetPlaneId) return;

    const fromPlane = planes.find((p) => p.id === resource.currentPlaneId);

    // Protocol check warning
    const isCrossProtocol =
      targetPlane.protocol !== 'HYBRID' &&
      resource.protocol.split(' ')[0] !== targetPlane.protocol.split(' ')[0];

    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, currentPlaneId: targetPlaneId } : r))
    );

    // Add to Audit Log
    const newLogEntry: OrchestrationLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      resourceName: resource.name,
      resourceCode: resource.code,
      fromPlaneName: fromPlane?.name || 'Unknown Plane',
      toPlaneName: targetPlane.name,
      operator: 'Marcus Vance (SecOps L4)',
      status: isCrossProtocol ? 'WARNING' : 'SUCCESS',
      message: isCrossProtocol
        ? `Reassigned with M3UA Protocol Adaptation Bridge (${resource.protocol} ⇄ ${targetPlane.protocol}).`
        : `Dynamically remapped signaling route context to ${targetPlane.name}.`,
    };

    setAuditLog((prev) => [newLogEntry, ...prev.slice(0, 19)]);

    if (onShowToast) {
      if (isCrossProtocol) {
        onShowToast(
          `Reassigned ${resource.name} to ${targetPlane.name} (Protocol Adaptation Active: ${resource.protocol} ⇄ ${targetPlane.protocol}).`,
          'warning'
        );
      } else {
        onShowToast(`Reassigned ${resource.name} to ${targetPlane.name}. Pending orchestration commit.`, 'info');
      }
    }
  };

  // Auto-Balance Workload across active production planes
  const handleAutoBalance = () => {
    const activePlanes = planes.filter((p) => p.id !== 'plane-staging');
    if (activePlanes.length === 0) return;

    // Distribute resources based on capacity and current MSU
    const productionResources = [...resources].filter((r) => r.currentPlaneId !== 'plane-staging');
    
    // Sort descending by MSU load
    productionResources.sort((a, b) => b.msuRate - a.msuRate);

    const planeLoads: { [key: string]: number } = {};
    activePlanes.forEach((p) => (planeLoads[p.id] = 0));

    const updated = resources.map((res) => {
      if (res.currentPlaneId === 'plane-staging') return res;

      // Find plane with smallest load that matches or is hybrid
      let bestPlane = activePlanes[0];
      let minLoad = Infinity;

      activePlanes.forEach((p) => {
        // Soft match protocol
        const match =
          p.protocol === 'HYBRID' ||
          res.protocol.startsWith(p.protocol.substring(0, 4));

        const effectiveLoad = planeLoads[p.id] / p.maxCapacityMsu;
        if (match && effectiveLoad < minLoad) {
          minLoad = effectiveLoad;
          bestPlane = p;
        }
      });

      planeLoads[bestPlane.id] = (planeLoads[bestPlane.id] || 0) + res.msuRate;
      return { ...res, currentPlaneId: bestPlane.id };
    });

    setResources(updated);

    const newLogEntry: OrchestrationLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      resourceName: 'ALL LINKSETS & SPCS',
      resourceCode: 'CLUSTER WIDE',
      fromPlaneName: 'Dynamic Load Topology',
      toPlaneName: 'Balanced STP Planes',
      operator: 'Marcus Vance (SecOps L4)',
      status: 'SUCCESS',
      message: 'Autonomous SLS load balancing executed across 4 active signaling planes.',
    };
    setAuditLog((prev) => [newLogEntry, ...prev]);

    if (onShowToast) {
      onShowToast('Auto-balanced signaling linksets & point codes across all STP planes.', 'success');
    }
  };

  // Commit Orchestration to M3UA Gateways
  const handleCommitOrchestration = () => {
    setBaselineResources(resources);
    setIsCommitModalOpen(false);

    const newLog: OrchestrationLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      resourceName: `${pendingChangesCount} Resources Rebound`,
      resourceCode: 'ROUTING_KEY_COMMIT',
      fromPlaneName: 'Staging Buffer',
      toPlaneName: 'Live SGW Routing Fabric',
      operator: 'Marcus Vance (SecOps L4)',
      status: 'SUCCESS',
      message: 'M3UA Routing Contexts and SLS bitmasks successfully pushed to cluster STPs.',
    };
    setAuditLog((prev) => [newLog, ...prev]);

    if (onShowToast) {
      onShowToast(`Committed ${pendingChangesCount} signaling resource reassignments to live SGW cluster.`, 'success');
    }
  };

  // Rollback to baseline
  const handleRollback = () => {
    setResources(baselineResources);
    if (onShowToast) {
      onShowToast('Reverted pending orchestration changes to previous active baseline.', 'info');
    }
  };

  // Provision New Resource
  const handleProvisionResource = (e: React.FormEvent) => {
    e.preventDefault();
    const newRes: AllocatableResource = {
      id: `res-${Date.now()}`,
      type: provType,
      name: provName.toUpperCase(),
      code: provCode,
      protocol: provProtocol,
      carrier: provCarrier,
      serviceType: provService,
      msuRate: provType === 'POINT_CODE' ? 0 : provMsuRate,
      capacityMsu: provCapacity,
      linksCount: provType === 'LINKSET' ? 4 : undefined,
      slsMask: provType === 'LINKSET' ? '0x0F (4-bit SLS)' : undefined,
      currentPlaneId: provPlaneId,
      status: provPlaneId === 'plane-staging' ? 'STANDBY' : 'IN_SERVICE',
      routingContext: `0x0000000${resources.length + 1}`,
      priority: provType === 'LINKSET' ? 'TIER-2 AGGREGATOR' : 'SPARE',
    };

    setResources((prev) => [newRes, ...prev]);
    setIsProvisionModalOpen(false);

    const targetPlane = planes.find((p) => p.id === provPlaneId);

    const logEntry: OrchestrationLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      resourceName: newRes.name,
      resourceCode: newRes.code,
      fromPlaneName: 'New Provisioning',
      toPlaneName: targetPlane?.name || 'Staging Pool',
      operator: 'Marcus Vance (SecOps L4)',
      status: 'SUCCESS',
      message: `Provisioned new ${provType}: ${newRes.name} (${newRes.code}) into ${targetPlane?.name}.`,
    };
    setAuditLog((prev) => [logEntry, ...prev]);

    if (onShowToast) {
      onShowToast(`Provisioned ${newRes.name} into ${targetPlane?.name}.`, 'success');
    }
  };

  return (
    <div className="rounded-lg bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col w-full relative space-y-4">
      {/* Module Title & Top Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-[#3d494c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[22px]">swap_driving_apps_wheel</span>
            <h2 className="text-[16px] font-semibold text-[#dfe2ee]">
              SS7 Signaling Resource Allocator &amp; Drag-and-Drop Orchestrator
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-code-metric bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6]">
              ITU-T Q.704 / RFC 4666 M3UA
            </span>
            {pendingChangesCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-code-metric bg-[#ffb4ab]/15 border border-[#ffb4ab]/30 text-[#ffb4ab] animate-pulse">
                {pendingChangesCount} Pending Reassignments
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#bcc9cd] mt-0.5">
            Dynamically reassign signaling point codes (SPCs) and linksets across carrier STP planes, M3UA application clusters, and hot-standby quarantine zones via drag-and-drop orchestration.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Balance Workload */}
          <button
            onClick={handleAutoBalance}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[11px] font-code-metric text-[#dfe2ee] hover:bg-[#353942] hover:text-[#4cd7f6] transition-all"
            title="Automatically distribute linksets and point codes to equalize Erlang capacity"
          >
            <span className="material-symbols-outlined text-[15px] text-[#4edea3]">balance</span>
            <span>Auto-Balance Planes</span>
          </button>

          {/* Provision Resource */}
          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[11px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            <span>+ Provision Resource</span>
          </button>

          {/* Audit History Drawer Toggle */}
          <button
            onClick={() => setIsAuditDrawerOpen(!isAuditDrawerOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181c24] border border-[#3d494c] text-[11px] font-code-metric text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
            title="View orchestration audit trail"
          >
            <span className="material-symbols-outlined text-[15px]">history</span>
            <span>Audit Trail ({auditLog.length})</span>
          </button>

          {/* Pending Changes Commit / Rollback */}
          {pendingChangesCount > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRollback}
                className="px-2.5 py-1.5 rounded bg-[#262a33] text-[#bcc9cd] hover:text-[#ffb4ab] text-[11px] font-code-metric border border-[#3d494c]"
                title="Discard uncommitted changes"
              >
                Rollback
              </button>
              <button
                onClick={() => setIsCommitModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#10b981] text-[#003822] font-semibold text-[11px] hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">cloud_sync</span>
                <span>Commit Orchestration ({pendingChangesCount})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-[#12161f] border border-[#293240] text-[11px] font-code-metric">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#869397]">
            <span className="material-symbols-outlined text-[15px]">filter_list</span>
            <span>FILTER:</span>
          </div>

          <div className="inline-flex rounded border border-[#3d494c] overflow-hidden">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 ${typeFilter === 'ALL' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#181c24] text-[#bcc9cd] hover:text-[#dfe2ee]'}`}
            >
              All Resources ({resources.length})
            </button>
            <button
              onClick={() => setTypeFilter('LINKSET')}
              className={`px-2.5 py-1 border-l border-[#3d494c] ${typeFilter === 'LINKSET' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#181c24] text-[#bcc9cd] hover:text-[#dfe2ee]'}`}
            >
              Linksets ({resources.filter((r) => r.type === 'LINKSET').length})
            </button>
            <button
              onClick={() => setTypeFilter('POINT_CODE')}
              className={`px-2.5 py-1 border-l border-[#3d494c] ${typeFilter === 'POINT_CODE' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'bg-[#181c24] text-[#bcc9cd] hover:text-[#dfe2ee]'}`}
            >
              Point Codes ({resources.filter((r) => r.type === 'POINT_CODE').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search Linkset, SPC, Carrier..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#0a0e16] border border-[#3d494c] rounded pl-7 pr-2 py-1 text-[#dfe2ee] placeholder:text-[#869397] outline-none text-[11px] focus:border-[#4cd7f6]"
            />
            <span className="material-symbols-outlined absolute left-2 top-1.5 text-[#869397] text-[14px]">
              search
            </span>
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1 text-[#869397] hover:text-[#dfe2ee] text-[11px]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#869397]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#4edea3]"></span> Linkset
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#d0bcff]"></span> Point Code
            </span>
          </div>
        </div>
      </div>

      {/* Main Drag-and-Drop Planes Grid (4 Production Planes + 1 Staging Pool) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
        {planes
          .filter((p) => p.id !== 'plane-staging')
          .map((plane) => {
            const telemetry = planeTelemetry[plane.id] || { totalMsu: 0, loadPercent: 0, count: 0, erlang: 0 };
            const assignedResources = resources.filter((r) => r.currentPlaneId === plane.id).filter(filterResource);
            const isHovered = hoveredPlaneId === plane.id;

            return (
              <div
                key={plane.id}
                onDragOver={(e) => handleDragOver(e, plane.id)}
                onDragLeave={() => handleDragLeave(plane.id)}
                onDrop={(e) => handleDrop(e, plane.id)}
                className={`rounded-lg bg-[#141820] border transition-all duration-200 flex flex-col min-h-[380px] shadow-sm ${
                  isHovered
                    ? 'border-[#4cd7f6] bg-[#06b6d4]/10 shadow-[0_0_16px_rgba(6,182,212,0.3)] ring-2 ring-[#4cd7f6]/50'
                    : 'border-[#293240] hover:border-[#3d494c]'
                }`}
              >
                {/* Plane Header */}
                <div className="p-3 border-b border-[#293240] bg-[#181c24] rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            plane.colorTheme === 'cyan'
                              ? 'bg-[#4cd7f6]'
                              : plane.colorTheme === 'emerald'
                              ? 'bg-[#4edea3]'
                              : plane.colorTheme === 'violet'
                              ? 'bg-[#d0bcff]'
                              : 'bg-[#fbbf24]'
                          }`}
                        ></span>
                        <h3 className="text-[13px] font-bold text-[#dfe2ee] font-code-metric">
                          {plane.name}
                        </h3>
                      </div>
                      <div className="text-[10px] text-[#869397] font-code-metric mt-0.5">
                        {plane.subTitle}
                      </div>
                    </div>

                    <span className="text-[9px] font-code-metric px-1.5 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#bcc9cd]">
                      {plane.protocol}
                    </span>
                  </div>

                  {/* Telemetry Bar */}
                  <div className="mt-2.5 pt-2 border-t border-[#293240] space-y-1 text-[10px] font-code-metric">
                    <div className="flex items-center justify-between text-[#869397]">
                      <span>
                        MSU: <strong className="text-[#dfe2ee]">{telemetry.totalMsu.toLocaleString()}</strong> /{' '}
                        {plane.maxCapacityMsu.toLocaleString()}
                      </span>
                      <span className={telemetry.loadPercent > 80 ? 'text-[#ffb4ab] font-bold' : 'text-[#4edea3]'}>
                        {telemetry.loadPercent}% ({telemetry.erlang} Erlang)
                      </span>
                    </div>

                    <div className="w-full bg-[#0a0e16] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          telemetry.loadPercent > 85
                            ? 'bg-[#ef4444]'
                            : telemetry.loadPercent > 65
                            ? 'bg-[#fbbf24]'
                            : 'bg-[#06b6d4]'
                        }`}
                        style={{ width: `${Math.min(100, telemetry.loadPercent)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Drop Zone Resource Cards Container */}
                <div className="p-2.5 flex-1 overflow-y-auto space-y-2 max-h-[460px]">
                  {assignedResources.length === 0 ? (
                    <div className="h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-[#293240] rounded p-4 text-center text-[#869397] text-[11px] font-code-metric">
                      <span className="material-symbols-outlined text-[24px] mb-1 opacity-50">move_to_inbox</span>
                      <span>No resources allocated</span>
                      <span className="text-[9.5px] text-[#556266] mt-0.5">Drag linksets or point codes here</span>
                    </div>
                  ) : (
                    assignedResources.map((res) => {
                      const isSelected = selectedResourceId === res.id;
                      const isLinkset = res.type === 'LINKSET';

                      return (
                        <div
                          key={res.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, res.id)}
                          onClick={() => setSelectedResourceId(res.id)}
                          className={`p-2.5 rounded border transition-all cursor-grab active:cursor-grabbing font-code-metric text-[11px] relative group ${
                            isSelected
                              ? 'bg-[#1f2937] border-[#4cd7f6] shadow-md'
                              : 'bg-[#181c24] border-[#293240] hover:border-[#4cd7f6]/60 hover:bg-[#1f242d]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`material-symbols-outlined text-[15px] ${
                                  isLinkset ? 'text-[#4edea3]' : 'text-[#d0bcff]'
                                }`}
                              >
                                {isLinkset ? 'hub' : 'pin_drop'}
                              </span>
                              <span className="font-bold text-[#dfe2ee] group-hover:text-[#4cd7f6] transition-colors">
                                {res.name}
                              </span>
                            </div>

                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded border ${
                                isLinkset
                                  ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                                  : 'bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/30'
                              }`}
                            >
                              {res.type}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="text-[#869397] truncate max-w-[130px]" title={res.carrier}>
                              {res.carrier}
                            </span>
                            <span className="text-[#4cd7f6] font-semibold">{res.code}</span>
                          </div>

                          <div className="mt-1 pt-1 border-t border-[#293240] flex items-center justify-between text-[9.5px] text-[#869397]">
                            <span>{res.serviceType}</span>
                            <span>{res.msuRate > 0 ? `${res.msuRate.toLocaleString()} MSU/s` : 'Standby Route'}</span>
                          </div>

                          {/* Quick Transfer Popover / Action Button */}
                          <div className="mt-2 pt-1.5 border-t border-[#293240]/80 flex items-center justify-between text-[9px]">
                            <span className="text-[#556266] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">drag_indicator</span> Drag to move
                            </span>

                            <div className="flex items-center gap-1">
                              <select
                                value={res.currentPlaneId}
                                onChange={(e) => reassignResourceToPlane(res.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#0a0e16] border border-[#3d494c] rounded text-[#bcc9cd] hover:text-[#dfe2ee] text-[9.5px] px-1 py-0.5 outline-none cursor-pointer"
                                title="Quick Transfer to another plane"
                              >
                                <option disabled value="">Move to Plane...</option>
                                {planes.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    → {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Drop Zone Footer info */}
                <div className="p-2 border-t border-[#293240] bg-[#12161f] text-[9.5px] font-code-metric text-[#869397] flex items-center justify-between rounded-b-lg">
                  <span>Primary SPC: <strong className="text-[#dfe2ee]">{plane.primarySpc}</strong></span>
                  <span>{assignedResources.length} Items</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Staging, Hot-Standby & Quarantine Pool (Full Width Lower Zone) */}
      {(() => {
        const stagingPlane = planes.find((p) => p.id === 'plane-staging')!;
        const stagingResources = resources.filter((r) => r.currentPlaneId === 'plane-staging').filter(filterResource);
        const isHovered = hoveredPlaneId === 'plane-staging';

        return (
          <div
            onDragOver={(e) => handleDragOver(e, 'plane-staging')}
            onDragLeave={() => handleDragLeave('plane-staging')}
            onDrop={(e) => handleDrop(e, 'plane-staging')}
            className={`rounded-lg bg-[#12161f] border transition-all duration-200 p-3 shadow-inner ${
              isHovered
                ? 'border-[#4cd7f6] bg-[#06b6d4]/10 ring-2 ring-[#4cd7f6]/50'
                : 'border-[#3d494c]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-[#293240] gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#869397] text-[20px]">inventory_2</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-bold text-[#dfe2ee] font-code-metric">
                      {stagingPlane.name}
                    </h3>
                    <span className="text-[9.5px] px-2 py-0.2 rounded bg-[#262a33] text-[#bcc9cd] border border-[#3d494c]">
                      {stagingResources.length} Unassigned / Standby Resources
                    </span>
                  </div>
                  <p className="text-[10px] text-[#869397] font-code-metric">
                    Staging reservoir for spare point codes, cold linksets, and maintenance quarantine. Drag items directly onto active STP planes to orchestrate routing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-code-metric text-[#869397]">
                <span>Drop Target: <strong className="text-[#dfe2ee]">Cold Staging</strong></span>
              </div>
            </div>

            {/* Staging Horizontal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
              {stagingResources.length === 0 ? (
                <div className="col-span-full p-6 text-center text-[#869397] font-code-metric text-[11px] border-2 border-dashed border-[#293240] rounded">
                  All signaling resources are actively allocated to production STP planes. Drag linksets or point codes here to deactivate or place in maintenance.
                </div>
              ) : (
                stagingResources.map((res) => (
                  <div
                    key={res.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, res.id)}
                    onClick={() => setSelectedResourceId(res.id)}
                    className="p-2.5 rounded bg-[#181c24] border border-[#293240] hover:border-[#4cd7f6] cursor-grab active:cursor-grabbing font-code-metric text-[11px] transition-all group shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-[#dfe2ee] group-hover:text-[#4cd7f6] truncate max-w-[110px]">
                        {res.name}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#0a0e16] border border-[#3d494c] text-[#869397]">
                        {res.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#4cd7f6] font-semibold mt-0.5 truncate">{res.code}</div>
                    <div className="text-[9.5px] text-[#869397] truncate mt-0.5">{res.carrier}</div>

                    <div className="mt-2 pt-1 border-t border-[#293240] flex items-center justify-between text-[9px]">
                      <span className="text-[#556266]">Standby</span>
                      <select
                        value={res.currentPlaneId}
                        onChange={(e) => reassignResourceToPlane(res.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0a0e16] border border-[#3d494c] rounded text-[#bcc9cd] hover:text-[#dfe2ee] text-[9px] px-1 py-0.5 outline-none cursor-pointer"
                        title="Reassign to plane"
                      >
                        <option disabled value="">Assign to...</option>
                        {planes.filter(p => p.id !== 'plane-staging').map((p) => (
                          <option key={p.id} value={p.id}>
                            → {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* Selected Resource Deep Inspector Drawer / Card (if selected) */}
      {selectedResource && (
        <div className="p-3.5 rounded-lg bg-[#141820] border border-[#4cd7f6]/40 font-code-metric text-[11px] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#293240]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">query_stats</span>
              <h4 className="text-[13px] font-bold text-[#dfe2ee]">
                Signaling Resource Telemetry &amp; SLS Routing Matrix: <span className="text-[#4cd7f6]">{selectedResource.name}</span>
              </h4>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
                {selectedResource.protocol}
              </span>
            </div>
            <button
              onClick={() => setSelectedResourceId(null)}
              className="text-[#869397] hover:text-[#dfe2ee] text-[13px] px-2 py-0.5 rounded hover:bg-[#262a33]"
            >
              Close Inspector ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-[11px]">
            <div className="p-2 rounded bg-[#0a0e16] border border-[#293240]">
              <span className="text-[#869397] block text-[9.5px]">ALLOCATED PLANE:</span>
              <span className="text-[#dfe2ee] font-semibold">
                {planes.find((p) => p.id === selectedResource.currentPlaneId)?.name}
              </span>
            </div>
            <div className="p-2 rounded bg-[#0a0e16] border border-[#293240]">
              <span className="text-[#869397] block text-[9.5px]">POINT CODE MAPPING:</span>
              <span className="text-[#4cd7f6] font-bold">{selectedResource.code}</span>
            </div>
            <div className="p-2 rounded bg-[#0a0e16] border border-[#293240]">
              <span className="text-[#869397] block text-[9.5px]">SERVICE TYPE:</span>
              <span className="text-[#dfe2ee]">{selectedResource.serviceType}</span>
            </div>
            <div className="p-2 rounded bg-[#0a0e16] border border-[#293240]">
              <span className="text-[#869397] block text-[9.5px]">CURRENT LOAD:</span>
              <span className="text-[#4edea3] font-bold">{selectedResource.msuRate.toLocaleString()} MSU/s</span>
            </div>
            <div className="p-2 rounded bg-[#0a0e16] border border-[#293240]">
              <span className="text-[#869397] block text-[9.5px]">SLS BITMASK:</span>
              <span className="text-[#dfe2ee]">{selectedResource.slsMask || 'N/A (Point Code)'}</span>
            </div>
            <div className="p-2 rounded bg-[#0a0e16] border border-[#293240]">
              <span className="text-[#869397] block text-[9.5px]">ROUTING CONTEXT:</span>
              <span className="text-[#d0bcff]">{selectedResource.routingContext || 'DYNAMIC'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Drawer (Collapsible) */}
      {isAuditDrawerOpen && (
        <div className="p-3.5 rounded-lg bg-[#12161f] border border-[#3d494c] font-code-metric text-[11px] space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#293240]">
            <div className="flex items-center gap-2 text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
              <span className="font-bold text-[#dfe2ee]">Signaling Orchestration Audit Trail</span>
            </div>
            <button
              onClick={() => setIsAuditDrawerOpen(false)}
              className="text-[#869397] hover:text-[#dfe2ee] text-[12px]"
            >
              Hide ✕
            </button>
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
            {auditLog.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-[#181c24] border border-[#293240] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#869397]">{log.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30'
                        : 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-[#dfe2ee] font-bold">{log.resourceName}</span>
                  <span className="text-[#4cd7f6]">{log.resourceCode}</span>
                </div>

                <div className="flex items-center gap-2 text-[#869397]">
                  <span>{log.fromPlaneName} → <strong className="text-[#dfe2ee]">{log.toPlaneName}</strong></span>
                  <span className="text-[9.5px] text-[#556266]">({log.operator})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provision Resource Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-lg bg-[#181c24] border border-[#3d494c] p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[22px]">add_circle</span>
                <h3 className="text-[15px] font-semibold text-[#dfe2ee]">
                  Provision Signaling Resource (Linkset / Point Code)
                </h3>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-[#869397] hover:text-[#dfe2ee] text-[18px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionResource} className="space-y-3 font-code-metric text-[11px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">RESOURCE TYPE:</label>
                  <select
                    value={provType}
                    onChange={(e) => setProvType(e.target.value as ResourceType)}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                  >
                    <option value="LINKSET">SS7 Signaling Linkset</option>
                    <option value="POINT_CODE">Signaling Point Code (SPC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">PROTOCOL VARIANT:</label>
                  <select
                    value={provProtocol}
                    onChange={(e) => setProvProtocol(e.target.value as any)}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                  >
                    <option value="ITU-T (14-bit)">ITU-T (14-bit Format)</option>
                    <option value="ANSI (24-bit)">ANSI (24-bit Format)</option>
                    <option value="TTC (16-bit)">TTC Japan (16-bit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">RESOURCE IDENTIFIER / NAME:</label>
                  <input
                    type="text"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                    placeholder="LS-CARRIER-01"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">POINT CODE MAPPING:</label>
                  <input
                    type="text"
                    value={provCode}
                    onChange={(e) => setProvCode(e.target.value)}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                    placeholder="3-042-1 ⇄ 2-014-5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">INTERCONNECT CARRIER:</label>
                  <input
                    type="text"
                    value={provCarrier}
                    onChange={(e) => setProvCarrier(e.target.value)}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                    placeholder="Carrier Name"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">SERVICE TYPE:</label>
                  <select
                    value={provService}
                    onChange={(e) => setProvService(e.target.value as any)}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                  >
                    <option value="STP Trunk">STP Trunk Route</option>
                    <option value="SMSC Relay">SMSC Relay Link</option>
                    <option value="HLR/HSS MAP">HLR/HSS MAP Interface</option>
                    <option value="Global Title Hub">Global Title Hub</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">INITIAL TARGET PLANE:</label>
                  <select
                    value={provPlaneId}
                    onChange={(e) => setProvPlaneId(e.target.value)}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                  >
                    {planes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#869397] block mb-1">CAPACITY (MSU/SEC):</label>
                  <input
                    type="number"
                    value={provCapacity}
                    onChange={(e) => setProvCapacity(Number(e.target.value))}
                    className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                    min={1000}
                    max={50000}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d494c]">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
                >
                  Provision into Staging
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commit Orchestration Safety Validation Modal */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-lg bg-[#181c24] border border-[#3d494c] p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#3d494c]">
              <div className="flex items-center gap-2 text-[#10b981]">
                <span className="material-symbols-outlined text-[24px]">cloud_sync</span>
                <h3 className="text-[15px] font-semibold text-[#dfe2ee]">
                  Commit Signaling Orchestration
                </h3>
              </div>
              <button
                onClick={() => setIsCommitModalOpen(false)}
                className="text-[#869397] hover:text-[#dfe2ee] text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 font-code-metric text-[11px] text-[#bcc9cd]">
              <p>
                You are about to push <strong className="text-[#4cd7f6]">{pendingChangesCount} reallocated signaling resource(s)</strong> live into the M3UA Signaling Gateway (SGW) routing fabric.
              </p>

              <div className="p-3 rounded bg-[#0a0e16] border border-[#293240] space-y-1.5 text-[10.5px]">
                <div className="text-[#869397] font-bold text-[9.5px] uppercase">Safety Verification Pre-Check:</div>
                <div className="flex items-center gap-1.5 text-[#4edea3]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>SLS bitmasks verified (no routing loops)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#4edea3]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Dual-homed SCTP associations ping confirmed</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#4edea3]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>M3UA Routing Context keys matched with STPs</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d494c]">
              <button
                onClick={() => setIsCommitModalOpen(false)}
                className="px-3.5 py-1.5 rounded bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] text-[12px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitOrchestration}
                className="px-4 py-1.5 rounded bg-[#10b981] text-[#003822] font-semibold text-[12px] hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all"
              >
                Apply Live Reassignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
