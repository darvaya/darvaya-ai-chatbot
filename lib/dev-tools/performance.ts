import type { PerformanceMetric } from './context';

interface LayoutShift extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private onMetricCallback: ((metric: PerformanceMetric) => void) | null = null;
  private marks: Map<string, number> = new Map();

  private constructor() {
    this.setupPerformanceObserver();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  setMetricCallback(callback: (metric: PerformanceMetric) => void) {
    this.onMetricCallback = callback;
  }

  private setupPerformanceObserver() {
    if (typeof window !== 'undefined') {
      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.reportMetric({
            id: crypto.randomUUID(),
            name: 'Long Task Duration',
            value: entry.duration,
            timestamp: new Date(),
            metadata: {
              entryType: entry.entryType,
              startTime: entry.startTime,
            },
          });
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Observe layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const layoutShift = entry as LayoutShift;
          if (layoutShift.hadRecentInput) return;

          this.reportMetric({
            id: crypto.randomUUID(),
            name: 'Cumulative Layout Shift',
            value: layoutShift.value,
            timestamp: new Date(),
            metadata: {
              entryType: layoutShift.entryType,
              startTime: layoutShift.startTime,
            },
          });
        });
      });

      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

      // Observe first paint and first contentful paint
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.reportMetric({
            id: crypto.randomUUID(),
            name:
              entry.name === 'first-paint'
                ? 'First Paint'
                : 'First Contentful Paint',
            value: entry.startTime,
            timestamp: new Date(),
            metadata: {
              entryType: entry.entryType,
            },
          });
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const lastEntry = list.getEntries().at(-1);
        if (lastEntry) {
          this.reportMetric({
            id: crypto.randomUUID(),
            name: 'Largest Contentful Paint',
            value: lastEntry.startTime,
            timestamp: new Date(),
            metadata: {
              entryType: lastEntry.entryType,
              element: (lastEntry as any).element?.tagName,
            },
          });
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const firstInput = entry as FirstInputEntry;
          this.reportMetric({
            id: crypto.randomUUID(),
            name: 'First Input Delay',
            value: firstInput.processingStart - firstInput.startTime,
            timestamp: new Date(),
            metadata: {
              entryType: firstInput.entryType,
              name: firstInput.name,
            },
          });
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  startMeasure(name: string) {
    this.marks.set(name, performance.now());
  }

  endMeasure(name: string) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.marks.delete(name);

      this.reportMetric({
        id: crypto.randomUUID(),
        name: `Custom Measure: ${name}`,
        value: duration,
        timestamp: new Date(),
        metadata: {
          type: 'custom-measure',
        },
      });
    }
  }

  private reportMetric(metric: PerformanceMetric) {
    this.onMetricCallback?.(metric);
  }
}

export function initializePerformanceMonitor(
  callback: (metric: PerformanceMetric) => void,
) {
  if (typeof window !== 'undefined') {
    const monitor = PerformanceMonitor.getInstance();
    monitor.setMetricCallback(callback);
  }
}
