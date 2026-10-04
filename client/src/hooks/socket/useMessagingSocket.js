import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from './useSocketEvent';

/**
 * @fileoverview Hook for handling real-time messaging events via WebSocket
 * Listens to socket events and updates React Query cache accordingly
 * 
 * NOTE: This hook handles conversation-specific updates.
 * Global sidebar unread counts are handled by GlobalMessagingHandler.
 */

/**
 * Hook for managing messaging socket events
 * Automatically updates cache when messages are received or seen in real-time
 * 
 * @param {string} [conversationId] - Optional conversation ID to filter events
 * @returns {{ isConnected: boolean, socket: Socket | null }}
 * 
 * @example
 * function ConversationDetail({ conversationId }) {
 *   useMessagingSocket(conversationId); // Setup listeners
 * }
 */
export const useMessagingSocket = (conversationId) => {
  const queryClient = useQueryClient();

  /**
   * Handle new message event
   * Adds message to the beginning of the messages list
   * NOTE: Sidebar unread count is handled by GlobalMessagingHandler
   */
  const handleNewMessage = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[useMessagingSocket] New message received:', data);
      }

      const { conversationId: msgConvId, content, senderId, senderName, senderProfilePicture, image, messageId, timestamp } = data;

      // If listening to specific conversation, filter
      if (conversationId && conversationId !== msgConvId) {
        return;
      }

      // Update messages cache (for ConversationDetail)
      queryClient.setQueryData(['messages', msgConvId], (old) => {
        if (!old || !old.pages || old.pages.length === 0) {
          if (import.meta.env.DEV) {
            console.log('[useMessagingSocket] No existing cache for messages, skipping');
          }
          return old;
        }

        const firstPage = old.pages[0];
        if (!firstPage || !firstPage.data) {
          return old;
        }

        // Check if message already exists (from optimistic update or duplicate event)
        const existingMessage = firstPage.data.messages.find(
          (msg) => msg._id === messageId
        );

        if (existingMessage) {
          if (import.meta.env.DEV) {
            console.log('[useMessagingSocket] Message already in cache, skipping duplicate');
          }
          return old;
        }

        const newMessage = {
          _id: messageId,
          content,
          image,
          sender: {
            _id: senderId,
            username: senderName,
            profilePicture: senderProfilePicture,
          },
          createdAt: timestamp,
          seenBy: [],
        };

        if (import.meta.env.DEV) {
          console.log('[useMessagingSocket] Adding message to cache:', messageId);
        }

        const updatedFirstPage = {
          ...firstPage,
          data: {
            ...firstPage.data,
            messages: [newMessage, ...firstPage.data.messages],
          },
        };

        return {
          ...old,
          pages: [updatedFirstPage, ...old.pages.slice(1)],
        };
      });

      // NOTE: Sidebar unread count and conversations list updates 
      // are handled by GlobalMessagingHandler to avoid double-counting
    },
    [queryClient, conversationId]
  );

  /**
   * Handle message seen event
   * Updates seenBy array for messages
   * NOTE: Sidebar unread count is handled by GlobalMessagingHandler
   */
  const handleMessageSeen = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[useMessagingSocket] Message seen event:', data);
      }

      const { conversationId: msgConvId, userId: seenByUserId, timestamp } = data;

      // If listening to specific conversation, filter
      if (conversationId && conversationId !== msgConvId) {
        return;
      }

      // Update messages cache (add user to seenBy)
      queryClient.setQueryData(['messages', msgConvId], (old) => {
        if (!old || !old.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              messages: page.data.messages.map((message) => {
                // Check if user already in seenBy
                const alreadySeen = message.seenBy?.some((user) => user._id === seenByUserId);
                
                if (alreadySeen) return message;

                // Add user to seenBy
                return {
                  ...message,
                  seenBy: [
                    ...(message.seenBy || []),
                    { _id: seenByUserId, seenAt: timestamp },
                  ],
                };
              }),
            },
          })),
        };
      });

      // NOTE: Sidebar unread count and conversations list updates 
      // are handled by GlobalMessagingHandler to avoid double-counting
    },
    [queryClient, conversationId]
  );

  // Setup socket event listeners
  useSocketEvent('message:new', handleNewMessage, [handleNewMessage]);
  useSocketEvent('message:seen', handleMessageSeen, [handleMessageSeen]);

  return null;
};

export default useMessagingSocket;
