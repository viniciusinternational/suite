'use client';

import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store';

export default function LoginPage() {
  const { setNotificationId } = useAuthStore();

  useEffect(() => {
    // Generate notification ID and redirect to auth service
    const generateNotificationId = () => {
      const id = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setNotificationId(id);
      return id;
    };

    const notificationId = generateNotificationId();
    const callbackUri = `${window.location.origin}/auth/callback`;
    window.location.href = `https://auth.viniciusint.com/api/v1/zitadel/auth/url?callback_uri=${encodeURIComponent(callbackUri)}&notification_id=${notificationId}`;
  }, [setNotificationId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
            <svg className="h-6 w-6 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <CardTitle>Redirecting to Login...</CardTitle>
          <CardDescription>
            Please wait while we redirect you to the authentication service.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
