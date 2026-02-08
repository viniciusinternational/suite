import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

const addFundsSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().optional(),
  reference: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = addFundsSchema.parse(body);

    const account = await prisma.account.findUnique({ where: { id } });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    if (!account.isActive) {
      return NextResponse.json(
        { ok: false, error: 'Cannot add funds to inactive account' },
        { status: 400 }
      );
    }

    const { userId, userSnapshot } = getUserInfoFromHeaders(request.headers);

    const [transaction] = await prisma.$transaction([
      prisma.accountTransaction.create({
        data: {
          accountId: id,
          type: 'deposit',
          amount: validatedData.amount,
          currency: account.currency,
          description: validatedData.description ?? 'Add funds',
          reference: validatedData.reference ?? null,
          createdById: userId !== 'system' ? userId : null,
        },
      }),
      prisma.account.update({
        where: { id },
        data: {
          balance: { increment: validatedData.amount },
          updatedAt: new Date(),
        },
      }),
    ]);

    const updatedAccount = await prisma.account.findUnique({
      where: { id },
    });

    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'AccountTransaction',
        entityId: transaction.id,
        description: `Added ${validatedData.amount} ${account.currency} to account "${account.name}"`,
        newData: {
          transaction,
          newBalance: updatedAccount?.balance,
        } as Record<string, unknown>,
        ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (add funds):', e);
    }

    return NextResponse.json({
      ok: true,
      data: {
        transaction,
        account: updatedAccount,
      },
      message: 'Funds added successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error adding funds:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to add funds' },
      { status: 500 }
    );
  }
}
