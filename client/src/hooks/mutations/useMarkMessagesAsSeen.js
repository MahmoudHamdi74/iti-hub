import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

export const useMarkMessagesAsSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId }) => {
      const response = await api.put(`/conversations/${conversationId}/seen`);
      return response.data;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId], exact: true });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
export default useMarkMessagesAsSeen;
