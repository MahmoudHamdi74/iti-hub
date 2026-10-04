import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth';
import api from '@lib/api';

/**
 * @fileoverview Hook for fetching messages with cursor-based pagination
 */

/**
 * Hook for fetching conversation messages with infinite scroll
 * Uses cursor-based pagination for efficient loading
 * 
 * @param {string} conversationId - ID of the conversation
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Messages per page
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult} React Query infinite query object
 * 
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isLoading,
 *   isFetchingNextPage
 * } = useMessages('conv-123');
 * 
 * // Access all messages
 * const messages = data?.pages.flatMap(page => page.data.messages) || [];
 */
export const useMessages = (conversationId, options = {}) => {
  const { limit = 20 } = options;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const response = await api.get(`/conversations/${conversationId}/messages`, {
        params: {
          cursor: pageParam, // undefined for first page
          limit,
        },
      });

      if (import.meta.env.DEV) {
        console.log('[useMessages] Fetched messages:', {
          conversationId,
          cursor: pageParam,
          count: response.data.data.messages.length,
        });
      }

      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // Backend returns hasMore and cursor (not pagination.hasNextPage)
      const data = lastPage.data;
      const hasMore = data?.hasMore;
      const cursor = data?.cursor;
      
      if (import.meta.env.DEV) {
        console.log('[useMessages] getNextPageParam:', {
          hasMore,
          cursor,
          messagesCount: data?.messages?.length
        });
      }

      // If there are more messages, return the cursor
      return hasMore ? cursor : undefined;
    },
    initialPageParam: undefined,
    enabled: !!conversationId && isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds - messages are fairly static, socket handles real-time updates
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Recover missed events when the realtime connection is unavailable.
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export default useMessages;
