import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth';
import api from '@lib/api';
import toast from 'react-hot-toast';

/**
 * @fileoverview Mutation hook for sending messages with optimistic updates
 */

/**
 * Hook for sending messages in a conversation
 * Includes optimistic update and image upload support
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation object
 * 
 * @example
 * const sendMessage = useSendMessage();
 * 
 * sendMessage.mutate({
 *   conversationId: 'conv-123',
 *   content: 'Hello!',
 *   image: fileObject // optional
 * });
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async ({ conversationId, content, image, replyTo }) => {
      // Validate at least one field is provided
      if (!content && !image) {
        throw new Error('Either content or image must be provided');
      }

      const formData = new FormData();
      if (replyTo?._id) formData.append('replyTo', replyTo._id);
      
      if (content) {
        formData.append('content', content);
      }
      
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post(
        `/conversations/${conversationId}/messages`,
        formData,
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (import.meta.env.DEV) {
        console.log('[useSendMessage] Message sent:', response.data);
      }

      return response.data;
    },
    
    // Optimistic update
    onMutate: async ({ conversationId, content, image, replyTo }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);

      // Create temporary message
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content,
        replyTo,
        image: image ? URL.createObjectURL(image) : null,
        sender: {
          _id: currentUser._id,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture,
        },
        createdAt: new Date().toISOString(),
        status: 'sending',
        isTemp: true,
      };

      // Optimistically add message to cache
      queryClient.setQueryData(['messages', conversationId], (old) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return old;
        }

        const firstPage = old.pages[0];
        const updatedFirstPage = {
          ...firstPage,
          data: {
            ...firstPage.data,
            messages: [tempMessage, ...(firstPage.data.messages || [])],
          },
        };

        return {
          ...old,
          pages: [updatedFirstPage, ...old.pages.slice(1)],
        };
      });

      return { previousMessages, tempMessage };
    },

    onSuccess: (data, variables) => {
      const { conversationId } = variables;

      // Invalidate messages to get real message from server
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });

      // Update conversations list (lastMessage)
      queryClient.setQueryData(['conversations'], (old) => {
        if (!old || !old.data) return old;

        return {
          ...old,
          data: {
            ...old.data,
            conversations: old.data.conversations.map((conv) =>
              conv._id === conversationId
                ? {
                    ...conv,
                    lastMessage: data.data.message,
                    updatedAt: data.data.message.createdAt,
                  }
                : conv
            ),
          },
        };
      });

      if (import.meta.env.DEV) {
        console.log('[useSendMessage] Success, cache updated');
      }
    },

    onError: (error, variables, context) => {
      const { conversationId } = variables;

      // Rollback optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }

      // Mark temp message as failed
      if (context?.tempMessage) {
        queryClient.setQueryData(['messages', conversationId], (old) => {
          if (!old || !old.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page, index) => {
              if (index !== 0) return page;

              return {
                ...page,
                data: {
                  ...page.data,
                  messages: page.data.messages.map((msg) =>
                    msg._id === context.tempMessage._id
                      ? { ...msg, status: 'failed' }
                      : msg
                  ),
                },
              };
            }),
          };
        });
      }

      toast.error(error.response?.data?.error?.message || 'Failed to send message');

      if (import.meta.env.DEV) {
        console.error('[useSendMessage] Error:', error);
      }
    },
  });
};

export default useSendMessage;
