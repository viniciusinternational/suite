'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import type { UserRole } from '@/types';

interface UseAuthGuardReturn {
  isChecking: boolean;
  user: any | null;
}

export function useAuthGuard(allowedRoles?: UserRole[]): UseAuthGuardReturn {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('isAuthenticated', isAuthenticated);
    console.log('user', user);
    console.log('allowedRoles', allowedRoles);
    // Check authentication
    // if (!isAuthenticated || !user) {
    //   router.push('/auth/login');
    //   return;
    // }

    // Check role authorization if allowed roles are specified
    // if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    //   // User doesn't have permission for this role
    //   router.push('/auth/login');
    //   return;
    // }

    // User is authenticated and authorized
    setIsChecking(false);
  }, [isAuthenticated, user, router, allowedRoles]);

  return { isChecking, user };
}

