import { performance } from 'node:perf_hooks';
import { logger } from './logger';
import { redis } from './redis';

// Metric types
type MetricType = 'counter' | 'gauge' | 'histogram';

interface MetricValue {
  type: MetricType;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

// Monitoring configuration
const MONITORING_CONFIG = {
  flushInterval: 60000, // 1 minute
  retentionPeriod: 86400000, // 24 hours
  buckets: [0.1, 0.5, 1, 2, 5, 10], // histogram buckets in seconds
};

// Metrics registry
const metrics = new Map<string, MetricValue[]>();

// Performance monitoring functions
export const monitoring = {
  // Counter increment
  increment(name: string, value = 1, labels?: Record<string, string>): void {
    const metric: MetricValue = {
      type: 'counter',
      value,
      timestamp: Date.now(),
      labels,
    };

    const values = metrics.get(name) || [];
    values.push(metric);
    metrics.set(name, values);
  },

  // Gauge set
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric: MetricValue = {
      type: 'gauge',
      value,
      timestamp: Date.now(),
      labels,
    };

    metrics.set(name, [metric]); // Gauges only keep latest value
  },

  // Histogram observation
  observe(name: string, value: number, labels?: Record<string, string>): void {
    const metric: MetricValue = {
      type: 'histogram',
      value,
      timestamp: Date.now(),
      labels,
    };

    const values = metrics.get(name) || [];
    values.push(metric);
    metrics.set(name, values);
  },

  // Start timing
  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.observe(name, duration / 1000); // Convert to seconds
    };
  },

  // Get current metrics
  getMetrics(): Record<string, MetricValue[]> {
    return Object.fromEntries(metrics);
  },

  // Clear old metrics
  clearOldMetrics(): void {
    const cutoff = Date.now() - MONITORING_CONFIG.retentionPeriod;

    for (const [name, values] of metrics) {
      const filtered = values.filter((m) => m.timestamp >= cutoff);
      if (filtered.length === 0) {
        metrics.delete(name);
      } else {
        metrics.set(name, filtered);
      }
    }
  },

  // Calculate histogram statistics
  calculateHistogram(values: number[]): Record<string, number> {
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      min: sorted[0] || 0,
      max: sorted[count - 1] || 0,
      avg: count ? sorted.reduce((a, b) => a + b, 0) / count : 0,
      p50: count ? sorted[Math.floor(count * 0.5)] : 0,
      p90: count ? sorted[Math.floor(count * 0.9)] : 0,
      p95: count ? sorted[Math.floor(count * 0.95)] : 0,
      p99: count ? sorted[Math.floor(count * 0.99)] : 0,
    };
  },
};

// Periodic metrics flush to Redis
async function flushMetrics(): Promise<void> {
  try {
    const timestamp = Date.now();
    const allMetrics = monitoring.getMetrics();

    for (const [name, values] of Object.entries(allMetrics)) {
      const key = `metrics:${name}:${timestamp}`;
      await redis.setex(
        key,
        MONITORING_CONFIG.retentionPeriod / 1000,
        JSON.stringify(values),
      );
    }

    monitoring.clearOldMetrics();
  } catch (error) {
    logger.error('Error flushing metrics:', error);
  }
}

// Start periodic flush
setInterval(flushMetrics, MONITORING_CONFIG.flushInterval);

// Request duration middleware
export function monitorRequestDuration(
  req: Request,
  routeName: string,
): () => void {
  const end = monitoring.startTimer(
    `http_request_duration_seconds{route="${routeName}"}`,
  );

  monitoring.increment(
    `http_requests_total{route="${routeName}",method="${req.method}"}`,
  );

  return end;
}

// Database query monitoring
export function monitorQuery(query: string, duration: number): void {
  const queryType = query.split(' ')[0].toLowerCase();

  monitoring.observe(
    `db_query_duration_seconds{type="${queryType}"}`,
    duration / 1000,
  );

  monitoring.increment(`db_queries_total{type="${queryType}"}`);
}

// Cache monitoring
export function monitorCache(operation: string, hit: boolean): void {
  monitoring.increment(
    `cache_operations_total{operation="${operation}",hit="${hit}"}`,
  );
}

// Error monitoring
export function monitorError(type: string, error: Error): void {
  monitoring.increment(`errors_total{type="${type}"}`);

  logger.error('Error monitored:', {
    type,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });
}
