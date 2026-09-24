import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { INITIAL_SMPP_TRUNKS } from '../data/mockData';
import { SmppTrunk } from '../types';

interface SmppThroughputStressProps {
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigateToTrunks?: () => void;
}

export const SmppThroughputStress: React.FC<SmppThroughputStressProps> = ({
  onShowToast,
  onNavigateToTrunks,
}) => {
  const [trunks, setTrunks] = useState<SmppTrunk[]>(INITIAL_SMPP_TRUNKS);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [activeSurge, setActiveSurge] = useState(false);
  const [isThrottlingSimulated, setIsThrottlingSimulated] = useState(false);
  const [selectedTrunkId, setSelectedTrunkId] = useState<string | null>(null);

  // Real-time jitter and heartbeat
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      setTrunks((prev) =>
        prev.map((t) => {
          // If surge is active, add elevated traffic
          const surgeFactor = activeSurge ? 1.35 : 1.0;
          const jitter = (Math.random() - 0.48) * 12;
          let newMps = Math.max(10, Math.round((t.currentMps + jitter) * (activeSurge ? 1.02 : 1.0)));
          
          // Cap or exceed if throttled
          let status = t.status;
          if (isThrottlingSimulated && (t.id === 'trunk-01' || t.id === 'trunk-06')) {
            newMps = Math.round(t.tpsLimit * 1.08); // Exceed limit by 8%
            status = 'THROTTLED';
          } else {
            status = 'BOUND';
          }

          const windowUtil = Math.min(
            99,
            Math.max(15, Math.round((newMps / t.tpsLimit) * 85 + (Math.random() - 0.5) * 6))
          );

          return {
            ...t,
            currentMps: Math.min(Math.round(t.tpsLimit * (activeSurge ? 1.15 : 0.98)), newMps),
            windowUtilization: windowUtil,
            status,
          };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveActive, activeSurge, isThrottlingSimulated]);

  // Aggregate Metrics Calculations
  const metrics = useMemo(() => {
    const totalCurrentTps = trunks.reduce((acc, t) => acc + t.currentMps, 0);
    const totalTpsCapacity = trunks.reduce((acc, t) => acc + t.tpsLimit, 0);
    const saturationRatio = (totalCurrentTps / (totalTpsCapacity || 1)) * 100;
    const remainingHeadroom = Math.max(0, totalTpsCapacity - totalCurrentTps);
    
    // Saturated / Throttled Trunks count
    const highStressTrunks = trunks.filter((t) => (t.currentMps / t.tpsLimit) >= 0.85);
    const throttledTrunks = trunks.filter((t) => t.status === 'THROTTLED' || (t.currentMps / t.tpsLimit) >= 1.0);
    
    // Average Window Buffer
    const avgWindowUtil = Math.round(
      trunks.reduce((acc, t) => acc + t.windowUtilization, 0) / trunks.length
    );

    // Status Level
    let stressState: 'OPTIMAL' | 'MODERATE' | 'HIGH_LOAD' | 'SATURATED_RISK' = 'OPTIMAL';
    if (saturationRatio >= 90 || throttledTrunks.length > 0) stressState = 'SATURATED_RISK';
    else if (saturationRatio >= 75) stressState = 'HIGH_LOAD';
    else if (saturationRatio >= 55) stressState = 'MODERATE';

    return {
      totalCurrentTps,
      totalTpsCapacity,
      saturationRatio: parseFloat(saturationRatio.toFixed(1)),
      remainingHeadroom,
      highStressCount: highStressTrunks.length,
      throttledCount: throttledTrunks.length,
      avgWindowUtil,
      stressState,
    };
  }, [trunks]);

  // Handle Surge Injection
  const handleToggleSurge = () => {
    const nextSurge = !activeSurge;
    setActiveSurge(nextSurge);
    if (nextSurge) {
      setTrunks((prev) =>
        prev.map((t) => ({
          ...t,
          currentMps: Math.round(t.tpsLimit * 0.92),
          windowUtilization: Math.min(96, t.windowUtilization + 28),
        }))
      );
      if (onShowToast) {
        onShowToast(
          'Traffic Surge Injected: +840 TPS pushed across Twilio, Sinch, and BICS trunks.',
          'warning'
        );
      }
    } else {
      if (onShowToast) {
        onShowToast('Traffic Surge cancelled. Returned to standard pacing schedule.', 'info');
      }
    }
  };

  // Handle Carrier Throttling Simulation (ESME_RTHROTTLED)
  const handleToggleThrottling = () => {
    const nextState = !isThrottlingSimulated;
    setIsThrottlingSimulated(nextState);
    if (nextState) {
      if (onShowToast) {
        onShowToast(
          'ESME_RTHROTTLED (0x00000058) simulated on Twilio Direct & Infobip trunks! Backoff queue engaged.',
          'error'
        );
      }
    } else {
      if (onShowToast) {
        onShowToast('Throttling simulation cleared. Carrier flow control restored.', 'success');
      }
    }
  };

  // Reset to Nominal
  const handleReset = () => {
    setActiveSurge(false);
    setIsThrottlingSimulated(false);
    setTrunks(INITIAL_SMPP_TRUNKS);
    if (onShowToast) {
      onShowToast('SMPP Throughput baseline reset to nominal capacity.', 'info');
    }
  };

  // Dynamic D3 Arc Gauge Dimensions and Generators
  const gaugeRef = useRef<SVGSVGElement>(null);
  const gaugeWidth = 320;
  const gaugeHeight = 220;
  const radius = 135;
  const strokeWidth = 24;

  // Gauge Angle: -125 to +125 degrees (250 degrees span)
  const minAngle = -125 * (Math.PI / 180);
  const maxAngle = 125 * (Math.PI / 180);

  // Scale from 0% to 100% saturation
  const angleScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, 100])
      .range([minAngle, maxAngle])
      .clamp(true);
  }, [minAngle, maxAngle]);

  // Current angle for the gauge needle/arc
  const currentAngle = angleScale(metrics.saturationRatio);

  // Background track arc generator
  const backgroundArcPath = useMemo(() => {
    const arcGen = d3
      .arc<void>()
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius)
      .startAngle(minAngle)
      .endAngle(maxAngle)
      .cornerRadius(6);
    return arcGen() || '';
  }, [radius, strokeWidth, minAngle, maxAngle]);

  // Foreground active arc generator
  const foregroundArcPath = useMemo(() => {
    const arcGen = d3
      .arc<void>()
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius)
      .startAngle(minAngle)
      .endAngle(currentAngle)
      .cornerRadius(6);
    return arcGen() || '';
  }, [radius, strokeWidth, minAngle, currentAngle]);

  // Dynamic Needle Calculation
  const needleLength = radius - 30;
  const needleX = needleLength * Math.sin(currentAngle);
  const needleY = -needleLength * Math.cos(currentAngle);

  // Status color helpers
  const getStatusColor = () => {
    if (metrics.stressState === 'SATURATED_RISK') return '#ef4444'; // Red
    if (metrics.stressState === 'HIGH_LOAD') return '#f59e0b'; // Amber
    if (metrics.stressState === 'MODERATE') return '#06b6d4'; // Cyan
    return '#10b981'; // Emerald
  };

  const statusColor = getStatusColor();

  // Color gradient stops along the radial gauge
  const tickLabels = [
    { pct: 0, label: '0%' },
    { pct: 25, label: '25%' },
    { pct: 50, label: '50%' },
    { pct: 75, label: '75%' },
    { pct: 90, label: '90%' },
    { pct: 100, label: '100% SLA' },
  ];

  return (
    <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col w-full relative">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#3d494c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">speed</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">
              SMPP Throughput Stress &amp; TPS Saturation Engine
            </h2>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-code-metric border"
              style={{
                backgroundColor: `${statusColor}15`,
                borderColor: `${statusColor}40`,
                color: statusColor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: statusColor }}
              ></span>
              {metrics.stressState === 'SATURATED_RISK'
                ? 'SATURATION CRITICAL'
                : metrics.stressState === 'HIGH_LOAD'
                ? 'HIGH TPS STRESS'
                : metrics.stressState === 'MODERATE'
                ? 'ELEVATED PACING'
                : 'NOMINAL FLOW'}
            </span>
          </div>
          <p className="text-[11px] text-[#bcc9cd] mt-0.5">
            D3-powered real-time TPS saturation gauge monitoring carrier flow control, sliding window queuing, and ESME_RTHROTTLED risk thresholds.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pause / Resume Live */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`p-1.5 rounded border text-[13px] flex items-center justify-center transition-all ${
              isLiveActive
                ? 'bg-[#181c24] border-[#3d494c] text-[#4edea3] hover:bg-[#262a33]'
                : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
            }`}
            title={isLiveActive ? 'Pause real-time stress stream' : 'Resume stream'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isLiveActive ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Trigger Traffic Surge */}
          <button
            onClick={handleToggleSurge}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
              activeSurge
                ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-[#262a33] border-[#3d494c] text-[#dfe2ee] hover:border-[#f59e0b]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>{activeSurge ? 'Surge Active (+840 TPS)' : 'Simulate Traffic Surge'}</span>
          </button>

          {/* Trigger Carrier Throttle */}
          <button
            onClick={handleToggleThrottling}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
              isThrottlingSimulated
                ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ffb4ab] shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'bg-[#262a33] border-[#3d494c] text-[#dfe2ee] hover:border-[#ffb4ab]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">block</span>
            <span>{isThrottlingSimulated ? 'Throttling Simulated' : 'Inject Carrier Throttle'}</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded bg-[#181c24] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
            title="Reset SMPP Stress to nominal baseline"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Gauge Chart (Left) + Top Saturated Trunks & Flow Analysis (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* D3 Radial Gauge Display (5 cols) */}
        <div className="lg:col-span-5 rounded bg-[#0a0e16] border border-[#3d494c] p-4 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-[11px] font-code-metric text-[#869397] pb-1 border-b border-[#1c2433]">
            <span>FLEET CAPACITY SATURATION</span>
            <span className="text-[#4cd7f6]">{metrics.totalCurrentTps} / {metrics.totalTpsCapacity} TPS</span>
          </div>

          {/* SVG Gauge Canvas */}
          <div className="relative flex flex-col items-center justify-center my-2 select-none">
            <svg
              ref={gaugeRef}
              width={gaugeWidth}
              height={gaugeHeight}
              viewBox={`0 0 ${gaugeWidth} ${gaugeHeight}`}
              className="overflow-visible"
            >
              <defs>
                {/* Gauge Gradient Arc */}
                <linearGradient id="gauge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="45%" stopColor="#06b6d4" />
                  <stop offset="75%" stopColor="#f59e0b" />
                  <stop offset="95%" stopColor="#ef4444" />
                </linearGradient>

                {/* Glow Filter for Needle */}
                <filter id="needle-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(${gaugeWidth / 2}, ${radius + 20})`}>
                {/* Background Track Arc */}
                <path
                  d={backgroundArcPath}
                  fill="#151b24"
                  stroke="#263142"
                  strokeWidth="1"
                />

                {/* Active Saturation Arc */}
                <path
                  d={foregroundArcPath}
                  fill="url(#gauge-grad)"
                  className="transition-all duration-300"
                />

                {/* Tick Marks along the arc */}
                {tickLabels.map((tick) => {
                  const angle = angleScale(tick.pct);
                  const tickInner = radius + 4;
                  const tickOuter = radius + 10;
                  const x1 = tickInner * Math.sin(angle);
                  const y1 = -tickInner * Math.cos(angle);
                  const x2 = tickOuter * Math.sin(angle);
                  const y2 = -tickOuter * Math.cos(angle);

                  const labelRadius = radius + 22;
                  const lx = labelRadius * Math.sin(angle);
                  const ly = -labelRadius * Math.cos(angle);

                  return (
                    <g key={`tick-${tick.pct}`}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={tick.pct >= 90 ? '#ef4444' : tick.pct >= 75 ? '#f59e0b' : '#3d494c'}
                        strokeWidth="1.5"
                      />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-code-metric text-[9px] fill-[#869397] select-none"
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                {/* Needle Pointer */}
                <g className="transition-all duration-300 ease-out" filter="url(#needle-glow)">
                  <line
                    x1={0}
                    y1={0}
                    x2={needleX}
                    y2={needleY}
                    stroke={statusColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Needle Pivot Center */}
                  <circle r="9" fill="#0a0e16" stroke={statusColor} strokeWidth="2.5" />
                  <circle r="4" fill={statusColor} />
                </g>
              </g>
            </svg>

            {/* Central Numerical Telemetry Readout */}
            <div className="absolute bottom-1 flex flex-col items-center justify-center pointer-events-none">
              <div className="flex items-baseline gap-1">
                <span
                  className="font-code-metric text-[34px] font-bold tabular-nums tracking-tight leading-none"
                  style={{ color: statusColor }}
                >
                  {metrics.saturationRatio}%
                </span>
                <span className="font-code-metric text-[11px] text-[#869397]">SATURATION</span>
              </div>
              <div className="text-[11px] font-code-metric text-[#bcc9cd] mt-0.5">
                {metrics.remainingHeadroom.toLocaleString()} TPS Buffer Available
              </div>
            </div>
          </div>

          {/* Under-Gauge Summary Cards */}
          <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-[#1c2433] text-center font-code-metric text-[10px]">
            <div className="p-1.5 rounded bg-[#151b24] border border-[#232d3d]">
              <div className="text-[#869397]">AVG WINDOW</div>
              <div className="text-[#4cd7f6] font-bold text-[12px]">{metrics.avgWindowUtil}% Util</div>
            </div>
            <div className="p-1.5 rounded bg-[#151b24] border border-[#232d3d]">
              <div className="text-[#869397]">OVER-LIMIT</div>
              <div
                className={`font-bold text-[12px] ${
                  metrics.highStressCount > 0 ? 'text-[#f59e0b]' : 'text-[#4edea3]'
                }`}
              >
                {metrics.highStressCount} Trunks
              </div>
            </div>
            <div className="p-1.5 rounded bg-[#151b24] border border-[#232d3d]">
              <div className="text-[#869397]">THROTTLES</div>
              <div
                className={`font-bold text-[12px] ${
                  metrics.throttledCount > 0 ? 'text-[#ef4444] animate-pulse' : 'text-[#4edea3]'
                }`}
              >
                {metrics.throttledCount} Active
              </div>
            </div>
          </div>
        </div>

        {/* Per-Trunk Stress Breakdown & Carrier Buffer Queues (7 cols) */}
        <div className="lg:col-span-7 rounded bg-[#1c2028] border border-[#3d494c] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">equalizer</span>
                <h3 className="text-[13px] font-semibold text-[#dfe2ee]">
                  Carrier Trunk Throughput &amp; Window Saturation
                </h3>
              </div>
              <span className="text-[10px] font-code-metric text-[#869397]">
                Sorted by Saturation Load
              </span>
            </div>

            {/* Saturated Trunks List */}
            <div className="space-y-2.5">
              {[...trunks]
                .sort((a, b) => b.currentMps / b.tpsLimit - a.currentMps / a.tpsLimit)
                .slice(0, 6)
                .map((trunk) => {
                  const sat = Math.round((trunk.currentMps / trunk.tpsLimit) * 100);
                  const isCritical = sat >= 95 || trunk.status === 'THROTTLED';
                  const isElevated = sat >= 80;

                  const barColor = isCritical
                    ? 'bg-[#ef4444]'
                    : isElevated
                    ? 'bg-[#f59e0b]'
                    : sat >= 60
                    ? 'bg-[#06b6d4]'
                    : 'bg-[#10b981]';

                  return (
                    <div
                      key={trunk.id}
                      onClick={() => setSelectedTrunkId(selectedTrunkId === trunk.id ? null : trunk.id)}
                      className={`p-2 rounded border cursor-pointer transition-all ${
                        selectedTrunkId === trunk.id
                          ? 'bg-[#262a33] border-[#4cd7f6]'
                          : 'bg-[#181c24] border-[#3d494c] hover:border-[#869397]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isCritical ? 'bg-[#ef4444] animate-ping' : 'bg-[#10b981]'
                            }`}
                          ></span>
                          <span className="font-semibold text-[#dfe2ee]">{trunk.name}</span>
                          <span className="text-[9px] font-code-metric px-1.5 py-0.2 rounded bg-[#0a0e16] text-[#869397]">
                            {trunk.systemId}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-code-metric text-[11px]">
                          <span className="text-[#bcc9cd]">
                            <strong className="text-[#dfe2ee]">{trunk.currentMps}</strong> / {trunk.tpsLimit} TPS
                          </span>
                          <span
                            className={`font-bold tabular-nums ${
                              isCritical
                                ? 'text-[#ef4444]'
                                : isElevated
                                ? 'text-[#f59e0b]'
                                : 'text-[#4edea3]'
                            }`}
                          >
                            {sat}%
                          </span>
                        </div>
                      </div>

                      {/* Saturation Progress Meter Bar */}
                      <div className="w-full h-1.5 rounded-full bg-[#0a0e16] overflow-hidden flex">
                        <div
                          className={`h-full ${barColor} transition-all duration-500`}
                          style={{ width: `${Math.min(100, sat)}%` }}
                        ></div>
                      </div>

                      {/* Expanded Details when selected */}
                      {selectedTrunkId === trunk.id && (
                        <div className="mt-2 pt-2 border-t border-[#3d494c] grid grid-cols-3 gap-2 text-[10px] font-code-metric text-[#bcc9cd]">
                          <div>
                            <span className="text-[#869397]">Mode:</span> {trunk.mode} Tranceiver
                          </div>
                          <div>
                            <span className="text-[#869397]">Window Size:</span> {trunk.windowSize} PDUs
                          </div>
                          <div>
                            <span className="text-[#869397]">Queue Util:</span> {trunk.windowUtilization}%
                          </div>
                          <div>
                            <span className="text-[#869397]">Latency:</span> {trunk.latencyMs}ms RTT
                          </div>
                          <div>
                            <span className="text-[#869397]">IP:</span> {trunk.ipAddress}
                          </div>
                          <div>
                            <span className="text-[#869397]">EnquireLink:</span> {trunk.enquireLinkStatus}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Bottom Carrier Backoff and Link Status */}
          <div className="mt-3 pt-3 border-t border-[#3d494c] flex flex-wrap items-center justify-between gap-2 text-[11px] font-code-metric">
            <span className="text-[#869397] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3] text-[16px]">verified</span>
              <span>Flow Control: Token Bucket Rate Limiting (Burst Allowed: 120%)</span>
            </span>
            {onNavigateToTrunks && (
              <button
                onClick={onNavigateToTrunks}
                className="text-[#4cd7f6] hover:underline flex items-center gap-1"
              >
                <span>Full Trunks Configuration</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
