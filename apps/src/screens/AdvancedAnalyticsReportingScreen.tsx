import React, { useMemo, useState } from 'react';
import { apiClient } from '../lib/api/client';
import { usePolling, useQuery } from '../hooks/useApi';

interface AnalyticsProps {
  onShowToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

type Tab = 'overview' | 'reports' | 'alerts' | 'activity' | 'financials';

interface ReportMessage {
  id: string;
  recipient: string;
  status: string;
  provider?: string;
  profile?: string;
  createdAt: string;
  cost?: number;
  price?: number;
}

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(Math.round(value || 0));
const formatCurrency = (value: number) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusClass = (status: string) => status === 'delivered' || status === 'sent' ? 'text-[#4edea3] bg-[#4edea3]/10' : status === 'failed' ? 'text-[#ffb4ab] bg-[#ffb4ab]/10' : 'text-[#fbbf24] bg-[#fbbf24]/10';

export const AdvancedAnalyticsReportingScreen: React.FC<AnalyticsProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [range, setRange] = useState('24h');
  const [status, setStatus] = useState('all');
  const [profile, setProfile] = useState('all');
  const [reportPage, setReportPage] = useState(1);

  const { data: stats, loading: statsLoading } = useQuery<any>(() => apiClient.getDashboardStats().then(response => response.data), []);
  const { data: trends } = useQuery<any[]>(() => apiClient.getAnalyticsTrends().then(response => response.data || []), []);
  const { data: providers } = useQuery<any[]>(() => apiClient.getVolumeByProvider().then(response => response.data || []), []);
  const { data: financials } = useQuery<any>(() => apiClient.getFinancials().then(response => response.data), []);
  const { data: reportsData } = useQuery<any>(() => apiClient.getAnalyticsReports().then(response => response.data), [status, profile]);
  const { data: alerts } = useQuery<any[]>(() => apiClient.getAnalyticsAlerts().then(response => response.data || []), []);
  const { data: auditLogs } = useQuery<any[]>(() => apiClient.getAuditLogs().then(response => response.data || []), []);
  const { data: liveTraffic } = usePolling<any[]>(() => apiClient.getLiveTraffic(20).then(response => response.data || []), 5000);

  const messages = reportsData?.messages || [];
  const totalReports = reportsData?.total || messages.length;
  const reportPages = Math.max(1, Math.ceil(totalReports / 50));
  const filteredProviders = providers || [];
  const maxProviderVolume = Math.max(...filteredProviders.map(provider => provider.count || 0), 1);
  const maxTrendVolume = Math.max(...(trends || []).map(point => point.count || 0), 1);
  const successRate = Number(stats?.successRate || 0);
  const delivered = stats?.delivered || 0;
  const failed = stats?.failed || 0;
  const activeAlerts = (alerts || []).filter(alert => alert.status !== 'RESOLVED').length;
  const profiles = useMemo(() => Array.from(new Set((messages as ReportMessage[]).map(message => message.profile).filter(Boolean))) as string[], [messages]);

