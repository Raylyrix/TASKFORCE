'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  HeartIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  BellIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface EmotionAnalysis {
  emotion: 'happy' | 'satisfied' | 'neutral' | 'concerned' | 'frustrated' | 'angry' | 'urgent';
  intensity: number;
  confidence: number;
  keywords: string[];
  context: string;
}

interface RelationshipHealth {
  clientId: string;
  clientEmail: string;
  healthScore: number;
  sentiment: EmotionAnalysis;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  lastInteraction: string;
  communicationFrequency: number;
  responseTimeTrend: 'improving' | 'stable' | 'declining';
}

interface TeamStressLevel {
  userId: string;
  userName: string;
  stressLevel: number;
  indicators: string[];
  recommendations: string[];
  workloadScore: number;
  communicationOverload: boolean;
  urgentEmailsRatio: number;
}

interface EmailAlert {
  id: string;
  type: 'unusual_pattern' | 'important_email' | 'response_needed' | 'crisis_detected' | 'workload_alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actions: string[];
  timestamp: string;
  metadata: {
    confidence: number;
    context: Record<string, any>;
  };
  isRead: boolean;
  isResolved: boolean;
}

interface EmailForecast {
  period: '7d' | '30d' | '90d';
  predictedVolume: {
    received: number;
    sent: number;
    total: number;
  };
  confidence: number;
  factors: string[];
  trends: {
    volume: 'increasing' | 'stable' | 'decreasing';
    responseTime: 'improving' | 'stable' | 'declining';
    workload: 'increasing' | 'stable' | 'decreasing';
  };
  recommendations: string[];
  riskFactors: string[];
}

