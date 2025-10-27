'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }

    // Redirect to appropriate dashboard based on role
    const role = user.role;
    let redirectPath = '/';

    switch (role) {
      case 'super_admin':
        redirectPath = '/admin/dashboard';
        break;
      case 'managing_director':
        redirectPath = '/ceo/dashboard';
        break;
      case 'department_head':
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
        redirectPath = '/auth/login';
    }

    router.push(redirectPath);
  }, [isAuthenticated, user, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
          <svg className="h-6 w-6 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
