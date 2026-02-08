import { Prisma } from '@prisma/client';
import { z } from 'zod';

import type {
  Payment,
  PaymentApproval as PaymentApprovalType,
  PaymentSourceType,
  PaymentStatus,
} from '@/types';
import { prisma } from '@/lib/prisma';
import { paymentSourceValues, paymentInstallmentStatusValues } from '@/constants/payments';

export const paymentItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().nonnegative().default(0),
  unitPrice: z.number().nonnegative().default(0),
  currency: z.string().min(1).optional(),
  taxRate: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  requestFormItemId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const paymentInstallmentSchema = z.object({
  id: z.string().optional(),
  dueDate: z.string().min(1),
  amount: z.number().nonnegative(),
  status: z.enum(paymentInstallmentStatusValues).optional(),
  paidAt: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentSourceSchema = z.object({
  type: z.enum(paymentSourceValues).default('none'),
  projectId: z.string().optional(),
  requestFormId: z.string().optional(),
  payrollId: z.string().optional(),
});

export const paymentWithRelations = Prisma.validator<Prisma.PaymentArgs>()({
  include: {
    items: true,
    installments: true,
    approvals: {
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    },
    payee: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    submittedBy: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    project: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
    requestForm: {
      select: {
        id: true,
        name: true,
        status: true,
      },
    },
    payroll: {
      select: {
        id: true,
        periodMonth: true,
        periodYear: true,
        status: true,
      },
    },
    payerAccount: {
      select: {
        id: true,
        name: true,
        code: true,
        balance: true,
        currency: true,
      },
    },
  },
});

export type PaymentWithRelations = Prisma.PaymentGetPayload<typeof paymentWithRelations>;

type NormalizedPaymentItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  requestFormItemId?: string;
  metadata?: Prisma.JsonValue;
};

export type NormalizedInstallment = {
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'voided';
  paidAt?: string;
  reference?: string;
  notes?: string;
};

export function normalizePaymentItems(
  items: z.infer<typeof paymentItemSchema>[],
  fallbackCurrency: string
) {
  const normalized: NormalizedPaymentItem[] = items.map(item => {
    const quantity = Number(item.quantity ?? 0) || 0;
    const unitPrice = Number(item.unitPrice ?? 0) || 0;
    const currency = item.currency || fallbackCurrency;
    const baseAmount = quantity * unitPrice;
    const taxAmount =
      item.taxAmount ??
      (item.taxRate != null ? baseAmount * (item.taxRate > 1 ? item.taxRate / 100 : item.taxRate) : 0);
    const total = item.total ?? baseAmount + taxAmount;

    const normalizedItem: NormalizedPaymentItem = {
      description: item.description,
      quantity,
      unitPrice,
      currency,
      taxRate: item.taxRate,
      taxAmount,
      total,
      requestFormItemId: item.requestFormItemId,
      metadata: item.metadata ?? null,
    }

    return normalizedItem;
  });

  const totals = normalized.reduce(
    (acc, item) => {
      const amountBeforeTax = item.total - (item.taxAmount ?? 0);
      acc.amount += amountBeforeTax;
      acc.taxAmount += item.taxAmount ?? 0;
      acc.totalAmount += item.total;
      return acc;
    },
    { amount: 0, taxAmount: 0, totalAmount: 0 }
  );

  return {
    items: normalized,
    totals,
    requestFormItemIds: normalized
      .map(item => item.requestFormItemId)
      .filter((id): id is string => Boolean(id)),
  };
}

export function normalizeInstallments(
  installments: z.infer<typeof paymentInstallmentSchema>[]
): NormalizedInstallment[] {
  return installments.map(installment => ({
    dueDate: installment.dueDate,
    amount: installment.amount,
    status: installment.status ?? 'pending',
    paidAt: installment.paidAt,
    reference: installment.reference,
    notes: installment.notes,
  }));
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function serializePayment(payment: PaymentWithRelations): Payment {
  const source: Payment['source'] = {
    type: payment.sourceType as PaymentSourceType,
    projectId: payment.projectId ?? undefined,
    requestFormId: payment.requestFormId ?? undefined,
    payrollId: payment.payrollId ?? undefined,
  };

  const items = payment.items.map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    currency: item.currency ?? undefined,
    taxRate: item.taxRate ?? undefined,
    taxAmount: item.taxAmount ?? undefined,
    total: item.total,
    requestFormItemId: item.requestFormItemId ?? undefined,
    metadata: isPlainObject(item.metadata) ? (item.metadata as Record<string, unknown>) : undefined,
  }));

  const installments =
    payment.installments.length > 0
      ? payment.installments.map(installment => ({
          id: installment.id,
          dueDate: installment.dueDate,
          amount: installment.amount,
          status: installment.status as NormalizedInstallment['status'],
          paidAt: installment.paidAt ?? undefined,
          reference: installment.reference ?? undefined,
          notes: installment.notes ?? undefined,
          createdAt: installment.createdAt.toISOString(),
          updatedAt: installment.updatedAt.toISOString(),
        }))
      : undefined;

  const approvals =
    payment.approvals.length > 0
      ? payment.approvals.map(approval => ({
          id: approval.id,
          paymentId: approval.paymentId,
          userId: approval.userId,
          addedById: approval.addedById ?? undefined,
          level: approval.level as PaymentApprovalType['level'],
          status: approval.status as PaymentApprovalType['status'],
          actionDate: approval.actionDate ?? undefined,
          comments: approval.comments ?? undefined,
          canAddApprovers: approval.canAddApprovers ?? undefined,
          createdAt: approval.createdAt.toISOString(),
          updatedAt: approval.updatedAt.toISOString(),
          user: approval.user
            ? {
                id: approval.user.id,
                fullName: approval.user.fullName,
                email: approval.user.email,
                role: approval.user.role ?? undefined,
              }
            : undefined,
          addedBy: approval.addedBy
            ? {
                id: approval.addedBy.id,
                fullName: approval.addedBy.fullName,
                email: approval.addedBy.email,
                role: approval.addedBy.role ?? undefined,
              }
            : undefined,
        }))
      : undefined;

  const attachments =
    Array.isArray(payment.attachments) && payment.attachments.every(item => typeof item === 'string')
      ? (payment.attachments as string[])
      : undefined;

  return {
    id: payment.id,
    source,
    requestFormId: payment.requestFormId ?? undefined,
    projectId: payment.projectId ?? undefined,
    payrollId: payment.payrollId ?? undefined,
    project: payment.project
      ? {
          id: payment.project.id,
          name: payment.project.name,
          code: payment.project.code,
        }
      : undefined,
    requestForm: payment.requestForm
      ? {
          id: payment.requestForm.id,
          name: payment.requestForm.name,
          status: payment.requestForm.status,
        }
      : undefined,
    payroll: payment.payroll
      ? {
          id: payment.payroll.id,
          periodMonth: payment.payroll.periodMonth,
          periodYear: payment.payroll.periodYear,
          status: payment.payroll.status,
        }
      : undefined,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    createdById: payment.createdById ?? undefined,
    createdBy: payment.createdBy
      ? {
          id: payment.createdBy.id,
          fullName: payment.createdBy.fullName,
          email: payment.createdBy.email,
        }
      : undefined,
    submittedById: payment.submittedById ?? undefined,
    submittedBy: payment.submittedBy
      ? {
          id: payment.submittedBy.id,
          fullName: payment.submittedBy.fullName,
          email: payment.submittedBy.email,
        }
      : undefined,
    approverIds: payment.approverIds ?? [],
    payeeId: payment.payeeId ?? undefined,
    payeeFullName: (payment as { payeeFullName?: string }).payeeFullName ?? undefined,
    payeePhone: (payment as { payeePhone?: string }).payeePhone ?? undefined,
    payee: payment.payee
      ? {
          id: payment.payee.id,
          fullName: payment.payee.fullName,
          email: payment.payee.email,
        }
      : undefined,
    payerAccountId: payment.payerAccountId ?? undefined,
    payerAccount: payment.payerAccount
      ? {
          id: payment.payerAccount.id,
          name: payment.payerAccount.name,
          code: payment.payerAccount.code,
          balance: payment.payerAccount.balance,
          currency: payment.payerAccount.currency,
        }
      : undefined,
    currency: payment.currency,
    exchangeRate: payment.exchangeRate ?? undefined,
    isForeignCurrency: payment.isForeignCurrency ?? undefined,
    amount: payment.amount,
    taxAmount: payment.taxAmount ?? undefined,
    totalAmount: payment.totalAmount,
    fxAppliedAmount: payment.fxAppliedAmount ?? undefined,
    balanceOutstanding: payment.balanceOutstanding ?? undefined,
    status: payment.status as PaymentStatus,
    method: payment.method as Payment['method'],
    paymentDate: payment.paymentDate ?? undefined,
    dueDate: payment.dueDate ?? undefined,
    scheduledFor: payment.scheduledFor ?? undefined,
    notes: payment.notes ?? undefined,
    reference: payment.reference ?? undefined,
    tags: payment.tags ?? [],
    requiresApproval: payment.requiresApproval ?? undefined,
    isDraft: payment.isDraft ?? undefined,
    isLocked: payment.isLocked ?? undefined,
    isArchived: payment.isArchived ?? undefined,
    isRecurring: payment.isRecurring ?? undefined,
    recurrenceTemplateId: payment.recurrenceTemplateId ?? undefined,
    derivedFromRequestFormItems: payment.derivedFromRequestFormItems ?? undefined,
    requestFormItemIds: payment.requestFormItemIds ?? [],
    items,
    installments,
    approvals,
    auditLog: undefined,
    attachments,
    reconciliationStatus: payment.reconciliationStatus ?? undefined,
    reconciliationDate: payment.reconciliationDate ?? undefined,
    ledgerEntryIds: payment.ledgerEntryIds ?? [],
    lastReminderSentAt: payment.lastReminderSentAt?.toISOString(),
    cancellationReason: payment.cancellationReason ?? undefined,
  };
}

