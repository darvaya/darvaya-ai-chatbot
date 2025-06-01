import { useState, useEffect } from 'react';

interface CSRFState {
  token: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCSRF() {
  const [state, setState] = useState<CSRFState>({
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf');
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        setState({
          token: data.csrfToken,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          token: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchToken();
  }, []);

  const refreshToken = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch('/api/auth/csrf');
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setState({
        token: data.csrfToken,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  };

  return {
    ...state,
    refreshToken,
  };
}
