import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

export type HeatmapMetric = 'mps' | 'dlr' | 'latency' | 'window';
export type TimeScaleMode = '24h' | '60m';

export interface RegionData {
  id: string;
  name: string;
  code: string;
  datacenter: string;
  provider: string;
  baselineMps: number;
  carrierTrunk: string;
}

export const REGIONS: RegionData[] = [
  { id: 'us-east', name: 'US-East (Ashburn)', code: 'IAD-01', datacenter: 'Equinix DC2', provider: 'AWS us-east-1', baselineMps: 680, carrierTrunk: 'Twilio Direct US' },
  { id: 'us-west', name: 'US-West (Oregon)', code: 'PDX-02', datacenter: 'EdgeConneX EDCPDX', provider: 'AWS us-west-2', baselineMps: 195, carrierTrunk: 'Telnyx Backbone' },
  { id: 'eu-central', name: 'EU-Central (Frankfurt)', code: 'FRA-01', datacenter: 'Interxion FRA1', provider: 'DE-CIX Peering', baselineMps: 390, carrierTrunk: 'Deutsche Telekom D1' },
  { id: 'eu-west', name: 'EU-West (London)', code: 'LON-01', datacenter: 'Telehouse North', provider: 'LINX Exchange', baselineMps: 260, carrierTrunk: 'Vodafone Transit' },
  { id: 'ap-east', name: 'AP-East (Singapore)', code: 'SIN-01', datacenter: 'Equinix SG1', provider: 'Singtel Global', baselineMps: 217, carrierTrunk: 'Tata Comm Asia' },
  { id: 'ap-south', name: 'AP-South (Mumbai)', code: 'BOM-01', datacenter: 'Netmagic DC', provider: 'NIXI Peering', baselineMps: 185, carrierTrunk: 'Airtel Enterprise' },
  { id: 'sa-east', name: 'SA-East (São Paulo)', code: 'GRU-01', datacenter: 'Ascenty SP1', provider: 'IX.br Transit', baselineMps: 142, carrierTrunk: 'Claro Carrier BR' },
  { id: 'me-central', name: 'ME-Central (Dubai)', code: 'DXB-01', datacenter: 'Datamena DXB', provider: 'UAE-IX Peering', baselineMps: 118, carrierTrunk: 'Etisalat ME Direct' },
];

export interface HeatmapCell {
  regionId: string;
  regionName: string;
  timeSlotIndex: number;
  timeLabel: string;
  mps: number;
  dlr: number; // percentage, e.g. 99.8
  latency: number; // ms, e.g. 14
  windowUtil: number; // % e.g. 42
  activeBinds: number;
  carrier: string;
  isPeak?: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  cell: HeatmapCell | null;
}

interface TrafficHeatmapProps {
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigateToTrunk?: () => void;
}

