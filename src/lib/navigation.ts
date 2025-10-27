import type { NavigationItem, UserRole } from '@/types';

export const navigationConfig: NavigationItem[] = [
  // Super Admin Navigation
  {
    id: 'super-admin-dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/admin/dashboard',
    roles: ['super_admin'],
  },
  {
    id: 'super-admin-departments',
    label: 'Departments',
    icon: 'Building2',
    href: '/admin/departments',
    roles: ['super_admin'],
  },
  {
    id: 'super-admin-projects',
    label: 'Projects',
    icon: 'FolderOpen',
    href: '/admin/projects',
    roles: ['super_admin'],
  },
  {
    id: 'super-admin-employees',
    label: 'Users',
    icon: 'UserCheck',
    href: '/admin/users',
    roles: ['super_admin'],
  },
  {
    id: 'super-admin-settings',
    label: 'System Settings',
    icon: 'Settings',
    href: '/admin/system-settings',
    roles: ['super_admin'],
  },
  // {
  //   id: 'super-admin-reports',
  //   label: 'Reports',
  //   icon: 'BarChart3',
  //   href: '/super-admin/reports',
  //   roles: ['super_admin'],
  // },
  // {
  //   id: 'super-admin-billing',
  //   label: 'Billing',
  //   icon: 'CreditCard',
  //   href: '/super-admin/billing',
  //   roles: ['super_admin'],
  // },
  {
    id: 'super-admin-audit',
    label: 'Audit Logs',
    icon: 'FileText',
    href: '/admin/audit-logs',
    roles: ['super_admin'],
  },

  // Department Head Navigation
  {
    id: 'dept-head-dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/department-head/dashboard',
    roles: ['department_head'],
  },
  {
    id: 'dept-head-projects',
    label: 'Department Projects',
    icon: 'FolderOpen',
    href: '/department-head/projects',
    roles: ['department_head'],
  },
  {
    id: 'dept-head-team',
    label: 'Team',
    icon: 'Users',
    href: '/department-head/team',
    roles: ['department_head'],
  },
  {
    id: 'dept-head-request-forms',
    label: 'Request Forms',
    icon: 'FileText',
    href: '/department-head/request-forms',
    roles: ['department_head'],
  },
  {
    id: 'dept-head-approvals',
    label: 'Approvals',
    icon: 'CheckCircle',
    href: '/department-head/approvals',
    badge: '0',
    roles: ['department_head'],
    children: [
      {
        id: 'dept-head-approvals-leave',
        label: 'Leave Requests',
        icon: 'Calendar',
        href: '/department-head/approvals/leave',
        roles: ['department_head'],
      },
      {
        id: 'dept-head-approvals-projects',
        label: 'Project Approvals',
        icon: 'FolderCheck',
        href: '/department-head/approvals/projects',
        roles: ['department_head'],
      },
      {
        id: 'dept-head-approvals-procurement',
        label: 'Procurement',
        icon: 'ShoppingCart',
        href: '/department-head/approvals/procurement',
        roles: ['department_head'],
      },
    ],
  },
  {
    id: 'dept-head-budget',
    label: 'Budget',
    icon: 'DollarSign',
    href: '/department-head/budget',
    roles: ['department_head'],
  },
  {
    id: 'dept-head-reports',
    label: 'Reports',
    icon: 'BarChart3',
    href: '/department-head/reports',
    roles: ['department_head'],
  },


  // HR Manager Navigation
  {
    id: 'hr-dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/hr-manager/dashboard',
    roles: ['hr_manager'],
  },
  {
    id: 'hr-employees',
    label: 'User Directory',
    icon: 'Users',
    href: '/hr-manager/employee-directory',
    roles: ['hr_manager'],
  },
  {
    id: 'hr-leave-management',
    label: 'Leave Management',
    icon: 'Calendar',
    href: '/hr-manager/leave-management',
    roles: ['hr_manager'],
  },
  {
    id: 'hr-payroll',
    label: 'Payroll Management',
    icon: 'DollarSign',
    href: '/hr-manager/payroll',
    roles: ['hr_manager'],
  },
  {
    id: 'hr-performance-reviews',
    label: 'Performance Reviews',
    icon: 'Star',
    href: '/hr-manager/performance-reviews',
    roles: ['hr_manager'],
  },

  // Managing Director Navigation
  {
    id: 'managing-director-dashboard',
    label: 'Executive Dashboard',
    icon: 'LayoutDashboard',
    href: '/managing-director/dashboard',
    roles: ['managing_director'],
  },
  {
    id: 'managing-director-performance',
    label: 'Performance Overview',
    icon: 'TrendingUp',
    href: '/managing-director/performance',
    roles: ['managing_director'],
  },
  {
    id: 'managing-director-financials',
    label: 'Financial Insights',
    icon: 'DollarSign',
    href: '/managing-director/financials',
    roles: ['managing_director'],
  },
  {
    id: 'managing-director-approvals',
    label: 'Approvals & Decisions',
    icon: 'CheckCircle',
    href: '/managing-director/approvals',
    badge: '0',
    roles: ['managing_director'],
  },
  {
    id: 'managing-director-history',
    label: 'History',
    icon: 'Calendar',
    href: '/managing-director/history',
    roles: ['managing_director'],
  },

  // Accountant Navigation
  {
    id: 'accountant-dashboard',
    label: 'Accounting Dashboard',
    icon: 'LayoutDashboard',
    href: '/accountant/dashboard',
    roles: ['accountant'],
  },
  {
    id: 'accountant-payroll',
    label: 'Payroll Management',
    icon: 'Users',
    href: '/accountant/payroll',
    roles: ['accountant'],
  },
  {
    id: 'accountant-procurement',
    label: 'Procurement Payments',
    icon: 'ShoppingCart',
    href: '/accountant/procurement-payments',
    roles: ['accountant'],
  },
  {
    id: 'accountant-reports',
    label: 'Financial Reports',
    icon: 'BarChart3',
    href: '/accountant/reports',
    roles: ['accountant'],
  },
  {
    id: 'accountant-reconciliation',
    label: 'Payment Reconciliation',
    icon: 'Calculator',
    href: '/accountant/reconciliation',
    roles: ['accountant'],
  },
  {
    id: 'accountant-payments',
    label: 'Generate Payments',
    icon: 'CreditCard',
    href: '/accountant/payments',
    roles: ['accountant'],
  },

  // Administrator Navigation
  {
    id: 'administrator-dashboard',
    label: 'Admin Dashboard',
    icon: 'LayoutDashboard',
    href: '/administrator/dashboard',
    roles: ['administrator'],
  },
  {
    id: 'administrator-request-forms',
    label: 'Request Forms Management',
    icon: 'FileText',
    href: '/administrator/request-forms',
    roles: ['administrator'],
  },
  {
    id: 'administrator-resources',
    label: 'Shared Resources',
    icon: 'Archive',
    href: '/administrator/resources',
    roles: ['administrator'],
  },
  {
    id: 'administrator-support',
    label: 'User Support',
    icon: 'HelpCircle',
    href: '/administrator/support',
    roles: ['administrator'],
  },
  {
    id: 'administrator-approvals',
    label: 'Approvals',
    icon: 'CheckCircle',
    href: '/administrator/approvals',
    badge: '0',
    roles: ['administrator'],
  },

  // Employee Navigation
  {
    id: 'employee-dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/employee/dashboard',
    roles: ['employee'],
  },
  {
    id: 'employee-tasks',
    label: 'My Tasks',
    icon: 'CheckSquare',
    href: '/employee/my-tasks',
    roles: ['employee'],
  },
  {
    id: 'employee-profile',
    label: 'My Profile',
    icon: 'User',
    href: '/employee/profile',
    roles: ['employee'],
  },
  {
    id: 'employee-leave',
    label: 'Leave',
    icon: 'Calendar',
    href: '/employee/leave',
    roles: ['employee'],
  },
  {
    id: 'employee-payslips',
    label: 'My Payslips',
    icon: 'FileText',
    href: '/employee/payslips',
    roles: ['employee'],
  },
  {
    id: 'employee-request-forms',
    label: 'Request Forms',
    icon: 'FilePlus',
    href: '/employee/request-forms',
    roles: ['employee'],
  },
  {
    id: 'employee-timesheet',
    label: 'Timesheet',
    icon: 'Clock',
    href: '/employee/timesheet',
    roles: ['employee'],
  },
];

export const getNavigationForRole = (userRole: UserRole): NavigationItem[] => {
  return navigationConfig.filter(item => item.roles.includes(userRole));
};

export const getRoleBaseDashboard = (userRole: UserRole): string => {
  const dashboards: Record<UserRole, string> = {
    super_admin: '/super-admin/dashboard',
    managing_director: '/managing-director/dashboard',
    department_head: '/department-head/dashboard',
    hr_manager: '/hr-manager/dashboard',
    accountant: '/accountant/dashboard',
    administrator: '/administrator/dashboard',
    employee: '/employee/dashboard',
  };
  
  return dashboards[userRole];
}; 