export async function deriveItemsFromRequestForm(
  requestFormId: string,
  fallbackCurrency: string
) {
  const requestForm = await prisma.requestForm.findUnique({
    where: { id: requestFormId },
    select: { items: true, currency: true },
  });

  if (!requestForm) {
    throw Object.assign(new Error('Request form not found'), { status: 404 });
  }

  const formItems = Array.isArray(requestForm.items) ? (requestForm.items as any[]) : [];

  if (formItems.length === 0) {
    return {
      items: [],
      totals: { amount: 0, taxAmount: 0, totalAmount: 0 },
      requestFormItemIds: [] as string[],
      currency: requestForm.currency ?? fallbackCurrency,
    };
  }

  const mappedItems = formItems.map(item => {
    const quantity = Number(item.quantity ?? 0) || 0;
    const unitPrice = Number(item.unitPrice ?? item.totalPrice ?? 0) || 0;
    const total = item.totalPrice != null ? Number(item.totalPrice) : quantity * unitPrice;

    return {
      description: item.description ?? item.name ?? 'Item',
      quantity,
      unitPrice,
      currency: requestForm.currency ?? fallbackCurrency,
      taxAmount: item.taxAmount ?? 0,
      total,
      requestFormItemId: item.id,
      metadata: item,
    };
  });

  const normalized = normalizePaymentItems(mappedItems, requestForm.currency ?? fallbackCurrency);

  return {
    ...normalized,
    currency: requestForm.currency ?? fallbackCurrency,
  };
}

