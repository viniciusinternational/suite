'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from '@/layout/dashboard/sidenav';
import { DashboardHeader } from '@/layout/dashboard/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { mockUsers } from '@/app/super-admin/mockdata';

interface AccountantLayoutProps {
  children: ReactNode;
}

export default function AccountantLayout({ children }: AccountantLayoutProps) {
  // Mock user data - in a real app, this would come from authentication
  // Find an accountant user from mock data
  const mockUser = mockUsers.find(user => user.role === 'accountant') || mockUsers[0];

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


