import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventEmitter } from 'node:events';
import { useAuthStore } from '../src/store/auth';
import { useUnreadCount } from '../src/hooks/queries/useUnreadCount';
import { useUnreadMessagesCount } from '../src/hooks/queries/useUnreadMessagesCount';
import { GlobalMessagingHandler } from '../src/components/messaging/GlobalMessagingHandler';
import { GlobalNotificationHandler } from '../src/components/notifications/GlobalNotificationHandler';
import { useMessagingSocket } from '../src/hooks/socket/useMessagingSocket';
import UnreadBadge from '../src/components/common/UnreadBadge';

const state = vi.hoisted(() => ({ socket: null, messages: 0, notifications: 0 }));
vi.mock('@hooks/socket/useSocket', () => ({ useSocket: () => ({ socket: state.socket, isConnected: false }) }));
vi.mock('@lib/api', () => ({ default: { get: async url => ({ data: { data: { unreadCount: url.startsWith('/notifications') ? state.notifications : state.messages } } }) } }));
function Counts() {
  const messages = useUnreadMessagesCount();
  const notifications = useUnreadCount();
  return <><div data-testid="messages"><UnreadBadge count={messages.data?.data?.unreadCount} /></div><div data-testid="notifications"><UnreadBadge count={notifications.data?.data?.unreadCount} /></div><GlobalMessagingHandler /><GlobalNotificationHandler /></>;
}
afterEach(cleanup);
test('badges recover missing caches, duplicate events and reconnects without count drift', async () => {
  state.socket = new EventEmitter(); state.messages = 0; state.notifications = 0;
  useAuthStore.setState({ isAuthenticated: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><Counts /></QueryClientProvider>);
  await waitFor(() => expect(client.getQueryData(['messages', 'unread-count'])).toBeTruthy());
  expect(screen.getByTestId('messages').textContent).toBe('');
  expect(client.getQueriesData({ queryKey: ['conversations'] })).toEqual([]);
  state.messages = 2;
  act(() => { state.socket.emit('message:new', { conversationId: 'abc' }); state.socket.emit('message:new', { conversationId: 'abc' }); });
  await waitFor(() => expect(screen.getByTestId('messages').textContent).toBe('2'));
  act(() => state.socket.emit('notification:count', { unreadCount: 103 }));
  await waitFor(() => expect(screen.getByTestId('notifications').textContent).toBe('99+'));
  state.messages = 0;
  act(() => state.socket.emit('message:seen', { conversationId: 'abc' }));
  await waitFor(() => expect(screen.getByTestId('messages').textContent).toBe(''));
  state.notifications = 1;
  act(() => state.socket.emit('connect'));
  await waitFor(() => expect(screen.getByTestId('notifications').textContent).toBe('1'));
  client.clear();
});
test('identical message content with different IDs is delivered; duplicate ID is ignored', () => {
  state.socket = new EventEmitter();
  const client = new QueryClient();
  client.setQueryData(['messages', 'abc'], { pages: [{ data: { messages: [{ _id: 'one', content: 'Hello', sender: { _id: 'sender' } }] } }], pageParams: [undefined] });
  function Conversation() { useMessagingSocket('abc'); return null; }
  render(<QueryClientProvider client={client}><Conversation /></QueryClientProvider>);
  const message = { conversationId: 'abc', content: 'Hello', senderId: 'sender', messageId: 'two' };
  act(() => { state.socket.emit('message:new', message); state.socket.emit('message:new', message); });
  expect(client.getQueryData(['messages', 'abc']).pages[0].data.messages.map(m => m._id)).toEqual(['two', 'one']);
  client.clear();
});

test('deleting a notification refreshes the list and clears its unread badge', async () => {
  state.socket = new EventEmitter(); state.notifications = 1;
  useAuthStore.setState({ isAuthenticated: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['notifications', 'list'], { items: ['old-alert'] });
  render(<QueryClientProvider client={client}><Counts /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByTestId('notifications').textContent).toBe('1'));
  state.notifications = 0;
  act(() => state.socket.emit('notification:removed', {}));
  await waitFor(() => expect(screen.getByTestId('notifications').textContent).toBe(''));
  expect(client.getQueryState(['notifications', 'list']).isInvalidated).toBe(true);
  client.clear();
});
