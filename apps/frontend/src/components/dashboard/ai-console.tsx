'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  LightBulbIcon, 
  PaperAirplaneIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface AIResponse {
  response: string;
  charts?: Array<{
    type: string;
    data: any;
    title: string;
  }>;
  confidence?: number;
}

const sampleQueries = [
  "Show me clients with slow response times",
  "What's my email volume trend this week?",
  "Which contacts need attention?",
  "Generate a summary of last week's activity",
];

async function processAIQuery(query: string): Promise<AIResponse> {
  const response = await fetch('/api/v1/ai/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      context: {
        includeCharts: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to process AI query');
  }

  const result = await response.json();
  return result.data || result;
}

export function AIConsole() {
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [responses, setResponses] = useState<AIResponse[]>([]);

  const { data: aiResponse, isLoading, error, refetch } = useQuery(
    ['ai-query', query],
    () => processAIQuery(query),
    {
      enabled: false, // Only run when manually triggered
      onSuccess: (data) => {
        setResponses(prev => [data, ...prev]);
        setQueryHistory(prev => [query, ...prev]);
        setQuery('');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      refetch();
    }
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  return (
    <div className="space-y-4">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything about your email analytics..."
            className="input pr-12"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 disabled:text-gray-400"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Sample Queries */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Try asking:
        </p>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sampleQuery, index) => (
            <button
              key={index}
              onClick={() => handleSampleQuery(sampleQuery)}
              className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              {sampleQuery}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            Error: {error instanceof Error ? error.message : 'Failed to process query'}
          </p>
        </div>
      )}

      {/* Response Display */}
      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
        {responses.map((response, index) => (
          <div key={index} className="space-y-3 animate-fade-in">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {response.response}
                  </p>
                  {response.confidence && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Confidence: {Math.round(response.confidence * 100)}%
                      </span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full" 
                          style={{ width: `${response.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Charts */}
                {response.charts && response.charts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {response.charts.map((chart, chartIndex) => (
                      <div key={chartIndex} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {chart.title}
                        </h4>
                        <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Chart: {chart.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Analyzing your query...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {responses.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Ask me anything about your email analytics to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
