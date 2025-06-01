import { logger } from '../logger';
import { monitoring } from '../monitoring';

// Error types
export type ErrorType =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'database'
  | 'cache'
  | 'external_service'
  | 'internal';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Base application error
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly context: Record<string, any>;
  public readonly timestamp: string;

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = 'medium',
    statusCode = 500,
    context: Record<string, any> = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);

    // Log and monitor error
    this.logError();
    this.monitorError();
  }

  private logError(): void {
    logger.error({
      type: 'error',
      errorType: this.type,
      severity: this.severity,
      message: this.message,
      stack: this.stack,
      context: this.context,
      timestamp: this.timestamp,
    });
  }

  private monitorError(): void {
    monitoring.increment(
      `errors_total{type="${this.type}",severity="${this.severity}"}`,
    );
  }

  public toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: {
          type: this.type,
          message: this.message,
          ...(process.env.NODE_ENV === 'development' && {
            stack: this.stack,
            context: this.context,
          }),
        },
      }),
      {
        status: this.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('validation', message, 'low', 400, context);
    this.name = 'ValidationError';
  }
}

// Authentication error
export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('authentication', message, 'medium', 401, context);
    this.name = 'AuthenticationError';
  }
}

// Authorization error
export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('authorization', message, 'medium', 403, context);
    this.name = 'AuthorizationError';
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('not_found', message, 'low', 404, context);
    this.name = 'NotFoundError';
  }
}

// Conflict error
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('conflict', message, 'medium', 409, context);
    this.name = 'ConflictError';
  }
}

// Rate limit error
export class RateLimitError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('rate_limit', message, 'low', 429, context);
    this.name = 'RateLimitError';
  }
}

// Database error
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('database', message, 'high', 500, context);
    this.name = 'DatabaseError';
  }
}

// Cache error
export class CacheError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('cache', message, 'medium', 500, context);
    this.name = 'CacheError';
  }
}

// External service error
export class ExternalServiceError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('external_service', message, 'high', 502, context);
    this.name = 'ExternalServiceError';
  }
}

// Error handler middleware
export async function errorHandler(
  error: Error,
  request: Request,
): Promise<Response> {
  // Handle known application errors
  if (error instanceof AppError) {
    return error.toResponse();
  }

  // Handle unknown errors
  const appError = new AppError(
    'internal',
    'An unexpected error occurred',
    'high',
    500,
    {
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers),
      },
    },
  );

  return appError.toResponse();
}

// Error utilities
export const errorUtils = {
  // Wrap an async function with error handling
  withErrorHandling: <T>(
    fn: (req: Request) => Promise<T>,
  ): ((req: Request) => Promise<Response>) => {
    return async (req: Request) => {
      try {
        const result = await fn(req);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return errorHandler(error as Error, req);
      }
    };
  },

  // Create a validation error from Zod error
  fromZodError: (zodError: any): ValidationError => {
    return new ValidationError('Validation failed', {
      errors: zodError.errors.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  },
};
