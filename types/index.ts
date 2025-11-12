// User Types and Roles
export type UserRole = 'admin' | 'ceo' | 'director' | 'hr_manager' | 'administrator' | 'accountant' | 'employee';
export type Sector = 'construction' | 'engineering' | 'legal' | 'administration' | 'consulting' | 'other';

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
  // AI Assistant Module
  | 'view_ai_assistant';

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



export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  sector: Sector;
  description?: string;
  units: DepartmentUnit[];
  isActive: boolean;
}

export interface DepartmentUnit {
  id: string;
  name: string;
  departmentId: string;
  managerId?: string;
  isActive: boolean;
}


export interface Approval {
  id: string;
  userId: string;
  addedById?: string;
  level: 'director' | 'ceo';
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  canAddApprovers?: boolean;
  createdAt?: string;
  updatedAt?: string;
  addedBy?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}


export interface Project {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  managerId: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  description?: string;
  clientName?: string;
  milestones?: Milestone[];
  tasks?: Task[];
  approvals?: Approval[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  budget: number;
  spent: number;
  createdAt?: string;
  updatedAt?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  assigneeId?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'maternity' | 'emergency' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  generatedAt: string;
  status: 'draft' | 'processed' | 'paid';
}

export interface Payroll {
  id: string;
  periodMonth: number;
  periodYear: number;
  status: 'draft' | 'pending_dept_head' | 'pending_admin_head' | 'pending_accountant' | 'approved' | 'rejected' | 'processed' | 'paid';
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  entries?: PayrollEntry[];
  approvals?: PayrollApproval[];
  createdBy?: Pick<User, 'id' | 'fullName' | 'email'>;
}

export interface PayrollApproval {
  id: string;
  payrollId: string;
  userId: string;
  addedById?: string;
  level: 'dept_head' | 'admin_head' | 'accountant';
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
  addedBy?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
  canAddApprovers?: boolean;
}

export interface PayrollEntry {
  id: string;
  payrollId: string;
  userId: string;
  baseSalary: number;
  deductions: number;
  allowances: number;
  netSalary: number;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'employeeId' | 'position'>;
  deductionApplications?: PayrollDeductionApplication[];
  allowanceApplications?: PayrollAllowanceApplication[];
}

export interface Deduction {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  always: boolean;
  amount?: number; // Fixed amount (nullable)
  percent?: number; // Percentage (nullable)
  global: boolean; // If true, applies to all users
  createdAt: string;
  updatedAt: string;
  users?: Pick<User, 'id' | 'fullName' | 'email'>[];
  departments?: Pick<Department, 'id' | 'name' | 'code'>[];
  applications?: PayrollDeductionApplication[];
}

export interface Allowance {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  always: boolean;
  amount?: number; // Fixed amount (nullable)
  percent?: number; // Percentage (nullable)
  global: boolean; // If true, applies to all users
  createdAt: string;
  updatedAt: string;
  users?: Pick<User, 'id' | 'fullName' | 'email'>[];
  departments?: Pick<Department, 'id' | 'name' | 'code'>[];
  applications?: PayrollAllowanceApplication[];
}

export interface PayrollDeductionApplication {
  id: string;
  payrollEntryId: string;
  deductionId: string;
  sourceAmount: number; // Base amount used for calculation
  calculatedAmount: number; // Final amount after percent calculation
  appliedAt: string;
  deduction?: Pick<Deduction, 'id' | 'title' | 'amount' | 'percent'>;
}

export interface PayrollAllowanceApplication {
  id: string;
  payrollEntryId: string;
  allowanceId: string;
  sourceAmount: number; // Base amount used for calculation
  calculatedAmount: number; // Final amount after percent calculation
  appliedAt: string;
  allowance?: Pick<Allowance, 'id' | 'title' | 'amount' | 'percent'>;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}



export interface Item {
  id: string;
  name: string;
  description?: string;
  vendorId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}


export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface RequestForm {
  id: string;
  name: string;
  description: string;
  requestedBy: string; // Employee ID
  departmentId: string; // Department of requester
  type: 'office_supplies' | 'equipment' | 'travel' | 'training' | 'other';
  status: 'pending_dept_head' | 'pending_admin_head' | 'approved' | 'rejected';
  requestDate: string;
  items?: Item[];
  amount?: number;
  currency?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  attachments?: string[];
  comments?: RequestComment[];
  approvals: RequestApproval[];
  createdAt?: string;
  updatedAt?: string;
  requestedByUser?: Pick<User, 'id' | 'fullName' | 'email' | 'avatar'>;
  department?: Pick<Department, 'id' | 'name' | 'code'>;
}

export interface RequestApproval {
  id: string;
  requestFormId: string;
  userId: string;
  addedById?: string;
  level: 'dept_head' | 'admin_head';
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  canAddApprovers?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
  addedBy?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}

export interface RequestComment {
  id: string;
  requestFormId: string;
  userId: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'avatar'>;
}

export type PaymentStatus =
  | 'draft'
  | 'scheduled'
  | 'partially_paid'
  | 'paid'
  | 'voided';

export type PaymentSourceType = 'project' | 'requestForm' | 'payroll' | 'none';

export interface PaymentSource {
  type: PaymentSourceType;
  projectId?: string;
  requestFormId?: string;
  payrollId?: string;
}

export interface PaymentItemSnapshot {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  requestFormItemId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'voided';
  paidAt?: string;
  reference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentReconciliationStatus =
  | 'unreconciled'
  | 'partially_reconciled'
  | 'reconciled';

export interface Payment {
  id: string;
  source: PaymentSource;
  requestFormId?: string;
  projectId?: string;
  payrollId?: string;
  project?: Pick<Project, 'id' | 'name' | 'code'>;
  requestForm?: Pick<RequestForm, 'id' | 'name' | 'status'>;
  payroll?: Pick<Payroll, 'id' | 'periodMonth' | 'periodYear' | 'status'>;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  createdBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  submittedById?: string;
  submittedBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  approverIds?: string[];
  payeeId?: string;
  payee?: Pick<User, 'id' | 'fullName' | 'email'>;
  payerAccountId?: string;
  currency: string;
  exchangeRate?: number;
  isForeignCurrency?: boolean;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  fxAppliedAmount?: number;
  balanceOutstanding?: number;
  status: PaymentStatus;
  method: 'bank_transfer' | 'check' | 'cash' | 'credit_card' | 'other';
  paymentDate?: string;
  dueDate?: string;
  scheduledFor?: string;
  notes?: string;
  reference?: string;
  tags?: string[];
  requiresApproval?: boolean;
  isDraft?: boolean;
  isLocked?: boolean;
  isArchived?: boolean;
  isRecurring?: boolean;
  recurrenceTemplateId?: string;
  derivedFromRequestFormItems?: boolean;
  requestFormItemIds?: string[];
  items: PaymentItemSnapshot[];
  installments?: PaymentInstallment[];
  approvals?: PaymentApproval[];
  auditLog?: Record<string, unknown>[];
  attachments?: string[];
  reconciliationStatus?: PaymentReconciliationStatus;
  reconciliationDate?: string;
  ledgerEntryIds?: string[];
  lastReminderSentAt?: string;
  cancellationReason?: string;
}

export interface PaymentApproval {
  id: string;
  paymentId: string;
  userId: string;
  addedById?: string;
  level: 'accountant' | 'finance_manager' | 'ceo';
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
  canAddApprovers?: boolean;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
  addedBy?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}
// Audit Log Types
export type AuditActionType = 
  // Generic CRUD operations
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  // Specific business actions
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'PASSWORD_RESET'
  | 'PERMISSION_CHANGED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_REJECTED'
  | 'PROJECT_PAUSED'
  | 'PROJECT_RESUMED'
  | 'BUDGET_UPDATED'
  | 'MILESTONE_COMPLETED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_COMMENT_ADDED'
  | 'REQUEST_ATTACHMENT_ADDED'
  | 'DEPARTMENT_UPDATED'
  | 'UNIT_CREATED'
  | 'REPORT_GENERATED'
  | 'SETTING_CHANGED';

export type AuditEntityType = 
  | 'User'
  | 'Department'
  | 'DepartmentUnit'
  | 'Project'
  | 'Milestone'
  | 'Task'
  | 'Approval'
  | 'LeaveRequest'
  | 'Payslip'
  | 'Payroll'
  | 'PayrollEntry'
  | 'Deduction'
  | 'Allowance'
  | 'PayrollDeductionApplication'
  | 'PayrollAllowanceApplication'
  | 'PayrollApproval'
  | 'Payment'
  | 'RequestForm'
  | 'RequestApproval'
  | 'RequestComment'
  | 'Item'
  | 'Vendor'
  | 'Client'
  | 'AuditLog'
  | 'Memo'
  | 'Team'
  | 'System';

export interface AuditLog {
  id: string;
  userId: string;
  userSnapshot: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    departmentId?: string;
  };
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId?: string;
  description: string;
  isSuccessful: boolean;
  previousData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date | string;
  createdAt: Date | string;
}

// Events
export interface Event {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  link?: string;
  startDateTime: string;
  endDateTime: string;
  users?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[];
  departments?: Pick<Department, 'id' | 'name' | 'code'>[];
  units?: Pick<DepartmentUnit, 'id' | 'name' | 'departmentId'>[];
  createdBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  createdAt?: string;
  updatedAt?: string;
}

// Memos
export interface Memo {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isActive: boolean;
  expiresAt?: string;
  users?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[];
  departments?: Pick<Department, 'id' | 'name' | 'code'>[];
  createdBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  createdAt?: string;
  updatedAt?: string;
}

// Teams
export interface Team {
  id: string;
  title: string;
  purpose?: string;
  leaderId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leader?: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'avatar'>;
  users?: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'avatar' | 'position'>[];
  tasks?: Pick<Task, 'id' | 'name' | 'status' | 'priority' | 'dueDate' | 'projectId'>[];
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  permissions?: PermissionKey[]; // Required permissions to see this item
  badge?: string;
  children?: NavigationItem[];
}

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}

