'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  HomeIcon, 
  BugAntIcon 
} from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    this.logError(error, errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };

    // Send to error reporting service
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/errors/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport)
    }).catch(err => {
      console.error('Failed to report error:', err);
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  };

  private getUserId = (): string | null => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      }
    } catch {
      // Ignore token parsing errors
    }
    return null;
  };

  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Open email client with error details
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(errorDetails, null, 2)}

Please describe what you were doing when this error occurred:
`);

    window.open(`mailto:support@taskforce.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We&apos;re sorry, but something unexpected happened. Our team has been notified.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 text-left">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Error Details:
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 font-mono">
                    {this.state.error.message}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Reload
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Home
                  </button>
                </div>

                <button
                  onClick={this.handleReportBug}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <BugAntIcon className="w-4 h-4 mr-2" />
                  Report Bug
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                If this problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    // Log error
    console.error('Error caught by error handler:', error, errorInfo);
    
    // Report to error service
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/errors/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        errorInfo
      })
    }).catch(err => {
      console.error('Failed to report error:', err);
    });
  };
}
