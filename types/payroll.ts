import type { User } from './auth';
import type { Department } from './department';

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
  amount?: number;
  percent?: number;
  global: boolean;
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
  amount?: number;
  percent?: number;
  global: boolean;
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
  sourceAmount: number;
  calculatedAmount: number;
  appliedAt: string;
  deduction?: Pick<Deduction, 'id' | 'title' | 'amount' | 'percent'>;
}

export interface PayrollAllowanceApplication {
  id: string;
  payrollEntryId: string;
  allowanceId: string;
  sourceAmount: number;
  calculatedAmount: number;
  appliedAt: string;
  allowance?: Pick<Allowance, 'id' | 'title' | 'amount' | 'percent'>;
}
