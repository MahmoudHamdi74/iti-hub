import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';
import { useAuthStore } from '@store/auth';

/**
 * Hook for creating a new post
 * Handles multipart/form-data for image uploads
 * @returns {object} React Query mutation object
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (postData) => {
      const formData = new FormData();

      // Add text content
      if (postData.content) {
        formData.append('content', postData.content);
      }

      // Add images
      if (postData.images && postData.images.length > 0) {
        postData.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      // Add tags
      if (postData.tags && postData.tags.length > 0) {
        postData.tags.forEach((tag) => {
          formData.append('tags', tag);
        });
      }

      // Add community
      if (postData.communityId) {
        formData.append('community', postData.communityId);
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      // Invalidate all feed queries to show new post
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      
      // If post was created in a community, invalidate community feed
      if (variables.communityId) {
        queryClient.invalidateQueries({ 
          queryKey: ['community', variables.communityId, 'feed'] 
        });
      }
      
      // Invalidate current user's posts to show new post on their profile
      if (currentUser?._id) {
        queryClient.invalidateQueries({ 
          queryKey: ['userPosts', currentUser._id] 
        });
      }
    },
  });
};

export default useCreatePost;
