// User Types and Roles
export type UserRole = 'super_admin'| 'managing_director' | 'department_head' |  'hr_manager'| 'administrator'| 'accountant' | 'employee';
export type Sector = 'construction' | 'engineering' | 'legal' | 'administration' | 'consulting' | 'other';
export type Permission = 'create' | 'read' | 'update' | 'delete';

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
  permissions?: Record<string, boolean>;
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
  clientName?: string;
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


// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}


