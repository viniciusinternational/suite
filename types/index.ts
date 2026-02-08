// Barrel: re-export all domain types so existing `from '@/types'` imports keep working.
export type {
  UserRole,
  PermissionKey,
  UserPermissions,
  AuthState,
  CurrentAccount,
  Permissions,
  User,
  ZitadelUser,
} from './auth';

export type { Sector, Department, DepartmentUnit } from './department';

export type { Approval, Project, Milestone, Task } from './project';

export type {
  LeaveRequest,
  Payslip,
  Payroll,
  PayrollApproval,
  PayrollEntry,
  Deduction,
  Allowance,
  PayrollDeductionApplication,
  PayrollAllowanceApplication,
} from './payroll';

export type {
  Client,
  Item,
  Vendor,
  RequestForm,
  RequestApproval,
  RequestComment,
} from './request';

export type {
  PaymentStatus,
  PaymentSourceType,
  PaymentSource,
  PaymentItemSnapshot,
  PaymentInstallment,
  PaymentReconciliationStatus,
  Payment,
  PaymentApproval,
} from './payment';

export type { AuditActionType, AuditEntityType, AuditLog } from './audit';

export type { Event } from './event';

export type { Memo } from './memo';

export type { Team } from './team';

export type { NavigationItem } from './navigation';

export type {
  Document,
  Tag,
  Correspondent,
  DocumentType,
  Comment,
  DocumentFilters,
} from './document';

export type { ApiResponse } from './api';

export type { Role, RoleFormData } from './role';

export type {
  Account,
  AccountTransaction,
  AccountTransactionType,
  AccountAnalytics,
} from './account';
