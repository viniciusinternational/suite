import { io, Socket } from 'socket.io-client';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  permission: 'granted' | 'denied' | 'default';
}

export interface UserRegistrationData {
  userEmail: string;
  userId?: string;
}

export interface SendNotificationData {
  targetUserEmail: string;
  title: string;
  body: string;
  type?: string;
  metadata?: any;
}

export interface BroadcastNotificationData {
  title: string;
  body: string;
  type?: string;
  metadata?: any;
}

export interface QueueStatus {
  messageCount: number;
  consumerCount: number;
  timestamp: string;
}

export interface OnlineUser {
  email: string;
  userId?: string;
  connectedAt: string;
}

class NotificationService {
  private socket: Socket | null = null;
  private isConnected = false;
  private notificationQueue: NotificationData[] = [];
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private userEmail: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  /**
   * Initialize the service worker for background notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'NOTIFICATION_CLICKED') {
            this.handleNotificationClick(event.data.notification);
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): 'granted' | 'denied' | 'default' {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Connect to Socket.IO server
   */
  connectToSocket(url: string, options?: any): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      ...options
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      this.isConnected = true;
      this.processNotificationQueue();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      this.isConnected = false;
    });

    this.socket.on('notification', (data: NotificationData) => {
      this.showNotification(data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket.IO error:', error);
    });

    // Handle user registration response
    this.socket.on('user-registered', (data: any) => {
      console.log('User registered successfully:', data);
      // Emit custom event for other parts of the app
      const event = new CustomEvent('user-registered', { detail: data });
      window.dispatchEvent(event);
    });

    // Handle notification sent response
    this.socket.on('notification-sent', (data: any) => {
      console.log('Notification sent:', data);
      const event = new CustomEvent('notification-sent', { detail: data });
      window.dispatchEvent(event);
    });

    // Handle broadcast sent response
    this.socket.on('broadcast-sent', (data: any) => {
      console.log('Broadcast sent:', data);
      const event = new CustomEvent('broadcast-sent', { detail: data });
      window.dispatchEvent(event);
    });

    // Handle queue status response
    this.socket.on('queue-status', (data: any) => {
      console.log('Queue status:', data);
      const event = new CustomEvent('queue-status', { detail: data });
      window.dispatchEvent(event);
    });

    // Handle queue purged response
    this.socket.on('queue-purged', (data: any) => {
      console.log('Queue purged:', data);
      const event = new CustomEvent('queue-purged', { detail: data });
      window.dispatchEvent(event);
    });

    // Handle online users response
    this.socket.on('online-users', (data: any) => {
      console.log('Online users:', data);
      const event = new CustomEvent('online-users', { detail: data });
      window.dispatchEvent(event);
    });

    // Handle user online/offline events
    this.socket.on('user-online', (data: any) => {
      console.log('User online:', data);
      const event = new CustomEvent('user-online', { detail: data });
      window.dispatchEvent(event);
    });

    this.socket.on('user-offline', (data: any) => {
      console.log('User offline:', data);
      const event = new CustomEvent('user-offline', { detail: data });
      window.dispatchEvent(event);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userEmail = null;
      this.userId = null;
    }
  }

  /**
   * Register user with the notification service
   */
  registerUser(data: UserRegistrationData): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot register user');
      return;
    }

    this.socket.emit('register-user', data);
    this.userEmail = data.userEmail;
    this.userId = data.userId || null;
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(data: SendNotificationData): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot send notification');
      return;
    }

    this.socket.emit('send-notification', data);
  }

  /**
   * Send direct message to specific user
   */
  sendDirectMessage(targetUserEmail: string, message: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot send direct message');
      return;
    }

    this.socket.emit('send-direct-message', {
      targetUserEmail,
      message
    });
  }

  /**
   * Broadcast notification to all users
   */
  broadcastNotification(data: BroadcastNotificationData): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot broadcast notification');
      return;
    }

    this.socket.emit('broadcast-notification', data);
  }

  /**
   * Get queue status for current user
   */
  getQueueStatus(): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot get queue status');
      return;
    }

    this.socket.emit('get-queue-status');
  }

  /**
   * Purge queue for current user
   */
  purgeQueue(): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot purge queue');
      return;
    }

    this.socket.emit('purge-queue');
  }

  /**
   * Get online users
   */
  getOnlineUsers(): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot get online users');
      return;
    }

    this.socket.emit('get-online-users');
  }

  /**
   * Show a browser notification
   */
  async showNotification(data: NotificationData): Promise<void> {
    const permission = this.getPermissionStatus();
    
    if (permission !== 'granted') {
      // Queue notification for later if permission not granted
      this.notificationQueue.push(data);
      return;
    }

    try {
      if (this.serviceWorkerRegistration) {
        // Use service worker for better control
        await this.serviceWorkerRegistration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/logo.svg',
          badge: data.badge,
          tag: data.tag,
          data: data.data,
          requireInteraction: data.requireInteraction,
          silent: data.silent
        });
      } else {
        // Fallback to direct notification
        const notification = new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/logo.svg',
          badge: data.badge,
          tag: data.tag,
          data: data.data,
          requireInteraction: data.requireInteraction,
          silent: data.silent
        });

        notification.onclick = () => {
          this.handleNotificationClick(data);
          notification.close();
        };
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Process queued notifications when permission is granted
   */
  private processNotificationQueue(): void {
    if (this.getPermissionStatus() === 'granted') {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        if (notification) {
          this.showNotification(notification);
        }
      }
    }
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(notification: NotificationData): void {
    // Emit custom event for other parts of the app to listen to
    const event = new CustomEvent('notification-clicked', {
      detail: notification
    });
    window.dispatchEvent(event);

    // Focus the window if it's not focused
    if (window.document.hasFocus()) {
      window.focus();
    }

    // Handle specific notification types
    if (notification.data?.type) {
      switch (notification.data.type) {
        case 'project_update':
          // Navigate to project details
          window.location.href = `/projects/${notification.data.projectId}`;
          break;
        case 'approval_request':
          // Navigate to approvals page
          window.location.href = '/approvals';
          break;
        case 'payment_alert':
          // Navigate to payments page
          window.location.href = '/payments';
          break;
        default:
          // Default behavior - focus the window
          window.focus();
      }
    }
  }

  /**
   * Close all notifications
   */
  closeAllNotifications(): void {
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }

  /**
   * Check if service worker is ready
   */
  isServiceWorkerReady(): boolean {
    return this.serviceWorkerRegistration !== null;
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current user email
   */
  getCurrentUserEmail(): string | null {
    return this.userEmail;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Types are already exported as interfaces above
