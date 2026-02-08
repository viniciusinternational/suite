import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const offset = (page - 1) * limit;

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    const [transactions, total] = await Promise.all([
      prisma.accountTransaction.findMany({
        where: { accountId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          payment: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              currency: true,
            },
          },
        },
      }),
      prisma.accountTransaction.count({ where: { accountId: id } }),
    ]);

    return NextResponse.json({
      ok: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