export const TrafficHeatmap: React.FC<TrafficHeatmapProps> = ({ onShowToast, onNavigateToTrunk }) => {
  const [metric, setMetric] = useState<HeatmapMetric>('mps');
  const [timeMode, setTimeMode] = useState<TimeScaleMode>('24h');
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, cell: null });
  const [hoveredCellKey, setHoveredCellKey] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Time labels generation
  const timeLabels = useMemo(() => {
    if (timeMode === '24h') {
      return Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return `${hour}:00`;
      });
    } else {
      // 12 slots of 5 minutes: -55m, -50m ... Live T-0
      return Array.from({ length: 12 }, (_, i) => {
        if (i === 11) return 'Live T-0';
        const minsAgo = (11 - i) * 5;
        return `-${minsAgo}m`;
      });
    }
  }, [timeMode]);

  // Current real-world UTC hour as reference
  const currentHourUTC = new Date().getUTCHours();
  const currentSlotIndex = timeMode === '24h' ? currentHourUTC : timeLabels.length - 1;

  // Initialize Matrix Data
  const generateInitialData = (): HeatmapCell[] => {
    const cells: HeatmapCell[] = [];
    const numSlots = timeMode === '24h' ? 24 : 12;

    REGIONS.forEach((region) => {
      for (let slot = 0; slot < numSlots; slot++) {
        // Natural diurnal curve calculation
        let diurnalFactor = 1.0;
        if (timeMode === '24h') {
          // Peak daytime vs nighttime traffic curve based on UTC and region longitude
          const localOffset = region.id.includes('us') ? -5 : region.id.includes('eu') ? 1 : region.id.includes('ap') ? 8 : -3;
          const localHour = (slot + localOffset + 24) % 24;
          // Traffic peaks around 11:00 to 17:00 local time
          diurnalFactor = 0.4 + 0.8 * Math.sin(((localHour - 5) / 18) * Math.PI);
          if (diurnalFactor < 0.25) diurnalFactor = 0.25;
        } else {
          // 60-minute window slight variation
          diurnalFactor = 0.9 + 0.2 * Math.sin(slot * 0.7);
        }

        const baseMps = region.baselineMps * diurnalFactor;
        const randomNoise = (Math.random() - 0.5) * 0.15 * baseMps;
        const mps = Math.max(12, Math.round(baseMps + randomNoise));

        // Delivery success rate: higher traffic slightly stresses DLR, nominal is 99.8% - 100%
        const dlr = parseFloat((99.98 - (mps > 600 ? 0.2 : 0.04) - Math.random() * 0.15).toFixed(2));
        
        // Latency: P99 ms
        const latency = Math.max(8, Math.round(12 + (mps / 50) + (Math.random() * 6)));

        // Window queue utilization: 20% to 90%
        const windowUtil = Math.min(96, Math.max(15, Math.round((mps / (region.baselineMps * 1.5)) * 100)));

        cells.push({
          regionId: region.id,
          regionName: region.name,
          timeSlotIndex: slot,
          timeLabel: timeLabels[slot],
          mps,
          dlr,
          latency,
          windowUtil,
          activeBinds: region.id === 'us-east' ? 4 : region.id.includes('eu') ? 3 : 2,
          carrier: region.carrierTrunk,
          isPeak: mps > 650,
        });
      }
    });

    return cells;
  };

  const [matrixData, setMatrixData] = useState<HeatmapCell[]>(generateInitialData);

  // Regenerate when timeMode changes
  useEffect(() => {
    setMatrixData(generateInitialData());
  }, [timeMode]);

  // Real-time streaming effect: continuously update current slot with live jitter & pulses
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setMatrixData((prev) => {
        return prev.map((cell) => {
          // If in 24h mode, update the current UTC hour slot; if in 60m mode, update the 'Live T-0' slot
          if (cell.timeSlotIndex === currentSlotIndex) {
            const jitter = (Math.random() - 0.48) * 18;
            const updatedMps = Math.max(15, Math.round(cell.mps + jitter));
            const updatedLatency = Math.max(8, Math.round(cell.latency + (Math.random() - 0.5) * 2));
            const updatedWindow = Math.min(98, Math.max(18, Math.round(cell.windowUtil + (Math.random() - 0.5) * 3)));
            return {
              ...cell,
              mps: updatedMps,
              latency: updatedLatency,
              windowUtil: updatedWindow,
              isPeak: updatedMps > 680,
            };
          }
          return cell;
        });
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreaming, currentSlotIndex]);

  // Trigger Traffic Surge simulation
  const handleSimulateBurst = () => {
    setMatrixData((prev) =>
      prev.map((cell) => {
        if (cell.regionId === 'us-east' && cell.timeSlotIndex === currentSlotIndex) {
          return {
            ...cell,
            mps: cell.mps + 480,
            latency: cell.latency + 28,
            windowUtil: 94,
            isPeak: true,
          };
        }
        if (cell.regionId === 'eu-central' && cell.timeSlotIndex === currentSlotIndex) {
          return {
            ...cell,
            mps: cell.mps + 260,
            latency: cell.latency + 16,
            windowUtil: 88,
          };
        }
        return cell;
      })
    );
    if (onShowToast) {
      onShowToast('Simulated Flash SMS Campaign: +480 MPS injected into US-East & EU-Central trunks.', 'warning');
    }
  };

  // Reset to nominal baseline
  const handleResetBaseline = () => {
    setMatrixData(generateInitialData());
    if (onShowToast) {
      onShowToast('Heatmap baseline recalibrated to nominal SLA distribution.', 'info');
    }
  };

  // Export Matrix Data as CSV
  const handleExportCSV = () => {
    const headers = ['Region_ID', 'Region_Name', 'Time_Slot', 'MPS', 'DLR_Percent', 'Latency_P99_ms', 'Window_Util_Percent', 'Carrier_Trunk'];
    const rows = matrixData.map((c) =>
      [c.regionId, `"${c.regionName}"`, c.timeLabel, c.mps, c.dlr, c.latency, c.windowUtil, `"${c.carrier}"`].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smpp-traffic-heatmap-${timeMode}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) {
      onShowToast('SMPP Regional Heatmap data exported as CSV.', 'success');
    }
  };

  // Filtered regions list
  const activeRegions = useMemo(() => {
    if (selectedRegionFilter === 'ALL') return REGIONS;
    return REGIONS.filter((r) => r.id === selectedRegionFilter);
  }, [selectedRegionFilter]);

  // Overall stats
  const stats = useMemo(() => {
    const currentCells = matrixData.filter((c) => c.timeSlotIndex === currentSlotIndex);
    const totalCurrentMps = currentCells.reduce((acc, c) => acc + c.mps, 0);
    const avgLatency = (currentCells.reduce((acc, c) => acc + c.latency, 0) / (currentCells.length || 1)).toFixed(1);
    const avgDlr = (currentCells.reduce((acc, c) => acc + c.dlr, 0) / (currentCells.length || 1)).toFixed(2);
    
    // Find peak region
    const peakCell = currentCells.reduce((max, c) => (c.mps > max.mps ? c : max), currentCells[0] || { mps: 0, regionName: 'None' });

    return {
      totalCurrentMps,
      avgLatency,
      avgDlr,
      peakRegion: peakCell.regionName.split(' ')[0],
      peakMps: peakCell.mps,
    };
  }, [matrixData, currentSlotIndex]);

  // D3 Color Scales setup based on metric
  const colorScale = useMemo(() => {
    if (metric === 'mps') {
      // 0 to 900+ MPS
      return d3
        .scaleLinear<string>()
        .domain([0, 150, 350, 600, 950])
        .range(['#101726', '#0284c7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'])
        .interpolate(d3.interpolateRgb);
    } else if (metric === 'dlr') {
      // 98% to 100%
      return d3
        .scaleLinear<string>()
        .domain([98.5, 99.2, 99.7, 100.0])
        .range(['#ef4444', '#f59e0b', '#06b6d4', '#4edea3'])
        .interpolate(d3.interpolateRgb);
    } else if (metric === 'latency') {
      // 10ms to 80ms: green is best, amber is warning, red is alert
      return d3
        .scaleLinear<string>()
        .domain([10, 25, 45, 75])
        .range(['#10b981', '#06b6d4', '#f59e0b', '#ef4444'])
        .interpolate(d3.interpolateRgb);
    } else {
      // Window Utilization: 0% to 100%
      return d3
        .scaleLinear<string>()
        .domain([10, 40, 70, 95])
        .range(['#0f172a', '#0284c7', '#d97706', '#dc2626'])
        .interpolate(d3.interpolateRgb);
    }
  }, [metric]);

  // Dimension measurements
  const [dimensions, setDimensions] = useState({ width: 900, height: 340 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.max(640, entry.contentRect.width),
            height: activeRegions.length * 36 + 60,
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeRegions.length]);

  // Margins
  const margin = { top: 32, right: 30, bottom: 42, left: 168 };
  const innerWidth = Math.max(300, dimensions.width - margin.left - margin.right);
  const innerHeight = Math.max(180, dimensions.height - margin.top - margin.bottom);

  // Scales
  const xScale = useMemo(() => {
    return d3
      .scaleBand<string>()
      .domain(timeLabels)
      .range([0, innerWidth])
      .padding(0.08);
  }, [timeLabels, innerWidth]);

  const yScale = useMemo(() => {
    return d3
      .scaleBand<string>()
      .domain(activeRegions.map((r) => r.name))
      .range([0, innerHeight])
      .padding(0.12);
  }, [activeRegions, innerHeight]);

  // Value formatting helper
  const formatCellValue = (cell: HeatmapCell) => {
    if (metric === 'mps') return `${cell.mps} MPS`;
    if (metric === 'dlr') return `${cell.dlr}%`;
    if (metric === 'latency') return `${cell.latency}ms`;
    return `${cell.windowUtil}%`;
  };

  // Legend min / max labels
  const legendConfig = useMemo(() => {
    switch (metric) {
      case 'mps':
        return { min: '0 MPS (Idle)', mid: '400 MPS (Nominal)', max: '1,000+ MPS (Surge)' };
      case 'dlr':
        return { min: '< 98.5% (Degraded)', mid: '99.5% (Standard)', max: '99.99% (Tier-1 SLA)' };
      case 'latency':
        return { min: '8ms (Fast)', mid: '30ms (Acceptable)', max: '75ms+ (Congested)' };
      case 'window':
        return { min: '10% (Low Queuing)', mid: '50% (Equilibrium)', max: '> 90% (Throttling Risk)' };
    }
  }, [metric]);

  return (
    <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col w-full relative">
      {/* Heatmap Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#3d494c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">grid_view</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">
              Real-Time Regional SMPP Traffic Heatmap
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-code-metric bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
              {isStreaming ? 'STREAMING ACTIVE' : 'STREAM PAUSED'}
            </span>
          </div>
          <p className="text-[11px] text-[#bcc9cd] mt-0.5">
            D3-powered telemetry matrix visualizing SMPP 3.4 submit_sm ingress density, latency, and window buffer utilization.
          </p>
        </div>

        {/* Action Controls & Metric Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Tabs */}
          <div className="inline-flex p-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[11px]">
            <button
              onClick={() => setMetric('mps')}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                metric === 'mps' ? 'bg-[#06b6d4] text-[#00424f] font-semibold shadow-sm' : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              Throughput (MPS)
            </button>
            <button
              onClick={() => setMetric('dlr')}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                metric === 'dlr' ? 'bg-[#06b6d4] text-[#00424f] font-semibold shadow-sm' : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              DLR SLA (%)
            </button>
            <button
              onClick={() => setMetric('latency')}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                metric === 'latency' ? 'bg-[#06b6d4] text-[#00424f] font-semibold shadow-sm' : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              P99 Latency
            </button>
            <button
              onClick={() => setMetric('window')}
              className={`px-2.5 py-1 rounded transition-all font-medium ${
                metric === 'window' ? 'bg-[#06b6d4] text-[#00424f] font-semibold shadow-sm' : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
              }`}
            >
              Window Queue %
            </button>
          </div>

          {/* Time Mode Toggle */}
          <div className="inline-flex p-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[11px]">
            <button
              onClick={() => setTimeMode('24h')}
              className={`px-2 py-1 rounded font-code-metric ${
                timeMode === '24h' ? 'bg-[#262a33] text-[#4cd7f6] font-semibold' : 'text-[#869397] hover:text-[#bcc9cd]'
              }`}
              title="24-Hour Diurnal Matrix"
            >
              24H UTC
            </button>
            <button
              onClick={() => setTimeMode('60m')}
              className={`px-2 py-1 rounded font-code-metric ${
                timeMode === '60m' ? 'bg-[#262a33] text-[#4cd7f6] font-semibold' : 'text-[#869397] hover:text-[#bcc9cd]'
              }`}
              title="Last 60 Minutes (5-min intervals)"
            >
              LIVE 60M
            </button>
          </div>

          {/* Play/Pause Stream */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`p-1.5 rounded border text-[13px] flex items-center justify-center transition-all ${
              isStreaming
                ? 'bg-[#181c24] border-[#3d494c] text-[#4edea3] hover:bg-[#262a33]'
                : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
            }`}
            title={isStreaming ? 'Pause live stream simulation' : 'Resume live stream'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isStreaming ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Simulate Surge Action */}
          <button
            onClick={handleSimulateBurst}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] text-[11px] hover:border-[#4cd7f6] transition-all"
            title="Simulate sudden bulk SMS broadcast"
          >
            <span className="material-symbols-outlined text-[#4cd7f6] text-[14px]">bolt</span>
            <span>Inject Spike</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded bg-[#181c24] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
            title="Export CSV matrix"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
          </button>
        </div>
      </div>

      {/* Mini Real-Time KPI Telemetry Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 font-code-metric text-[11px]">
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">CURRENT FLEET MPS:</span>
          <span className="font-bold text-[#4cd7f6] tabular-nums">{stats.totalCurrentMps.toLocaleString()} MPS</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">PEAK REGION:</span>
          <span className="font-bold text-[#4edea3]">{stats.peakRegion} ({stats.peakMps} MPS)</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">AVG FLEET LATENCY:</span>
          <span className="font-bold text-[#dfe2ee]">{stats.avgLatency}ms</span>
        </div>
        <div className="p-2 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
          <span className="text-[#869397]">ACTIVE INGRESS CELLS:</span>
          <span className="font-bold text-[#bcc9cd]">{activeRegions.length * timeLabels.length} nodes</span>
        </div>
      </div>

      {/* Heatmap D3 SVG Canvas Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto relative rounded bg-[#0a0e16] border border-[#3d494c] p-2"
        style={{ minHeight: `${innerHeight + margin.top + margin.bottom}px` }}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={innerHeight + margin.top + margin.bottom}
          className="select-none overflow-visible"
        >
          {/* Definitions for glowing markers and gradients */}
          <defs>
            <linearGradient id="heatmap-legend-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              {metric === 'mps' && (
                <>
                  <stop offset="0%" stopColor="#101726" />
                  <stop offset="25%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="75%" stopColor="#10b981" />
                  <stop offset="90%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              )}
              {metric === 'dlr' && (
                <>
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="35%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#4edea3" />
                </>
              )}
              {metric === 'latency' && (
                <>
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="40%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              )}
              {metric === 'window' && (
                <>
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="40%" stopColor="#0284c7" />
                  <stop offset="75%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#dc2626" />
                </>
              )}
            </linearGradient>

            <filter id="cell-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Top X-Axis Header Time Labels */}
            {timeLabels.map((label, i) => {
              const xPos = (xScale(label) || 0) + xScale.bandwidth() / 2;
              const isCurrent = i === currentSlotIndex;
              return (
                <g key={`x-tick-${label}`} transform={`translate(${xPos}, -8)`}>
                  <text
                    textAnchor="middle"
                    className={`font-code-metric text-[10px] ${
                      isCurrent ? 'fill-[#4cd7f6] font-bold' : 'fill-[#869397]'
                    }`}
                  >
                    {label}
                  </text>
                  {isCurrent && (
                    <circle cx="0" cy="5" r="2.5" fill="#06b6d4" className="animate-ping" />
                  )}
                </g>
              );
            })}

            {/* Current Active Column Highlight Stripe */}
            {(() => {
              const currentLabel = timeLabels[currentSlotIndex];
              const curX = xScale(currentLabel) || 0;
              const curW = xScale.bandwidth();
              return (
                <rect
                  x={curX - 2}
                  y={0}
                  width={curW + 4}
                  height={innerHeight}
                  fill="none"
                  stroke="#4cd7f6"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="pointer-events-none opacity-40"
                />
              );
            })()}

            {/* Left Y-Axis Regional Row Labels */}
            {activeRegions.map((region) => {
              const yPos = (yScale(region.name) || 0) + yScale.bandwidth() / 2;
              return (
                <g
                  key={`y-label-${region.id}`}
                  transform={`translate(-12, ${yPos})`}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedRegionFilter(selectedRegionFilter === region.id ? 'ALL' : region.id);
                  }}
                >
                  <text
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="font-code-metric text-[11px] fill-[#dfe2ee] hover:fill-[#4cd7f6] transition-colors"
                  >
                    {region.name}
                  </text>
                  <text
                    textAnchor="end"
                    dominantBaseline="middle"
                    dy="11"
                    className="font-code-metric text-[9px] fill-[#869397]"
                  >
                    {region.code} • {region.datacenter}
                  </text>
                </g>
              );
            })}

            {/* Heatmap Grid Cells */}
            {activeRegions.map((region) => {
              const y = yScale(region.name) || 0;
              const height = yScale.bandwidth();

              return timeLabels.map((timeLabel, slotIdx) => {
                const x = xScale(timeLabel) || 0;
                const width = xScale.bandwidth();

                const cellData = matrixData.find(
                  (c) => c.regionId === region.id && c.timeSlotIndex === slotIdx
                ) || {
                  regionId: region.id,
                  regionName: region.name,
                  timeSlotIndex: slotIdx,
                  timeLabel,
                  mps: 0,
                  dlr: 99.9,
                  latency: 12,
                  windowUtil: 20,
                  activeBinds: 2,
                  carrier: region.carrierTrunk,
                };

                const cellKey = `${region.id}-${slotIdx}`;
                const isHovered = hoveredCellKey === cellKey;
                const isLiveSlot = slotIdx === currentSlotIndex;

                let metricValue = cellData.mps;
                if (metric === 'dlr') metricValue = cellData.dlr;
                else if (metric === 'latency') metricValue = cellData.latency;
                else if (metric === 'window') metricValue = cellData.windowUtil;

                const cellFill = colorScale(metricValue);

                return (
                  <g
                    key={cellKey}
                    onMouseEnter={(e) => {
                      setHoveredCellKey(cellKey);
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({
                          visible: true,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          cell: cellData,
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltip((prev) => ({
                          ...prev,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        }));
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCellKey(null);
                      setTooltip({ visible: false, x: 0, y: 0, cell: null });
                    }}
                    onClick={() => {
                      if (onShowToast) {
                        onShowToast(
                          `Carrier Trunk [${cellData.carrier}] in ${cellData.regionName} @ ${cellData.timeLabel}: ${cellData.mps} MPS (${cellData.latency}ms latency).`,
                          'info'
                        );
                      }
                    }}
                    className="cursor-pointer transition-all duration-150"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx={3}
                      ry={3}
                      fill={cellFill}
                      stroke={
                        isHovered
                          ? '#ffffff'
                          : isLiveSlot
                          ? '#4cd7f6'
                          : cellData.isPeak
                          ? '#ffb4ab'
                          : '#262a33'
                      }
                      strokeWidth={isHovered ? 2 : isLiveSlot ? 1.5 : 0.6}
                      className={isHovered ? 'filter drop-shadow-[0_0_8px_rgba(76,215,246,0.6)]' : ''}
                    />

                    {/* Numeric text inside cell if space allows */}
                    {width > 34 && height > 22 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-code-metric text-[9px] fill-[#ffffff] font-medium pointer-events-none select-none opacity-85"
                      >
                        {metric === 'mps'
                          ? cellData.mps
                          : metric === 'dlr'
                          ? `${cellData.dlr.toFixed(1)}%`
                          : metric === 'latency'
                          ? `${cellData.latency}m`
                          : `${cellData.windowUtil}%`}
                      </text>
                    )}
                  </g>
                );
              });
            })}
          </g>
        </svg>

        {/* Floating Precise Tooltip */}
        {tooltip.visible && tooltip.cell && (
          <div
            className="absolute z-30 pointer-events-none p-3 rounded-md bg-[#181c24] border border-[#4cd7f6] text-[#dfe2ee] shadow-[0_4px_24px_rgba(0,0,0,0.8)] font-code-metric text-[11px] max-w-xs transition-transform duration-75"
            style={{
              left: `${Math.min(tooltip.x + 12, dimensions.width - 260)}px`,
              top: `${Math.max(10, tooltip.y - 120)}px`,
            }}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#3d494c]">
              <div className="font-bold text-[#4cd7f6] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                <span>{tooltip.cell.regionName}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#869397] text-[10px]">
                {tooltip.cell.timeLabel} UTC
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[#869397]">SMPP Throughput:</span>
                <span className="font-bold text-[#4cd7f6]">{tooltip.cell.mps} MPS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#869397]">DLR Conversion Rate:</span>
                <span className="font-bold text-[#4edea3]">{tooltip.cell.dlr}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#869397]">Round-Trip P99:</span>
                <span className="font-bold text-[#dfe2ee]">{tooltip.cell.latency} ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#869397]">Window Queue Util:</span>
                <span className={`font-bold ${tooltip.cell.windowUtil > 80 ? 'text-[#ffb4ab]' : 'text-[#bcc9cd]'}`}>
                  {tooltip.cell.windowUtil}%
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#3d494c]/60">
                <span className="text-[#869397]">Primary Trunk:</span>
                <span className="text-[#4cd7f6]">{tooltip.cell.carrier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#869397]">Active Binds:</span>
                <span className="text-[#4edea3]">{tooltip.cell.activeBinds} x TRX Binds UP</span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#3d494c] text-[9px] text-[#869397] flex items-center justify-between">
              <span>Click to isolate &amp; inspect</span>
              <span className="text-[#4cd7f6]">SLA Compliant</span>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Footer Legend & Quick Controls */}
      <div className="mt-3 pt-2.5 border-t border-[#3d494c] flex flex-col md:flex-row items-center justify-between gap-3 text-[11px]">
        {/* Color Scale Legend */}
        <div className="flex items-center gap-2">
          <span className="text-[#869397] font-code-metric uppercase text-[10px]">Spectrum:</span>
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-48 rounded bg-gradient-to-r" style={{ backgroundImage: 'url(#heatmap-legend-grad)' }}>
              <div
                className="w-full h-full rounded"
                style={{
                  background:
                    metric === 'mps'
                      ? 'linear-gradient(to right, #101726, #0284c7, #06b6d4, #10b981, #f59e0b, #ef4444)'
                      : metric === 'dlr'
                      ? 'linear-gradient(to right, #ef4444, #f59e0b, #06b6d4, #4edea3)'
                      : metric === 'latency'
                      ? 'linear-gradient(to right, #10b981, #06b6d4, #f59e0b, #ef4444)'
                      : 'linear-gradient(to right, #0f172a, #0284c7, #d97706, #dc2626)',
                }}
              />
            </div>
            <div className="flex justify-between w-48 text-[9px] text-[#869397] font-code-metric mt-0.5">
              <span>{legendConfig.min}</span>
              <span>{legendConfig.max}</span>
            </div>
          </div>
        </div>

        {/* Region Filter Dropdown & Quick Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#bcc9cd]">
            <span className="text-[#869397]">Filter:</span>
            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className="bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] rounded px-2 py-0.5 font-code-metric text-[11px] focus:outline-none focus:border-[#4cd7f6]"
            >
              <option value="ALL">All 8 Global Regions</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetBaseline}
            className="text-[11px] text-[#869397] hover:text-[#dfe2ee] underline font-code-metric ml-1"
          >
            Reset
          </button>

          {onNavigateToTrunk && (
            <button
              onClick={onNavigateToTrunk}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#262a33] text-[#4cd7f6] hover:bg-[#353942] text-[11px] transition-all ml-2"
            >
              <span>Trunks Configuration</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
