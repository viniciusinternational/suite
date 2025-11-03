'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { hasAnyPermission } from '@/lib/permissions';
import type { PermissionKey } from '@/types';

interface UseAuthGuardReturn {
  isChecking: boolean;
  user: any | null;
}

export function useAuthGuard(requiredPermissions?: PermissionKey[]): UseAuthGuardReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for hydration to complete before checking authentication
    if (!hasHydrated) {
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Check permissions if required permissions are specified
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAnyPermission(user, requiredPermissions)) {
        // User doesn't have required permissions
        // If already on dashboard, don't redirect (avoid infinite loop)
        if (pathname !== '/dashboard') {
          router.push('/dashboard');
          return;
        }
        // If on dashboard and missing permission, still allow (will show no access message)
      }
    }

    // User is authenticated and authorized
    setIsChecking(false);
  }, [isAuthenticated, user, hasHydrated, router, requiredPermissions, pathname]);

  return { isChecking, user };
}
