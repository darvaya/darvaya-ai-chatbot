import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';

type ValidationConfig = {
  query?: z.ZodType;
  params?: z.ZodType;
  body?: z.ZodType;
};

export function withValidation(config: ValidationConfig) {
  return async function validationMiddleware(request: NextRequest) {
    try {
      const url = new URL(request.url);

      // Validate query parameters
      if (config.query) {
        const queryParams = Object.fromEntries(url.searchParams.entries());
        try {
          config.query.parse(queryParams);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return new ChatSDKError(
              'bad_request:api',
              `Invalid query parameters: ${error.errors.map((e) => e.message).join(', ')}`,
            ).toResponse();
          }
        }
      }

      // Validate path parameters
      if (config.params) {
        const params = url.pathname
          .split('/')
          .filter(Boolean)
          .reduce((acc: Record<string, string>, curr, idx) => {
            acc[idx.toString()] = curr;
            return acc;
          }, {});
        try {
          config.params.parse(params);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return new ChatSDKError(
              'bad_request:api',
              `Invalid path parameters: ${error.errors.map((e) => e.message).join(', ')}`,
            ).toResponse();
          }
        }
      }

      // Validate request body for POST/PUT/PATCH requests
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const contentType = request.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const body = await request.json();
            config.body.parse(body);
          } else {
            throw new Error('Unsupported content type');
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            return new ChatSDKError(
              'bad_request:api',
              `Invalid request body: ${error.errors.map((e) => e.message).join(', ')}`,
            ).toResponse();
          } else {
            return new ChatSDKError(
              'bad_request:api',
              'Invalid request format',
            ).toResponse();
          }
        }
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return new ChatSDKError('internal_server_error:api').toResponse();
    }
  };
}

// Helper function to create a validated API route
export function createValidatedRoute(
  config: ValidationConfig,
  handler: (request: NextRequest) => Promise<Response>,
) {
  return async function validatedRoute(request: NextRequest) {
    const validationResponse = await withValidation(config)(request);
    if (validationResponse.status !== 200) {
      return validationResponse;
    }
    return handler(request);
  };
}
