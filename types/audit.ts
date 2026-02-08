export type AuditActionType =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
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
  | 'Event'
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
  | 'Account'
  | 'AccountTransaction'
  | 'RequestForm'
  | 'RequestApproval'
  | 'RequestComment'
  | 'Item'
  | 'Vendor'
  | 'Client'
  | 'AuditLog'
  | 'Memo'
  | 'Document'
  | 'Comment'
  | 'Team'
  | 'Role'
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
