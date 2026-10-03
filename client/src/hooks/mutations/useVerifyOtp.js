import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Verify the 6-digit OTP emailed after registration (work order item 3).
 * POST /auth/verify-otp { email, otp } → { token, user } (auto-login).
 */
export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async ({ email, otp }) => {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response;
    },
  });
};

/**
 * Resend the verification OTP. POST /auth/resend-otp { email }.
 * The server always answers generically (never reveals if the email exists).
 */
export const useResendOtp = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const response = await api.post('/auth/resend-otp', { email });
      return response;
    },
  });
};
