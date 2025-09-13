'use client';

import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

interface MetricCardsProps {
  data?: {
    totalSent: number;
    totalReceived: number;
    avgResponseTime: number;
    activeContacts: number;
    topContact?: {
      email: string;
      name: string;
      messageCount: number;
    };
  };
}

export function MetricCards({ data }: MetricCardsProps) {
  const metrics = [
    {
      name: 'Messages Sent',
      value: data?.totalSent?.toLocaleString() || '0',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: ChatBubbleLeftRightIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      name: 'Messages Received',
      value: data?.totalReceived?.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: ChatBubbleLeftRightIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      name: 'Avg Response Time',
      value: data?.avgResponseTime ? `${Math.round(data.avgResponseTime / 60)}h ${data.avgResponseTime % 60}m` : '0h',
      change: '-15.3%',
      changeType: 'positive' as const,
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      name: 'Active Contacts',
      value: data?.activeContacts?.toLocaleString() || '0',
      change: '+5.7%',
      changeType: 'positive' as const,
      icon: UserGroupIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      name: 'Health Score',
      value: '87%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: HeartIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {metrics.map((metric) => (
        <div key={metric.name} className="metric-card">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-6 w-6 ${metric.color}`} />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              metric.changeType === 'positive' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {metric.changeType === 'positive' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              {metric.change}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {metric.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
