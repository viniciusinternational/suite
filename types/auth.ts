// User Types and Roles
export type UserRole = 'admin' | 'ceo' | 'director' | 'hr_manager' | 'administrator' | 'accountant' | 'employee';

// Permission Types - Granular permissions per module
export type PermissionKey =
  // Dashboard
  | 'view_dashboard'
  // Projects Module
  | 'view_projects'
  | 'add_projects'
  | 'edit_projects'
  | 'delete_projects'
  | 'approve_projects'
  // Users Module
  | 'view_users'
  | 'add_users'
  | 'edit_users'
  | 'delete_users'
  // Departments Module
  | 'view_departments'
  | 'add_departments'
  | 'edit_departments'
  | 'delete_departments'
  // Requests Module
  | 'view_requests'
  | 'add_requests'
  | 'edit_requests'
  | 'delete_requests'
  | 'approve_requests'
  // Payments Module
  | 'view_payments'
  | 'add_payments'
  | 'edit_payments'
  | 'delete_payments'
  | 'approve_payments'
  // Accounts Module
  | 'view_accounts'
  | 'create_accounts'
  | 'edit_accounts'
  | 'manage_accounts'
  // Payroll Module
  | 'view_payroll'
  | 'add_payroll'
  | 'edit_payroll'
  | 'delete_payroll'
  // Leave Module
  | 'view_leave'
  | 'add_leave'
  | 'edit_leave'
  | 'delete_leave'
  | 'approve_leave'
  // Reports Module
  | 'view_reports'
  // Audit Logs Module
  | 'view_audit_logs'
  // Events Module
  | 'view_events'
  | 'add_events'
  | 'edit_events'
  | 'delete_events'
  // Approvals Module
  | 'view_approvals'
  | 'approve_approvals'
  | 'add_approvers'
  | 'manage_approvers'
  // Settings Module
  | 'view_settings'
  | 'edit_settings'
  // Team Module
  | 'view_team'
  | 'add_teams'
  | 'edit_teams'
  | 'delete_teams'
  // Timesheets Module
  | 'view_timesheets'
  | 'add_timesheets'
  | 'edit_timesheets'
  | 'delete_timesheets'
  // Performance Module
  | 'view_performance'
  | 'add_performance'
  | 'edit_performance'
  | 'delete_performance'
  // Memos Module
  | 'view_memos'
  | 'add_memos'
  | 'edit_memos'
  | 'delete_memos'
  // Documents Module
  | 'view_documents'
  | 'add_documents'
  | 'edit_documents'
  | 'delete_documents'
  // AI Assistant Module
  | 'view_ai_assistant'
  // Role & Permissions Module
  | 'view_roles'
  | 'add_roles'
  | 'edit_roles'
  | 'delete_roles';

// Permission record type
export type UserPermissions = Record<PermissionKey, boolean>;

// Auth Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  notificationId: string | null;
  token: string | null;
  refreshToken: string | null;
  currentAccount: CurrentAccount | null;
}

export interface CurrentAccount {
  _id?: string;
  email?: string;
  name?: string;
}

export interface Permissions {
  id: string;
  key: string;
  value: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  dob: string;
  gender: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  employeeId?: string;
  position: string;
  hireDate: string;
  salary: number;
  avatar?: string;
  isActive: boolean;
  permissions?: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface ZitadelUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  preferredUsername?: string;
  state?: string;
}
