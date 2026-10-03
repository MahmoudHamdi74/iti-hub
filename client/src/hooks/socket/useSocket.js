import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@store/auth';
import { useSocketStore } from '@store/socketStore';
import { initializeSocket, disconnectSocket, getSocket } from '@lib/socket';

/**
 * @fileoverview Custom React hook for managing Socket.io connection lifecycle
 * Handles authentication, connection, disconnection, and reconnection
 */

/**
 * Hook for managing WebSocket connection with authentication
 * 
 * @returns {{
 *   socket: import('socket.io-client').Socket | null,
 *   isConnected: boolean,
 *   isReconnecting: boolean,
 *   reconnect: () => void
 * }}
 * 
 * @example
 * function MyComponent() {
 *   const { socket, isConnected, reconnect } = useSocket();
 *   
 *   useEffect(() => {
 *     if (socket?.connected) {
 *       socket.on('notification:new', handleNotification);
 *       return () => socket.off('notification:new', handleNotification);
 *     }
 *   }, [socket]);
 * }
 */
export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socket = useSocketStore((state) => state.socket);
  const connected = useSocketStore((state) => state.connected);
  const reconnecting = useSocketStore((state) => state.reconnecting);

  /**
   * Manual reconnection trigger
   */
  const reconnect = useCallback(() => {
    if (token && isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('[useSocket] Manual reconnection triggered');
      }
      disconnectSocket();
      initializeSocket(token);
    }
  }, [token, isAuthenticated]);

  /**
   * Initialize socket when user is authenticated
   */
  useEffect(() => {
    if (token && isAuthenticated && (!socket || socket.auth?.token !== token)) {
      if (import.meta.env.DEV) {
        console.log('[useSocket] Initializing socket with auth token');
      }
      initializeSocket(token);
    }
  }, [token, isAuthenticated, socket]);

  /**
   * Cleanup socket on logout or unmount
   */
  useEffect(() => {
    if (!token || !isAuthenticated) {
      if (socket) {
        if (import.meta.env.DEV) {
          console.log('[useSocket] User logged out, disconnecting socket');
        }
        disconnectSocket();
      }
    }
  }, [token, isAuthenticated, socket]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      const currentSocket = getSocket();
      if (currentSocket) {
        // Don't disconnect on unmount, only on logout
        // This allows socket to persist across component remounts
        if (import.meta.env.DEV) {
          console.log('[useSocket] Component unmounting, keeping socket alive');
        }
      }
    };
  }, []);

  return {
    socket,
    isConnected: connected,
    isReconnecting: reconnecting,
    reconnect,
  };
};

export default useSocket;
