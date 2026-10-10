import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for reposting a post with optional comment
 * @returns {object} React Query mutation object
 */
export const useRepost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, ...repostData }) => {
      const response = await api.post(`/posts/${postId}/repost`, {
        comment: repostData.comment || undefined,
        communityId: repostData.communityId || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      // Invalidate feed queries to show repost
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export default useRepost;
