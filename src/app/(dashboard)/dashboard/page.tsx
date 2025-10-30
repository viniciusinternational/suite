'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Building2, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  CheckCircle, 
  Settings, 
  Clock, 
  Star 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getNavigationForPermissions } from '@/lib/navigation';
import { useAuthStore } from '@/store';

// Icon mapping for navigation items
const iconMap: Record<string, any> = {
  LayoutDashboard,
  FolderOpen: FolderKanban,
  UserCheck: Users,
  Building2,
  FileText,
  CreditCard,
  DollarSign,
  Calendar,
  BarChart3,
  CheckCircle,
  Settings,
  Users,
  Clock,
  Star,
};

export default function DashboardPage() {
  // Dashboard is accessible to all authenticated users - no specific permission required
  // Permission check is implicit - if authenticated, they can see dashboard
  const { user } = useAuthGuard();
  const router = useRouter();

  if (!user) return null;

  // Get all accessible modules from navigation config
  const navigationItems = getNavigationForPermissions(user);
  
  // Filter out dashboard itself and get module cards
  const moduleCards = navigationItems
    .filter(item => item.id !== 'dashboard')
    .map(item => {
      const Icon = iconMap[item.icon] || LayoutDashboard;
      return {
        id: item.id,
        name: item.label,
        href: item.href || '#',
        icon: Icon,
        desc: getModuleDescription(item.id),
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.fullName}</p>
        </div>
      </div>

      {moduleCards.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Access</CardTitle>
            <CardDescription>You don't have access to any modules yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Please contact your administrator to grant you permissions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((module) => (
            <Card 
              key={module.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => module.href && router.push(module.href)}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <module.icon className="h-5 w-5" />
                  <span>{module.name}</span>
                </CardTitle>
                <CardDescription>{module.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function getModuleDescription(moduleId: string): string {
  const descriptions: Record<string, string> = {
    projects: 'Manage projects and tasks',
    users: 'Manage users and permissions',
    departments: 'Manage departments and units',
    requests: 'View and manage request forms',
    payments: 'Process and manage payments',
    payroll: 'Manage payroll and salaries',
    leave: 'Manage leave requests',
    reports: 'View reports and analytics',
    'audit-logs': 'View system audit logs',
    approvals: 'Manage approval workflows',
    settings: 'Configure system settings',
    team: 'View team and employee directory',
    timesheets: 'Manage timesheet entries',
    performance: 'View and manage performance reviews',
  };
  return descriptions[moduleId] || 'Access module';
}
