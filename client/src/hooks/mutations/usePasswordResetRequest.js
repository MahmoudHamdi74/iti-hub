import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Password reset request mutation hook
 * @returns {object} React Query mutation object
 */
export const usePasswordResetRequest = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const response = await api.post('/auth/password-reset/request', { email }, { timeout: 45000 });
      return response;
    },
  });
};

export default usePasswordResetRequest;
