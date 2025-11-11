'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/layout/dashboard/sidenav';
import { DashboardHeader } from '@/layout/dashboard/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  // No specific permissions required for layout - individual pages will check
  const { isChecking, user } = useAuthGuard();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    // Log logout event before clearing auth state (best-effort)
    if (user) {
      try {
        await fetch('/api/audit-logs/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'x-user-fullname': user.fullName,
            'x-user-email': user.email,
            'x-user-role': user.role,
            'x-user-department-id': user.departmentId || '',
          },
          body: JSON.stringify({
            action: 'USER_LOGOUT',
            userId: user.id,
            userSnapshot: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              role: user.role,
              departmentId: user.departmentId,
            },
            ipAddress: undefined, // Will be captured server-side
            userAgent: navigator.userAgent,
          }),
        }).catch((e) => {
          console.warn('Failed to log logout event:', e);
        });
      } catch (e) {
        console.warn('Failed to log logout event:', e);
      }
    }
    
    logout();
    router.push('/auth/login');
  };

  if (isChecking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we verify your authentication
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        {/* Sidebar */}
        <DashboardSidebar userRole={user.role} user={user} />
        
        {/* Main Content Area */}
        <SidebarInset>
          <div className="flex flex-col h-full">
            {/* Header */}
            <DashboardHeader user={user} onLogout={handleLogout} />
            
            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-muted/30">
              <div className="p-4 space-y-4 w-full">
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

