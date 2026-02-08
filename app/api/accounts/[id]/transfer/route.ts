import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

const transferSchema = z.object({
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().optional(),
  reference: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: fromAccountId } = await context.params;
    const body = await request.json();
    const validatedData = transferSchema.parse(body);

    const { toAccountId, amount } = validatedData;

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { ok: false, error: 'Cannot transfer to the same account' },
        { status: 400 }
      );
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findUnique({ where: { id: fromAccountId } }),
      prisma.account.findUnique({ where: { id: toAccountId } }),
    ]);

    if (!fromAccount) {
      return NextResponse.json(
        { ok: false, error: 'Source account not found' },
        { status: 404 }
      );
    }

    if (!toAccount) {
      return NextResponse.json(
        { ok: false, error: 'Destination account not found' },
        { status: 404 }
      );
    }

    if (!fromAccount.isActive || !toAccount.isActive) {
      return NextResponse.json(
        { ok: false, error: 'Cannot transfer to or from inactive account' },
        { status: 400 }
      );
    }

    if (!fromAccount.allowNegativeBalance && fromAccount.balance < amount) {
      return NextResponse.json(
        {
          ok: false,
          error: `Insufficient balance. Available: ${fromAccount.balance} ${fromAccount.currency}`,
        },
        { status: 400 }
      );
    }

    const { userId, userSnapshot } = getUserInfoFromHeaders(request.headers);

    const result = await prisma.$transaction(async (tx) => {
      const outTx = await tx.accountTransaction.create({
        data: {
          accountId: fromAccountId,
          type: 'transfer_out',
          amount: -amount,
          currency: fromAccount.currency,
          description: validatedData.description ?? `Transfer to ${toAccount.name}`,
          reference: validatedData.reference ?? null,
          fromAccountId,
          toAccountId,
          createdById: userId !== 'system' ? userId : null,
        },
      });

      const inTx = await tx.accountTransaction.create({
        data: {
          accountId: toAccountId,
          type: 'transfer_in',
          amount,
          currency: toAccount.currency,
          description: validatedData.description ?? `Transfer from ${fromAccount.name}`,
          reference: validatedData.reference ?? null,
          fromAccountId,
          toAccountId,
          createdById: userId !== 'system' ? userId : null,
        },
      });

      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount }, updatedAt: new Date() },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount }, updatedAt: new Date() },
      });

      const [updatedFrom, updatedTo] = await Promise.all([
        tx.account.findUnique({ where: { id: fromAccountId } }),
        tx.account.findUnique({ where: { id: toAccountId } }),
      ]);

      return { outTx, inTx, fromAccount: updatedFrom, toAccount: updatedTo };
    });

    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'AccountTransaction',
        entityId: result.outTx.id,
        description: `Transferred ${amount} ${fromAccount.currency} from "${fromAccount.name}" to "${toAccount.name}"`,
        newData: {
          fromTransaction: result.outTx,
          toTransaction: result.inTx,
          fromBalance: result.fromAccount?.balance,
          toBalance: result.toAccount?.balance,
        } as Record<string, unknown>,
        ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (transfer):', e);
    }

    return NextResponse.json({
      ok: true,
      data: result,
      message: 'Transfer completed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error processing transfer:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}
