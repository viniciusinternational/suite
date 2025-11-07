import { describe, expect, it } from 'vitest';

import {
  normalizePaymentItems,
  serializePayment,
} from '@/app/api/payments/utils';

describe('payments utilities', () => {
  it('normalizes items and aggregates totals', () => {
    const { items, totals, requestFormItemIds } = normalizePaymentItems(
      [
        {
          description: 'Consulting hours',
          quantity: 2,
          unitPrice: 50,
          taxRate: 0.1,
        },
        {
          description: 'Hardware',
          quantity: 1,
          unitPrice: 200,
          taxAmount: 10,
          requestFormItemId: 'rf-item-1',
        },
      ],
      'USD'
    );

    expect(items).toHaveLength(2);
    expect(totals.amount).toBeCloseTo(300);
    expect(totals.taxAmount).toBeCloseTo(20);
    expect(totals.totalAmount).toBeCloseTo(320);
    expect(requestFormItemIds).toEqual(['rf-item-1']);
  });

  it('serializes a payment with related snapshots', () => {
    const now = new Date();
    const later = new Date(now.getTime() + 60_000);

    const serialized = serializePayment({
      id: 'pay_1',
      sourceType: 'project',
      projectId: 'proj_1',
      requestFormId: null,
      payrollId: null,
      createdById: 'user_creator',
      submittedById: 'user_submitter',
      approverIds: ['approver_1'],
      payeeId: 'payee_1',
      payerAccountId: 'acct_123',
      currency: 'USD',
      exchangeRate: 1,
      isForeignCurrency: false,
      amount: 100,
      taxAmount: 10,
      totalAmount: 110,
      fxAppliedAmount: null,
      balanceOutstanding: 0,
      status: 'paid',
      method: 'bank_transfer',
      paymentDate: '2025-01-01',
      dueDate: '2024-12-31',
      scheduledFor: null,
      notes: 'Payment for project milestone',
      reference: 'INV-100',
      tags: ['milestone'],
      requiresApproval: true,
      isDraft: false,
      isLocked: false,
      isArchived: false,
      isRecurring: false,
      recurrenceTemplateId: null,
      derivedFromRequestFormItems: false,
      requestFormItemIds: [],
      attachments: ['https://example.com/invoice.pdf'],
      auditLog: null,
      reconciliationStatus: 'reconciled',
      reconciliationDate: '2025-01-15',
      ledgerEntryIds: ['ledger_1'],
      lastReminderSentAt: later,
      cancellationReason: null,
      createdAt: now,
      updatedAt: later,
      items: [
        {
          id: 'item_1',
          paymentId: 'pay_1',
          description: 'Milestone completion',
          quantity: 1,
          unitPrice: 100,
          currency: 'USD',
          taxRate: 0.1,
          taxAmount: 10,
          total: 110,
          requestFormItemId: null,
          metadata: { milestone: 'Phase 1' },
        },
      ],
      installments: [
        {
          id: 'inst_1',
          paymentId: 'pay_1',
          dueDate: '2025-02-01',
          amount: 50,
          status: 'paid',
          paidAt: '2025-02-05',
          reference: 'CHK-101',
          notes: 'Second installment',
          createdAt: now,
          updatedAt: later,
        },
      ],
      approvals: [
        {
          id: 'approval_1',
          paymentId: 'pay_1',
          userId: 'approver_1',
          level: 'finance_manager',
          status: 'approved',
          actionDate: '2025-01-02',
          comments: 'Looks good',
          createdAt: now,
          updatedAt: later,
        },
      ],
      payee: {
        id: 'payee_1',
        fullName: 'John Doe',
        email: 'john@example.com',
      },
      createdBy: {
        id: 'user_creator',
        fullName: 'Creator User',
        email: 'creator@example.com',
      },
      submittedBy: {
        id: 'user_submitter',
        fullName: 'Submitter User',
        email: 'submitter@example.com',
      },
      project: {
        id: 'proj_1',
        name: 'Infrastructure Upgrade',
        code: 'PROJ-001',
      },
      requestForm: null,
      payroll: null,
    } as any);

    expect(serialized.id).toBe('pay_1');
    expect(serialized.project?.name).toBe('Infrastructure Upgrade');
    expect(serialized.payee?.fullName).toBe('John Doe');
    expect(serialized.items[0]).toMatchObject({
      description: 'Milestone completion',
      total: 110,
    });
    expect(serialized.installments?.[0].status).toBe('paid');
    expect(serialized.approvals?.[0].status).toBe('approved');
    expect(serialized.attachments).toEqual(['https://example.com/invoice.pdf']);
    expect(serialized.lastReminderSentAt).toBe(later.toISOString());
  });
});


