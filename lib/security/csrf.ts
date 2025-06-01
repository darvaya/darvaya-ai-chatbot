import { randomBytes, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import type { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';

const CSRF_SECRET = process.env.CSRF_SECRET || randomBytes(32).toString('hex');
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

export function generateToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(`${token}${CSRF_SECRET}`).digest('hex');
}

export function setCSRFCookie(token: string) {
  const hashedToken = hashToken(token);
  const cookieStore = cookies() as unknown as RequestCookies;

  cookieStore.set(CSRF_COOKIE_NAME, hashedToken);
}

export function getCSRFCookie(): string | undefined {
  const cookieStore = cookies() as unknown as RequestCookies;
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

export function validateToken(token: string | null): boolean {
  if (!token) return false;

  const hashedToken = hashToken(token);
  const cookieToken = getCSRFCookie();

  return cookieToken === hashedToken;
}

export function clearCSRFCookie() {
  const cookieStore = cookies() as unknown as RequestCookies;
  cookieStore.delete(CSRF_COOKIE_NAME);
}

export const CSRF_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export const CSRF_EXEMPT_PATHS = [
  '/api/auth/csrf',
  '/api/auth/callback',
  '/api/auth/providers',
  '/api/auth/session',
];

export { CSRF_HEADER_NAME };
