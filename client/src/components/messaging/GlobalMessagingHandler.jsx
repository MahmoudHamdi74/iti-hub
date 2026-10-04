import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@hooks/socket/useSocketEvent';

export function GlobalMessagingHandler() {
  const queryClient = useQueryClient();
  const refresh = useCallback((event) => {
    // Fetch authoritative counts even before the conversations page is visited.
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'], exact: true });
    if (event?.conversationId) {
      queryClient.invalidateQueries({ queryKey: ['messages', event.conversationId], exact: true });
    }
  }, [queryClient]);
  const reconnect = useCallback(() => {
    refresh();
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  }, [queryClient, refresh]);
  useSocketEvent('message:new', refresh, [refresh]);
  useSocketEvent('message:seen', refresh, [refresh]);
  useSocketEvent('connect', reconnect, [reconnect]);
  return null;
}
