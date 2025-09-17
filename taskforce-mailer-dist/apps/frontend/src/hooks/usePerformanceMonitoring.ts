'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage?: number;
  networkTiming?: any;
}

interface PerformanceConfig {
  enableMemoryMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  enableWebVitals?: boolean;
  reportInterval?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function usePerformanceMonitoring(config: PerformanceConfig = {}) {
  const {
    enableMemoryMonitoring = true,
    enableNetworkMonitoring = true,
    enableWebVitals = true,
    reportInterval = 30000, // 30 seconds
    onMetricsUpdate
  } = config;

  const metricsRef = useRef<PerformanceMetrics>({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  });

  const observerRef = useRef<PerformanceObserver | null>(null);

  // Measure page load time
  const measurePageLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metricsRef.current.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
      }
    }
  }, []);

  // Measure Web Vitals
  const measureWebVitals = useCallback(() => {
    if (!enableWebVitals || typeof window === 'undefined') return;

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metricsRef.current.firstContentfulPaint = fcpEntry.startTime;
      }
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Browser doesn't support paint timing
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metricsRef.current.largestContentfulPaint = lastEntry.startTime;
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Browser doesn't support LCP
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime;
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Browser doesn't support FID
    }

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      metricsRef.current.cumulativeLayoutShift = clsValue;
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Browser doesn't support CLS
    }
  }, [enableWebVitals]);

  // Monitor memory usage
  const measureMemoryUsage = useCallback(() => {
    if (!enableMemoryMonitoring || typeof window === 'undefined') return;

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize;
    }
  }, [enableMemoryMonitoring]);

  // Monitor network timing
  const measureNetworkTiming = useCallback(() => {
    if (!enableNetworkMonitoring || typeof window === 'undefined') return;

    if (window.performance && window.performance.getEntriesByType) {
      const networkEntries = window.performance.getEntriesByType('resource');
      const navigationEntries = window.performance.getEntriesByType('navigation');

      metricsRef.current.networkTiming = {
        resourceCount: networkEntries.length,
        navigationTiming: navigationEntries[0],
        totalTransferSize: networkEntries.reduce((total, entry: any) => total + (entry.transferSize || 0), 0)
      };
    }
  }, [enableNetworkMonitoring]);

  // Get session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Report metrics
  const reportMetrics = useCallback(() => {
    const metrics = { ...metricsRef.current };
    
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }

    // Send to analytics service
    if (typeof window !== 'undefined') {
      fetch('/api/v1/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metrics,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: getSessionId()
        })
      }).catch(err => {
        console.error('Failed to report performance metrics:', err);
      });
    }
  }, [onMetricsUpdate, getSessionId]);

  // Initialize performance monitoring
  useEffect(() => {
    // Measure initial metrics
    measurePageLoadTime();
    measureWebVitals();
    measureMemoryUsage();
    measureNetworkTiming();

    // Set up periodic reporting
    const interval = setInterval(() => {
      measureMemoryUsage();
      measureNetworkTiming();
      reportMetrics();
    }, reportInterval);

    // Report on page unload
    const handleBeforeUnload = () => {
      reportMetrics();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Report on visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        measureMemoryUsage();
        reportMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      const observer = observerRef.current;
      if (observer) {
        observer.disconnect();
      }
    };
  }, [measurePageLoadTime, measureWebVitals, measureMemoryUsage, measureNetworkTiming, reportMetrics, reportInterval]);

  // Return current metrics and utility functions
  return {
    metrics: metricsRef.current,
    reportMetrics,
    measurePageLoadTime,
    measureWebVitals,
    measureMemoryUsage,
    measureNetworkTiming
  };
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      
      if (renderTime > 16) { // More than one frame (16ms)
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        
        // Report slow render
        fetch('/api/v1/analytics/performance/slow-render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            componentName,
            renderTime,
            renderCount: renderCountRef.current,
            timestamp: new Date().toISOString()
          })
        }).catch(err => {
          console.error('Failed to report slow render:', err);
        });
      }
    };
  });

  return {
    renderCount: renderCountRef.current
  };
}

// Hook for measuring API call performance
export function useAPIPerformance() {
  const measureAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Report API performance
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/performance/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          duration,
          success: true,
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.error('Failed to report API performance:', err);
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Report failed API call
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/performance/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          duration,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.error('Failed to report API performance:', err);
      });
      
      throw error;
    }
  }, []);

  return { measureAPICall };
}
