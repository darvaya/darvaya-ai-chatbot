'use client';

import { useDevTools } from '@/lib/dev-tools/context';
import { useEffect, useState } from 'react';
import { initializeNetworkInterceptor } from '@/lib/dev-tools/network-interceptor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { XIcon, TrashIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DevToolsPanel() {
  const {
    isEnabled,
    toggleDevTools,
    logs,
    clearLogs,
    networkRequests,
    addNetworkRequest,
    clearNetworkRequests,
    performanceMetrics,
    clearPerformanceMetrics,
  } = useDevTools();

  const [activeTab, setActiveTab] = useState('console');

  useEffect(() => {
    if (isEnabled) {
      initializeNetworkInterceptor(addNetworkRequest);
    }
  }, [isEnabled, addNetworkRequest]);

  if (!isEnabled) return null;

  const renderJSONString = (data: unknown): string => {
    try {
      if (typeof data === 'string') return data;
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-80 bg-background border-t z-50">
      <div className="flex items-center justify-between p-2 border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="console">Console ({logs.length})</TabsTrigger>
            <TabsTrigger value="network">
              Network ({networkRequests.length})
            </TabsTrigger>
            <TabsTrigger value="performance">
              Performance ({performanceMetrics.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              switch (activeTab) {
                case 'console':
                  clearLogs();
                  break;
                case 'network':
                  clearNetworkRequests();
                  break;
                case 'performance':
                  clearPerformanceMetrics();
                  break;
              }
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleDevTools}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="p-4">
          <TabsContent value="console" className="mt-0">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`mb-2 p-2 rounded ${
                  log.level === 'error'
                    ? 'bg-red-500/10 text-red-500'
                    : log.level === 'warn'
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : log.level === 'info'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="opacity-70">
                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                  </span>
                  <span className="font-mono">{log.message}</span>
                </div>
                {log.details && (
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {renderJSONString(log.details)}
                  </pre>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="network" className="mt-0">
            {networkRequests.map((request) => (
              <div
                key={request.id}
                className={`mb-2 p-2 rounded ${
                  request.status && request.status >= 400
                    ? 'bg-red-500/10'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`font-mono ${
                      request.status && request.status >= 400
                        ? 'text-red-500'
                        : request.status && request.status >= 300
                          ? 'text-yellow-500'
                          : 'text-green-500'
                    }`}
                  >
                    {request.status || 'Pending'}
                  </span>
                  <span className="font-medium">{request.method}</span>
                  <span className="opacity-70">{request.url}</span>
                  {request.duration && (
                    <span className="ml-auto">{request.duration}ms</span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs font-medium mb-1">Request</div>
                    <pre className="text-xs overflow-x-auto">
                      {renderJSONString(request.request)}
                    </pre>
                  </div>
                  {request.response && (
                    <div>
                      <div className="text-xs font-medium mb-1">Response</div>
                      <pre className="text-xs overflow-x-auto">
                        {renderJSONString(request.response)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            {performanceMetrics.map((metric) => (
              <div key={metric.id} className="mb-2 p-2 rounded bg-muted">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{metric.name}</span>
                  <span className="font-mono">{metric.value.toFixed(2)}</span>
                  <span className="opacity-70">
                    {formatDistanceToNow(metric.timestamp, { addSuffix: true })}
                  </span>
                </div>
                {metric.metadata && (
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {renderJSONString(metric.metadata)}
                  </pre>
                )}
              </div>
            ))}
          </TabsContent>
        </div>
      </ScrollArea>
    </div>
  );
}
