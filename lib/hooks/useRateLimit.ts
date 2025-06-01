import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

interface RateLimitHeaders {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

interface UseRateLimitOptions {
  onRateLimitExceeded?: (retryAfter: number) => void;
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitHeaders | null>(
    null,
  );

  const handleResponse = useCallback(
    (response: Response) => {
      const limit = Number(response.headers.get('X-RateLimit-Limit'));
      const remaining = Number(response.headers.get('X-RateLimit-Remaining'));
      const reset = Number(response.headers.get('X-RateLimit-Reset'));
      const retryAfter = Number(response.headers.get('Retry-After'));

      const info: RateLimitHeaders = {
        limit,
        remaining,
        reset,
        ...(retryAfter && { retryAfter }),
      };

      setRateLimitInfo(info);

      if (response.status === 429) {
        const retryAfterSeconds =
          retryAfter || Math.ceil(reset - Date.now() / 1000);

        toast({
          title: 'Rate limit exceeded',
          description: `Please try again in ${retryAfterSeconds} seconds`,
          variant: 'destructive',
        });

        options.onRateLimitExceeded?.(retryAfterSeconds);
        throw new Error('Rate limit exceeded');
      }

      return response;
    },
    [options.onRateLimitExceeded],
  );

  const fetchWithRateLimit = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(input, init);
      return handleResponse(response);
    },
    [handleResponse],
  );

  return {
    rateLimitInfo,
    fetchWithRateLimit,
  };
}
