import { useEffect, useRef } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useSession } from 'next-auth/react';

export const useRealtimeNotifications = () => {
  const { addNotification } = useNotification();
  const { data: session } = useSession();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!session?.user?.email) return;

    // Poll for new notifications every 30 seconds
    const pollNotifications = async () => {
      try {
        const response = await fetch('/api/guest/notifications?since=' + lastCheckRef.current);
        if (!response.ok) return;

        const newNotifications = await response.json();
        lastCheckRef.current = Date.now();

        // Add each new notification
        newNotifications.forEach((notification: any) => {
          addNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
          });
        });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Initial fetch
    pollNotifications();

    // Set up polling
    pollingRef.current = setInterval(pollNotifications, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [session?.user?.email, addNotification]);
};

// Alternative WebSocket hook for true real-time (requires backend support)
export const useWebSocketNotifications = () => {
  const { addNotification } = useNotification();
  const { data: session } = useSession();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    // Only use WebSocket in production or if explicitly enabled
    const useWS = process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED === 'true';
    if (!useWS) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/notifications/ws?email=${encodeURIComponent(
        session.user.email
      )}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          addNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
          });
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = () => {
        console.error('WebSocket error');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [session?.user?.email, addNotification]);
};
