import { useEffect, useState, useCallback } from 'react';
import { 
  notificationService, 
  type NotificationData,
  type UserRegistrationData,
  type SendNotificationData,
  type BroadcastNotificationData,
  type QueueStatus,
  type OnlineUser
} from '@/components/globals/notification';

export interface UseNotificationsReturn {
  // Permission management
  permission: 'granted' | 'denied' | 'default';
  requestPermission: () => Promise<'granted' | 'denied' | 'default'>;
  
  // Connection status
  isConnected: boolean;
  isServiceWorkerReady: boolean;
  
  // Socket connection
  connectToSocket: (url: string, options?: any) => void;
  disconnect: () => void;
  
  // User management
  registerUser: (data: UserRegistrationData) => void;
  getCurrentUserEmail: () => string | null;
  getCurrentUserId: () => string | null;
  
  // Notification actions
  showNotification: (data: NotificationData) => Promise<void>;
  sendNotificationToUser: (data: SendNotificationData) => void;
  sendDirectMessage: (targetUserEmail: string, message: string) => void;
  broadcastNotification: (data: BroadcastNotificationData) => void;
  closeAllNotifications: () => void;
  
  // Queue management
  getQueueStatus: () => void;
  purgeQueue: () => void;
  
  // User tracking
  getOnlineUsers: () => void;
  
