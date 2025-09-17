'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  DocumentTextIcon,
  LightBulbIcon,
  QueueListIcon,
  BellIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Overview', href: '/', icon: HomeIcon, current: true },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, current: false },
  { name: 'Contacts', href: '/contacts', icon: UserGroupIcon, current: false },
  { name: 'Conversations', href: '/conversations', icon: ChatBubbleLeftRightIcon, current: false },
  { name: 'AI Console', href: '/ai', icon: LightBulbIcon, current: false },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon, current: false },
  { name: 'Automation', href: '/automation', icon: QueueListIcon, current: false },
  { name: 'Notifications', href: '/notifications', icon: BellIcon, current: false },
  { name: 'Settings', href: '/settings', icon: CogIcon, current: false },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState('Overview');

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = item.name === activeItem;
            return (
              <button
                key={item.name}
                onClick={() => setActiveItem(item.name)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }`}
                />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Messages Today</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">142</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">2.3h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">AI Insights</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">8</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Health Score</span>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">87%</span>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">AI Status</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400">Active</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Processing 15 messages
        </div>
      </div>
    </div>
  );
}
