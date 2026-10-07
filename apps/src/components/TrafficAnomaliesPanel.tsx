import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { ScreenId } from '../types';

export interface TrafficAnomaly {
  id: string;
  type: 'SPIKE' | 'DROP' | 'JITTER_DRIFT' | 'DLR_COLLAPSE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  trunkId: string;
  trunkName: string;
  region: string;
  detectedAt: string;
  currentValue: number;
  expectedBaseline: number;
  deviationPercent: number; // e.g. +145 or -74
  zScore: number; // e.g. +3.6 or -3.2
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED' | 'ACKNOWLEDGED';
  rootCauseSummary: string;
  recommendedAction: string;
  historyTimeline: { time: string; actual: number; expected: number }[];
}

interface TrafficAnomaliesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigateToScreen?: (screenId: ScreenId) => void;
}

const INITIAL_ANOMALIES: TrafficAnomaly[] = [
  {
    id: 'anom-01',
    type: 'SPIKE',
    severity: 'CRITICAL',
    trunkId: 'trunk-01',
    trunkName: 'Twilio Direct US',
    region: 'AWS us-east-1 (Ashburn)',
    detectedAt: '3 mins ago (05:34 UTC)',
    currentValue: 980,
    expectedBaseline: 412,
    deviationPercent: 137.8,
    zScore: 3.8,
    status: 'ACTIVE',
    rootCauseSummary: 'Abnormal influx of SMS OTP verification requests targeting destination prefix +1 (800). Signatures match credential-stuffing attack.',
    recommendedAction: 'Engage adaptive token-bucket rate limiting and apply IP reputation filter.',
    historyTimeline: [
      { time: '-60m', actual: 395, expected: 400 },
      { time: '-45m', actual: 410, expected: 405 },
      { time: '-30m', actual: 420, expected: 410 },
      { time: '-15m', actual: 610, expected: 415 },
      { time: '-5m', actual: 890, expected: 412 },
      { time: 'Now', actual: 980, expected: 412 },
    ],
  },
  {
    id: 'anom-02',
    type: 'DROP',
    severity: 'HIGH',
    trunkId: 'trunk-02',
    trunkName: 'BICS Global Transit',
    region: 'EU-Central-1 (Frankfurt)',
    detectedAt: '8 mins ago (05:29 UTC)',
    currentValue: 72,
    expectedBaseline: 289,
    deviationPercent: -75.1,
    zScore: -3.4,
    status: 'ACTIVE',
    rootCauseSummary: 'Severe throughput collapse on DE-CIX interconnect. Upstream STP reporting SCTP chunk loss and timeout errors.',
    recommendedAction: 'Reroute pending outbound MT-SMS via Sinch Global LCR failover trunk.',
    historyTimeline: [
      { time: '-60m', actual: 285, expected: 280 },
      { time: '-45m', actual: 290, expected: 285 },
      { time: '-30m', actual: 275, expected: 288 },
      { time: '-15m', actual: 190, expected: 289 },
      { time: '-5m', actual: 80, expected: 289 },
      { time: 'Now', actual: 72, expected: 289 },
    ],
  },
  {
    id: 'anom-03',
    type: 'JITTER_DRIFT',
    severity: 'MEDIUM',
    trunkId: 'trunk-03',
    trunkName: 'Tata Comm Asia',
    region: 'AP-Southeast-1 (Singapore)',
    detectedAt: '18 mins ago (05:19 UTC)',
    currentValue: 88, // ms latency
    expectedBaseline: 42,
    deviationPercent: 109.5,
    zScore: 2.7,
    status: 'ACKNOWLEDGED',
    rootCauseSummary: 'Subsea cable fiber re-routing around Malacca Strait inducing +46ms transit penalty.',
    recommendedAction: 'Keep in secondary monitoring; SLA threshold remains within 100ms tolerance.',
    historyTimeline: [
      { time: '-60m', actual: 41, expected: 42 },
      { time: '-45m', actual: 43, expected: 42 },
      { time: '-30m', actual: 42, expected: 42 },
      { time: '-15m', actual: 64, expected: 42 },
      { time: '-5m', actual: 82, expected: 42 },
      { time: 'Now', actual: 88, expected: 42 },
    ],
  },
];

