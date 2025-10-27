import { useState, useEffect } from 'react';

interface UseNotificationPermissionReturn {
  permission: NotificationPermission | null;
  requestPermission: () => Promise<NotificationPermission>;
  isRequesting: boolean;
}

export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check initial permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    } else {
      // Notifications not supported
      setPermission('denied');
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    setIsRequesting(true);
    try {
      if (!('Notification' in window)) {
        console.warn('[Notification] Notifications not supported in this browser');
        return 'denied';
      }

      // Check if already granted or denied
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        setPermission(Notification.permission);
        return Notification.permission;
      }

      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('[Notification] Error requesting permission:', error);
      return 'denied';
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    permission,
    requestPermission,
    isRequesting,
  };
}
