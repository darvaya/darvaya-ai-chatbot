import type { NetworkRequest } from './context';

export class NetworkInterceptor {
  private static instance: NetworkInterceptor;
  private onRequestCallback: ((request: NetworkRequest) => void) | null = null;

  private constructor() {
    this.interceptFetch();
  }

  static getInstance(): NetworkInterceptor {
    if (!NetworkInterceptor.instance) {
      NetworkInterceptor.instance = new NetworkInterceptor();
    }
    return NetworkInterceptor.instance;
  }

  setRequestCallback(callback: (request: NetworkRequest) => void) {
    this.onRequestCallback = callback;
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request: NetworkRequest = {
        id: crypto.randomUUID(),
        url:
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
        method: init?.method || 'GET',
        startTime: new Date(),
        request: {
          headers: init?.headers
            ? Object.fromEntries(new Headers(init.headers).entries())
            : {},
          body: init?.body,
        },
      };

      try {
        const response = await originalFetch(input, init);
        const responseClone = response.clone();
        let responseBody: unknown;

        try {
          responseBody = await responseClone.json();
        } catch {
          responseBody = await responseClone.text();
        }

        const endTime = new Date();
        const networkRequest: NetworkRequest = {
          ...request,
          status: response.status,
          endTime,
          duration: endTime.getTime() - request.startTime.getTime(),
          response: {
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
          },
        };

        self.onRequestCallback?.(networkRequest);
        return response;
      } catch (error) {
        const endTime = new Date();
        const networkRequest: NetworkRequest = {
          ...request,
          endTime,
          duration: endTime.getTime() - request.startTime.getTime(),
          status: 0,
          response: {
            body: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        };

        self.onRequestCallback?.(networkRequest);
        throw error;
      }
    };
  }
}

export function initializeNetworkInterceptor(
  callback: (request: NetworkRequest) => void,
) {
  if (typeof window !== 'undefined') {
    const interceptor = NetworkInterceptor.getInstance();
    interceptor.setRequestCallback(callback);
  }
}
