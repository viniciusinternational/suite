import type { User } from './auth';
import type { Project } from './project';
import type { RequestForm } from './request';
import type { Payroll } from './payroll';

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
  payeeFullName?: string;
  payeePhone?: string;
  payee?: Pick<User, 'id' | 'fullName' | 'email'>;
  payerAccountId?: string;
  payerAccount?: Pick<import('./account').Account, 'id' | 'name' | 'code' | 'balance' | 'currency'>;
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
