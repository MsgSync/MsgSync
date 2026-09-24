import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api/client';
import { usePolling, useQuery } from '../hooks/useApi';
import { AnalyticsStats, FinancialStats } from '../lib/api/types';

interface ObservabilityScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ObservabilityScreen: React.FC<ObservabilityScreenProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'queues' | 'webhooks' | 'metrics' | 'logs'>('queues');
  const [queueDepth, setQueueDepth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: stats, loading } = usePolling<{ data: AnalyticsStats }>(
    () => apiClient.getDashboardStats().then((r) => r),
    5000,
    { enabled: !isPaused }
  );

  const { data: financials } = useQuery<FinancialStats>(
    () => apiClient.get<{ data: FinancialStats }>('/api/analytics/financials').then((r) => r.data),
    []
  );

  const { data: alerts } = useQuery(
    () => apiClient.getAlerts('root').then((r) => r.data || []),
    []
  );

  const alertsList = alerts || [];

  const { data: recentMessages } = usePolling(
    () => apiClient.getLiveTraffic(20).then((r) => r.data || []),
    3000,
    { enabled: !isPaused }
  );

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">OBSERVABILITY</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">OBSERVABILITY &amp; QUEUES</span>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-[12px] ${
            isPaused ? 'bg-[#06b6d4] text-[#00424f]' : 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
          }`}
        >
          {isPaused ? (
            <><span className="material-symbols-outlined text-[16px]">play_arrow</span> Resume</>
          ) : (
            <><span className="material-symbols-outlined text-[16px]">pause</span> Pause</>
          )}
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-[#3d494c] pb-2 text-[12px] font-code-metric">
        {[
          { id: 'queues', label: 'Queue Depth' },
          { id: 'webhooks', label: 'Webhooks' },
          { id: 'metrics', label: 'Metrics & Charts' },
          { id: 'logs', label: 'Logs & Events' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-3 py-1.5 rounded transition-all ${
            activeTab === tab.id ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#bcc9cd] hover:bg-[#262a33]'
          }`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'queues' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c]">
            <div className="text-[10px] text-[#869397] uppercase mb-1">Queue Depth</div>
            <div className="text-[24px] font-bold font-code-metric text-[#4cd7f6]">{queueDepth}</div>
            <div className="text-[10px] text-[#4edea3]">Messages pending</div>
          </div>
          <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c]">
            <div className="text-[10px] text-[#869397] uppercase mb-1">Active Workers</div>
            <div className="text-[24px] font-bold font-code-metric text-[#4edea3]">8</div>
            <div className="text-[10px] text-[#4edea3]">All healthy</div>
          </div>
          <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c]">
            <div className="text-[10px] text-[#869397] uppercase mb-1">Retry Queue</div>
            <div className="text-[24px] font-bold font-code-metric text-[#fbbf24]">0</div>
            <div className="text-[10px] text-[#4edea3]">No retries</div>
          </div>
          <div className="p-3.5 rounded bg-[#1c2028] border border-[#3d494c]">
            <div className="text-[10px] text-[#869397] uppercase mb-1">Error Rate</div>
            <div className="text-[24px] font-bold font-code-metric text-[#4edea3]">0.02%</div>
            <div className="text-[10px] text-[#4edea3]">Within SLA</div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <h3 className="text-[15px] font-semibold text-[#dfe2ee]">Message Throughput</h3>
              <span className="text-[10px] font-code-metric text-[#4edea3]">LIVE</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-[#869397]">Total Messages</span>
                <span className="text-[#4cd7f6] font-bold">{stats?.data?.total || 0}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#869397]">Delivered</span>
                <span className="text-[#4edea3] font-bold">{stats?.data?.delivered || 0}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#869397]">Success Rate</span>
                <span className="text-[#4edea3] font-bold">{stats?.data?.successRate || 0}%</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#869397]">Revenue</span>
                <span className="text-[#d0bcff] font-bold">${financials?.revenue || 0}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#869397]">Cost</span>
                <span className="text-[#ffb4ab] font-bold">${financials?.cost || 0}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#869397]">Profit</span>
                <span className="text-[#4cd7f6] font-bold">${financials?.profit || 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <h3 className="text-[15px] font-semibold text-[#dfe2ee]">Live Message Feed</h3>
              <span className="text-[10px] font-code-metric text-[#4edea3]">{recentMessages?.length || 0} msgs</span>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {recentMessages?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded bg-[#0a0e16] text-[11px] font-code-metric">
                  <span className="text-[#4cd7f6]">{m.recipient}</span>
                  <span className="text-[#bcc9cd]">{m.status}</span>
                  <span className="text-[#869397]">{m.provider || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <h3 className="text-[15px] font-semibold text-[#dfe2ee]">System Alerts</h3>
            <span className="text-[10px] font-code-metric text-[#4edea3]">{alertsList.length} active</span>
          </div>
          {alertsList.length === 0 ? (
            <div className="text-center py-8 text-[#869397] text-[13px]">No active alerts. All systems nominal.</div>
          ) : (
            <div className="space-y-2">
              {alertsList.map((alert: any) => (
                <div key={alert.id} className="p-3 rounded bg-[#0a0e16] border border-[#3d494c] flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-[#dfe2ee] font-semibold">{alert.name}</div>
                    <div className="text-[10px] text-[#bcc9cd]">Type: {alert.type} • Threshold: {alert.threshold}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${
                    alert.status === 'TRIGGERED' ? 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30' : 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30'
                  }`}>{alert.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
