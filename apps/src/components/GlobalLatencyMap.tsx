import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import countriesData from 'world-atlas/countries-110m.json';

export interface Tier1Gateway {
  id: string;
  name: string;
  carrier: string;
  city: string;
  country: string;
  coordinates: [number, number]; // [lon, lat]
  latencyMs: number;
  baselineLatency: number;
  jitterMs: number;
  packetLoss: number;
  status: 'OPTIMAL' | 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  mps: number;
  tier: 'TIER-1 DIRECT' | 'DIRECT IXP' | 'SUBSEA BACKBONE';
  systemId: string;
  activeBinds: number;
  ixp: string;
  isCoreHub?: boolean;
}

export interface TransitLink {
  id: string;
  sourceId: string;
  targetId: string;
  latencyMs: number;
  baselineLatency: number;
  status: 'OPTIMAL' | 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  cableName: string;
  packetRate: number; // pulses per sec
}

const INITIAL_GATEWAYS: Tier1Gateway[] = [
  {
    id: 'gw-ashburn',
    name: 'US-East Core Hub',
    carrier: 'Twilio Direct US / AWS Direct Connect',
    city: 'Ashburn, VA',
    country: 'United States',
    coordinates: [-77.4875, 39.0438],
    latencyMs: 12,
    baselineLatency: 12,
    jitterMs: 0.8,
    packetLoss: 0.0,
    status: 'OPTIMAL',
    mps: 680,
    tier: 'TIER-1 DIRECT',
    systemId: 'twlo_core_iad01',
    activeBinds: 4,
    ixp: 'Equinix Ashburn (IAD)',
    isCoreHub: true,
  },
  {
    id: 'gw-oregon',
    name: 'US-West Ingress',
    carrier: 'Telnyx Global Transit',
    city: 'Boardman, OR',
    country: 'United States',
    coordinates: [-122.6784, 45.5152],
    latencyMs: 24,
    baselineLatency: 24,
    jitterMs: 1.2,
    packetLoss: 0.0,
    status: 'OPTIMAL',
    mps: 195,
    tier: 'TIER-1 DIRECT',
    systemId: 'tlnx_west_pdx02',
    activeBinds: 2,
    ixp: 'NWAX Portland',
  },
  {
    id: 'gw-frankfurt',
    name: 'EU-Central Core',
    carrier: 'Deutsche Telekom D1 / BICS Primary',
    city: 'Frankfurt',
    country: 'Germany',
    coordinates: [8.6821, 50.1109],
    latencyMs: 18,
    baselineLatency: 18,
    jitterMs: 0.9,
    packetLoss: 0.0,
    status: 'OPTIMAL',
    mps: 390,
    tier: 'TIER-1 DIRECT',
    systemId: 'dtag_fra_core01',
    activeBinds: 3,
    ixp: 'DE-CIX Frankfurt',
    isCoreHub: true,
  },
  {
    id: 'gw-london',
    name: 'EU-West Gateway',
    carrier: 'Vodafone Enterprise Transit',
    city: 'London',
    country: 'United Kingdom',
    coordinates: [-0.1278, 51.5074],
    latencyMs: 16,
    baselineLatency: 16,
    jitterMs: 1.1,
    packetLoss: 0.0,
    status: 'OPTIMAL',
    mps: 260,
    tier: 'DIRECT IXP',
    systemId: 'voda_uk_lon01',
    activeBinds: 3,
    ixp: 'LINX London',
  },
  {
    id: 'gw-singapore',
    name: 'APAC Primary Hub',
    carrier: 'Tata Communications Asia / Singtel',
    city: 'Singapore',
    country: 'Singapore',
    coordinates: [103.8198, 1.3521],
    latencyMs: 42,
    baselineLatency: 42,
    jitterMs: 2.1,
    packetLoss: 0.0,
    status: 'NORMAL',
    mps: 217,
    tier: 'SUBSEA BACKBONE',
    systemId: 'tata_sg_ap01',
    activeBinds: 2,
    ixp: 'Equinix SG1 / SGIX',
    isCoreHub: true,
  },
  {
    id: 'gw-tokyo',
    name: 'Japan / East Asia',
    carrier: 'NTT Com / SoftBank Carrier Direct',
    city: 'Tokyo',
    country: 'Japan',
    coordinates: [139.6917, 35.6895],
    latencyMs: 54,
    baselineLatency: 54,
    jitterMs: 2.4,
    packetLoss: 0.0,
    status: 'NORMAL',
    mps: 180,
    tier: 'TIER-1 DIRECT',
    systemId: 'ntt_tyo_direct02',
    activeBinds: 2,
    ixp: 'JPIX Tokyo',
  },
  {
    id: 'gw-mumbai',
    name: 'South Asia Ingress',
    carrier: 'Bharti Airtel Enterprise / Jio',
    city: 'Mumbai',
    country: 'India',
    coordinates: [72.8777, 19.0760],
    latencyMs: 48,
    baselineLatency: 48,
    jitterMs: 2.6,
    packetLoss: 0.0,
    status: 'NORMAL',
    mps: 185,
    tier: 'DIRECT IXP',
    systemId: 'airtel_bom_in01',
    activeBinds: 2,
    ixp: 'NIXI Mumbai',
  },
  {
    id: 'gw-saopaulo',
    name: 'Latin America Hub',
    carrier: 'Claro Carrier / Vivo LATAM',
    city: 'São Paulo',
    country: 'Brazil',
    coordinates: [-46.6333, -23.5505],
    latencyMs: 62,
    baselineLatency: 62,
    jitterMs: 3.1,
    packetLoss: 0.01,
    status: 'NORMAL',
    mps: 142,
    tier: 'SUBSEA BACKBONE',
    systemId: 'claro_gru_latam',
    activeBinds: 2,
    ixp: 'IX.br São Paulo',
  },
  {
    id: 'gw-sydney',
    name: 'Oceania Regional',
    carrier: 'Telstra Global Roaming',
    city: 'Sydney',
    country: 'Australia',
    coordinates: [151.2093, -33.8688],
    latencyMs: 78,
    baselineLatency: 78,
    jitterMs: 3.8,
    packetLoss: 0.0,
    status: 'ELEVATED',
    mps: 98,
    tier: 'SUBSEA BACKBONE',
    systemId: 'telstra_syd_au01',
    activeBinds: 2,
    ixp: 'Equinix SY3 Sydney',
  },
  {
    id: 'gw-dubai',
    name: 'Middle East Ingress',
    carrier: 'Etisalat e& / STC Carrier Direct',
    city: 'Dubai',
    country: 'United Arab Emirates',
    coordinates: [55.2708, 25.2048],
    latencyMs: 38,
    baselineLatency: 38,
    jitterMs: 1.8,
    packetLoss: 0.0,
    status: 'NORMAL',
    mps: 118,
    tier: 'DIRECT IXP',
    systemId: 'etisalat_dxb_me01',
    activeBinds: 2,
    ixp: 'UAE-IX Datamena',
  },
  {
    id: 'gw-johannesburg',
    name: 'Sub-Saharan Africa',
    carrier: 'MTN Group / Vodacom International',
    city: 'Johannesburg',
    country: 'South Africa',
    coordinates: [28.0473, -26.2041],
    latencyMs: 84,
    baselineLatency: 84,
    jitterMs: 4.2,
    packetLoss: 0.02,
    status: 'ELEVATED',
    mps: 76,
    tier: 'SUBSEA BACKBONE',
    systemId: 'mtn_jnb_za01',
    activeBinds: 1,
    ixp: 'NAPAfrica Teraco',
  },
  {
    id: 'gw-stockholm',
    name: 'Nordics Hub',
    carrier: 'Sinch Global Route / Telia Carrier',
    city: 'Stockholm',
    country: 'Sweden',
    coordinates: [18.0686, 59.3293],
    latencyMs: 22,
    baselineLatency: 22,
    jitterMs: 1.0,
    packetLoss: 0.0,
    status: 'OPTIMAL',
    mps: 165,
    tier: 'TIER-1 DIRECT',
    systemId: 'sinch_arn_eu02',
    activeBinds: 2,
    ixp: 'Netnod Stockholm',
  },
];

