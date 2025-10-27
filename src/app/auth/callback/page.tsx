'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, UserX } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types';

interface DecodedToken {
  email?: string;
  sub?: string;
  [key: string]: any;
}

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNoPermission, setIsNoPermission] = useState(false);
  
  const { setToken, setAuthenticated, setUser, setCurrentAccount, logout } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true);
        
        // Get parameters from URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh_token');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle error from auth provider
        if (errorParam) {
          setError(errorDescription || errorParam);
          setIsLoading(false);
          return;
        }

        // Check if token exists
        if (!token) {
          setError('No authentication token received');
          setIsLoading(false);
          return;
        }

        // Decode token to get email only
        const decodedToken = jwtDecode<DecodedToken>(token);
        const email = decodedToken.email || decodedToken.sub;
        
        if (!email) {
          setError('Email not found in token');
          setIsLoading(false);
          return;
        }

        // Fetch user from local database using email
        const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
        const result = await response.json();
        
        if (!result.ok || !result.data) {
          // User not found in local database
          setIsNoPermission(true);
          logout();
          setIsLoading(false);
          return;
        }

        // User found in local database - get user data
        const dbUser: User = result.data;
        
        // Check if user is active
        if (!dbUser.isActive) {
          setError('Your account has been deactivated. Please contact the administrator.');
          setIsLoading(false);
          return;
        }
        
        // Set tokens in store
        setToken(token, refreshToken || '');
        setAuthenticated(true);
        setUser(dbUser);
        setCurrentAccount({
          _id: dbUser.id,
          email: dbUser.email,
          name: dbUser.fullName,
        });
        setSuccess(true);
        
        // Redirect to appropriate dashboard based on role from DB
        setTimeout(() => {
          const role = dbUser.role;
          let redirectPath = '/';
          
          switch (role) {
            case 'admin':
              redirectPath = '/admin/dashboard';
              break;
            case 'ceo':
              redirectPath = '/ceo/dashboard';
              break;
            case 'director':
              redirectPath = '/director/dashboard';
              break;
            case 'hr_manager':
              redirectPath = '/hr-manager/dashboard';
              break;
            case 'administrator':
              redirectPath = '/administrator/dashboard';
              break;
            case 'accountant':
              redirectPath = '/accountant/dashboard';
              break;
            case 'employee':
              redirectPath = '/employee/dashboard';
              break;
            default:
              redirectPath = '/';
          }
          
          router.push(redirectPath);
        }, 1500);

      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred during authentication');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, setToken, setAuthenticated, setUser, setCurrentAccount, router, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Authenticating...</CardTitle>
            <CardDescription>
              Please wait while we complete your authentication
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isNoPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <UserX className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-amber-600">Access Restricted</CardTitle>
            <CardDescription className="mt-2">
              You don't have the required permissions to access this service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please contact your administrator to grant access to your account.
            </p>
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full"
              size="lg"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Authentication Failed</CardTitle>
            <CardDescription className="text-destructive/80">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full"
              size="lg"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Authentication Successful</CardTitle>
            <CardDescription>
              Redirecting you to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
}
