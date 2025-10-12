import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/hooks/use-notifications';
import type { NotificationData } from '@/components/globals/notification';

interface NotificationManagerProps {
  socketUrl?: string;
  onNotificationClick?: (notification: NotificationData) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  socketUrl = 'https://mail.viniciusint.com',
  onNotificationClick
}) => {
  const {
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
    onNotificationClick: handleNotificationClick,
    onUserRegistered,
    onNotificationSent,
    onBroadcastSent,
    onQueueStatus,
    onQueuePurged,
    onOnlineUsers
  } = useNotifications();

  const [testNotification, setTestNotification] = useState<NotificationData>({
    id: Date.now().toString(),
    title: 'Test Notification',
    body: 'This is a test notification from ViniSuite',
    icon: '/logo.svg',
    data: {
      type: 'test',
      timestamp: Date.now()
    }
  });

  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [autoConnect, setAutoConnect] = useState(false);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Handle notification clicks
  useEffect(() => {
    if (onNotificationClick) {
      const cleanup = handleNotificationClick(onNotificationClick);
      return cleanup;
    }
  }, [handleNotificationClick, onNotificationClick]);

  // Auto-connect to socket
  useEffect(() => {
    if (autoConnect && permission === 'granted') {
      connectToSocket(socketUrl);
    }
  }, [autoConnect, permission, socketUrl, connectToSocket]);

  // Set up event listeners
  useEffect(() => {
    const cleanupUserRegistered = onUserRegistered((data) => {
      console.log('User registered:', data);
    });

    const cleanupNotificationSent = onNotificationSent((data) => {
      console.log('Notification sent:', data);
    });

    const cleanupBroadcastSent = onBroadcastSent((data) => {
      console.log('Broadcast sent:', data);
    });

    const cleanupQueueStatus = onQueueStatus((data) => {
      setQueueStatus(data);
    });

    const cleanupQueuePurged = onQueuePurged((data) => {
      console.log('Queue purged:', data);
    });

    const cleanupOnlineUsers = onOnlineUsers((data) => {
      setOnlineUsers(data.data?.users || []);
    });

    return () => {
      cleanupUserRegistered();
      cleanupNotificationSent();
      cleanupBroadcastSent();
      cleanupQueueStatus();
      cleanupQueuePurged();
      cleanupOnlineUsers();
    };
  }, [onUserRegistered, onNotificationSent, onBroadcastSent, onQueueStatus, onQueuePurged, onOnlineUsers]);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted' && autoConnect) {
      connectToSocket(socketUrl);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showNotification(testNotification);
    } catch (error) {
      console.error('Failed to show test notification:', error);
    }
  };

  const handleRegisterUser = () => {
    if (!userEmail.trim()) {
      alert('Please enter a valid email address');
      return;
    }
    registerUser({ userEmail: userEmail.trim(), userId: userId.trim() || undefined });
  };

  const handleSendNotificationToUser = () => {
    if (!targetUserEmail.trim()) {
      alert('Please enter a target user email');
      return;
    }
    sendNotificationToUser({
      targetUserEmail: targetUserEmail.trim(),
      title: testNotification.title,
      body: testNotification.body,
      type: testNotification.data?.type || 'info',
      metadata: testNotification.data
    });
  };

  const handleSendDirectMessage = () => {
    if (!targetUserEmail.trim() || !directMessage.trim()) {
      alert('Please enter both target user email and message');
      return;
    }
    sendDirectMessage(targetUserEmail.trim(), directMessage.trim());
  };

  const handleBroadcastNotification = () => {
    broadcastNotification({
      title: testNotification.title,
      body: testNotification.body,
      type: testNotification.data?.type || 'broadcast',
      metadata: testNotification.data
    });
  };

  const handleGetQueueStatus = () => {
    getQueueStatus();
  };

  const handlePurgeQueue = () => {
    if (confirm('Are you sure you want to purge all messages from your queue?')) {
      purgeQueue();
    }
  };

  const handleGetOnlineUsers = () => {
    getOnlineUsers();
  };

  const getPermissionColor = () => {
    switch (permission) {
      case 'granted':
        return 'bg-green-500';
      case 'denied':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getConnectionColor = () => {
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getServiceWorkerColor = () => {
    return isServiceWorkerReady ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Status</CardTitle>
          <CardDescription>
            Monitor notification service status and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getPermissionColor()}`} />
              <Label>Permission Status</Label>
            </div>
            <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
              {permission}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionColor()}`} />
              <Label>Socket Connection</Label>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getServiceWorkerColor()}`} />
              <Label>Service Worker</Label>
            </div>
            <Badge variant={isServiceWorkerReady ? 'default' : 'secondary'}>
              {isServiceWorkerReady ? 'Ready' : 'Not Ready'}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-connect"
              checked={autoConnect}
              onCheckedChange={setAutoConnect}
            />
            <Label htmlFor="auto-connect">Auto-connect to socket</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Management</CardTitle>
          <CardDescription>
            Request notification permissions and manage socket connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button
              onClick={handleRequestPermission}
              disabled={permission === 'granted'}
            >
              Request Permission
            </Button>
            <Button
              onClick={() => connectToSocket(socketUrl)}
              disabled={isConnected}
              variant="outline"
            >
              Connect to Socket
            </Button>
            <Button
              onClick={disconnect}
              disabled={!isConnected}
              variant="outline"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Register with the notification service to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-email">Email Address</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="Enter your email address"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-id">User ID (Optional)</Label>
            <Input
              id="user-id"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleRegisterUser}
              disabled={!isConnected || !userEmail.trim()}
            >
              Register User
            </Button>
            <Button
              onClick={() => {
                const email = getCurrentUserEmail();
                const id = getCurrentUserId();
                console.log('Current user:', { email, id });
              }}
              variant="outline"
            >
              Get Current User
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Test notification functionality with custom messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-title">Title</Label>
            <Input
              id="notification-title"
              value={testNotification.title}
              onChange={(e) =>
                setTestNotification(prev => ({
                  ...prev,
                  title: e.target.value
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-body">Body</Label>
            <Textarea
              id="notification-body"
              value={testNotification.body}
              onChange={(e) =>
                setTestNotification(prev => ({
                  ...prev,
                  body: e.target.value
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-type">Type</Label>
            <Select
              value={testNotification.data?.type || 'test'}
              onValueChange={(value) =>
                setTestNotification(prev => ({
                  ...prev,
                  data: { ...prev.data, type: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="project_update">Project Update</SelectItem>
                <SelectItem value="approval_request">Approval Request</SelectItem>
                <SelectItem value="payment_alert">Payment Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleTestNotification}>
              Show Test Notification
            </Button>
            <Button
              onClick={closeAllNotifications}
              variant="outline"
            >
              Close All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
          <CardDescription>
            Send notifications to specific users or broadcast to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-user-email">Target User Email</Label>
            <Input
              id="target-user-email"
              type="email"
              placeholder="Enter target user email"
              value={targetUserEmail}
              onChange={(e) => setTargetUserEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direct-message">Direct Message</Label>
            <Textarea
              id="direct-message"
              placeholder="Enter direct message"
              value={directMessage}
              onChange={(e) => setDirectMessage(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleSendNotificationToUser}
              disabled={!isConnected || !targetUserEmail.trim()}
            >
              Send to User
            </Button>
            <Button
              onClick={handleSendDirectMessage}
              disabled={!isConnected || !targetUserEmail.trim() || !directMessage.trim()}
              variant="outline"
            >
              Send Direct Message
            </Button>
            <Button
              onClick={handleBroadcastNotification}
              disabled={!isConnected}
              variant="outline"
            >
              Broadcast to All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queue Management</CardTitle>
          <CardDescription>
            Manage your notification queue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {queueStatus && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Queue Status</h4>
              <div className="text-sm space-y-1">
                <div>Message Count: {queueStatus.data?.messageCount || 0}</div>
                <div>Consumer Count: {queueStatus.data?.consumerCount || 0}</div>
                <div>Timestamp: {queueStatus.data?.timestamp}</div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleGetQueueStatus}
              disabled={!isConnected}
            >
              Get Queue Status
            </Button>
            <Button
              onClick={handlePurgeQueue}
              disabled={!isConnected}
              variant="outline"
            >
              Purge Queue
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Online Users</CardTitle>
          <CardDescription>
            View currently online users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onlineUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Online Users ({onlineUsers.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {onlineUsers.map((user, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="font-medium">{user.email}</div>
                    {user.userId && <div className="text-gray-600">ID: {user.userId}</div>}
                    <div className="text-gray-500 text-xs">
                      Connected: {new Date(user.connectedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleGetOnlineUsers}
              disabled={!isConnected}
            >
              Get Online Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 