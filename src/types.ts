// User Types and Roles
export type   UserRole = 'admin'| 'ceo'| 'director' | 'hr_manager'| 'administrator'| 'accountant' | 'employee';
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


export interface Approval {
  id: string;
  projectId: string;
  userId: string;
  level: 'director' | 'ceo';
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
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
  department?: {
    id: string;
    name: string;
    code: string;
    sector?: string;
  };
  manager?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  _count?: {
    milestones: number;
    tasks: number;
  };
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
  _count?: {
    tasks: number;
  };
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
  assignee?: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
    role: string;
  };
  milestone?: {
    id: string;
    name: string;
  };
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
  | 'Payment'
  | 'RequestForm'
  | 'Item'
  | 'Vendor'
  | 'Client'
  | 'AuditLog'
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

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}


