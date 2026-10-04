import { useQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Get user profile by username
 * @param {string} username - Username to fetch
 */
export const useGetUserProfile = (username) => {
  return useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      const response = await api.get(`/users/${username}`);
      return response.data;
    },
    enabled: !!username,
    staleTime: 0, // Relationship flags may have changed since the last visit.
    retry: 2,
  });
};

/**
 * Get user posts by userId (not username)
 * @param {string} userId - User ID to fetch posts for
 * @param {number} page - Page number for pagination
 */
export const useGetUserPosts = (userId, page = 1) => {
  return useQuery({
    queryKey: ['userPosts', userId, page],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/posts`, {
        params: { page },
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  });
};

/**
 * Get user followers
 * @param {string} userId - User ID
 */
export const useGetUserFollowers = (userId) => {
  return useQuery({
    queryKey: ['userFollowers', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/followers`);
      return response.data;
    },
    enabled: !!userId,
  });
};

/**
 * Get user following
 * @param {string} userId - User ID
 */
export const useGetUserFollowing = (userId) => {
  return useQuery({
    queryKey: ['userFollowing', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/following`);
      return response.data;
    },
    enabled: !!userId,
  });
};
