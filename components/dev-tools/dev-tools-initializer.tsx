'use client';

import { useEffect } from 'react';
import { useDevTools } from '@/lib/dev-tools/context';
import { initializeNetworkInterceptor } from '@/lib/dev-tools/network-interceptor';
import { initializePerformanceMonitor } from '@/lib/dev-tools/performance';

export function DevToolsInitializer() {
  const { addNetworkRequest, addPerformanceMetric } = useDevTools();

  useEffect(() => {
    initializeNetworkInterceptor(addNetworkRequest);
    initializePerformanceMonitor(addPerformanceMetric);
  }, [addNetworkRequest, addPerformanceMetric]);

  return null;
}
