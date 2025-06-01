import { NextResponse } from 'next/server';
import { getRateLimiter } from '@/lib/security/rate-limit';

export async function GET() {
  try {
    const rateLimiter = await getRateLimiter('api');
    const rateLimitInfo = await rateLimiter.increment();

    // If rate limit exceeded, the middleware will handle it
    // This is just an example endpoint that returns the current time
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      message: 'Rate limited API endpoint',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
