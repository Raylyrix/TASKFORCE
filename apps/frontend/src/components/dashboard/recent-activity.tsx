'use client';

import { 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface ActivityItem {
  id: string;
  type: 'email' | 'alert' | 'ai' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

export function RecentActivity() {
  // Mock data - in real app, this would come from API
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'ai',
      title: 'AI Analysis Completed',
      description: 'Priority analysis completed for 15 new messages',
      timestamp: '2 minutes ago',
      status: 'success',
    },
    {
      id: '2',
      type: 'email',
      title: 'New High Priority Email',
      description: 'Urgent message from john.doe@client.com',
      timestamp: '5 minutes ago',
      status: 'warning',
    },
    {
      id: '3',
      type: 'system',
      title: 'Daily Report Generated',
      description: 'Weekly analytics report sent to admin@taskforce-demo.com',
      timestamp: '1 hour ago',
      status: 'success',
    },
    {
      id: '4',
      type: 'alert',
      title: 'Slow Response Alert',
      description: '3 emails waiting for response > 24 hours',
      timestamp: '2 hours ago',
      status: 'warning',
    },
    {
      id: '5',
      type: 'ai',
      title: 'Smart Reply Generated',
      description: 'Draft response created for support inquiry',
      timestamp: '3 hours ago',
      status: 'success',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return ChatBubbleLeftRightIcon;
      case 'alert':
        return ExclamationTriangleIcon;
      case 'ai':
        return SparklesIcon;
      case 'system':
        return CheckCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (status === 'error') return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (status === 'warning') return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    if (type === 'ai') return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    if (type === 'email') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (type === 'system') return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const IconComponent = getActivityIcon(activity.type);
        const colorClasses = getActivityColor(activity.type, activity.status);
        
        return (
          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className={`flex-shrink-0 p-2 rounded-lg ${colorClasses}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {activity.timestamp}
              </p>
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}
