import { useState } from 'react';
import { useRateLimit } from '@/lib/hooks/useRateLimit';
import { Button } from '@/components/ui/button';

export function RateLimitDemo() {
  const [loading, setLoading] = useState(false);
  const { rateLimitInfo, fetchWithRateLimit } = useRateLimit({
    onRateLimitExceeded: (retryAfter) => {
      console.log(`Rate limit exceeded. Try again in ${retryAfter} seconds`);
    },
  });

  const handleClick = async () => {
    try {
      setLoading(true);
      // Make a request to a rate-limited endpoint
      await fetchWithRateLimit('/api/demo/rate-limited');
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Rate Limit Demo</h2>
      <div className="space-y-2">
        <Button onClick={handleClick} disabled={loading} variant="default">
          {loading ? 'Loading...' : 'Make Request'}
        </Button>
        {rateLimitInfo && (
          <div className="text-sm space-y-1">
            <p>Rate Limit: {rateLimitInfo.limit}</p>
            <p>Remaining: {rateLimitInfo.remaining}</p>
            <p>
              Reset: {new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
