import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth';
import api from '@lib/api';

/**
 * @fileoverview Hook for fetching unread messages count
 */

/**
 * Hook for fetching unread messages count
 * 
 * @returns {import('@tanstack/react-query').UseQueryResult<{unreadCount: number}>} React Query query object
 * 
 * @example
 * const { data, isLoading, refetch } = useUnreadMessagesCount();
 * const unreadCount = data?.data?.unreadCount || 0;
 */
export const useUnreadMessagesCount = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: async () => {
      const response = await api.get('/conversations/unread/count');
      if (import.meta.env.DEV) {
        console.log('[useUnreadMessagesCount] Fetched count:', response.data);
      }
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 0, // Always fresh - will be updated via socket
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Recover missed events when the realtime connection is unavailable.
  });
};

export default useUnreadMessagesCount;
