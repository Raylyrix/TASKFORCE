'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface EmailMetrics {
  totalEmails: number;
  sentEmails: number;
  receivedEmails: number;
  avgResponseTime: number;
  pendingEmails: number;
  todayEmails: number;
  weekEmails: number;
  monthEmails: number;
}

interface AIInsights {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
  suggestions: string[];
  trends: string[];
  predictions: string[];
}

interface RelationshipHealth {
  contact: string;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  lastInteraction: string;
  responseRate: number;
  sentiment: string;
}

export function ProductionDashboard() {
  const [metrics, setMetrics] = useState<EmailMetrics>({
    totalEmails: 0,
    sentEmails: 0,
    receivedEmails: 0,
    avgResponseTime: 0,
    pendingEmails: 0,
    todayEmails: 0,
    weekEmails: 0,
    monthEmails: 0
  });

  const [aiInsights, setAiInsights] = useState<AIInsights>({
    sentiment: 'neutral',
    urgency: 'medium',
    suggestions: [],
    trends: [],
    predictions: []
  });

  const [relationships, setRelationships] = useState<RelationshipHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load email metrics
      const metricsResponse = await fetch('/api/analytics/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      // Load AI insights
      const insightsResponse = await fetch('/api/analytics/insights');
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setAiInsights(insightsData.data);
      }

      // Load relationship health
      const relationshipsResponse = await fetch('/api/analytics/relationships');
      if (relationshipsResponse.ok) {
        const relationshipsData = await relationshipsResponse.json();
        setRelationships(relationshipsData.data);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaturalLanguageQuery = async () => {
    if (!naturalLanguageQuery.trim()) return;

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: naturalLanguageQuery,
          context: 'dashboard'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setQueryResult(result.data);
      }
    } catch (error) {
      console.error('Error processing natural language query:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'negative': return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      default: return <ChartBarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                AI-powered email analytics and insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Natural Language Query */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <CpuChipIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          </div>
          <div className="flex space-x-4">
            <input
              type="text"
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              placeholder="Ask anything about your emails: 'Show me my busiest day this week'"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageQuery()}
            />
            <button
              onClick={handleNaturalLanguageQuery}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Ask AI
            </button>
          </div>
          {queryResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">AI Response:</h4>
              <p className="text-blue-800">{queryResult.answer}</p>
              {queryResult.charts && queryResult.charts.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-blue-900 mb-2">Visualizations:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {queryResult.charts.map((chart: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <h6 className="font-medium text-gray-900">{chart.title}</h6>
                        <p className="text-sm text-gray-600">{chart.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Emails</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.totalEmails.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.avgResponseTime}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.pendingEmails}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.todayEmails}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Insights */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CpuChipIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
                <div className="flex items-center">
                  {getSentimentIcon(aiInsights.sentiment)}
                  <span className="ml-2 text-sm capitalize">{aiInsights.sentiment}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Urgency Level</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  aiInsights.urgency === 'high' ? 'bg-red-100 text-red-800' :
                  aiInsights.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {aiInsights.urgency}
                </span>
              </div>

              {aiInsights.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {aiInsights.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Relationship Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Relationship Health</h2>
            </div>
            
            <div className="space-y-3">
              {relationships.slice(0, 5).map((relationship, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{relationship.contact}</p>
                    <p className="text-xs text-gray-500">Last: {relationship.lastInteraction}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(relationship.health)}`}>
                      {relationship.health}
                    </span>
                    <span className="text-xs text-gray-500">{relationship.responseRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Generate comprehensive email analytics reports with AI insights.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Smart Alerts</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Get notified about important emails and communication patterns.
            </p>
            <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
              Configure Alerts
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Forecast email volume and optimize your communication schedule.
            </p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              View Predictions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
