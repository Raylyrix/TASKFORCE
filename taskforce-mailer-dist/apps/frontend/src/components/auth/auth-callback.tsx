'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (error) {
          setError(`OAuth error: ${error}`);
          setIsLoading(false);
          return;
        }

        if (success === 'false') {
          setError('Authentication failed');
          setIsLoading(false);
          return;
        }

        if (token) {
          // Token received directly from OAuth callback
          login(token);
          router.push('/');
          return;
        }

        // Fallback: try to exchange code for token
        const code = searchParams.get('code');
        if (code) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/callback?code=${code}`, {
            method: 'GET',
          });

          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to authenticate');
            setIsLoading(false);
            return;
          }

          const data = await response.json();
          
          if (data.success && data.data.token) {
            login(data.data.token);
            router.push('/');
          } else {
            setError(data.error || 'Authentication failed');
          }
        } else {
          setError('No authentication token or code received');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}