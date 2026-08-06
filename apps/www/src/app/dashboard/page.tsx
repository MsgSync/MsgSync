"use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { authService } from '@/lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Users, MessageSquare, Target, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface DashboardStats {
  totalMessages: number;
  monthlyMessages: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  totalRevenue: number;
  messageTrends: Array<{ month: string; messages: number }>;
  campaignPerformance: Array<{ name: string; sent: number; delivered: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const dashboardStats = await api.get<DashboardStats>('/api/analytics/stats');
        setStats(dashboardStats);
      } catch (error) {
        setError('Failed to load dashboard statistics');
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-heading font-medium text-2xl md:text-3xl">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Messages</h3>
            <MessageSquare className="h-5 w-5 text-brand" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">
            +{stats.monthlyMessages} this month
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Campaigns</h3>
            <Target className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeCampaigns}</p>
          <p className="text-sm text-gray-600 mt-1">
            of {stats.totalCampaigns} total
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Contacts</h3>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalContacts.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">
            active contacts
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            monthly revenue
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Message Volume Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.messageTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#3ECF8E"
                strokeWidth={2}
                dot={{ fill: '#3ECF8E', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Campaign Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sent" fill="#3ECF8E" name="Sent" />
              <Bar dataKey="delivered" fill="#3ECF8E" opacity={0.5} name="Delivered" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-heading font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-brand" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-sm">Send Message</h3>
              <p className="text-xs text-gray-500">Create a new message</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-sm">New Campaign</h3>
              <p className="text-xs text-gray-500">Start a marketing campaign</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-sm">Add Contact</h3>
              <p className="text-xs text-gray-500">Import new contacts</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}