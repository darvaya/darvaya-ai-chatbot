import { CSRF_HEADER_NAME } from './security/csrf';

interface FetchOptions extends RequestInit {
  csrfToken?: string | null;
}

export async function fetchWithCSRF(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { csrfToken, headers: initialHeaders = {}, ...rest } = options;

  // Convert headers to a mutable object
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(initialHeaders as Record<string, string>),
  };

  // Add CSRF token to headers for mutating requests
  const method = (rest.method || 'GET').toUpperCase();
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers[CSRF_HEADER_NAME] = csrfToken;
  }

  return fetch(url, {
    ...rest,
    headers,
  });
}
