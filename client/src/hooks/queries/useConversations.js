import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth';
import api from '@lib/api';

/**
 * @fileoverview Hook for fetching conversations list with pagination
 */

/**
 * Hook for fetching user's conversations
 * 
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query query object
 * 
 * @example
 * const { data, isLoading, error, refetch } = useConversations({ page: 1 });
 * 
 * // Access conversations
 * const conversations = data?.data?.conversations || [];
 */
export const useConversations = (options = {}) => {
  const { page = 1, limit = 20 } = options;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['conversations', { page, limit }],
    queryFn: async () => {
      const response = await api.get('/conversations', {
        params: {
          page,
          limit,
        },
      });

      if (import.meta.env.DEV) {
        console.log('[useConversations] Fetched conversations:', response.data);
      }

      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 0, // Always fresh - socket handles updates
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Recover missed events when the realtime connection is unavailable.
  });
};

export default useConversations;
