import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';
const invalidateConnectionViews = queryClient => Promise.all(
  ['userProfile', 'userPosts', 'posts', 'post', 'community', 'globalSearch', 'search', 'feed']
    .map(key => queryClient.invalidateQueries({ queryKey: [key] }))
);


/**
 * Follow a user
 * Backend: POST /users/:userId/follow
 * Params: userId in URL
 */
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.post(`/users/${userId}/follow`);
      return response.data;
    },
    onSuccess: () => invalidateConnectionViews(queryClient),
  });
};

/**
 * Unfollow a user
 * Backend: DELETE /users/:userId/follow
 * Params: userId in URL
 */
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/users/${userId}/follow`);
      return response.data;
    },
    onSuccess: () => invalidateConnectionViews(queryClient),
  });
};

/**
 * Block a user
 * Backend: POST /users/:userId/block
 * Params: userId in URL
 * Note: Blocking automatically removes any follow relationships
 */
export const useBlockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.post(`/users/${userId}/block`);
      return response.data;
    },
    onSuccess: () => invalidateConnectionViews(queryClient),
  });
};

/**
 * Unblock a user
 * Backend: DELETE /users/:userId/block
 * Params: userId in URL
 */
export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/users/${userId}/block`);
      return response.data;
    },
    onSuccess: () => invalidateConnectionViews(queryClient),
  });
};

/**
 * Toggle follow - automatically follows or unfollows
 */
export const useToggleFollow = () => {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  
  const toggleFollow = async (userId, isCurrentlyFollowing) => {
    if (isCurrentlyFollowing) {
      return unfollowMutation.mutateAsync(userId);
    } else {
      return followMutation.mutateAsync(userId);
    }
  };
  
  return {
    toggleFollow,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    error: followMutation.error || unfollowMutation.error,
  };
};

/**
 * Toggle block - automatically blocks or unblocks
 */
export const useToggleBlock = () => {
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  
  const toggleBlock = async (userId, isCurrentlyBlocked) => {
    if (isCurrentlyBlocked) {
      return unblockMutation.mutateAsync(userId);
    } else {
      return blockMutation.mutateAsync(userId);
    }
  };
  
  return {
    toggleBlock,
    isLoading: blockMutation.isPending || unblockMutation.isPending,
    error: blockMutation.error || unblockMutation.error,
  };
};
