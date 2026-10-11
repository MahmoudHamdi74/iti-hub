import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth';

const TOKEN_EXPIRED_CODES = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED'];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      networkMode: 'always',
      retry: (count, error) => count < 1 && !!error.response && error.response.status >= 500,
      refetchOnWindowFocus: false,
      onError: (error) => {
        // Check for token expiration errors
        const errorCode = error?.response?.data?.error?.code;
        if (errorCode && TOKEN_EXPIRED_CODES.includes(errorCode)) {
          console.log('[QueryClient] Token expired, logging out');
          useAuthStore.getState().logout();
        }
      },
    },
    mutations: {
      networkMode: 'always',
      retry: 0,
      onError: (error) => {
        // Check for token expiration errors
        const errorCode = error?.response?.data?.error?.code;
        if (errorCode && TOKEN_EXPIRED_CODES.includes(errorCode)) {
          console.log('[QueryClient] Token expired, logging out');
          useAuthStore.getState().logout();
        }
      },
    },
  },
});

// Make queryClient available globally for authStore logout
if (typeof window !== 'undefined') {
  window.__queryClient = queryClient;
}

export default queryClient;
