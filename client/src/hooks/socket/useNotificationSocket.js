import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from './useSocketEvent';

export const useNotificationSocket = () => {
  const queryClient = useQueryClient();
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);
  const updateCount = useCallback(({ unreadCount }) => {
    if (!Number.isFinite(unreadCount)) return;
    queryClient.setQueryData(['notifications', 'unread-count'], (old) => ({
      ...old, data: { ...old?.data, unreadCount: Math.max(0, unreadCount) },
    }));
  }, [queryClient]);
  useSocketEvent('notification:new', refresh, [refresh]);
  useSocketEvent('notification:update', refresh, [refresh]);
  useSocketEvent('notification:read', refresh, [refresh]);
  useSocketEvent('notification:count', updateCount, [updateCount]);
  useSocketEvent('connect', refresh, [refresh]);
};
export default useNotificationSocket;
