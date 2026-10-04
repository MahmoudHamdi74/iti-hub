import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth';
import api from '@lib/api';

/**
 * @fileoverview Hook for fetching notifications with infinite scroll
 */

/**
 * Hook for fetching notifications with pagination
 * 
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult} React Query infinite query object
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isLoading } = useNotifications();
 * 
 * // Access flattened notifications
 * const notifications = data?.pages.flatMap(page => page.data.notifications) || [];
 */
export const useNotifications = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/notifications', {
        params: {
          page: pageParam,
          limit: 20,
        },
      });

      if (import.meta.env.DEV) {
        console.log('[useNotifications] Fetched page:', pageParam, response.data);
      }

      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination?.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds - notifications should be fresh
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Recover missed events when the realtime connection is unavailable.
  });
};

export default useNotifications;