export default function AdvancedAIDashboard() {
  const [activeTab, setActiveTab] = useState<'sentiment' | 'monitoring' | 'predictions'>('sentiment');
  const [relationshipHealth, setRelationshipHealth] = useState<RelationshipHealth[]>([]);
  const [teamStress, setTeamStress] = useState<TeamStressLevel[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<EmailAlert[]>([]);
  const [emailForecast, setEmailForecast] = useState<EmailForecast | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load relationship health
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/relationship-health`);
      const healthData = await healthResponse.json();
      if (healthData.success) {
        setRelationshipHealth(healthData.data);
      }

      // Load team stress levels
      const stressResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/team-stress`);
      const stressData = await stressResponse.json();
      if (stressData.success) {
        setTeamStress(stressData.data);
      }

      // Load active alerts
      const alertsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/active-alerts`);
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setActiveAlerts(alertsData.data);
      }

      // Load email forecast
      const forecastResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/forecast-volume?period=30d`);
      const forecastData = await forecastResponse.json();
      if (forecastData.success) {
        setEmailForecast(forecastData.data);
      }
    } catch (error) {
      console.error('Failed to load AI dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↗️';
      case 'declining':
        return '↘️';
      case 'critical':
        return '🚨';
      default:
        return '➡️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    switch (emotion) {
      case 'happy':
      case 'satisfied':
        return '😊';
      case 'neutral':
        return '😐';
      case 'concerned':
        return '😟';
      case 'frustrated':
        return '😤';
      case 'angry':
        return '😠';
      case 'urgent':
        return '⚡';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🤖 Advanced AI Analytics</h2>
            <p className="text-gray-600 mt-1">
              Intelligent email insights powered by advanced AI and machine learning
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'sentiment', label: 'Sentiment & Relationships', icon: HeartIcon },
              { id: 'monitoring', label: 'Real-time Monitoring', icon: BellIcon },
              { id: 'predictions', label: 'Predictive Analytics', icon: ArrowTrendingUpIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'sentiment' && (
            <div className="space-y-6">
              {/* Relationship Health Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Relationships */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <HeartIcon className="w-5 h-5 mr-2" />
                    Client Relationship Health
                  </h3>
                  <div className="space-y-4">
                    {relationshipHealth.slice(0, 5).map((client) => (
                      <div key={client.clientId} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getEmotionEmoji(client.sentiment.emotion)}</span>
                            <span className="font-medium text-gray-900">{client.clientEmail}</span>
                            <span className="text-sm text-gray-500">{getTrendIcon(client.trend)}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-sm font-medium ${getHealthScoreColor(client.healthScore)}`}>
                            {client.healthScore}/100
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {client.sentiment.context}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {client.sentiment.keywords.slice(0, 3).map((keyword, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                        {client.riskFactors.length > 0 && (
                          <div className="text-xs text-red-600">
                            ⚠️ {client.riskFactors.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Stress Levels */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UsersIcon className="w-5 h-5 mr-2" />
                    Team Stress Monitoring
                  </h3>
                  <div className="space-y-4">
                    {teamStress.slice(0, 5).map((member) => (
                      <div key={member.userId} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{member.userName}</span>
                          <div className={`px-2 py-1 rounded-full text-sm font-medium ${
                            member.stressLevel > 80 ? 'bg-red-100 text-red-800' :
                            member.stressLevel > 60 ? 'bg-orange-100 text-orange-800' :
                            member.stressLevel > 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {member.stressLevel}/100
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Workload: {member.workloadScore}/100
                          {member.communicationOverload && ' • Overloaded'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Urgent emails: {(member.urgentEmailsRatio * 100).toFixed(1)}%
                        </div>
                        {member.indicators.length > 0 && (
                          <div className="mt-2 text-xs text-orange-600">
                            📊 {member.indicators.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis Summary */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Sentiment Analysis Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {relationshipHealth.filter(r => r.sentiment.emotion === 'happy' || r.sentiment.emotion === 'satisfied').length}
                    </div>
                    <div className="text-sm text-green-700">Positive Relationships</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {relationshipHealth.filter(r => r.sentiment.emotion === 'neutral').length}
                    </div>
                    <div className="text-sm text-yellow-700">Neutral Relationships</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {relationshipHealth.filter(r => r.sentiment.emotion === 'frustrated' || r.sentiment.emotion === 'angry').length}
                    </div>
                    <div className="text-sm text-red-700">At-Risk Relationships</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              {/* Active Alerts */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BellIcon className="w-5 h-5 mr-2" />
                  Active Alerts ({activeAlerts.length})
                </h3>
                <div className="space-y-3">
                  {activeAlerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.priority === 'urgent' ? 'bg-red-500' :
                          alert.priority === 'high' ? 'bg-orange-500' :
                          alert.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(alert.priority)}`}>
                            {alert.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                          <div className="flex space-x-2">
                            {alert.actions.slice(0, 2).map((action, idx) => (
                              <button
                                key={idx}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">📧</div>
                  <div className="text-sm text-gray-600 mt-1">Emails Today</div>
                  <div className="text-lg font-semibold">1,247</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">⚡</div>
                  <div className="text-sm text-gray-600 mt-1">Avg Response</div>
                  <div className="text-lg font-semibold">2.3h</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-orange-600">👥</div>
                  <div className="text-sm text-gray-600 mt-1">Active Users</div>
                  <div className="text-lg font-semibold">12</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-red-600">🚨</div>
                  <div className="text-sm text-gray-600 mt-1">Critical Alerts</div>
                  <div className="text-lg font-semibold">3</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-6">
              {/* Email Volume Forecast */}
              {emailForecast && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                    Email Volume Forecast ({emailForecast.period})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{emailForecast.predictedVolume.received}</div>
                      <div className="text-sm text-blue-700">Predicted Received</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{emailForecast.predictedVolume.sent}</div>
                      <div className="text-sm text-green-700">Predicted Sent</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{emailForecast.predictedVolume.total}</div>
                      <div className="text-sm text-purple-700">Total Volume</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{(emailForecast.confidence * 100).toFixed(0)}%</div>
                      <div className="text-sm text-yellow-700">Confidence</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">📈 Trends</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Volume:</span>
                          <span className={`font-medium ${
                            emailForecast.trends.volume === 'increasing' ? 'text-green-600' :
                            emailForecast.trends.volume === 'decreasing' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {emailForecast.trends.volume}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Response Time:</span>
                          <span className={`font-medium ${
                            emailForecast.trends.responseTime === 'improving' ? 'text-green-600' :
                            emailForecast.trends.responseTime === 'declining' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {emailForecast.trends.responseTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Workload:</span>
                          <span className={`font-medium ${
                            emailForecast.trends.workload === 'increasing' ? 'text-orange-600' :
                            emailForecast.trends.workload === 'decreasing' ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {emailForecast.trends.workload}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">💡 Recommendations</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {emailForecast.recommendations.slice(0, 3).map((rec, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Predictive Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Response Time Predictions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">VIP Clients</span>
                      <span className="text-sm text-green-600">1.2h avg</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Regular Clients</span>
                      <span className="text-sm text-yellow-600">4.5h avg</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">New Prospects</span>
                      <span className="text-sm text-orange-600">12.3h avg</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    Risk Factors
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-600">⚠️</span>
                      <div>
                        <div className="font-medium text-yellow-800">Volume Increase</div>
                        <div className="text-sm text-yellow-700">Expected 25% increase next month</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                      <span className="text-red-600">🚨</span>
                      <div>
                        <div className="font-medium text-red-800">Team Capacity</div>
                        <div className="text-sm text-red-700">3 team members at 90% capacity</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                      <span className="text-orange-600">📈</span>
                      <div>
                        <div className="font-medium text-orange-800">Response Delays</div>
                        <div className="text-sm text-orange-700">Response times increasing 15%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
