'use client';

import { DashboardSidebar } from '@/layout/dashboard/sidenav';
import { DashboardHeader } from '@/layout/dashboard/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { mockUsers } from '@/app/super-admin/mockdata';
import type { UserRole } from '@/types';

// Mock user data - in a real app, this would come from authentication
const mockUser = mockUsers[0]; // Using the first user as an example

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleLogout = () => {
    // In a real app, this would handle logout logic
    console.log('Logout clicked');
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        {/* Sidebar */}
        <DashboardSidebar userRole={mockUser.role} user={mockUser} />
        
        {/* Main Content Area */}
        <SidebarInset>
          <div className="flex flex-col h-full">
            {/* Header */}
            <DashboardHeader user={mockUser} onLogout={handleLogout} />
            
            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-muted/30">
              <div className="mx-auto p-6 space-y-8 max-w-5xl">
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
