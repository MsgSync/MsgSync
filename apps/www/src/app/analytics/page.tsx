'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { authService } from '@/lib/auth';
import { DashboardLayout } from '@/lib/layout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';

interface AnalyticsData {
  overview: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    avgLatency: number;
    costPerMessage: number;
  };
  volumeTrends: Array<{ date: string; sent: number; delivered: number; failed: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  providerPerformance: Array<{ provider: string; sent: number; delivered: number; failed: number; avgLatency: number }>;
  hourlyActivity: Array<{ hour: number; sent: number; delivered: number }>;
  topCampaigns: Array<{ id: string; name: string; sent: number; delivered: number; deliveryRate: number }>;
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: 'Last 24 hours', value: '24h', days: 1 },
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
];

const COLORS = ['#3ECF8E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const analyticsData = await api.get<AnalyticsData>(`/api/analytics/stats?range=${timeRange}`);
        setData(analyticsData);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    if (authService.isAuthenticated()) {
      fetchData();
    }
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin h-8 w-8 border-b-2 border-brand rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !data) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { overview, volumeTrends, statusDistribution, providerPerformance, hourlyActivity, topCampaigns } = data;

  const stats = [
    {
      label: 'Total Sent',
      value: overview.totalSent.toLocaleString(),
      icon: '📤',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Delivered',
      value: overview.totalDelivered.toLocaleString(),
      icon: '✅',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Failed',
      value: overview.totalFailed.toLocaleString(),
      icon: '❌',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Delivery Rate',
      value: `${overview.deliveryRate.toFixed(1)}%`,
      icon: '📊',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Avg Latency',
      value: `${overview.avgLatency}ms`,
      icon: '⚡',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Cost/Message',
      value: `$${overview.costPerMessage.toFixed(4)}`,
      icon: '💰',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-medium text-2xl md:text-3xl">Analytics</h1>
            <p className="text-gray-600 mt-1">Track your messaging performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none appearance-none bg-white"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Download className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} rounded-lg p-3`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume Trends */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">Message Volume Trends</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-brand"></span>
                  Sent
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Delivered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Failed
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={volumeTrends}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3ECF8E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3ECF8E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [value.toLocaleString(), 'messages']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="#3ECF8E"
                  fillOpacity={1}
                  fill="url(#colorSent)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorDelivered)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-heading font-semibold text-lg mb-4">Delivery Status Distribution</h2>
            <div className="flex flex-col lg:flex-row gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 flex-1 text-right">{item.value.toLocaleString()}</span>
                    <span className="font-semibold text-gray-900">{(item.value / statusDistribution.reduce((a, b) => a + b.value, 0) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Provider Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-heading font-semibold text-lg mb-4">Provider Performance</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={providerPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="provider"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'avgLatency') return [`${value}ms`, name];
                    return [value.toLocaleString(), name];
                  }}
                />
                <Legend />
                <Bar dataKey="sent" fill="#3ECF8E" name="Sent" radius={[0, 4, 4, 0]} />
                <Bar dataKey="delivered" fill="#3B82F6" name="Delivered" radius={[0, 4, 4, 0]} />
                <Bar dataKey="failed" fill="#EF4444" name="Failed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-heading font-semibold text-lg mb-4">Hourly Activity (24h)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="#3ECF8E"
                  strokeWidth={2}
                  dot={{ fill: '#3ECF8E', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Top Performing Campaigns</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topCampaigns.map((campaign, index) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                          <span className="text-brand font-bold">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-900">{campaign.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{campaign.sent.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{campaign.delivered.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {campaign.deliveryRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}