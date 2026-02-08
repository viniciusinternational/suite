import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    const transactions = await prisma.accountTransaction.findMany({
      where: { accountId: id },
      select: { type: true, amount: true },
    });

    const inflowTotal = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const outflowTotal = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const paymentCount = await prisma.payment.count({
      where: {
        payerAccountId: id,
        status: 'paid',
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        balance: account.balance,
        inflowTotal,
        outflowTotal,
        transactionCount: transactions.length,
        paymentCount,
      },
    });
  } catch (error) {
    console.error('Error fetching account analytics:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
