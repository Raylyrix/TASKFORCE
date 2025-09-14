'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { ClockIcon, TrashIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ErrorMessage } from '../ui/error-message';

interface ScheduledReport {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'excel' | 'email';
  recipients: string[];
  lastRun?: Date;
  nextRun: Date;
  isActive: boolean;
}

export function ScheduledReports() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    format: 'email' as 'pdf' | 'excel' | 'email',
    recipients: '',
    includeAI: true
  });

  // Fetch scheduled reports
  const { data: scheduledReports, refetch } = useQuery('scheduled-reports', async () => {
    const response = await fetch('/api/v1/reports/scheduled', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch scheduled reports');
    return response.json();
  });

  // Create scheduled report mutation
  const createSchedule = useMutation(async (schedule: any) => {
    const response = await fetch('/api/v1/reports/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        ...schedule,
        recipients: schedule.recipients.split(',').map((email: string) => email.trim()),
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      })
    });

    if (!response.ok) throw new Error('Failed to create scheduled report');
    return response.json();
  });

  // Toggle schedule mutation
  const toggleSchedule = useMutation(async ({ id, isActive }: { id: string; isActive: boolean }) => {
    const response = await fetch(`/api/v1/reports/scheduled/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ isActive: !isActive })
    });

    if (!response.ok) throw new Error('Failed to toggle schedule');
    return response.json();
  });

  // Delete schedule mutation
  const deleteSchedule = useMutation(async (id: string) => {
    const response = await fetch(`/api/v1/reports/scheduled/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });

    if (!response.ok) throw new Error('Failed to delete schedule');
    return response.json();
  });

  const handleCreateSchedule = async () => {
    try {
      await createSchedule.mutateAsync(newSchedule);
      setShowCreateForm(false);
      setNewSchedule({
        frequency: 'weekly',
        format: 'email',
        recipients: '',
        includeAI: true
      });
      refetch();
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  const handleToggleSchedule = async (id: string, currentStatus: boolean) => {
    try {
      await toggleSchedule.mutateAsync({ id, isActive: currentStatus });
      refetch();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      try {
        await deleteSchedule.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Failed to delete schedule:', error);
      }
    }
  };

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const getNextRunText = (nextRun: Date) => {
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    return nextRun.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Scheduled Reports
        </h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create Schedule
        </button>
      </div>

      {/* Create Schedule Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Create Scheduled Report
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={newSchedule.frequency}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
                className="input"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Format
              </label>
              <select
                value={newSchedule.format}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, format: e.target.value as any }))}
                className="input"
              >
                <option value="email">Email</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipients
              </label>
              <input
                type="text"
                value={newSchedule.recipients}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, recipients: e.target.value }))}
                placeholder="user@example.com, manager@company.com"
                className="input"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newSchedule.includeAI}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, includeAI: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include AI insights
              </span>
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreateSchedule}
              disabled={createSchedule.isLoading}
              className="btn btn-primary"
            >
              {createSchedule.isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Create Schedule
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>

          {createSchedule.error && (
            <ErrorMessage error={new Error("Failed to create scheduled report. Please try again.")} />
          )}
        </div>
      )}

      {/* Scheduled Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {scheduledReports?.data?.reports?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {scheduledReports.data.reports.map((report: any) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatFrequency(report.frequency)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {report.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {report.recipients?.length || 0} recipients
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getNextRunText(new Date(report.nextRun))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {report.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleSchedule(report.id, report.isActive)}
                        disabled={toggleSchedule.isLoading}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title={report.isActive ? 'Pause' : 'Resume'}
                      >
                        {report.isActive ? (
                          <PauseIcon className="h-4 w-4" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(report.id)}
                        disabled={deleteSchedule.isLoading}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No scheduled reports
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create your first scheduled report to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
