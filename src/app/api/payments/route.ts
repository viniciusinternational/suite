import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import type { PaymentSourceType, PaymentStatus } from '@/types';
import { paymentMethodValues, paymentStatusValues } from '@/constants/payments';
import {
  paymentItemSchema,
  paymentInstallmentSchema,
  paymentSourceSchema,
  paymentWithRelations,
  serializePayment,
  normalizePaymentItems,
  normalizeInstallments,
  deriveItemsFromRequestForm,
} from './utils';

const paymentCreateSchema = z.object({
  source: paymentSourceSchema,
  currency: z.string().min(1),
  exchangeRate: z.number().optional(),
  method: z.enum(paymentMethodValues).default('bank_transfer'),
  status: z.enum(paymentStatusValues).default('draft'),
  paymentDate: z.string().optional(),
  dueDate: z.string().optional(),
  scheduledFor: z.string().optional(),
  notes: z.string().optional(),
  reference: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requiresApproval: z.boolean().optional(),
  payeeId: z.string().optional(),
  payerAccountId: z.string().optional(),
  submittedById: z.string().optional(),
  approverIds: z.array(z.string()).optional(),
  items: z.array(paymentItemSchema).optional(),
  installments: z.array(paymentInstallmentSchema).optional(),
  attachments: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceTemplateId: z.string().optional(),
  balanceOutstanding: z.number().optional(),
  amount: z.number().optional(),
  taxAmount: z.number().optional(),
  totalAmount: z.number().optional(),
  fxAppliedAmount: z.number().optional(),
  ledgerEntryIds: z.array(z.string()).optional(),
  derivedFromRequestFormItems: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where: Prisma.PaymentWhereInput = {};

    const sourceType = searchParams.get('sourceType') as PaymentSourceType | null;
    const status = searchParams.get('status') as PaymentStatus | null;
    const projectId = searchParams.get('projectId');
    const requestFormId = searchParams.get('requestFormId');
    const payrollId = searchParams.get('payrollId');
    const payeeId = searchParams.get('payeeId');

    if (sourceType) {
      where.sourceType = sourceType;
    }
    if (status) {
      where.status = status;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (requestFormId) {
      where.requestFormId = requestFormId;
    }
    if (payrollId) {
      where.payrollId = payrollId;
    }
    if (payeeId) {
      where.payeeId = payeeId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: paymentWithRelations.include,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      ok: true,
      data: payments.map(payment => serializePayment(payment)),
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = paymentCreateSchema.parse(body);

    const { userId, userSnapshot } = getUserInfoFromHeaders(request.headers);

    const sourceType = payload.source.type;
    const resolvedProjectId = payload.source.projectId;
    const resolvedRequestFormId = payload.source.requestFormId;
    const resolvedPayrollId = payload.source.payrollId;

    if (sourceType === 'project' && !resolvedProjectId) {
      return NextResponse.json(
        { ok: false, error: 'projectId is required when source type is project' },
        { status: 400 }
      );
    }

    if (sourceType === 'requestForm' && !resolvedRequestFormId) {
      return NextResponse.json(
        { ok: false, error: 'requestFormId is required when source type is requestForm' },
        { status: 400 }
      );
    }

    if (sourceType === 'payroll' && !resolvedPayrollId) {
      return NextResponse.json(
        { ok: false, error: 'payrollId is required when source type is payroll' },
        { status: 400 }
      );
    }

    let itemsInput = payload.items ?? [];
    let derivedFromRequestFormItems = payload.derivedFromRequestFormItems ?? false;
    let requestFormItemIds: string[] = [];
    let currency = payload.currency;

    if (sourceType === 'requestForm' && resolvedRequestFormId) {
      const derived = await deriveItemsFromRequestForm(resolvedRequestFormId, payload.currency);
      itemsInput = derived.items;
      derivedFromRequestFormItems = true;
      requestFormItemIds = derived.requestFormItemIds;
      currency = derived.currency;
    }

    const normalizedItems = normalizePaymentItems(itemsInput, currency);
    requestFormItemIds = requestFormItemIds.length > 0 ? requestFormItemIds : normalizedItems.requestFormItemIds;

    const amount = payload.amount ?? normalizedItems.totals.amount;
    const taxAmount = payload.taxAmount ?? normalizedItems.totals.taxAmount;
    const totalAmount = payload.totalAmount ?? normalizedItems.totals.totalAmount;

    const installmentsInput = payload.installments ? normalizeInstallments(payload.installments) : [];

    const createdPayment = await prisma.payment.create({
      data: {
        sourceType,
        projectId: resolvedProjectId,
        requestFormId: resolvedRequestFormId,
        payrollId: resolvedPayrollId,
        createdById: userId,
        submittedById: payload.submittedById ?? userId,
        approverIds: payload.approverIds ?? [],
        payeeId: payload.payeeId,
        payerAccountId: payload.payerAccountId,
        currency,
        exchangeRate: payload.exchangeRate,
        isForeignCurrency: payload.exchangeRate != null ? payload.exchangeRate !== 1 : false,
        amount,
        taxAmount,
        totalAmount,
        fxAppliedAmount: payload.fxAppliedAmount,
        balanceOutstanding: payload.balanceOutstanding ?? totalAmount,
        status: payload.status,
        method: payload.method,
        paymentDate: payload.paymentDate,
        dueDate: payload.dueDate,
        scheduledFor: payload.scheduledFor,
        notes: payload.notes,
        reference: payload.reference,
        tags: payload.tags ?? [],
        requiresApproval: payload.requiresApproval ?? false,
        isDraft: payload.status === 'draft',
        isLocked: false,
        isArchived: false,
        isRecurring: payload.isRecurring ?? false,
        recurrenceTemplateId: payload.recurrenceTemplateId,
        derivedFromRequestFormItems,
        requestFormItemIds,
        attachments: payload.attachments ?? undefined,
        auditLog: null,
        reconciliationStatus: null,
        reconciliationDate: undefined,
        ledgerEntryIds: payload.ledgerEntryIds ?? [],
        cancellationReason: undefined,
        items: {
          create: normalizedItems.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            total: item.total,
            requestFormItemId: item.requestFormItemId,
            metadata: item.metadata ?? undefined,
          })),
        },
        installments: installmentsInput.length
          ? {
              create: installmentsInput.map(installment => ({
                dueDate: installment.dueDate,
                amount: installment.amount,
                status: installment.status,
                paidAt: installment.paidAt,
                reference: installment.reference,
                notes: installment.notes,
              })),
            }
          : undefined,
      },
      include: paymentWithRelations.include,
    });

    await createAuditLog({
      userId,
      userSnapshot,
      actionType: 'CREATE',
      entityType: 'Payment',
      entityId: createdPayment.id,
      description: `Created payment ${createdPayment.id} (${sourceType})`,
      newData: serializePayment(createdPayment),
    }).catch(() => null);

    return NextResponse.json(
      {
        ok: true,
        data: serializePayment(createdPayment),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.flatten() },
        { status: 422 }
      );
    }

    const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500;
    const message =
      status === 404 ? (error as Error).message : 'Failed to create payment';

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

