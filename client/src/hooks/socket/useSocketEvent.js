import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

/**
 * @fileoverview Generic hook for listening to Socket.io events
 * Provides automatic cleanup and dependency management
 */

/**
 * Hook for subscribing to socket events with automatic cleanup
 * 
 * @param {string} eventName - Name of the socket event to listen for
 * @param {Function} handler - Event handler function
 * @param {Array} dependencies - React dependencies array for the handler
 * 
 * @example
 * function NotificationsComponent() {
 *   const [notifications, setNotifications] = useState([]);
 *   
 *   const handleNewNotification = useCallback((data) => {
 *     setNotifications(prev => [data.notification, ...prev]);
 *   }, []);
 *   
 *   useSocketEvent('notification:new', handleNewNotification, []);
 * }
 */
export const useSocketEvent = (eventName, handler, dependencies = []) => {
  const { socket } = useSocket();

  // Memoize the handler to prevent unnecessary re-subscriptions
  const memoizedHandler = useCallback(handler, dependencies);

  useEffect(() => {
    if (!socket) {
      if (import.meta.env.DEV) {
        console.log(`[useSocketEvent] Socket not connected, skipping listener for '${eventName}'`);
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`[useSocketEvent] Setting up listener for '${eventName}'`);
    }

    // Setup event listener
    socket.on(eventName, memoizedHandler);

    // Cleanup listener on unmount or when dependencies change
    return () => {
      if (socket) {
        if (import.meta.env.DEV) {
          console.log(`[useSocketEvent] Cleaning up listener for '${eventName}'`);
        }
        socket.off(eventName, memoizedHandler);
      }
    };
  }, [socket, eventName, memoizedHandler]);
};

export default useSocketEvent;
