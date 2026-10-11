import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for deleting a post
 * @returns {object} React Query mutation object
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }) => {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      // Invalidate all feed and post queries
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // If post was in a community, invalidate community feed
      if (variables.communityId) {
        queryClient.invalidateQueries({ 
          queryKey: ['community', variables.communityId, 'feed'] 
        });
      }
      
      // Invalidate the post author's profile posts
      if (variables.authorId) {
        queryClient.invalidateQueries({ 
          queryKey: ['userPosts', variables.authorId] 
        });
      }
    },
  });
};

export default useDeletePost;