  // Event handlers
  onNotificationClick: (callback: (notification: NotificationData) => void) => () => void;
  onNotificationClose: (callback: (notification: NotificationData) => void) => () => void;
  onUserRegistered: (callback: (data: any) => void) => () => void;
  onNotificationSent: (callback: (data: any) => void) => () => void;
  onBroadcastSent: (callback: (data: any) => void) => () => void;
  onQueueStatus: (callback: (data: any) => void) => () => void;
  onQueuePurged: (callback: (data: any) => void) => () => void;
  onOnlineUsers: (callback: (data: any) => void) => () => void;
  onUserOnline: (callback: (data: any) => void) => () => void;
  onUserOffline: (callback: (data: any) => void) => () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isConnected, setIsConnected] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  // Update permission status
  const updatePermissionStatus = useCallback(() => {
    setPermission(notificationService.getPermissionStatus());
  }, []);

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    setIsConnected(notificationService.isSocketConnected());
    setIsServiceWorkerReady(notificationService.isServiceWorkerReady());
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<'granted' | 'denied' | 'default'> => {
    try {
      const result = await notificationService.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Connect to socket
  const connectToSocket = useCallback((url: string, options?: any) => {
    notificationService.connectToSocket(url, options);
    updateConnectionStatus();
  }, [updateConnectionStatus]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    notificationService.disconnect();
    updateConnectionStatus();
  }, [updateConnectionStatus]);

  // Register user
  const registerUser = useCallback((data: UserRegistrationData) => {
    notificationService.registerUser(data);
  }, []);

  // Get current user email
  const getCurrentUserEmail = useCallback(() => {
    return notificationService.getCurrentUserEmail();
  }, []);

  // Get current user ID
  const getCurrentUserId = useCallback(() => {
    return notificationService.getCurrentUserId();
  }, []);

  // Show notification
  const showNotification = useCallback(async (data: NotificationData): Promise<void> => {
    await notificationService.showNotification(data);
  }, []);

  // Send notification to user
  const sendNotificationToUser = useCallback((data: SendNotificationData) => {
    notificationService.sendNotificationToUser(data);
  }, []);

  // Send direct message
  const sendDirectMessage = useCallback((targetUserEmail: string, message: string) => {
    notificationService.sendDirectMessage(targetUserEmail, message);
  }, []);

  // Broadcast notification
  const broadcastNotification = useCallback((data: BroadcastNotificationData) => {
    notificationService.broadcastNotification(data);
  }, []);

  // Close all notifications
  const closeAllNotifications = useCallback(() => {
    notificationService.closeAllNotifications();
  }, []);

  // Get queue status
  const getQueueStatus = useCallback(() => {
    notificationService.getQueueStatus();
  }, []);

  // Purge queue
  const purgeQueue = useCallback(() => {
    notificationService.purgeQueue();
  }, []);

  // Get online users
  const getOnlineUsers = useCallback(() => {
    notificationService.getOnlineUsers();
  }, []);

  // Set up notification click handler
  const onNotificationClick = useCallback((callback: (notification: NotificationData) => void) => {
    const handleClick = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('notification-clicked', handleClick as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('notification-clicked', handleClick as EventListener);
    };
  }, []);

  // Set up notification close handler
  const onNotificationClose = useCallback((callback: (notification: NotificationData) => void) => {
    const handleClose = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('notification-closed', handleClose as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('notification-closed', handleClose as EventListener);
    };
  }, []);

  // Set up user registered handler
  const onUserRegistered = useCallback((callback: (data: any) => void) => {
    const handleUserRegistered = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('user-registered', handleUserRegistered as EventListener);
    
    return () => {
      window.removeEventListener('user-registered', handleUserRegistered as EventListener);
    };
  }, []);

  // Set up notification sent handler
  const onNotificationSent = useCallback((callback: (data: any) => void) => {
    const handleNotificationSent = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('notification-sent', handleNotificationSent as EventListener);
    
    return () => {
      window.removeEventListener('notification-sent', handleNotificationSent as EventListener);
    };
  }, []);

  // Set up broadcast sent handler
  const onBroadcastSent = useCallback((callback: (data: any) => void) => {
    const handleBroadcastSent = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('broadcast-sent', handleBroadcastSent as EventListener);
    
    return () => {
      window.removeEventListener('broadcast-sent', handleBroadcastSent as EventListener);
    };
  }, []);

  // Set up queue status handler
  const onQueueStatus = useCallback((callback: (data: any) => void) => {
    const handleQueueStatus = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('queue-status', handleQueueStatus as EventListener);
    
    return () => {
      window.removeEventListener('queue-status', handleQueueStatus as EventListener);
    };
  }, []);

  // Set up queue purged handler
  const onQueuePurged = useCallback((callback: (data: any) => void) => {
    const handleQueuePurged = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('queue-purged', handleQueuePurged as EventListener);
    
    return () => {
      window.removeEventListener('queue-purged', handleQueuePurged as EventListener);
    };
  }, []);

  // Set up online users handler
  const onOnlineUsers = useCallback((callback: (data: any) => void) => {
    const handleOnlineUsers = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('online-users', handleOnlineUsers as EventListener);
    
    return () => {
      window.removeEventListener('online-users', handleOnlineUsers as EventListener);
    };
  }, []);

  // Set up user online handler
  const onUserOnline = useCallback((callback: (data: any) => void) => {
    const handleUserOnline = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('user-online', handleUserOnline as EventListener);
    
    return () => {
      window.removeEventListener('user-online', handleUserOnline as EventListener);
    };
  }, []);

  // Set up user offline handler
  const onUserOffline = useCallback((callback: (data: any) => void) => {
    const handleUserOffline = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('user-offline', handleUserOffline as EventListener);
    
    return () => {
      window.removeEventListener('user-offline', handleUserOffline as EventListener);
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    updatePermissionStatus();
    updateConnectionStatus();

    // Set up periodic status checks
    const interval = setInterval(() => {
      updateConnectionStatus();
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [updatePermissionStatus, updateConnectionStatus]);

  return {
    permission,
    requestPermission,
    isConnected,
    isServiceWorkerReady,
    connectToSocket,
    disconnect,
    registerUser,
    getCurrentUserEmail,
    getCurrentUserId,
    showNotification,
    sendNotificationToUser,
    sendDirectMessage,
    broadcastNotification,
    closeAllNotifications,
    getQueueStatus,
    purgeQueue,
    getOnlineUsers,
    onNotificationClick,
    onNotificationClose,
    onUserRegistered,
    onNotificationSent,
    onBroadcastSent,
    onQueueStatus,
    onQueuePurged,
    onOnlineUsers,
    onUserOnline,
    onUserOffline
  };
}; 