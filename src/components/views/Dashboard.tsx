import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Send, Calendar, Mail, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { supabase, type Lead } from '../../lib/supabase';
import UserMenu from '../UserMenu';

interface DashboardMetrics {
  totalLeads: number;
  totalEmailsSent: number;
  repliesReceived: number;
  meetingsBooked: number;
}

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    totalEmailsSent: 0,
    repliesReceived: 0,
    meetingsBooked: 0,
  });
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [recentActivity, setRecentActivity] = useState<Lead[]>([]);

  useEffect(() => {
    fetchLeadsData();
  }, []);

  const fetchLeadsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('leads_pipeline')
        .select('*')
        .order('last_updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const leadsData = data || [];
      setLeads(leadsData);

      // Calculate metrics
      const totalLeads = leadsData.length;
      const totalEmailsSent = leadsData.reduce((count, lead) => {
        let emailCount = 0;
        if (lead.day_1_sent_at) emailCount++;
        if (lead.day_2_sent_at) emailCount++;
        if (lead.day_3_sent_at) emailCount++;
        if (lead.day_4_sent_at) emailCount++;
        return count + emailCount;
      }, 0);
      const repliesReceived = leadsData.filter(lead => lead.replied).length;
      const meetingsBooked = leadsData.filter(lead => lead.booked).length;

      setMetrics({
        totalLeads,
        totalEmailsSent,
        repliesReceived,
        meetingsBooked,
      });

      // Calculate funnel stages
      const day1Sent = leadsData.filter(lead => lead.day_1_sent).length;
      const day2Sent = leadsData.filter(lead => lead.day_2_sent).length;
      const day3Sent = leadsData.filter(lead => lead.day_3_sent).length;
      const day4Sent = leadsData.filter(lead => lead.day_4_sent).length;
      const replied = leadsData.filter(lead => lead.replied).length;
      const booked = leadsData.filter(lead => lead.booked).length;

      const maxCount = Math.max(day1Sent, day2Sent, day3Sent, day4Sent, replied, booked, 1);

      setFunnelStages([
        { name: 'Day 1 Sent', count: day1Sent, percentage: (day1Sent / maxCount) * 100 },
        { name: 'Day 2 Sent', count: day2Sent, percentage: (day2Sent / maxCount) * 100 },
        { name: 'Day 3 Sent', count: day3Sent, percentage: (day3Sent / maxCount) * 100 },
        { name: 'Day 4 Sent', count: day4Sent, percentage: (day4Sent / maxCount) * 100 },
        { name: 'Replied', count: replied, percentage: (replied / maxCount) * 100 },
        { name: 'Booked', count: booked, percentage: (booked / maxCount) * 100 },
      ]);

      // Get recent activity (last 10 updated leads)
      setRecentActivity(leadsData.slice(0, 10));

    } catch (err) {
      console.error('Error fetching leads data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityAction = (lead: Lead): string => {
    if (lead.booked) return 'Booked Meeting';
    if (lead.replied) return 'Replied';
    if (lead.day_4_sent) return 'Day 4 Email Sent';
    if (lead.day_3_sent) return 'Day 3 Email Sent';
    if (lead.day_2_sent) return 'Day 2 Email Sent';
    if (lead.day_1_sent) return 'Day 1 Email Sent';
    return 'Imported';
  };

  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-8 h-8 text-primary-red animate-spin" />
              <span className="text-dark-text text-lg">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">Error Loading Data</h3>
                <p className="text-sm text-dark-text-muted">{error}</p>
                <button
                  onClick={fetchLeadsData}
                  className="mt-2 px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-primary-red-hover transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads.toLocaleString(),
      icon: Users,
    },
    {
      title: 'Total Emails Sent',
      value: metrics.totalEmailsSent.toLocaleString(),
      icon: Mail,
    },
    {
      title: 'Replies Received',
      value: metrics.repliesReceived.toLocaleString(),
      icon: MessageSquare,
    },
    {
      title: 'Meetings Booked',
      value: metrics.meetingsBooked.toLocaleString(),
      icon: Calendar,
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-0 sm:pt-4 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-dark-text">Dashboard</h1>
            <div className="flex items-center space-x-3">
              <UserMenu />
              <button
                onClick={fetchLeadsData}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-dark-elevated hover:bg-primary-red hover:bg-opacity-10 hover:text-primary-red rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-dark-border"
              >
                <TrendingUp className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-dark-text-secondary">Welcome back! Here's what's happening with your sales pipeline.</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 lg:mb-8">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:bg-dark-elevated transition-colors duration-200">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-primary-red bg-opacity-10 rounded-lg">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-red" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-dark-text mb-1">{metric.value}</h3>
                  <p className="text-dark-text-muted text-xs sm:text-sm">{metric.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Funnel Visualization */}
        <div className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-6 lg:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-dark-text mb-4 sm:mb-6">Sales Funnel</h2>
          <div className="space-y-3 sm:space-y-4">
            {funnelStages.map((stage, index) => (
              <div key={index} className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <div className="w-12 sm:w-16 md:w-20 lg:w-24 text-xs sm:text-sm font-medium text-dark-text-secondary text-right flex-shrink-0">
                  {stage.name}
                </div>
                <div className="flex-1 bg-dark-elevated rounded-full h-5 sm:h-6 md:h-8 relative overflow-hidden min-w-0">
                  <div
                    className="h-full bg-gradient-to-r from-primary-red to-primary-red-light rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1 sm:pr-2 md:pr-3"
                    style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                  >
                    <span className="text-white text-xs font-medium">
                      {stage.count}
                    </span>
                  </div>
                </div>
                <div className="w-8 sm:w-12 md:w-16 text-xs text-dark-text-muted text-right flex-shrink-0">
                  {stage.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-dark-text mb-4">Recent Activity</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-3 sm:space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((lead, index) => (
                  <div key={lead.id} className="flex items-start space-x-2 sm:space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      lead.booked_meeting ? 'bg-green-400' :
                      lead.replied ? 'bg-blue-400' :
                      lead.day_7_sent ? 'bg-purple-400' :
                      lead.day_5_sent ? 'bg-yellow-400' :
                      lead.day_3_sent ? 'bg-orange-400' :
                      lead.day_1_sent ? 'bg-primary-red' :
                      'bg-gray-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-dark-text text-xs">
                        <span className="font-medium">
                          {lead.fullname || lead.email}
                        </span>
                        {lead.company_name && (
                          <span className="text-dark-text-muted"> from {lead.company_name}</span>
                        )}
                        <span className="text-dark-text-muted"> - {getActivityAction(lead)}</span>
                      </p>
                      <p className="text-dark-text-muted text-xs">
                        {formatTimeAgo(lead.last_updated_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-dark-text-muted">No recent activity found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}