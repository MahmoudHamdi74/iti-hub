import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for joining a community
 *
 * Round 3 work order §4: joining now sends a join REQUEST (pending admin
 * approval) instead of instantly adding the member. Same endpoint — the
 * server creates a CommunityJoinRequest row.
 *
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useJoinCommunity = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`/communities/${communityId}/join`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate community details to refetch with updated join/pending status
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'join-requests'] });
    },
  });
};

/**
 * Hook for leaving a community
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useLeaveCommunity = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`/communities/${communityId}/leave`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate community details to refetch with updated join status
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

/**
 * Hook for updating community details
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useUpdateCommunity = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const response = await api.patch(`/communities/${communityId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

/**
 * Hook for updating community profile picture
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useUpdateCommunityProfilePicture = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/communities/${communityId}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

/**
 * Hook for updating community cover image
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useUpdateCommunityCoverImage = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/communities/${communityId}/cover-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

/**
 * Hook for adding a moderator to community
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useAddModerator = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.post(`/communities/${communityId}/moderators`, { userId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

/**
 * Hook for removing a moderator from community
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useRemoveModerator = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/communities/${communityId}/moderators/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'members'] });
    },
  });
};

/**
 * Hook for kicking a member from community
 * @param {string} communityId - The community ID
 * @returns {object} React Query mutation object
 */
export const useKickMember = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/communities/${communityId}/members/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'members'] });
    },
  });
};

/**
 * Approve or reject a community join request (owners/moderators)
 * Round 3 work order §4 — legacy-community pending-approval flow.
 */
export const useDecideCommunityJoinRequest = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, decision }) => {
      const response = await api.patch(
        `/communities/join-requests/${requestId}/decision`,
        { decision }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'members'] });
    },
  });
};

/**
 * Cancel the current user's pending community join request
 */
export const useCancelCommunityJoinRequest = (communityId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId) => {
      const response = await api.delete(`/communities/join-requests/${requestId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

export default {
  useJoinCommunity,
  useLeaveCommunity,
  useUpdateCommunity,
  useUpdateCommunityProfilePicture,
  useUpdateCommunityCoverImage,
  useAddModerator,
  useRemoveModerator,
  useKickMember,
  useDecideCommunityJoinRequest,
  useCancelCommunityJoinRequest,
};
