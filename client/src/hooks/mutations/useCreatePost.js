import { useRef } from 'react';
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
  const attempt = useRef(null);
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (postData) => {
      const fingerprint = JSON.stringify({ ...postData, images: postData.images?.map(f => [f.name, f.size, f.lastModified]) });
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, id: crypto.randomUUID() };
      const requestId = attempt.current.id;
      const formData = new FormData();
      formData.append('clientRequestId', requestId);

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

      let response;
      try { response = await api.post('/posts', formData, {
        timeout: 60000,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      } catch (error) {
        if (!error.response || error.response.status >= 500) {
          try { response = await api.get('/posts/requests/' + requestId); }
          catch { error.deliveryUncertain = true; throw error; }
        } else throw error;
      }
      attempt.current = null;
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
