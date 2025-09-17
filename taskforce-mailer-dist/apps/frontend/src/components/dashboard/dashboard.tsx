'use client';

import { useQuery } from 'react-query';
import { MetricCards } from './metric-cards';
import { VolumeChart } from './charts/volume-chart';
import { ResponseTimeChart } from './charts/response-time-chart';
import { ContactHealthChart } from './charts/contact-health-chart';
import { TopContacts } from './top-contacts';
import { RecentActivity } from './recent-activity';
import { AIConsole } from './ai-console';
import AdvancedAIDashboard from '../ai/advanced-ai-dashboard';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ErrorMessage } from '../ui/error-message';

async function fetchAnalyticsOverview() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/overview`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics overview');
  }
  return response.json();
}

async function fetchVolumeData() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/volume`);
  if (!response.ok) {
    throw new Error('Failed to fetch volume data');
  }
  return response.json();
}

async function fetchContactData() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/contacts`);
  if (!response.ok) {
    throw new Error('Failed to fetch contact data');
  }
  return response.json();
}

export function Dashboard() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery(
    'analytics-overview',
    fetchAnalyticsOverview,
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const { data: volumeData, isLoading: volumeLoading } = useQuery(
    'volume-data',
    fetchVolumeData,
    { refetchInterval: 60000 } // Refetch every minute
  );

  const { data: contactData, isLoading: contactLoading } = useQuery(
    'contact-data',
    fetchContactData,
    { refetchInterval: 120000 } // Refetch every 2 minutes
  );

  if (overviewLoading) {
    return <LoadingSpinner />;
  }

  if (overviewError) {
    return <ErrorMessage error={overviewError} />;
  }

  const analyticsData = overview?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time email analytics and AI-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button className="btn btn-primary">
            Export Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <MetricCards data={analyticsData} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Email Volume Trend
          </h3>
          {volumeLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <VolumeChart data={volumeData?.data} />
          )}
        </div>

        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Response Time Distribution
          </h3>
          {overviewLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ResponseTimeChart data={analyticsData?.responseTimeDistribution} />
          )}
        </div>
      </div>

      {/* Contact Health and AI Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contact Health Score
          </h3>
          {contactLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ContactHealthChart data={contactData?.data} />
          )}
        </div>

        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Insights Console
          </h3>
          <AIConsole />
        </div>
      </div>

      {/* Advanced AI Dashboard */}
      <div className="card">
        <AdvancedAIDashboard />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Contacts
          </h3>
          {contactLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <TopContacts data={contactData?.data} />
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
