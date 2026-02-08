import type { NavigationItem } from '@/types';
import { hasAnyPermission } from '@/lib/permissions';
import type { User } from '@/types';

export const navigationConfig: NavigationItem[] = [
  // Dashboard - Always accessible to authenticated users (no permission required)
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
    permissions: [], // Empty array means always accessible when authenticated
  },
  // Projects Module
  {
    id: 'projects',
    label: 'Projects',
    icon: 'FolderOpen',
    href: '/projects',
    permissions: ['view_projects'],
  },
  // Users Module
  {
    id: 'users',
    label: 'Users',
    icon: 'UserCheck',
    href: '/users',
    permissions: ['view_users'],
  },
  // Departments Module
  {
    id: 'departments',
    label: 'Departments',
    icon: 'Building2',
    href: '/departments',
    permissions: ['view_departments'],
  },
  // Events Module
  {
    id: 'events',
    label: 'Events',
    icon: 'CalendarDays',
    href: '/events',
    permissions: ['view_events'],
  },
  // Requests Module
  {
    id: 'requests',
    label: 'Requests',
    icon: 'FileText',
    href: '/requests',
    permissions: ['view_requests'],
  },
  // Payments Module
  {
    id: 'payments',
    label: 'Payments',
    icon: 'CreditCard',
    href: '/payments',
    permissions: ['view_payments'],
  },
  // Accounts Module
  {
    id: 'accounts',
    label: 'Accounts',
    icon: 'Wallet',
    href: '/accounts',
    permissions: ['view_accounts'],
  },
  // Payroll Module
  {
    id: 'payroll',
    label: 'Payroll',
    icon: 'DollarSign',
    href: '/payroll',
    permissions: ['view_payroll'],
  },
  // Leave Module
  // {
  //   id: 'leave',
  //   label: 'Leave',
  //   icon: 'Calendar',
  //   href: '/leave',
  //   permissions: ['view_leave'],
  // },
  // Reports Module
  // {
  //   id: 'reports',
  //   label: 'Reports',
  //   icon: 'BarChart3',
  //   href: '/reports',
  //   permissions: ['view_reports'],
  // },
  // Audit Logs Module
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: 'FileText',
    href: '/audit-logs',
    permissions: ['view_audit_logs'],
  },
  // Approvals Module
  {
    id: 'approvals',
    label: 'Approvals',
    icon: 'CheckCircle',
    href: '/approvals',
    permissions: ['view_approvals'],
  },
  // Role & Permissions Module
  {
    id: 'roles',
    label: 'Role & Permissions',
    icon: 'ShieldCheck',
    href: '/role-permissions',
    permissions: ['view_roles'],
  },
  // Settings Module
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    href: '/settings',
    permissions: ['view_settings'],
  },
  // Team Module
  // {
  //   id: 'team',
  //   label: 'Team',
  //   icon: 'Users',
  //   href: '/team',
  //   permissions: ['view_team'],
  // },
  // Timesheets Module
  // {
  //   id: 'timesheets',
  //   label: 'Timesheets',
  //   icon: 'Clock',
  //   href: '/timesheets',
  //   permissions: ['view_timesheets'],
  // },
  // // Performance Module
  // {
  //   id: 'performance',
  //   label: 'Performance',
  //   icon: 'Star',
  //   href: '/performance',
  //   permissions: ['view_performance'],
  // },
  // Memos Module
  {
    id: 'memos',
    label: 'Memos',
    icon: 'Megaphone',
    href: '/memos',
    permissions: ['view_memos'],
  },
  // Documents Module
  {
    id: 'documents',
    label: 'Documents',
    icon: 'FileText',
    href: '/documents',
    permissions: ['view_documents'],
  },
];

/**
 * Get navigation items filtered by user permissions
 */
export function getNavigationForPermissions(user: User | null): NavigationItem[] {
  if (!user) {
    return [];
  }

  return navigationConfig.filter(item => {
    // Dashboard is always available to authenticated users
    if (item.id === 'dashboard') {
      return true;
    }

    // If no permissions required, show item (shouldn't happen but safety check)
    if (!item.permissions || item.permissions.length === 0) {
      return false;
    }

    // User needs at least one of the required permissions
    return hasAnyPermission(user, item.permissions);
  }).map(item => {
    // Recursively filter children
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: item.children.filter(child => {
          if (!child.permissions || child.permissions.length === 0) {
            return false;
          }
          return hasAnyPermission(user, child.permissions);
        }),
      };
    }
    return item;
  }).filter(item => {
    // Remove parent items that have no visible children
    if (item.children && item.children.length === 0) {
      return false;
    }
    return true;
  });
}
