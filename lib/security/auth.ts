import { z } from 'zod';
import { hash } from 'bcrypt-ts';
import { ChatSDKError } from '@/lib/errors';

// Password strength validation schema with customizable requirements
export const createPasswordSchema = (
  requirements: {
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
  } = {},
) => {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSymbols = true,
  } = requirements;

  let schema = z
    .string()
    .min(minLength, `Password must be at least ${minLength} characters`)
    .max(maxLength, `Password must be at most ${maxLength} characters`);

  if (requireUppercase) {
    schema = schema.regex(
      /[A-Z]/,
      'Password must contain at least one uppercase letter',
    );
  }
  if (requireLowercase) {
    schema = schema.regex(
      /[a-z]/,
      'Password must contain at least one lowercase letter',
    );
  }
  if (requireNumbers) {
    schema = schema.regex(/[0-9]/, 'Password must contain at least one number');
  }
  if (requireSymbols) {
    schema = schema.regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    );
  }

  return schema;
};

// Rate limiting for failed login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkLoginAttempts(
  identifier: string,
  maxAttempts: number,
  lockoutDuration: number,
) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);

  if (attempts) {
    // Check if still in lockout period
    if (attempts.count >= maxAttempts) {
      const timeSinceLastAttempt = now - attempts.lastAttempt;
      if (timeSinceLastAttempt < lockoutDuration * 60 * 1000) {
        const remainingLockout = Math.ceil(
          (lockoutDuration * 60 * 1000 - timeSinceLastAttempt) / 1000 / 60,
        );
        throw new ChatSDKError(
          'too_many_requests:auth',
          `Too many failed attempts. Please try again in ${remainingLockout} minutes.`,
        );
      }
      // Reset attempts after lockout period
      loginAttempts.delete(identifier);
    }
  }
}

export function recordFailedLoginAttempt(identifier: string) {
  const attempts = loginAttempts.get(identifier) || {
    count: 0,
    lastAttempt: Date.now(),
  };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(identifier, attempts);
}

export function resetLoginAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

// Password hashing with configurable work factor
export async function hashPassword(
  password: string,
  workFactor = 12,
): Promise<string> {
  return hash(password, workFactor);
}

// Session security utilities
export function generateSessionId(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    'base64url',
  );
}

// CSRF token validation
export function validateCsrfToken(
  token: string | null,
  expectedToken: string,
): boolean {
  if (!token) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

// IP address validation
export function validateIpAddress(ip: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  return allowlist.includes(ip);
}

// User agent validation to detect suspicious clients
export function validateUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;

  // Block common bot patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /curl/i,
    /postman/i,
    /insomnia/i,
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(userAgent));
}

// Security headers configuration
export const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
