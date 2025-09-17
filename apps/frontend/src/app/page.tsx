'use client';

import { ProductionDashboard } from '@/components/dashboard/production-dashboard';
import { EnhancedDashboard } from '@/components/dashboard/enhanced-dashboard';
import { SeamlessSetup } from '@/components/onboarding/seamless-setup';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isElectron, setIsElectron] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== 'undefined' && !!(window as any).electronAPI);
    
    // Check if setup is needed
    const checkSetup = async () => {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getUserSettings();
        setNeedsSetup(!settings.supabaseConfigured || !settings.userToken);
      } else {
        // For web version, check localStorage
        const token = localStorage.getItem('auth_token');
        setNeedsSetup(!token);
      }
      setSetupLoading(false);
    };

    checkSetup();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !needsSetup) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, needsSetup, router]);

  if (isLoading || setupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (needsSetup) {
    return <SeamlessSetup />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          {isElectron ? <EnhancedDashboard /> : <ProductionDashboard />}
        </main>
      </div>
    </div>
  );
}
