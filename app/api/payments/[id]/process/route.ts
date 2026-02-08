import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId, userSnapshot } = getUserInfoFromHeaders(request.headers);

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'paid') {
      return NextResponse.json(
        { ok: false, error: 'Payment is already paid' },
        { status: 400 }
      );
    }

    if (!payment.payerAccountId) {
      return NextResponse.json(
        { ok: false, error: 'Payment has no payer account assigned' },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: payment.payerAccountId },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: 'Payer account not found' },
        { status: 400 }
      );
    }

    if (!account.allowNegativeBalance && account.balance < payment.totalAmount) {
      return NextResponse.json(
        {
          ok: false,
          error: `Insufficient account balance. Available: ${account.currency} ${account.balance.toFixed(2)}, required: ${payment.totalAmount}`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.accountTransaction.create({
        data: {
          accountId: payment.payerAccountId,
          type: 'payment',
          amount: -payment.totalAmount,
          currency: payment.currency,
          description: `Payment ${payment.id}`,
          reference: payment.reference ?? null,
          paymentId: payment.id,
          createdById: userId !== 'system' ? userId : null,
        },
      }),
      prisma.account.update({
        where: { id: payment.payerAccountId },
        data: { balance: { decrement: payment.totalAmount }, updatedAt: new Date() },
      }),
      prisma.payment.update({
        where: { id },
        data: { status: 'paid', updatedAt: new Date() },
      }),
    ]);

    const updatedPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        items: true,
        approvals: true,
        payee: { select: { id: true, fullName: true, email: true } },
      },
    });

    await createAuditLog({
      userId: userId || 'system',
      userSnapshot,
      actionType: 'PAYMENT_PROCESSED',
      entityType: 'Payment',
      entityId: id,
      description: `Processed payment ${id} - deducted ${payment.totalAmount} ${payment.currency} from account`,
      newData: updatedPayment as Record<string, unknown>,
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      data: updatedPayment,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