const INITIAL_LINKS: TransitLink[] = [
  // Trans-Atlantic Core (Ashburn <-> Frankfurt, London)
  { id: 'link-ash-fra', sourceId: 'gw-ashburn', targetId: 'gw-frankfurt', latencyMs: 68, baselineLatency: 68, status: 'OPTIMAL', cableName: 'MAREA / Dunant Subsea', packetRate: 480 },
  { id: 'link-ash-lon', sourceId: 'gw-ashburn', targetId: 'gw-london', latencyMs: 64, baselineLatency: 64, status: 'OPTIMAL', cableName: 'Apollo North Express', packetRate: 340 },
  { id: 'link-ash-pdx', sourceId: 'gw-ashburn', targetId: 'gw-oregon', latencyMs: 42, baselineLatency: 42, status: 'OPTIMAL', cableName: 'Trans-US Terrestrial 400G', packetRate: 210 },
  { id: 'link-ash-gru', sourceId: 'gw-ashburn', targetId: 'gw-saopaulo', latencyMs: 98, baselineLatency: 98, status: 'NORMAL', cableName: 'Seabras-1 Direct Cable', packetRate: 140 },
  
  // European Ring
  { id: 'link-fra-lon', sourceId: 'gw-frankfurt', targetId: 'gw-london', latencyMs: 14, baselineLatency: 14, status: 'OPTIMAL', cableName: 'Pan-European Dark Fiber', packetRate: 290 },
  { id: 'link-fra-arn', sourceId: 'gw-frankfurt', targetId: 'gw-stockholm', latencyMs: 22, baselineLatency: 22, status: 'OPTIMAL', cableName: 'Baltic Sea Link', packetRate: 160 },
  { id: 'link-fra-dxb', sourceId: 'gw-frankfurt', targetId: 'gw-dubai', latencyMs: 74, baselineLatency: 74, status: 'NORMAL', cableName: 'AAE-1 Asia-Africa-Europe', packetRate: 120 },
  { id: 'link-fra-jnb', sourceId: 'gw-frankfurt', targetId: 'gw-johannesburg', latencyMs: 138, baselineLatency: 138, status: 'NORMAL', cableName: 'WACS West Africa Cable', packetRate: 85 },

  // Asia-Pacific & Middle East Transit
  { id: 'link-dxb-bom', sourceId: 'gw-dubai', targetId: 'gw-mumbai', latencyMs: 28, baselineLatency: 28, status: 'OPTIMAL', cableName: 'FALCON Submarine Cable', packetRate: 190 },
  { id: 'link-bom-sin', sourceId: 'gw-mumbai', targetId: 'gw-singapore', latencyMs: 44, baselineLatency: 44, status: 'NORMAL', cableName: 'i2i Submarine Cable', packetRate: 215 },
  { id: 'link-sin-tyo', sourceId: 'gw-singapore', targetId: 'gw-tokyo', latencyMs: 62, baselineLatency: 62, status: 'NORMAL', cableName: 'SJC2 South East Asia Japan', packetRate: 195 },
  { id: 'link-sin-syd', sourceId: 'gw-singapore', targetId: 'gw-sydney', latencyMs: 88, baselineLatency: 88, status: 'NORMAL', cableName: 'Australia-Singapore Indigo', packetRate: 110 },
  
  // Trans-Pacific Corridors (US-West <-> Tokyo, Sydney)
  { id: 'link-pdx-tyo', sourceId: 'gw-oregon', targetId: 'gw-tokyo', latencyMs: 96, baselineLatency: 96, status: 'NORMAL', cableName: 'FASTER Trans-Pacific Cable', packetRate: 180 },
  { id: 'link-pdx-syd', sourceId: 'gw-oregon', targetId: 'gw-sydney', latencyMs: 142, baselineLatency: 142, status: 'ELEVATED', cableName: 'Southern Cross Cable Link', packetRate: 95 },
];

