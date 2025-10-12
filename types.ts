// User Types and Roles
export type UserRole = 'super_admin'| 'managing_director' | 'department_head' |  'hr_manager'| 'administrator'| 'accountant' | 'employee';
export type Sector = 'construction' | 'engineering' | 'legal' | 'administration' | 'consulting' | 'other';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  dob: string;
  gender: string;
  email: string;
  mailAddresses: string[];
  role: UserRole;
  emailVerified?: boolean;
  departmentId?: string;
  employeeId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shape returned by backend user endpoints
export interface BackendUser {
  _id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  email: string;
  mailAddresses: string[];
  phone?: string;
  gender?: string;
  dob?: string | null;
  avatar?: string;
  isActive: boolean;
  status?: 'active' | 'inactive' | 'suspended' | string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
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

export interface Employee {
  id: string;
  userId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  unitId?: string;
  position: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  managerId?: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName?: string; // Optional field for display purposes
  managerId: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  description?: string;
  milestones: Milestone[];
  tasks: Task[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalDate?: string;
  approvedBy?: string;
  approvalComments?: string;
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
  attachments?: string[];
  comments?: string;
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
  attachments?: string[];
  comments?: string;
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

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Revenue {
  id: string;
  projectId?: string;
  clientId?: string;
  amount: number;
  date: string;
  description?: string;
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
// quantity survey
export interface QuantitySurvey {
  id: string;
  projectId: string;
  items: Item[];
  totalAmount: number;
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
  currentStatus: 'pending_dept_head' | 'pending_admin_head' | 'approved' | 'rejected';
  approvedByDeptHeadId?: string;
  approvedByAdminId?: string;
  rejectionReason?: string;
  associatedPaymentId?: string;
  requestDate: string;
  items?: Item[];
  totalAmount?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  attachments?: string[];
  comments?: string[];
}

export interface Payment {
  id: string;
  requestForms: RequestForm[]; // Link to RequestFormA for traceability
  items: Item[];
  total: number;
  date: string;
  status: 'pending' | 'approved' | 'paid' | 'failed' | 'cancelled';
  paymentMethod?: 'bank_transfer' | 'check' | 'cash' | 'credit_card';
  vendorId?: string;
  approvedBy?: string; // Managing Director or authorized approver
  approvedAt?: string;
  paidBy?: string; // Accountant who processed the payment
  paidAt?: string;
  referenceNumber?: string;
  notes?: string;
  comments?: string[];

}

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  voucherType: 'purchase' | 'sale' | 'payment' | 'receipt';
  totalAmount: number;
}

// internal memo
export interface InternalMemo {
  id: string;
  message: string;
  author: string;
  users: User[];
  departments: Department[];
  attachments: string[];
}

// Navigation and Route Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  badge?: string | number;
  children?: NavigationItem[];
  roles: UserRole[];
}

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  roles: UserRole[];
  title: string;
}

// Dashboard Data Types
export interface DashboardStats {
  totalProjects?: number;
  activeProjects?: number;
  totalEmployees?: number;
  pendingApprovals?: number;
  totalRevenue?: number;
  monthlyExpenses?: number;
  completedTasks?: number;
  overdueTasks?: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean | null;
  permissions: string[];
}

// Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserForm {
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  password: string;
}

export interface CreateProjectForm {
  name: string;
  code: string;
  description?: string;
  departmentId: string;
  managerId: string;
  startDate: string;
  endDate: string;
  budget: number;
  clientName?: string;
}

// Filter and Search Types
export interface ProjectFilters {
  status?: string[];
  departmentId?: string;
  managerId?: string;
  priority?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface EmployeeFilters {
  departmentId?: string;
  status?: string[];
  position?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Approval Workflow Types
export interface ApprovalAction {
  id: string;
  requestId: string;
  requestType: 'leave_request' | 'procurement_request' | 'request_form' | 'payment';
  approverId: string;
  action: 'approve' | 'reject' | 'pending';
  comments?: string;
  actionDate: string;
  level: 'department_head' | 'administrator' | 'managing_director';
}

export interface ApprovalSummary {
  pendingLeaveRequests: number;
  pendingProcurementRequests: number;
  pendingRequestForms: number;
  pendingPayments: number;
  totalPending: number;
}

export interface RevenueStats {
  totalRevenue: number;
  yearToDateGrowth: number;
  revenueByProject: {
    name: string;
    value: number;
  }[];
  revenueByClient: {
    name: string;
    value: number;
  }[];
  revenueTrends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export interface IncomeExpenseComparison {
  month: string;
  income: number;
  expenses: number;
}

// Update ApprovalStats interface
export interface ApprovalStats {
  pendingPayments: number;
  pendingRequests: number;
  pendingProcurements: number;
  pendingLeaves: number;
  pendingProjects: number;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  sector: Sector;
  description: string;
  headId: string;
  isActive: boolean;
}

export interface UnitFormData {
  name: string;
  departmentId: string;
  managerId: string;
  isActive: boolean;
}
