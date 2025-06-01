import {
  generateToken,
  setCSRFCookie,
  CSRF_HEADER_NAME,
} from '@/lib/security/csrf';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate new CSRF token
    const token = generateToken();

    // Set CSRF cookie
    setCSRFCookie(token);

    // Return token in response
    return new NextResponse(
      JSON.stringify({
        csrfToken: token,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: token,
        },
      },
    );
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to generate CSRF token',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
