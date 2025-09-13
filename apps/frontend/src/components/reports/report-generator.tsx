'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { CalendarIcon, DocumentArrowDownIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ErrorMessage } from '../ui/error-message';

interface ReportConfig {
  dateRange: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'excel' | 'email';
  recipients?: string[];
  includeAI: boolean;
}

export function ReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    format: 'pdf',
    includeAI: true
  });

  const [recipients, setRecipients] = useState('');

  // Fetch user's report history
  const { data: reports, refetch } = useQuery('reports', async () => {
    const response = await fetch('/api/v1/reports', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  });

  // Generate report mutation
  const generateReport = useMutation(async (reportConfig: ReportConfig) => {
    const response = await fetch('/api/v1/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(reportConfig)
    });

    if (!response.ok) throw new Error('Failed to generate report');
    return response.json();
  });

  const handleGenerate = async () => {
    const reportConfig = {
      ...config,
      recipients: config.format === 'email' ? recipients.split(',').map(email => email.trim()) : undefined
    };

    try {
      const result = await generateReport.mutateAsync(reportConfig);
      
      if (result.data.downloadUrl) {
        // Download the file
        window.open(result.data.downloadUrl, '_blank');
      } else {
        alert('Report generated and sent successfully!');
      }
      
      refetch(); // Refresh reports list
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };

  const downloadReport = (filename: string) => {
    window.open(`/api/v1/reports/download/${filename}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Generate Report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={config.dateRange.start}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="input"
              />
              <input
                type="date"
                value={config.dateRange.end}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="input"
              />
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Format
            </label>
            <select
              value={config.format}
              onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
              className="input"
            >
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="email">Email Report</option>
            </select>
          </div>
        </div>

        {/* Email Recipients */}
        {config.format === 'email' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Recipients (comma-separated)
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="user@example.com, manager@company.com"
              className="input w-full"
            />
          </div>
        )}

        {/* AI Insights */}
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.includeAI}
              onChange={(e) => setConfig(prev => ({ ...prev, includeAI: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Include AI insights and recommendations
            </span>
          </label>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={generateReport.isLoading}
            className="btn btn-primary flex items-center"
          >
            {generateReport.isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            )}
            Generate Report
          </button>
        </div>

        {generateReport.error && (
          <ErrorMessage message="Failed to generate report. Please try again." />
        )}
      </div>

      {/* Report History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report History
        </h3>

        {reports?.data?.reports?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reports.data.reports.map((report: any) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {report.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : report.status === 'FAILED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {report.filePath && (
                        <button
                          onClick={() => downloadReport(report.filePath.split('/').pop())}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No reports generated yet.</p>
        )}
      </div>
    </div>
  );
}