export const TrafficAnomaliesPanel: React.FC<TrafficAnomaliesPanelProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onNavigateToScreen,
}) => {
  const [anomalies, setAnomalies] = useState<TrafficAnomaly[]>(INITIAL_ANOMALIES);
  const [sensitivitySigma, setSensitivitySigma] = useState<number>(2.5); // 2.0 to 3.5
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>(INITIAL_ANOMALIES[0].id);
  const [filterType, setFilterType] = useState<'ALL' | 'SPIKE' | 'DROP'>('ALL');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Selected anomaly record
  const selectedAnomaly = useMemo(() => {
    return anomalies.find((a) => a.id === selectedAnomalyId) || anomalies[0];
  }, [anomalies, selectedAnomalyId]);

  // Filtered anomalies list
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      if (filterType === 'ALL') return true;
      return a.type === filterType;
    });
  }, [anomalies, filterType]);

  // Counts
  const activeCount = anomalies.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  // Actions
  const handleMitigate = (anomalyId: string, actionType: 'RATE_LIMIT' | 'LCR_FAILOVER' | 'ACKNOWLEDGE') => {
    setAnomalies((prev) =>
      prev.map((a) => {
        if (a.id === anomalyId) {
          if (actionType === 'RATE_LIMIT') {
            return {
              ...a,
              status: 'MITIGATING',
              currentValue: Math.round(a.expectedBaseline * 1.1),
              deviationPercent: 10,
              zScore: 0.8,
            };
          }
          if (actionType === 'LCR_FAILOVER') {
            return {
              ...a,
              status: 'RESOLVED',
              currentValue: a.expectedBaseline,
              deviationPercent: 0,
              zScore: 0.1,
            };
          }
          if (actionType === 'ACKNOWLEDGE') {
            return {
              ...a,
              status: 'ACKNOWLEDGED',
            };
          }
        }
        return a;
      })
    );

    if (onShowToast) {
      if (actionType === 'RATE_LIMIT') {
        onShowToast('Applied adaptive token bucket pacing on trunk. Ingress throttled to 110% of diurnal baseline.', 'success');
      } else if (actionType === 'LCR_FAILOVER') {
        onShowToast('LCR Failover executed. Outbound traffic successfully shifted to secondary carrier routes.', 'success');
      } else {
        onShowToast('Anomaly acknowledged and silenced for 30 minutes.', 'info');
      }
    }
  };

  // Simulate OTP Bombing Spike
  const handleSimulateSpike = () => {
    const newSpike: TrafficAnomaly = {
      id: `anom-spike-${Date.now()}`,
      type: 'SPIKE',
      severity: 'CRITICAL',
      trunkId: 'trunk-05',
      trunkName: 'Vodafone Transit UK',
      region: 'EU-West-2 (London)',
      detectedAt: 'Just now (Live)',
      currentValue: 740,
      expectedBaseline: 260,
      deviationPercent: 184.6,
      zScore: 4.2,
      status: 'ACTIVE',
      rootCauseSummary: 'Instantaneous +184% traffic explosion detected on UK sender ID bank. Potential fraud ring burst.',
      recommendedAction: 'Engage aggressive geo-pacing and trigger human-in-the-loop inspection.',
      historyTimeline: [
        { time: '-60m', actual: 250, expected: 255 },
        { time: '-45m', actual: 260, expected: 260 },
        { time: '-30m', actual: 265, expected: 260 },
        { time: '-15m', actual: 320, expected: 260 },
        { time: '-5m', actual: 580, expected: 260 },
        { time: 'Now', actual: 740, expected: 260 },
      ],
    };

    setAnomalies([newSpike, ...anomalies]);
    setSelectedAnomalyId(newSpike.id);
    if (onShowToast) {
      onShowToast('CRITICAL ANOMALY: +184% Traffic Spike on Vodafone UK detected by Z-Score engine!', 'error');
    }
  };

  // Simulate Carrier Blackhole Drop
  const handleSimulateDrop = () => {
    const newDrop: TrafficAnomaly = {
      id: `anom-drop-${Date.now()}`,
      type: 'DROP',
      severity: 'CRITICAL',
      trunkId: 'trunk-04',
      trunkName: 'Syniverse SS7 Hub',
      region: 'AWS us-east-1 (Ashburn)',
      detectedAt: 'Just now (Live)',
      currentValue: 18,
      expectedBaseline: 240,
      deviationPercent: -92.5,
      zScore: -4.1,
      status: 'ACTIVE',
      rootCauseSummary: 'Sudden loss of signaling link code (SLC). 92.5% throughput drop within 45 seconds.',
      recommendedAction: 'Initiate SIGTRAN M3UA ASP failover and notify carrier interconnect desk.',
      historyTimeline: [
        { time: '-60m', actual: 240, expected: 240 },
        { time: '-45m', actual: 235, expected: 240 },
        { time: '-30m', actual: 245, expected: 240 },
        { time: '-15m', actual: 220, expected: 240 },
        { time: '-5m', actual: 45, expected: 240 },
        { time: 'Now', actual: 18, expected: 240 },
      ],
    };

    setAnomalies([newDrop, ...anomalies]);
    setSelectedAnomalyId(newDrop.id);
    if (onShowToast) {
      onShowToast('CRITICAL ANOMALY: -92.5% Upstream Blackhole Drop on Syniverse SS7!', 'error');
    }
  };

  // Reset to default
  const handleReset = () => {
    setAnomalies(INITIAL_ANOMALIES);
    setSelectedAnomalyId(INITIAL_ANOMALIES[0].id);
    if (onShowToast) {
      onShowToast('Anomaly queue restored to baseline telemetry.', 'info');
    }
  };

  // D3 Sparkline generation for the selected anomaly
  const sparklineData = useMemo(() => {
    const w = 360;
    const h = 110;
    if (!selectedAnomaly) return { actualPath: '', expectedPath: '', areaPath: '', points: [], w, h };

    const data = selectedAnomaly.historyTimeline;
    const padX = 35;
    const padY = 16;

    const maxVal = Math.max(...data.map((d) => Math.max(d.actual, d.expected))) * 1.15;
    const minVal = Math.min(0, Math.min(...data.map((d) => Math.min(d.actual, d.expected))));

    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([padX, w - padX]);
    const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([h - padY, padY]);

    const actualLineGen = d3
      .line<{ time: string; actual: number }>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.actual))
      .curve(d3.curveMonotoneX);

    const expectedLineGen = d3
      .line<{ time: string; expected: number }>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.expected))
      .curve(d3.curveMonotoneX);

    // Confidence band area (expected ± 20%)
    const areaGen = d3
      .area<{ time: string; expected: number }>()
      .x((_, i) => xScale(i))
      .y0((d) => yScale(d.expected * 0.8))
      .y1((d) => yScale(d.expected * 1.2))
      .curve(d3.curveMonotoneX);

    const points = data.map((d, i) => ({
      x: xScale(i),
      yActual: yScale(d.actual),
      yExpected: yScale(d.expected),
      label: d.time,
      actual: d.actual,
      expected: d.expected,
    }));

    return {
      actualPath: actualLineGen(data) || '',
      expectedPath: expectedLineGen(data) || '',
      areaPath: areaGen(data) || '',
      points,
      w,
      h,
    };
  }, [selectedAnomaly]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#000000]/70 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Slide-over Side Panel */}
      <aside
        className="absolute top-0 right-0 h-full w-full max-w-2xl bg-[#141820] border-l border-[#3d494c] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col z-50 transition-transform duration-300 ease-in-out text-[#dfe2ee]"
      >
        {/* Panel Header */}
        <div className="p-4 bg-[#181c24] border-b border-[#3d494c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444]">
              <span className="material-symbols-outlined text-[20px] animate-pulse">crisis_alert</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[#dfe2ee]">Traffic Anomalies &amp; Trend Engine</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-code-metric bg-[#ef4444]/20 border border-[#ef4444]/50 text-[#ffb4ab] font-bold">
                  {activeCount} ACTIVE ALERTS
                </span>
              </div>
              <p className="text-[11px] text-[#bcc9cd] font-code-metric mt-0.5">
                Diurnal Z-score trend analysis: $|Z| \ge {sensitivitySigma.toFixed(1)}\sigma$ departure threshold
              </p>
            </div>
          </div>

          {/* Action Tools & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className={`p-1.5 rounded border text-[14px] transition-all ${
                isAudioMuted
                  ? 'bg-[#262a33] border-[#3d494c] text-[#869397]'
                  : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ffb4ab]'
              }`}
              title={isAudioMuted ? 'NOC audio alarm muted' : 'Mute NOC audio alarm'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isAudioMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#353942] transition-all"
              title="Close panel (Esc)"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Quick Simulation Ribbon & Sensitivity Controls */}
        <div className="px-4 py-2.5 bg-[#0a0e16] border-b border-[#3d494c] flex flex-wrap items-center justify-between gap-2 text-[11px] font-code-metric">
          <div className="flex items-center gap-2">
            <span className="text-[#869397]">SIMULATE:</span>
            <button
              onClick={handleSimulateSpike}
              className="px-2.5 py-0.5 rounded bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ffb4ab] hover:bg-[#ef4444]/30 transition-all font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">trending_up</span>
              <span>+184% Spike</span>
            </button>
            <button
              onClick={handleSimulateDrop}
              className="px-2.5 py-0.5 rounded bg-[#f59e0b]/15 border border-[#f59e0b]/40 text-[#f59e0b] hover:bg-[#f59e0b]/30 transition-all font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">trending_down</span>
              <span>-92% Drop</span>
            </button>
            <button
              onClick={handleReset}
              className="text-[#869397] hover:text-[#dfe2ee] underline ml-1"
            >
              Reset
            </button>
          </div>

          {/* Sensitivity Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#869397]">SENSITIVITY:</span>
            <select
              value={sensitivitySigma}
              onChange={(e) => setSensitivitySigma(parseFloat(e.target.value))}
              className="bg-[#181c24] border border-[#3d494c] text-[#4cd7f6] rounded px-2 py-0.5 text-[10px] focus:outline-none"
            >
              <option value="2.0">Strict (2.0σ - High Sensitivity)</option>
              <option value="2.5">Standard (2.5σ - Balanced)</option>
              <option value="3.0">Elevated (3.0σ - Critical Only)</option>
              <option value="3.5">Relaxed (3.5σ - Outliers Only)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Anomaly Highlight Card */}
          {selectedAnomaly && (
            <div className="rounded-lg bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm relative">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#3d494c]">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-code-metric font-bold ${
                        selectedAnomaly.type === 'SPIKE'
                          ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'
                          : selectedAnomaly.type === 'DROP'
                          ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                          : 'bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/40'
                      }`}
                    >
                      {selectedAnomaly.type === 'SPIKE'
                        ? 'SUDDEN THROUGHPUT SPIKE'
                        : selectedAnomaly.type === 'DROP'
                        ? 'CARRIER BLACKHOLE DROP'
                        : 'JITTER DRIFT ANOMALY'}
                    </span>
                    <span className="text-[11px] text-[#869397] font-code-metric">
                      {selectedAnomaly.detectedAt}
                    </span>
                  </div>

                  <h3 className="text-[16px] font-bold text-[#dfe2ee] mt-1">
                    {selectedAnomaly.trunkName}
                  </h3>
                  <div className="text-[11px] text-[#bcc9cd] font-code-metric">
                    {selectedAnomaly.region} • System ID: {selectedAnomaly.trunkId}
                  </div>
                </div>

                {/* Deviation Badge */}
                <div className="text-right font-code-metric">
                  <div
                    className={`text-[20px] font-bold tabular-nums ${
                      selectedAnomaly.deviationPercent > 0 ? 'text-[#ef4444]' : 'text-[#f59e0b]'
                    }`}
                  >
                    {selectedAnomaly.deviationPercent > 0 ? '+' : ''}
                    {selectedAnomaly.deviationPercent.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-[#869397]">
                    Z-Score: <strong>{selectedAnomaly.zScore > 0 ? '+' : ''}{selectedAnomaly.zScore.toFixed(1)}σ</strong>
                  </div>
                </div>
              </div>

              {/* D3 Historical Trend vs Actual Curve */}
              <div className="my-3 p-3 rounded bg-[#0a0e16] border border-[#263142]">
                <div className="flex items-center justify-between text-[10px] font-code-metric text-[#869397] mb-1">
                  <span>HISTORICAL DIURNAL ENVELOPE (±2σ BAND) vs ACTUAL</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-3 bg-[#4cd7f6]/40 inline-block"></span>
                      <span>Diurnal Baseline</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-3 bg-[#ef4444] inline-block"></span>
                      <span>Observed Throughput</span>
                    </span>
                  </div>
                </div>

                {/* SVG Trend Line */}
                <svg
                  width="100%"
                  height={sparklineData.h}
                  viewBox={`0 0 ${sparklineData.w} ${sparklineData.h}`}
                  className="overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>

                  {/* Confidence Interval Shaded Area */}
                  <path d={sparklineData.areaPath} fill="url(#area-grad)" />

                  {/* Baseline Historical Path (Dashed) */}
                  <path
                    d={sparklineData.expectedPath}
                    fill="none"
                    stroke="#4cd7f6"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />

                  {/* Actual Observed Throughput Path */}
                  <path
                    d={sparklineData.actualPath}
                    fill="none"
                    stroke={selectedAnomaly.type === 'SPIKE' ? '#ef4444' : '#f59e0b'}
                    strokeWidth="2.5"
                  />

                  {/* Data Point Circles */}
                  {sparklineData.points.map((pt, i) => {
                    const isLast = i === sparklineData.points.length - 1;
                    return (
                      <g key={`pt-${i}`}>
                        <circle
                          cx={pt.x}
                          cy={pt.yActual}
                          r={isLast ? 4.5 : 2.5}
                          fill={isLast ? '#ffffff' : selectedAnomaly.type === 'SPIKE' ? '#ef4444' : '#f59e0b'}
                          stroke={isLast ? '#ef4444' : '#0a0e16'}
                          strokeWidth={isLast ? 2 : 1}
                        />
                        {isLast && (
                          <circle
                            cx={pt.x}
                            cy={pt.yActual}
                            r={9}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1"
                            className="animate-ping"
                          />
                        )}
                        <text
                          x={pt.x}
                          y={sparklineData.h - 2}
                          textAnchor="middle"
                          className="font-code-metric text-[8.5px] fill-[#869397]"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Values comparison row */}
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#1c2433] text-center font-code-metric text-[11px]">
                  <div>
                    <div className="text-[#869397] text-[10px]">CURRENT VALUE</div>
                    <div className="text-[#dfe2ee] font-bold text-[13px]">
                      {selectedAnomaly.currentValue} {selectedAnomaly.type === 'JITTER_DRIFT' ? 'ms' : 'MPS'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#869397] text-[10px]">EXPECTED BASELINE</div>
                    <div className="text-[#4cd7f6] font-bold text-[13px]">
                      {selectedAnomaly.expectedBaseline} {selectedAnomaly.type === 'JITTER_DRIFT' ? 'ms' : 'MPS'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#869397] text-[10px]">SEVERITY INDEX</div>
                    <div
                      className={`font-bold text-[13px] ${
                        selectedAnomaly.severity === 'CRITICAL' ? 'text-[#ef4444]' : 'text-[#f59e0b]'
                      }`}
                    >
                      {selectedAnomaly.severity} ({selectedAnomaly.status})
                    </div>
                  </div>
                </div>
              </div>

              {/* Root Cause & Forensic Context */}
              <div className="space-y-2 text-[12px]">
                <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c]">
                  <div className="text-[#869397] text-[10px] font-code-metric uppercase mb-0.5">
                    DIAGNOSED ROOT CAUSE
                  </div>
                  <p className="text-[#dfe2ee] leading-relaxed">
                    {selectedAnomaly.rootCauseSummary}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-[#181c24] border border-[#3d494c]">
                  <div className="text-[#4cd7f6] text-[10px] font-code-metric uppercase mb-0.5">
                    AUTOMATED MITIGATION PROPOSAL
                  </div>
                  <p className="text-[#bcc9cd] leading-relaxed">
                    {selectedAnomaly.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Mitigation Action Buttons */}
              <div className="mt-3 pt-3 border-t border-[#3d494c] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedAnomaly.type === 'SPIKE' && (
                    <button
                      onClick={() => handleMitigate(selectedAnomaly.id, 'RATE_LIMIT')}
                      className="px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-bold text-[11px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">speed</span>
                      <span>Engage Token Bucket Pacing</span>
                    </button>
                  )}

                  {selectedAnomaly.type === 'DROP' && (
                    <button
                      onClick={() => handleMitigate(selectedAnomaly.id, 'LCR_FAILOVER')}
                      className="px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-bold text-[11px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">alt_route</span>
                      <span>Execute LCR Failover</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleMitigate(selectedAnomaly.id, 'ACKNOWLEDGE')}
                    className="px-3 py-1.5 rounded bg-[#262a33] border border-[#3d494c] text-[#dfe2ee] text-[11px] hover:bg-[#353942] transition-all"
                  >
                    Acknowledge Alert
                  </button>
                </div>

                {onNavigateToScreen && (
                  <button
                    onClick={() => {
                      onNavigateToScreen('smpp-connections');
                      onClose();
                    }}
                    className="text-[11px] text-[#4cd7f6] hover:underline flex items-center gap-1"
                  >
                    <span>View Trunk Diagnostics</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Anomaly Queue / List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-semibold text-[#dfe2ee] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[16px]">list_alt</span>
                <span>Active Carrier Anomaly Stream ({filteredAnomalies.length})</span>
              </h4>

              {/* Filter tabs */}
              <div className="inline-flex p-0.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[10px] font-code-metric">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2 py-0.5 rounded ${
                    filterType === 'ALL' ? 'bg-[#262a33] text-[#4cd7f6] font-bold' : 'text-[#869397]'
                  }`}
                >
                  All ({anomalies.length})
                </button>
                <button
                  onClick={() => setFilterType('SPIKE')}
                  className={`px-2 py-0.5 rounded ${
                    filterType === 'SPIKE' ? 'bg-[#262a33] text-[#ef4444] font-bold' : 'text-[#869397]'
                  }`}
                >
                  Spikes
                </button>
                <button
                  onClick={() => setFilterType('DROP')}
                  className={`px-2 py-0.5 rounded ${
                    filterType === 'DROP' ? 'bg-[#262a33] text-[#f59e0b] font-bold' : 'text-[#869397]'
                  }`}
                >
                  Drops
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {filteredAnomalies.map((anom) => {
                const isSelected = selectedAnomalyId === anom.id;
                const isCritical = anom.severity === 'CRITICAL';

                return (
                  <div
                    key={anom.id}
                    onClick={() => setSelectedAnomalyId(anom.id)}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1e2430] border-[#4cd7f6] shadow-sm'
                        : 'bg-[#181c24] border-[#3d494c] hover:border-[#869397]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isCritical ? 'bg-[#ef4444] animate-ping' : 'bg-[#f59e0b]'
                          }`}
                        ></span>
                        <span className="font-semibold text-[#dfe2ee]">{anom.trunkName}</span>
                        <span className="text-[10px] font-code-metric text-[#869397]">
                          {anom.region.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-code-metric">
                        <span
                          className={`font-bold ${
                            anom.deviationPercent > 0 ? 'text-[#ef4444]' : 'text-[#f59e0b]'
                          }`}
                        >
                          {anom.deviationPercent > 0 ? '+' : ''}
                          {anom.deviationPercent.toFixed(1)}%
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded ${
                            anom.status === 'RESOLVED'
                              ? 'bg-[#10b981]/20 text-[#10b981]'
                              : anom.status === 'MITIGATING'
                              ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
                              : 'bg-[#ef4444]/20 text-[#ffb4ab]'
                          }`}
                        >
                          {anom.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#bcc9cd] line-clamp-1">
                      {anom.rootCauseSummary}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="p-3 bg-[#181c24] border-t border-[#3d494c] flex items-center justify-between text-[11px] font-code-metric text-[#869397]">
          <span>Algorithm: Holt-Winters Exponential Smoothing + Gaussian Z-Score</span>
          <span>Sampling Interval: 10s Window</span>
        </div>
      </aside>
    </div>
  );
};