  const exportReports = () => {
    const rows = ['recipient,status,provider,profile,createdAt,cost,price', ...messages.map((message: ReportMessage) => [message.recipient, message.status, message.provider || '', message.profile || '', message.createdAt, message.cost || 0, message.price || 0].join(','))];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `msgsync-report-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Analytics report exported as CSV.', 'success');
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'monitoring' },
    { id: 'reports', label: 'Detailed Reports', icon: 'table_view' },
    { id: 'alerts', label: 'Alert Management', icon: 'notifications_active' },
    { id: 'activity', label: 'User Activity', icon: 'history' },
    { id: 'financials', label: 'Financial Analysis', icon: 'query_stats' },
  ];

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3">
        <div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">INSIGHTS</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">ADVANCED ANALYTICS &amp; REPORTING</span></div>
        <div className="flex items-center gap-2"><select value={range} onChange={event => setRange(event.target.value)} className="rounded border border-[#3d494c] bg-[#181c24] px-2.5 py-1.5 text-[11px] text-[#bcc9cd] outline-none"><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><button type="button" onClick={exportReports} className="flex items-center gap-1.5 rounded border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-3 py-1.5 text-[11px] font-semibold text-[#4cd7f6] hover:bg-[#06b6d4]/20"><span className="material-symbols-outlined text-[15px]">download</span>Export</button></div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[#3d494c] pb-2">
        {tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 rounded px-3 py-2 text-[11px] font-semibold transition-colors ${activeTab === tab.id ? 'bg-[#06b6d4] text-[#00424f]' : 'text-[#869397] hover:bg-[#262a33] hover:text-[#dfe2ee]'}`}><span className="material-symbols-outlined text-[16px]">{tab.icon}</span>{tab.label}{tab.id === 'alerts' && activeAlerts > 0 && <span className="rounded-full bg-[#ffb4ab] px-1.5 text-[9px] text-[#401719]">{activeAlerts}</span>}</button>)}
      </div>

      {activeTab === 'overview' && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[['Total messages', formatNumber(stats?.total), 'sms', 'All time', 'text-[#4cd7f6]'], ['Delivery rate', `${successRate}%`, 'trending_up', successRate >= 95 ? 'Within SLA' : 'Review failures', 'text-[#4edea3]'], ['Failed messages', formatNumber(failed), 'error', failed ? 'Needs attention' : 'No failures', 'text-[#ffb4ab]'], ['Active alerts', formatNumber(activeAlerts), 'notifications_active', activeAlerts ? 'Review required' : 'All clear', 'text-[#fbbf24]']].map(([label, value, icon, detail, color]) => <div key={label} className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#869397]"><span>{label}</span><span className={`material-symbols-outlined ${color}`}>{icon}</span></div><div className={`mt-2 font-code-metric text-[25px] font-bold ${color}`}>{value}</div><div className="mt-1 text-[10px] text-[#869397]">{detail}</div></div>)}</div>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold">Delivery volume</h2><p className="text-[10px] text-[#869397]">Message throughput and successful deliveries</p></div><span className="font-code-metric text-[10px] text-[#4edea3]">{range.toUpperCase()}</span></div><div className="flex h-48 items-end gap-1 border-b border-l border-[#293240] px-3 pb-0 pt-4">{(trends || []).map((point, index) => <div key={`${point.hour}-${index}`} className="group relative flex h-full flex-1 items-end gap-0.5" title={`${point.hour}:00 · ${point.count} messages · ${point.success} successful`}><div className="w-1/2 rounded-t bg-[#06b6d4]/70 transition-colors group-hover:bg-[#4cd7f6]" style={{ height: `${Math.max(4, ((point.count || 0) / maxTrendVolume) * 90)}%` }} /><div className="w-1/2 rounded-t bg-[#4edea3]/70 transition-colors group-hover:bg-[#4edea3]" style={{ height: `${Math.max(4, ((point.success || 0) / maxTrendVolume) * 90)}%` }} /></div>)}</div><div className="mt-2 flex justify-between font-code-metric text-[9px] text-[#68767b]">{(trends || []).filter((_, index) => index % 4 === 0).map(point => <span key={point.hour}>{String(point.hour).padStart(2, '0')}:00</span>)}</div></section>
          <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold">Provider performance</h2><p className="text-[10px] text-[#869397]">Volume share by carrier</p></div><span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">lan</span></div><div className="space-y-4">{filteredProviders.length ? filteredProviders.map(provider => <div key={provider.provider}><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-[#bcc9cd]">{provider.provider}</span><span className="font-code-metric text-[#4cd7f6]">{formatNumber(provider.count)}</span></div><div className="h-2 overflow-hidden rounded bg-[#293240]"><div className="h-full rounded bg-gradient-to-r from-[#06b6d4] to-[#4edea3]" style={{ width: `${((provider.count || 0) / maxProviderVolume) * 100}%` }} /></div></div>) : <div className="py-8 text-center text-[11px] text-[#869397]">No provider data available.</div>}</div></section>
        </div>
        <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-3 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold">Live traffic</h2><p className="text-[10px] text-[#869397]">Recent message activity across your network</p></div><span className="flex items-center gap-1.5 text-[10px] text-[#4edea3]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4edea3]" />LIVE</span></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{(liveTraffic || []).slice(0, 8).map((message: any) => <div key={message.id} className="rounded border border-[#293240] bg-[#0a0e16] p-2.5"><div className="flex justify-between text-[11px]"><span className="text-[#4cd7f6]">{message.recipient}</span><span className={statusClass(message.status)}>{message.status}</span></div><div className="mt-1 flex justify-between text-[9px] text-[#68767b]"><span>{message.provider || 'unknown'}</span><span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div>)}</div></section>
      </>}

      {activeTab === 'reports' && <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold">Detailed SMS reports</h2><p className="text-[10px] text-[#869397]">{formatNumber(totalReports)} messages in the selected period</p></div><div className="flex gap-2"><select value={status} onChange={event => setStatus(event.target.value)} className="rounded border border-[#3d494c] bg-[#181c24] px-2 py-1.5 text-[10px] text-[#bcc9cd]"><option value="all">All statuses</option><option value="delivered">Delivered</option><option value="sent">Sent</option><option value="queued">Queued</option><option value="failed">Failed</option></select><select value={profile} onChange={event => setProfile(event.target.value)} className="rounded border border-[#3d494c] bg-[#181c24] px-2 py-1.5 text-[10px] text-[#bcc9cd]"><option value="all">All profiles</option>{profiles.map(item => <option key={item} value={item}>{item}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-[#293240] text-[10px] uppercase tracking-wider text-[#68767b]"><th className="px-2 py-2">Recipient</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Provider</th><th className="px-2 py-2">Profile</th><th className="px-2 py-2">Created</th><th className="px-2 py-2 text-right">Cost</th><th className="px-2 py-2 text-right">Price</th></tr></thead><tbody>{(status === 'all' && profile === 'all' ? messages : messages.filter((message: ReportMessage) => (status === 'all' || message.status === status) && (profile === 'all' || message.profile === profile))).map((message: ReportMessage) => <tr key={message.id} className="border-b border-[#293240]/60 text-[11px] text-[#bcc9cd]"><td className="px-2 py-2.5 text-[#4cd7f6]">{message.recipient}</td><td className="px-2 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[9px] ${statusClass(message.status)}`}>{message.status}</span></td><td className="px-2 py-2.5">{message.provider || '—'}</td><td className="px-2 py-2.5">{message.profile || '—'}</td><td className="px-2 py-2.5">{new Date(message.createdAt).toLocaleString()}</td><td className="px-2 py-2.5 text-right">{formatCurrency(Number(message.cost))}</td><td className="px-2 py-2.5 text-right">{formatCurrency(Number(message.price))}</td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between text-[10px] text-[#869397]"><span>Page {reportPage} of {reportPages}</span><div className="flex gap-2"><button type="button" disabled={reportPage <= 1} onClick={() => setReportPage(current => current - 1)} className="rounded border border-[#3d494c] px-2.5 py-1 disabled:opacity-40">Previous</button><button type="button" disabled={reportPage >= reportPages} onClick={() => setReportPage(current => current + 1)} className="rounded border border-[#3d494c] px-2.5 py-1 disabled:opacity-40">Next</button></div></div></section>}

      {activeTab === 'alerts' && <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[14px] font-semibold">Alert management</h2><p className="text-[10px] text-[#869397]">Configure thresholds and respond to delivery, provider, and account signals.</p></div><div className="space-y-2">{(alerts || []).map((alert: any) => <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#293240] bg-[#0a0e16] p-3"><div className="flex items-center gap-3"><span className={`material-symbols-outlined text-[19px] ${alert.status === 'TRIGGERED' ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>{alert.status === 'TRIGGERED' ? 'warning' : 'check_circle'}</span><div><div className="text-[12px] font-semibold text-[#dfe2ee]">{alert.name}</div><div className="text-[10px] text-[#869397]">{alert.type} · Threshold {alert.threshold}</div></div></div><span className={`rounded px-2 py-1 text-[10px] ${alert.status === 'TRIGGERED' ? 'bg-[#ffb4ab]/10 text-[#ffb4ab]' : 'bg-[#4edea3]/10 text-[#4edea3]'}`}>{alert.status}</span></div>)}{!alerts?.length && <div className="py-10 text-center text-[12px] text-[#869397]">No alerts configured. All systems are within expected thresholds.</div>}</div></section>}

      {activeTab === 'activity' && <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[14px] font-semibold">User activity</h2><p className="text-[10px] text-[#869397]">Audit events and changes made by your team.</p></div><div className="space-y-1">{(auditLogs || []).slice(0, 20).map((log: any) => <div key={log.id} className="flex items-center justify-between border-b border-[#293240]/60 py-2.5 text-[11px]"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">person</span><span className="text-[#bcc9cd]">{log.action?.replaceAll('_', ' ') || 'System event'}</span></div><span className="font-code-metric text-[10px] text-[#68767b]">{new Date(log.createdAt).toLocaleString()}</span></div>)}{!auditLogs?.length && <div className="py-10 text-center text-[12px] text-[#869397]">No recent user activity.</div>}</div></section>}

      {activeTab === 'financials' && <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]"><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[14px] font-semibold">Financial analysis</h2><p className="text-[10px] text-[#869397]">Revenue, carrier cost, and contribution margin.</p></div><div className="space-y-4">{[['Revenue', financials?.revenue, 'text-[#4edea3]'], ['Carrier cost', financials?.cost, 'text-[#ffb4ab]'], ['Contribution profit', financials?.profit, 'text-[#4cd7f6]'], ['Margin', `${financials?.margin || 0}%`, 'text-[#d0bcff]']].map(([label, value, color]) => <div key={label as string} className="flex items-center justify-between border-b border-[#293240]/60 pb-3"><span className="text-[12px] text-[#869397]">{label}</span><span className={`font-code-metric text-[17px] font-semibold ${color}`}>{label === 'Margin' ? value : formatCurrency(Number(value))}</span></div>)}</div></section><section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="mb-4 border-b border-[#293240] pb-3"><h2 className="text-[14px] font-semibold">Revenue by profile</h2><p className="text-[10px] text-[#869397]">Where your messaging revenue is generated.</p></div><div className="space-y-4">{(financials?.profileBreakdown || []).map((item: any) => <div key={item.profile}><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-[#bcc9cd]">{item.profile || 'Unassigned'}</span><span className="font-code-metric text-[#4edea3]">{formatCurrency(item.revenue)}</span></div><div className="h-2 rounded bg-[#293240]"><div className="h-full rounded bg-[#4edea3]" style={{ width: `${Math.min(100, (item.revenue / Math.max(financials?.revenue || 1, 1)) * 100)}%` }} /></div></div>)}{!financials?.profileBreakdown?.length && <div className="py-8 text-center text-[11px] text-[#869397]">No financial breakdown available.</div>}</div></section></div>}
      {statsLoading && <div className="text-center text-[11px] text-[#869397]">Refreshing analytics...</div>}
    </div>
  );
};
