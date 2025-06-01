import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { redis } from '@/lib/redis';
import { performance } from 'perf_hooks';
import { logger } from '@/lib/logger';

// Connection pool configuration
const POOL_CONFIG = {
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Cache configuration
const CACHE_CONFIG = {
  ttl: 300, // 5 minutes
  prefix: 'db:cache:',
};

// Create connection pool
const sql = postgres(process.env.DATABASE_URL!, POOL_CONFIG);
export const db = drizzle(sql);

// Query builder with caching and monitoring
export class QueryBuilder {
  private static async withCache<T>(
    key: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const cacheKey = `${CACHE_CONFIG.prefix}${key}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const result = await queryFn();
    await redis.setex(cacheKey, CACHE_CONFIG.ttl, JSON.stringify(result));
    return result;
  }

  private static async measurePerformance<T>(
    queryName: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await queryFn();
      const duration = performance.now() - start;

      logger.info('Query performance', {
        query: queryName,
        duration_ms: duration.toFixed(2),
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      logger.error('Query error', {
        query: queryName,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  static async executeQuery<T>({
    name,
    query,
    useCache = false,
    cacheKey,
  }: {
    name: string;
    query: () => Promise<T>;
    useCache?: boolean;
    cacheKey?: string;
  }): Promise<T> {
    const execute = async () => this.measurePerformance(name, query);

    if (useCache && cacheKey) {
      return this.withCache(cacheKey, execute);
    }

    return execute();
  }

  static invalidateCache(key: string): Promise<void> {
    return redis.del(`${CACHE_CONFIG.prefix}${key}`);
  }
}

// Export common query patterns
export const queryPatterns = {
  // Paginated query with optional filters
  paginated: <T>({
    baseQuery,
    page = 1,
    limit = 10,
    orderBy,
    filters = [],
  }: {
    baseQuery: any;
    page?: number;
    limit?: number;
    orderBy?: { column: any; direction: 'asc' | 'desc' };
    filters?: any[];
  }) => {
    let query = baseQuery;

    if (filters.length > 0) {
      query = query.where(filters);
    }

    if (orderBy) {
      query = query.orderBy(
        orderBy.direction === 'asc'
          ? asc(orderBy.column)
          : desc(orderBy.column),
      );
    }

    return query.limit(limit).offset((page - 1) * limit);
  },

  // Batch operation with chunking
  batchOperation: async <T>({
    items,
    batchSize = 100,
    operation,
  }: {
    items: T[];
    batchSize?: number;
    operation: (batch: T[]) => Promise<void>;
  }) => {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await operation(batch);
    }
  },
};
