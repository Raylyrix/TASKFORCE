'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '../ui/loading-spinner';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true' && token) {
      // Store the JWT token
      localStorage.setItem('auth_token', token);
      setStatus('success');
      setMessage('Successfully connected to Gmail!');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else if (success === 'false' || error) {
      setStatus('error');
      setMessage(error || 'Failed to connect to Gmail');
    } else {
      setStatus('error');
      setMessage('Invalid authentication response');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <LoadingSpinner size="lg" className="mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connecting to Gmail...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we set up your email analytics.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/auth/login')}
                className="btn btn-primary w-full"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn btn-secondary w-full"
              >
                Continue with Demo Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
