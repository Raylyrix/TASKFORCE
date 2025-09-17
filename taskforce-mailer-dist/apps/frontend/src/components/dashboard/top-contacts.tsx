'use client';

import { UserCircleIcon } from '@heroicons/react/24/outline';

interface Contact {
  id: string;
  email: string;
  name?: string;
  messageCount: number;
  responseRate: number;
  healthScore: number;
  lastContact: string;
}

interface TopContactsProps {
  data?: Contact[];
}

export function TopContacts({ data }: TopContactsProps) {
  const contacts = data?.slice(0, 10) || [];

  const getHealthBadgeColor = (score: number) => {
    if (score >= 90) return 'badge-success';
    if (score >= 70) return 'badge-info';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  const formatLastContact = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="space-y-4">
      {contacts.length === 0 ? (
        <div className="text-center py-8">
          <UserCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No contact data available</p>
        </div>
      ) : (
        contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {contact.name ? contact.name.charAt(0).toUpperCase() : contact.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {contact.name || contact.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {contact.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {contact.messageCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  messages
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round(contact.responseRate * 100)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  response
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`badge ${getHealthBadgeColor(contact.healthScore)}`}>
                  {contact.healthScore}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatLastContact(contact.lastContact)}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
      
      {contacts.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            View all contacts →
          </button>
        </div>
      )}
    </div>
  );
}
