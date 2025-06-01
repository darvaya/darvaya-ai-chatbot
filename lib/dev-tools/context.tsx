'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: unknown;
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status?: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  request: {
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    headers?: Record<string, string>;
    body?: unknown;
  };
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface DevToolsContextType {
  isEnabled: boolean;
  toggleDevTools: () => void;
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, details?: unknown) => void;
  clearLogs: () => void;
  networkRequests: NetworkRequest[];
  addNetworkRequest: (request: NetworkRequest) => void;
  clearNetworkRequests: () => void;
  performanceMetrics: PerformanceMetric[];
  addPerformanceMetric: (metric: PerformanceMetric) => void;
  clearPerformanceMetrics: () => void;
}

const DevToolsContext = createContext<DevToolsContextType | undefined>(
  undefined,
);

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);

  // Enable dev tools with keyboard shortcut (Ctrl/Cmd + Shift + D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsEnabled((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleDevTools = () => setIsEnabled((prev) => !prev);

  const addLog = (level: LogLevel, message: string, details?: unknown) => {
    setLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level,
        message,
        details,
      },
    ]);
  };

  const clearLogs = () => setLogs([]);

  const addNetworkRequest = (request: NetworkRequest) => {
    setNetworkRequests((prev) => [...prev, request]);
  };

  const clearNetworkRequests = () => setNetworkRequests([]);

  const addPerformanceMetric = (metric: PerformanceMetric) => {
    setPerformanceMetrics((prev) => [...prev, metric]);
  };

  const clearPerformanceMetrics = () => setPerformanceMetrics([]);

  return (
    <DevToolsContext.Provider
      value={{
        isEnabled,
        toggleDevTools,
        logs,
        addLog,
        clearLogs,
        networkRequests,
        addNetworkRequest,
        clearNetworkRequests,
        performanceMetrics,
        addPerformanceMetric,
        clearPerformanceMetrics,
      }}
    >
      {children}
    </DevToolsContext.Provider>
  );
}

export function useDevTools() {
  const context = useContext(DevToolsContext);
  if (context === undefined) {
    throw new Error('useDevTools must be used within a DevToolsProvider');
  }
  return context;
}
