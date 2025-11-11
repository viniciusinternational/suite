export const paymentStatusValues = [
  'draft',
  'scheduled',
  'partially_paid',
  'paid',
  'voided',
] as const;

export const paymentMethodValues = [
  'bank_transfer',
  'check',
  'cash',
  'credit_card',
  'other',
] as const;

export const paymentSourceValues = [
  'project',
  'requestForm',
  'payroll',
  'none',
] as const;

export const paymentApprovalStatusValues = ['pending', 'approved', 'rejected'] as const;

export const paymentInstallmentStatusValues = ['pending', 'paid', 'overdue', 'voided'] as const;