interface TooltipData {
  type: 'gateway' | 'link';
  x: number;
  y: number;
  gateway?: Tier1Gateway;
  link?: TransitLink;
  sourceGateway?: Tier1Gateway;
  targetGateway?: Tier1Gateway;
}

interface GlobalLatencyMapProps {
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigateToTrunk?: () => void;
}

export const GlobalLatencyMap: React.FC<GlobalLatencyMapProps> = ({
  onShowToast,
  onNavigateToTrunk,
}) => {
  const [gateways, setGateways] = useState<Tier1Gateway[]>(INITIAL_GATEWAYS);
  const [links, setLinks] = useState<TransitLink[]>(INITIAL_LINKS);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'CORE' | 'HIGH_LATENCY'>('ALL');
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 980, height: 480 });

  // Resize observer for responsive SVG canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          const w = Math.max(680, entry.contentRect.width);
          // 2.1 aspect ratio for balanced world map
          const h = Math.max(400, Math.min(540, Math.round(w * 0.48)));
          setDimensions({ width: w, height: h });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Live real-time latency fluctuations (jitter & packet latency heartbeat)
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      // Fluctuate gateway latency
      setGateways((prev) =>
        prev.map((gw) => {
          const jitter = (Math.random() - 0.5) * (gw.jitterMs * 2);
          const currentLatency = Math.max(8, Math.round(gw.baselineLatency + jitter));
          let status: Tier1Gateway['status'] = 'OPTIMAL';
          if (currentLatency > 75) status = 'CRITICAL';
          else if (currentLatency > 50) status = 'ELEVATED';
          else if (currentLatency > 28) status = 'NORMAL';

          return {
            ...gw,
            latencyMs: currentLatency,
            status,
          };
        })
      );

      // Fluctuate link transit latency
      setLinks((prev) =>
        prev.map((link) => {
          const jitter = (Math.random() - 0.48) * 3;
          const currentLatency = Math.max(10, Math.round(link.baselineLatency + jitter));
          let status: TransitLink['status'] = 'OPTIMAL';
          if (currentLatency > 120) status = 'CRITICAL';
          else if (currentLatency > 80) status = 'ELEVATED';
          else if (currentLatency > 40) status = 'NORMAL';

          return {
            ...link,
            latencyMs: currentLatency,
            status,
          };
        })
      );
    }, 1400);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Simulation: Trigger Trans-Pacific Undersea Cable Congestion
  const handleSimulatePacificCongestion = () => {
    setGateways((prev) =>
      prev.map((gw) => {
        if (['gw-tokyo', 'gw-sydney', 'gw-singapore'].includes(gw.id)) {
          return {
            ...gw,
            latencyMs: gw.latencyMs + 65,
            jitterMs: 8.4,
            packetLoss: 0.08,
            status: 'CRITICAL',
          };
        }
        return gw;
      })
    );

    setLinks((prev) =>
      prev.map((link) => {
        if (['link-pdx-tyo', 'link-pdx-syd', 'link-sin-syd'].includes(link.id)) {
          return {
            ...link,
            latencyMs: link.latencyMs + 78,
            status: 'CRITICAL',
          };
        }
        return link;
      })
    );

    if (onShowToast) {
      onShowToast(
        'BGP Route Alert: Injected +78ms congestion on FASTER & Southern Cross subsea cables.',
        'warning'
      );
    }
  };

  // Reset simulation to baseline
  const handleResetSimulation = () => {
    setGateways(INITIAL_GATEWAYS);
    setLinks(INITIAL_LINKS);
    if (onShowToast) {
      onShowToast('Global mesh latency baseline recalibrated to SLA nominals.', 'info');
    }
  };

  // Convert TopoJSON to GeoJSON features
  const countries = useMemo(() => {
    try {
      const featureColl = topojson.feature(
        countriesData as any,
        (countriesData as any).objects.countries
      );
      return (featureColl as any).features || [];
    } catch {
      return [];
    }
  }, []);

  // D3 Projection and Path Generator
  const projection = useMemo(() => {
    return d3
      .geoNaturalEarth1()
      .scale(dimensions.width / 5.8)
      .translate([dimensions.width / 2, dimensions.height / 2 + 10]);
  }, [dimensions.width, dimensions.height]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Graticule grid generator
  const graticule = useMemo(() => {
    return d3.geoGraticule10();
  }, []);

  // Filtered Gateways
  const displayedGateways = useMemo(() => {
    if (filterMode === 'CORE') {
      return gateways.filter((g) => g.isCoreHub);
    }
    if (filterMode === 'HIGH_LATENCY') {
      return gateways.filter((g) => g.latencyMs > 50);
    }
    return gateways;
  }, [gateways, filterMode]);

  // Active links matching current filter & selection
  const displayedLinks = useMemo(() => {
    const activeGatewayIds = new Set(displayedGateways.map((g) => g.id));
    return links.filter((link) => {
      if (selectedGatewayId) {
        return link.sourceId === selectedGatewayId || link.targetId === selectedGatewayId;
      }
      return activeGatewayIds.has(link.sourceId) && activeGatewayIds.has(link.targetId);
    });
  }, [links, displayedGateways, selectedGatewayId]);

  // Latency Color Helper
  const getLatencyColor = (latency: number) => {
    if (latency <= 20) return '#10b981'; // Green / Emerald
    if (latency <= 45) return '#06b6d4'; // Cyan
    if (latency <= 75) return '#f59e0b'; // Amber
    return '#ef4444'; // Red / Critical
  };

  // Overall Global Telemetry Stats
  const globalStats = useMemo(() => {
    const avgLatency = (gateways.reduce((acc, g) => acc + g.latencyMs, 0) / gateways.length).toFixed(1);
    const totalMps = gateways.reduce((acc, g) => acc + g.mps, 0);
    const elevatedCount = gateways.filter((g) => g.latencyMs > 50).length;
    return {
      avgLatency,
      totalMps,
      elevatedCount,
      gatewaysUp: gateways.length,
    };
  }, [gateways]);

  return (
    <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col w-full relative">
      {/* Header with Title & Live Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#3d494c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">public</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">
              Real-Time Global Packet Latency Mesh
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-code-metric bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
              {isLiveActive ? 'SCTP / SMPP MESH ACTIVE' : 'LIVE STREAM PAUSED'}
            </span>
          </div>
          <p className="text-[11px] text-[#bcc9cd] mt-0.5">
            D3.js geospatial telemetry rendering round-trip latency across Tier-1 carrier SMS gateways &amp; trans-oceanic subsea fiber routes.
          </p>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="inline-flex p-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[11px]">
            <button
              onClick={() => {
                setFilterMode('ALL');
                setSelectedGatewayId(null);
              }}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                filterMode === 'ALL'
                  ? 'bg-[#06b6d4] text-[#00424f] font-semibold'
                  : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              All 12 Gateways
            </button>
            <button
              onClick={() => {
                setFilterMode('CORE');
                setSelectedGatewayId(null);
              }}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                filterMode === 'CORE'
                  ? 'bg-[#06b6d4] text-[#00424f] font-semibold'
                  : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              Core Hubs Only
            </button>
            <button
              onClick={() => {
                setFilterMode('HIGH_LATENCY');
                setSelectedGatewayId(null);
              }}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                filterMode === 'HIGH_LATENCY'
                  ? 'bg-[#06b6d4] text-[#00424f] font-semibold'
                  : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              High Latency (&gt;50ms)
            </button>
          </div>

          {/* Pause / Resume Live Streaming */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`p-1.5 rounded border text-[13px] flex items-center justify-center transition-all ${
              isLiveActive
                ? 'bg-[#181c24] border-[#3d494c] text-[#4edea3] hover:bg-[#262a33]'
                : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
            }`}
            title={isLiveActive ? 'Pause latency stream' : 'Resume latency stream'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isLiveActive ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Inject Subsea Cable Congestion */}
          <button
            onClick={handleSimulatePacificCongestion}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] text-[11px] hover:border-[#ffb4ab] transition-all"
            title="Simulate Trans-Pacific Cable Delay"
          >
            <span className="material-symbols-outlined text-[#ffb4ab] text-[14px]">warning</span>
            <span>Simulate Cable Congestion</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={handleResetSimulation}
            className="p-1.5 rounded bg-[#181c24] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
            title="Recalibrate all routes to nominal baseline"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 font-code-metric text-[11px]">
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">GLOBAL P99 MESH:</span>
          <span className="font-bold text-[#4cd7f6] tabular-nums">{globalStats.avgLatency}ms RTT</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">CONNECTED TRUNKS:</span>
          <span className="font-bold text-[#4edea3]">{globalStats.gatewaysUp} / 12 UP</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">TRANS-OCEANIC MPS:</span>
          <span className="font-bold text-[#dfe2ee] tabular-nums">{globalStats.totalMps.toLocaleString()} MPS</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">ELEVATED ROUTES:</span>
          <span className={`font-bold ${globalStats.elevatedCount > 0 ? 'text-[#f59e0b]' : 'text-[#4edea3]'}`}>
            {globalStats.elevatedCount} Routes
          </span>
        </div>
      </div>

      {/* D3 Geospatial SVG Canvas */}
      <div
        ref={containerRef}
        className="w-full relative overflow-hidden rounded bg-[#0a0e16] border border-[#3d494c] p-1 flex items-center justify-center select-none"
        style={{ minHeight: `${dimensions.height}px` }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto max-h-[540px] block"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <defs>
            {/* Gradients for links */}
            <linearGradient id="link-grad-optimal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="link-grad-elevated" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="link-grad-critical" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Graticule / Meridian Grid lines */}
          <path
            d={pathGenerator(graticule) || ''}
            fill="none"
            stroke="#1c2433"
            strokeWidth="0.6"
            strokeDasharray="2 3"
          />

          {/* Landmass Paths */}
          <g className="landmasses">
            {countries.map((feature: any, i: number) => {
              const d = pathGenerator(feature);
              if (!d) return null;
              return (
                <path
                  key={`land-${i}`}
                  d={d}
                  fill="#151b24"
                  stroke="#232d3d"
                  strokeWidth="0.6"
                  className="transition-colors duration-200 hover:fill-[#1b222e]"
                />
              );
            })}
          </g>

          {/* Transit Links & Geodesic Arcs */}
          <g className="transit-links">
            {displayedLinks.map((link) => {
              const srcGw = gateways.find((g) => g.id === link.sourceId);
              const tgtGw = gateways.find((g) => g.id === link.targetId);
              if (!srcGw || !tgtGw) return null;

              const srcCoords = projection(srcGw.coordinates);
              const tgtCoords = projection(tgtGw.coordinates);
              if (!srcCoords || !tgtCoords) return null;

              const [x1, y1] = srcCoords;
              const [x2, y2] = tgtCoords;

              // Quadratic curve offset for smooth trans-oceanic arc look
              const dx = x2 - x1;
              const dy = y2 - y1;
              const dr = Math.sqrt(dx * dx + dy * dy);
              // Midpoint curvature
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2 - Math.min(65, dr * 0.22);

              const pathData = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

              const strokeColor =
                link.status === 'CRITICAL'
                  ? 'url(#link-grad-critical)'
                  : link.status === 'ELEVATED'
                  ? 'url(#link-grad-elevated)'
                  : 'url(#link-grad-optimal)';

              const strokeWidth = link.status === 'CRITICAL' ? 2 : 1.2;
              const isSelected = selectedGatewayId === srcGw.id || selectedGatewayId === tgtGw.id;

              return (
                <g
                  key={link.id}
                  className="cursor-pointer group"
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({
                        type: 'link',
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        link,
                        sourceGateway: srcGw,
                        targetGateway: tgtGw,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltip((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            }
                          : null
                      );
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Invisible wide hit area for easy hover */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                  />

                  {/* Base Route Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
                    strokeDasharray={link.status === 'CRITICAL' ? '4 3' : 'solid'}
                    opacity={selectedGatewayId ? (isSelected ? 1 : 0.2) : 0.75}
                    className="transition-all duration-300 group-hover:opacity-100 group-hover:stroke-width-2"
                  />

                  {/* Animated Traveling Packet Pulse along route */}
                  {isLiveActive && (
                    <circle r={link.status === 'CRITICAL' ? 2.5 : 2} fill={getLatencyColor(link.latencyMs)}>
                      <animateMotion
                        path={pathData}
                        dur={`${Math.max(1.8, Math.min(5.5, link.latencyMs / 18))}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* Gateway Nodes */}
          <g className="gateways">
            {displayedGateways.map((gw) => {
              const coords = projection(gw.coordinates);
              if (!coords) return null;
              const [x, y] = coords;

              const isSelected = selectedGatewayId === gw.id;
              const nodeColor = getLatencyColor(gw.latencyMs);

              return (
                <g
                  key={gw.id}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedGatewayId(selectedGatewayId === gw.id ? null : gw.id);
                    if (onShowToast) {
                      onShowToast(
                        `Filtered links for ${gw.name} (${gw.carrier}): ${gw.latencyMs}ms P99 latency.`,
                        'info'
                      );
                    }
                  }}
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({
                        type: 'gateway',
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        gateway: gw,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltip((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            }
                          : null
                      );
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Concentric Pulse Ring for Core Hubs or Elevated routes */}
                  <circle
                    r={gw.isCoreHub ? 12 : 8}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="1"
                    opacity="0.3"
                    className="animate-ping"
                  />

                  {/* Outer Ring */}
                  <circle
                    r={gw.isCoreHub ? 7 : 5}
                    fill="#0a0e16"
                    stroke={nodeColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter="url(#node-glow)"
                  />

                  {/* Center Dot */}
                  <circle
                    r={gw.isCoreHub ? 3.5 : 2.5}
                    fill={nodeColor}
                  />

                  {/* Latency Badge Text Overlay */}
                  <g transform="translate(0, -11)">
                    <rect
                      x="-18"
                      y="-8"
                      width="36"
                      height="12"
                      rx="2"
                      fill="#0a0e16"
                      stroke={nodeColor}
                      strokeWidth="0.8"
                      opacity="0.9"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-code-metric text-[8.5px] font-bold select-none pointer-events-none"
                      fill={nodeColor}
                    >
                      {gw.latencyMs}ms
                    </text>
                  </g>

                  {/* City Label Below */}
                  <text
                    y="15"
                    textAnchor="middle"
                    className={`font-code-metric text-[8.5px] select-none pointer-events-none transition-colors ${
                      isSelected ? 'fill-[#ffffff] font-bold' : 'fill-[#bcc9cd]'
                    }`}
                  >
                    {gw.city}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Gateway Clear Action Overlay */}
        {selectedGatewayId && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#181c24]/90 border border-[#4cd7f6] px-2.5 py-1 rounded shadow-md text-[11px] font-code-metric text-[#dfe2ee]">
            <span>Isolating: {gateways.find((g) => g.id === selectedGatewayId)?.name}</span>
            <button
              onClick={() => setSelectedGatewayId(null)}
              className="text-[#ffb4ab] hover:underline text-[10px]"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Interactive Floating Tooltip */}
        {tooltip && (
          <div
            className="absolute z-30 pointer-events-none p-3 rounded-md bg-[#181c24] border border-[#4cd7f6] text-[#dfe2ee] shadow-[0_4px_24px_rgba(0,0,0,0.85)] font-code-metric text-[11px] max-w-xs transition-transform duration-75"
            style={{
              left: `${Math.min(tooltip.x + 15, dimensions.width - 270)}px`,
              top: `${Math.max(10, tooltip.y - 130)}px`,
            }}
          >
            {tooltip.type === 'gateway' && tooltip.gateway && (
              <>
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#3d494c]">
                  <div className="font-bold text-[#4cd7f6] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                    <span>{tooltip.gateway.name}</span>
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      backgroundColor: `${getLatencyColor(tooltip.gateway.latencyMs)}20`,
                      color: getLatencyColor(tooltip.gateway.latencyMs),
                    }}
                  >
                    {tooltip.gateway.status}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Round-Trip P99:</span>
                    <span
                      className="font-bold"
                      style={{ color: getLatencyColor(tooltip.gateway.latencyMs) }}
                    >
                      {tooltip.gateway.latencyMs} ms (±{tooltip.gateway.jitterMs}ms)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Throughput:</span>
                    <span className="font-bold text-[#4cd7f6]">{tooltip.gateway.mps} MPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Carrier Trunk:</span>
                    <span className="text-[#dfe2ee]">{tooltip.gateway.carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">IXP Interconnect:</span>
                    <span className="text-[#bcc9cd]">{tooltip.gateway.ixp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Packet Loss:</span>
                    <span className="text-[#4edea3]">{tooltip.gateway.packetLoss.toFixed(2)}% (Zero SLA Loss)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#3d494c]/60">
                    <span className="text-[#869397]">Binds:</span>
                    <span className="text-[#4edea3]">{tooltip.gateway.activeBinds} x TRX UP</span>
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-[#3d494c] text-[9px] text-[#869397]">
                  Click to isolate connected subsea transit arcs
                </div>
              </>
            )}

            {tooltip.type === 'link' && tooltip.link && tooltip.sourceGateway && tooltip.targetGateway && (
              <>
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#3d494c]">
                  <div className="font-bold text-[#4cd7f6] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">cable</span>
                    <span>{tooltip.link.cableName}</span>
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      backgroundColor: `${getLatencyColor(tooltip.link.latencyMs)}20`,
                      color: getLatencyColor(tooltip.link.latencyMs),
                    }}
                  >
                    {tooltip.link.latencyMs} ms
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Route:</span>
                    <span className="text-[#dfe2ee]">
                      {tooltip.sourceGateway.city} ↔ {tooltip.targetGateway.city}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Latency P99:</span>
                    <span
                      className="font-bold"
                      style={{ color: getLatencyColor(tooltip.link.latencyMs) }}
                    >
                      {tooltip.link.latencyMs} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Link Bandwidth:</span>
                    <span className="text-[#4cd7f6]">{tooltip.link.packetRate} MPS in flight</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#869397]">Physical Layer:</span>
                    <span className="text-[#bcc9cd]">Dual-Homed DWDM Subsea</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Latency Spectrum Legend and Details */}
      <div className="mt-3 pt-2.5 border-t border-[#3d494c] flex flex-col md:flex-row items-center justify-between gap-3 text-[11px]">
        {/* Latency Threshold Spectrum */}
        <div className="flex items-center gap-3">
          <span className="text-[#869397] font-code-metric uppercase text-[10px]">Latency SLA:</span>
          <div className="flex items-center gap-3 font-code-metric text-[10px]">
            <span className="flex items-center gap-1 text-[#10b981]">
              <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
              &lt; 20ms (Optimal)
            </span>
            <span className="flex items-center gap-1 text-[#06b6d4]">
              <span className="h-2 w-2 rounded-full bg-[#06b6d4]"></span>
              20–50ms (Nominal)
            </span>
            <span className="flex items-center gap-1 text-[#f59e0b]">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
              50–75ms (Elevated)
            </span>
            <span className="flex items-center gap-1 text-[#ef4444]">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]"></span>
              &gt; 75ms (Critical)
            </span>
          </div>
        </div>

        {/* Secondary Action Link */}
        <div className="flex items-center gap-2">
          {onNavigateToTrunk && (
            <button
              onClick={onNavigateToTrunk}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#262a33] text-[#4cd7f6] hover:bg-[#353942] text-[11px] transition-all"
            >
              <span>Inspect All 12 SMPP Trunks</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
