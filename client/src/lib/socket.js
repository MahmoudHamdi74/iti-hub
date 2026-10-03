import { io } from 'socket.io-client';
import { useSocketStore } from '@store/socketStore';

/**
 * @fileoverview WebSocket connection utility for Socket.io client
 * Manages socket lifecycle, authentication, and reconnection strategies
 */

/** @type {import('socket.io-client').Socket | null} */
let socketInstance = null;

/**
 * Initialize Socket.io connection with authentication
 * 
 * @param {string} authToken - JWT authentication token
 * @returns {import('socket.io-client').Socket} Socket instance
 * 
 * @example
 * const socket = initializeSocket(token);
 * socket.on('notification:new', handleNotification);
 */
export const initializeSocket = (authToken) => {
  // If socket already exists and is connected, return it
  if (socketInstance && socketInstance.auth?.token === authToken) {
    if (import.meta.env.DEV) {
      console.log('[Socket] Already connected, reusing existing socket');
    }
    return socketInstance;
  }

  // Clean up existing disconnected socket
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.close();
  }

  const socketURL = import.meta.env.VITE_SOCKET_URL || new URL(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030',
    window.location.origin,
  ).origin;

  if (import.meta.env.DEV) {
    console.log('[Socket] Initializing connection to:', socketURL);
  }

  // Create new socket instance
  socketInstance = io(socketURL, {
    auth: {
      token: authToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  // Connection lifecycle handlers
  socketInstance.on('connect', () => {
    if (import.meta.env.DEV) {
      console.log('[Socket] Connected successfully', socketInstance.id);
    }
    useSocketStore.getState().setConnected(true);
    useSocketStore.getState().setReconnecting(false);
  });

  socketInstance.on('disconnect', (reason) => {
    if (import.meta.env.DEV) {
      console.log('[Socket] Disconnected:', reason);
    }
    useSocketStore.getState().setConnected(false);
  });

  socketInstance.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    useSocketStore.getState().setConnected(false);
  });

  socketInstance.io.on('reconnect_attempt', (attemptNumber) => {
    if (import.meta.env.DEV) {
      console.log(`[Socket] Reconnection attempt #${attemptNumber}`);
    }
    useSocketStore.getState().setReconnecting(true);
  });

  socketInstance.io.on('reconnect', (attemptNumber) => {
    if (import.meta.env.DEV) {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
    }
    useSocketStore.getState().setConnected(true);
    useSocketStore.getState().setReconnecting(false);
  });

  socketInstance.io.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed after maximum attempts');
    useSocketStore.getState().setConnected(false);
    useSocketStore.getState().setReconnecting(false);
  });

  // Update store with socket instance
  useSocketStore.getState().setSocket(socketInstance);

  return socketInstance;
};

/**
 * Disconnect and cleanup socket connection
 * 
 * @example
 * disconnectSocket(); // Clean disconnect on logout
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    if (import.meta.env.DEV) {
      console.log('[Socket] Disconnecting...');
    }
    
    socketInstance.removeAllListeners();
    socketInstance.close();
    socketInstance = null;
    
    useSocketStore.getState().setSocket(null);
    useSocketStore.getState().setConnected(false);
    useSocketStore.getState().setReconnecting(false);
  }
};

/**
 * Get current socket instance
 * 
 * @returns {import('socket.io-client').Socket | null} Current socket instance or null
 * 
 * @example
 * const socket = getSocket();
 * if (socket?.connected) {
 *   socket.emit('message:send', data);
 * }
 */
export const getSocket = () => socketInstance;

/**
 * Check if socket is connected
 * 
 * @returns {boolean} True if socket is connected
 * 
 * @example
 * if (isSocketConnected()) {
 *   // Perform real-time operation
 * }
 */
export const isSocketConnected = () => {
  return socketInstance?.connected || false;
};

export default {
  initializeSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
};
