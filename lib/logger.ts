import pino from 'pino';
import { performance } from 'node:perf_hooks';

// Log configuration
const LOG_CONFIG = {
  development: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
  },
  production: {
    level: 'info',
    transport: {
      target: 'pino/file',
      options: { destination: './logs/app.log' },
    },
  },
};

// Create logger instance
export const logger = pino({
  ...(process.env.NODE_ENV === 'production'
    ? LOG_CONFIG.production
    : LOG_CONFIG.development),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

// Log levels with corresponding methods
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Performance monitoring
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  static start(label: string): void {
    this.marks.set(label, performance.now());
  }

  static end(label: string, metadata: Record<string, any> = {}): void {
    const start = this.marks.get(label);
    if (!start) {
      logger.warn(`No start mark found for "${label}"`);
      return;
    }

    const duration = performance.now() - start;
    this.marks.delete(label);

    logger.info({
      type: 'performance',
      label,
      duration_ms: duration.toFixed(2),
      ...metadata,
    });
  }
}

// Audit logging
export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  status: 'success' | 'failure';
  ip?: string;
  userAgent?: string;
}

export function logAudit(data: AuditLogData): void {
  logger.info({
    type: 'audit',
    timestamp: new Date().toISOString(),
    ...data,
  });
}

// Error logging with stack traces and metadata
export function logError(
  error: Error,
  metadata: Record<string, any> = {},
): void {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

// Request logging middleware
export function requestLogger(
  req: Request,
  metadata: Record<string, any> = {},
): void {
  const start = performance.now();

  // Log request start
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers),
    ...metadata,
    phase: 'start',
    timestamp: new Date().toISOString(),
  });

  // Return response logger
  return {
    logResponse: (
      status: number,
      responseMetadata: Record<string, any> = {},
    ) => {
      const duration = performance.now() - start;
      logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        status,
        duration_ms: duration.toFixed(2),
        ...metadata,
        ...responseMetadata,
        phase: 'end',
        timestamp: new Date().toISOString(),
      });
    },
  };
}

// Security event logging
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any> = {},
): void {
  logger.warn({
    type: 'security',
    event,
    severity,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

// Database query logging
export function logQuery(
  query: string,
  params: any[],
  duration: number,
  metadata: Record<string, any> = {},
): void {
  logger.debug({
    type: 'query',
    query,
    params,
    duration_ms: duration.toFixed(2),
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}
