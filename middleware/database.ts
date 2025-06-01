import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import {
  dbIdentifierSchema,
  validateSearchParams,
  validateSortParams,
  validatePagination,
  validateDateRange,
} from '@/lib/security/database';

// Common query parameter names that might be used for SQL injection
const DANGEROUS_PARAMS = [
  'query',
  'q',
  'search',
  'filter',
  'where',
  'order',
  'sort',
  'orderBy',
  'groupBy',
  'having',
  'select',
  'columns',
  'fields',
  'include',
  'exclude',
  'join',
];

// SQL injection patterns to check for
const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Basic SQL meta-characters
  /(alter|create|delete|drop|exec(ute)?|insert|merge|select|update|upsert|union|bulk)/i, // SQL commands
  /(\%27)|(\')|(\-\-)|(\%3B)|(;)/i, // SQL command terminators
  /(\%6F\%72)|(\%6F\%72)|(\%6F\%52)|(\%6F\%52)/i, // URL encoded 'or'
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // Basic SQL injection test for equality
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // Basic SQL injection test for 'or'
  /((\%27)|(\'))union/i, // Basic SQL injection test for union
];

function containsSQLInjection(value: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeQueryParams(url: URL): void {
  // Check each query parameter for SQL injection attempts
  url.searchParams.forEach((value, key) => {
    // Check if the parameter name is potentially dangerous
    if (DANGEROUS_PARAMS.includes(key.toLowerCase())) {
      if (containsSQLInjection(value)) {
        throw new ChatSDKError(
          'bad_request:database',
          'Invalid query parameter detected',
        );
      }
    }

    // Validate specific parameter types
    if (key === 'sort' || key === 'orderBy') {
      try {
        dbIdentifierSchema.parse(value);
      } catch {
        throw new ChatSDKError(
          'bad_request:database',
          'Invalid sort parameter',
        );
      }
    }

    if (key === 'page' || key === 'limit') {
      const num = Number(value);
      if (Number.isNaN(num) || num < 0 || !Number.isInteger(num)) {
        throw new ChatSDKError(
          'bad_request:database',
          'Invalid pagination parameter',
        );
      }
    }

    if (key === 'startDate' || key === 'endDate') {
      if (!value.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/)) {
        throw new ChatSDKError(
          'bad_request:database',
          'Invalid date parameter',
        );
      }
    }
  });
}

export async function databaseMiddleware(request: NextRequest) {
  try {
    // Skip non-API routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Skip authentication routes
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    // Check request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          const body = await request.json();
          const jsonString = JSON.stringify(body);
          if (containsSQLInjection(jsonString)) {
            return new ChatSDKError(
              'bad_request:database',
              'Invalid request body',
            ).toResponse();
          }
        } catch {
          return new ChatSDKError(
            'bad_request:database',
            'Invalid JSON body',
          ).toResponse();
        }
      }
    }

    // Sanitize query parameters
    const url = new URL(request.url);
    sanitizeQueryParams(url);

    return NextResponse.next();
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('internal_server_error:database').toResponse();
  }
}
